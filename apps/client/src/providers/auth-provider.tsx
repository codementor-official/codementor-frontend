"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ApiClientError } from "@codementor/api-client";
import { accessTokenOf, currentUser, getUserManager } from "@codementor/auth";
import type { OidcUser, UserManager } from "@codementor/auth";
import type { User } from "@codementor/types";
import { keycloakConfig } from "@/lib/env";
import { api, setAccessTokenReader } from "@/lib/api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

/**
 * Dưới hạn sống của access token (300s) nên mỗi nhịp thứ hai là một lần gia hạn thật,
 * và xa dưới hạn nhàn rỗi 1800s của refresh token nên phiên không bao giờ chạm mốc đó
 * khi người học vẫn đang mở tab.
 */
const SESSION_HEARTBEAT_MS = 4 * 60 * 1000;

/** Keycloak identity provider alias, provisioned in the realm — see configure-codementor-realm.sh. */
export type SocialProvider = "google" | "facebook";

interface AuthContextValue {
  status: AuthStatus;
  /** The CodeMentor profile from GET /api/v1/me, not the raw Keycloak token. */
  user: User | null;
  error: string | null;
  /**
   * Email/tên đăng nhập + mật khẩu, gửi tới BFF cùng origin — KHÔNG tới Keycloak.
   * Chỉ ném lỗi kèm thông điệp hiển thị được; form ở /login bắt và hiện tại chỗ.
   */
  signInWithPassword: (username: string, password: string) => Promise<void>;
  /**
   * Opens Keycloak in a popup so /login never navigates away, skipping straight to the
   * chosen IdP via `kc_idp_hint`. Rejects on cancel/error.
   */
  signInWithPopup: (provider: SocialProvider) => Promise<void>;
  cancelPopupSignIn: () => void;
  /**
   * Tạo tài khoản rồi đăng nhập luôn, cũng qua BFF. Keycloak vẫn là nơi tài khoản được
   * tạo ra — CodeMentor không có bảng người dùng riêng nào ở đây.
   */
  signUpWithPassword: (input: {
    displayName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads the profile after the user edits it. */
  refreshUser: () => Promise<void>;
  /**
   * Access token dùng để bắt tay WebSocket, hoặc `null` nếu chưa đăng nhập.
   *
   * Ở đây vì đây là chỗ duy nhất biết phiên hiện tại thuộc loại nào: phiên popup giữ
   * token ngay trong tab, còn phiên mật khẩu giữ trong cookie HttpOnly và phải hỏi BFF.
   * Để nơi khác tự đoán thì realtime sẽ im lặng không chạy với đúng một trong hai loại.
   */
  realtimeToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The token lives in a ref rather than in state: the API client reads it during a
  // request, and re-rendering the tree every time a silent renew swaps the token
  // would be pointless churn. Phiên đăng nhập bằng mật khẩu để ref này ở `null` —
  // token của nó nằm trong cookie HttpOnly và chỉ server đọc được.
  const tokenRef = useRef<string | null>(null);
  const managerRef = useRef<UserManager | null>(null);
  // `sub` của danh tính popup đang áp dụng cho tab này (null nếu đang ở phiên mật
  // khẩu hoặc chưa đăng nhập). Dùng để nhận ra một lần `userLoaded` từ gia hạn nền
  // (automaticSilentRenew) trả về MỘT NGƯỜI KHÁC — một tab khác (kể cả apps/lecturer,
  // apps/admin) vừa đăng nhập đổi tài khoản trên cookie SSO dùng chung của Keycloak —
  // thay vì âm thầm tiếp tục chạy dưới danh tính mới đó.
  const oidcUserIdRef = useRef<string | null>(null);
  // Bật ngay trước khi tự tay gọi signinPopup: lần userLoaded do CHÍNH tab này chủ
  // động đổi danh tính (bấm nút đăng nhập popup lần nữa) không đi qua guard ở trên —
  // khác với gia hạn nền, đây là hành động người dùng vừa chọn.
  const explicitPopupSignInRef = useRef(false);
  const popupAbortRef = useRef<AbortController | null>(null);
  const popupWindowRef = useRef<Window | null>(null);

  const manager = () => {
    // Resolved lazily because UserManager touches window.sessionStorage, which does
    // not exist while Next renders this on the server. `getUserManager` returns the
    // one instance the callback page also uses, so its events reach this provider.
    managerRef.current ??= getUserManager(keycloakConfig, window.location.origin);
    return managerRef.current;
  };

  /**
   * Một đường duy nhất để đi tới trạng thái đã-đăng-nhập, dùng chung cho cả hai loại
   * phiên: token trong tab (popup Google/Facebook) và cookie HttpOnly (mật khẩu).
   * Hồ sơ luôn lấy từ backend, không bao giờ từ claim của token.
   */
  const applySession = useCallback(async (oidcUser: OidcUser | null) => {
    const explicit = explicitPopupSignInRef.current;
    explicitPopupSignInRef.current = false;
    const token = accessTokenOf(oidcUser);

    // Một lần userLoaded từ gia hạn nền (automaticSilentRenew) trả về sub khác với
    // danh tính popup đang có — tức tab khác vừa đăng nhập đổi tài khoản trên cookie
    // SSO dùng chung — thì bỏ phiên popup này thay vì âm thầm chạy dưới danh tính mới.
    // Bỏ qua khi `explicit`: đây là lúc chính tab này vừa chủ động gọi signinPopup.
    if (!explicit && token && oidcUserIdRef.current && oidcUser?.profile.sub !== oidcUserIdRef.current) {
      void manager().removeUser();
      return;
    }

    tokenRef.current = token;
    oidcUserIdRef.current = token ? (oidcUser?.profile.sub ?? null) : null;

    // Chỉ hiện màn "loading" khi thật sự chuyển trạng thái (tải trang lần đầu, vừa
    // đăng nhập, vừa hồi phục sau đăng xuất) — KHÔNG cho một lần gia hạn nền của
    // automaticSilentRenew khi phiên popup vẫn còn hợp lệ, để tránh xoá trắng trang
    // rồi hiện lại giữa lúc người dùng đang thao tác (xem lecturer/auth-provider.tsx
    // cho cùng lỗi ở dạng nặng hơn, vì lecturer không có phiên mật khẩu dự phòng).
    setStatus((current) => (current === "authenticated" ? current : "loading"));

    if (!tokenRef.current && !(await hasPasswordSession())) {
      setUser(null);
      setStatus("anonymous");
      return;
    }

    try {
      // The profile comes from the backend, never from token claims. The token
      // carries the Keycloak `sub`; `users.id` and the resolved platform role
      // exist only in CodeMentor's own database.
      setUser(await api.me());
      setStatus("authenticated");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được hồ sơ");
      // Chỉ 401/403 mới là "phiên này không dùng được nữa" — token bị từ chối, hoặc tài
      // khoản bị khoá/xoá. Mọi lỗi khác (gateway 502, BFF 503 khi Keycloak vấp, mất mạng
      // một nhịp) KHÔNG được đọc thành chưa đăng nhập: cookie phiên vẫn còn nguyên, và
      // từ khi có RequireAuth thì đoán sai ở đây không còn là một ô trống trên trang nữa
      // mà là đá thẳng người dùng về /login giữa lúc đang làm bài.
      const status = cause instanceof ApiClientError ? cause.status : 0;
      if (status !== 401 && status !== 403) {
        setStatus(tokenRef.current || (await hasPasswordSession()) ? "authenticated" : "anonymous");
        return;
      }
      tokenRef.current = null;
      oidcUserIdRef.current = null;
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    setAccessTokenReader(() => tokenRef.current);

    const userManager = manager();
    // Token trong kho có thể đã quá hạn — nó chỉ sống 5 phút, còn `automaticSilentRenew`
    // chỉ bắt đầu đếm sau khi có user được nạp, nên nó không cứu được lần mở tab đầu tiên.
    // `currentUser` gia hạn im lặng trước khi kết luận là chưa đăng nhập; logic đó nằm ở
    // @codementor/auth vì apps/lecturer cần đúng như vậy và trước đây thì thiếu.
    void currentUser(userManager)
      .then(applySession);

    const onLoaded = (oidcUser: OidcUser) => void applySession(oidcUser);
    const onUnloaded = () => void applySession(null);
    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onUnloaded);
    userManager.events.addSilentRenewError(onUnloaded);

    return () => {
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onUnloaded);
      userManager.events.removeSilentRenewError(onUnloaded);
    };
  }, [applySession]);

  /**
   * Nhịp giữ phiên khi tab đang mở.
   *
   * Refresh token của Keycloak sống 1800 giây và được đặt lại về 1800 sau MỖI lần gia
   * hạn — nghĩa là 30 phút đó là hạn nhàn rỗi, không phải hạn cứng của phiên. Phiên chỉ
   * được gia hạn khi có một lời gọi API đi qua BFF, nên một người học ngồi đọc bài lý
   * thuyết 30 phút không phát sinh request nào sẽ mất phiên ở Keycloak mà không hề biết:
   * cú bấm tiếp theo trả 401, và vì cookie bị dọn nên MỌI tab đang mở cùng chết theo —
   * đúng cảnh mở tab làm bài rồi quay lại thấy trang bài học cũng 401.
   *
   * `/api/auth/session` đã tự gia hạn khi access token sắp hết hạn, nên chỉ cần gọi nó
   * đều đặn. Chỉ gọi khi tab đang hiện: tab bị ẩn không phải người đang học, và giữ phiên
   * sống cho một tab bỏ quên là kéo dài phiên quá điều người dùng thực sự làm.
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    // CHỈ dành cho phiên mật khẩu. Phiên popup giữ token ngay trong tab và tự gia hạn qua
    // iframe (`automaticSilentRenew`), nó không có cookie BFF nào cả — nên với nó
    // `/api/auth/session` trả `authenticated: false` là câu trả lời ĐÚNG, không phải dấu
    // hiệu hết phiên. Nhịp này mà chạy cho phiên popup thì cứ mỗi lần đổi tab lại tự huỷ
    // một phiên đang khoẻ và đá người dùng về /login.
    if (tokenRef.current) return;
    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const body = (await response.json()) as { authenticated?: boolean; transient?: boolean };
        // Phiên chết giữa chừng mà trạng thái vẫn là "đã đăng nhập" thì mọi trang chỉ
        // hiện 401 và không có đường ra. `transient` là "chưa hỏi được Keycloak", không
        // phải "hết phiên", nên không đá người dùng ra vì một cú vấp mạng.
        if (body.authenticated === false && body.transient !== true) {
          await applySession(null);
        }
      } catch {
        // Mất mạng: lần nhịp sau thử lại, không kết luận gì.
      }
    };
    const onBeat = () => void beat();
    const timer = setInterval(onBeat, SESSION_HEARTBEAT_MS);
    // Quay lại tab sau một lúc cũng phải gia hạn ngay, không đợi hết chu kỳ.
    document.addEventListener("visibilitychange", onBeat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onBeat);
    };
  }, [status, applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      signInWithPassword: async (username, password) => {
        setError(null);
        await postCredentials("/api/auth/login", { username, password });
        // Cookie phiên đã được đặt trong response ở trên; `applySession(null)` thấy nó
        // qua /api/auth/session rồi nạp hồ sơ như mọi đường đăng nhập khác.
        await applySession(null);
      },
      signUpWithPassword: async (input) => {
        setError(null);
        await postCredentials("/api/auth/register", input);
        await applySession(null);
      },
      signInWithPopup: async (provider) => {
        setError(null);
        const popupName = "codementor-social-login";
        const popupWindow = window.open("", popupName, "width=480,height=640");
        if (!popupWindow) {
          setError("Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup rồi thử lại.");
          return;
        }
        const controller = new AbortController();
        popupAbortRef.current = controller;
        popupWindowRef.current = popupWindow;
        try {
          // signinPopup resolves once the popup's callback (this same /auth/callback,
          // run inside the popup) posts the result back — see CallbackPage. Its
          // `userLoaded` event fires on this manager instance just like a redirect
          // would, so the effect above picks the session up the same way.
          explicitPopupSignInRef.current = true;
          await manager().signinPopup({
            extraQueryParams: { kc_idp_hint: provider },
            popupWindowTarget: popupName,
            popupAbortOnClose: true,
            popupSignal: controller.signal,
            popupWindowFeatures: {
              width: 480,
              height: 640,
              popup: true,
              closePopupWindowAfterInSeconds: 120,
            },
          });
        } catch (cause) {
          explicitPopupSignInRef.current = false;
          const message = cause instanceof Error ? cause.message : String(cause);
          if (!/popup (closed|canceled|aborted)/i.test(message)) {
            setError("Không thể đăng nhập. Vui lòng thử lại.");
          }
        } finally {
          if (popupAbortRef.current === controller) popupAbortRef.current = null;
          if (popupWindowRef.current === popupWindow) popupWindowRef.current = null;
          if (!popupWindow.closed) popupWindow.close();
        }
      },
      cancelPopupSignIn: () => {
        popupAbortRef.current?.abort("Popup canceled");
        popupWindowRef.current?.close();
        explicitPopupSignInRef.current = false;
      },
      /**
       * Đăng xuất phải thu hồi token của RIÊNG app này, nếu không lần bấm "Đăng nhập"
       * kế tiếp sẽ lặng lẽ khôi phục tài khoản cũ:
       *
       *   1. Phiên mật khẩu — cookie BFF, thu hồi refresh token ở Keycloak qua
       *      back-channel (`endKeycloakSession`, chạy trong route `/api/auth/logout`).
       *   2. Phiên popup — token trong tab của oidc-client-ts, thu hồi qua back-channel
       *      (`revokeTokens`) rồi xoá khỏi kho local.
       *
       * KHÔNG gọi `signoutRedirect()`: đó là front-channel `end_session` thật, xoá
       * cookie SSO dùng chung ở id.codementor.cloud và khiến Keycloak thu hồi TOÀN BỘ
       * phiên người dùng — kể cả apps/lecturer và apps/admin đang mở ở tab khác. Không
       * đụng tới phiên Google/Facebook của người dùng: chỉ token phía CodeMentor bị
       * thu hồi, họ vẫn đăng nhập Gmail/Facebook bình thường.
       */
      signOut: async () => {
        tokenRef.current = null;
        oidcUserIdRef.current = null;
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);

        const userManager = manager();
        const oidcUser = await userManager.getUser();
        if (oidcUser) {
          await userManager.revokeTokens().catch(() => undefined);
          await userManager.removeUser();
        }

        setUser(null);
        setStatus("anonymous");
        window.location.href = "/login";
      },
      realtimeToken: async () => {
        // Phiên popup: token đã nằm sẵn trong tab, không cần đi đâu cả.
        if (tokenRef.current) return tokenRef.current;

        // Phiên mật khẩu: chỉ server đọc được cookie, nên phải xin vé.
        try {
          const response = await fetch("/api/auth/realtime-token", { cache: "no-store" });
          if (!response.ok) return null;
          const body = (await response.json()) as { token?: string };
          return body.token ?? null;
        } catch {
          return null;
        }
      },
      refreshUser: async () => {
        if (status === "authenticated") setUser(await api.me());
      },
    }),
    [status, user, error, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Gửi thông tin đăng nhập/đăng ký tới BFF và ném lỗi kèm thông điệp hiển thị được.
 * Không log, không giữ lại gì: đối tượng `body` chết ngay khi request kết thúc.
 */
async function postCredentials(path: string, body: Record<string, string>): Promise<void> {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(problem?.message ?? "Thao tác thất bại. Vui lòng thử lại.");
  }
}

/**
 * `true` nếu cookie BFF còn sống. Không trả token — token không rời khỏi server.
 *
 * `transient` là câu trả lời thứ ba, tách khỏi "còn phiên" và "hết phiên": route
 * không hỏi được Keycloak nên chưa biết. Cookie vẫn còn, nên coi như còn phiên và để
 * `api.me()` ngay sau đó quyết định — đoán là "hết phiên" ở đây sẽ đá người dùng ra
 * màn hình đăng nhập vì một sự cố mạng thoáng qua.
 */
async function hasPasswordSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const body = (await response.json()) as { authenticated?: boolean; transient?: boolean };
    return body.authenticated === true || body.transient === true;
  } catch {
    return false;
  }
}
