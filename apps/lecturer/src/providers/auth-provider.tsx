"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { accessTokenOf, currentUser, getUserManager } from "@codementor/auth";
import type { OidcUser, UserManager } from "@codementor/auth";
import { ApiClientError } from "@codementor/api-client";
import type { User } from "@codementor/types";
import { keycloakConfig } from "@/lib/env";
import { api, setAccessTokenReader } from "@/lib/api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  /** The CodeMentor profile from GET /api/v1/me, not the raw Keycloak token. */
  user: User | null;
  error: string | null;
  signIn: () => void;
  signOut: () => void;
  /** Re-reads the profile after the user edits it. */
  refreshUser: () => Promise<void>;
  /**
   * Vé bắt tay WebSocket cho chuông thông báo.
   *
   * Phiên ở ứng dụng này giữ access token ngay trong tab (oidc-client-ts), nên không cần
   * hỏi server như bên client — nhưng vẫn để dạng Promise để chuông dùng chung được cho
   * cả hai kiểu phiên.
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
  const pathname = usePathname();
  const isOidcCallback = pathname === "/auth/callback" || pathname === "/auth/silent-renew";
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The token lives in a ref rather than in state: the API client reads it during a
  // request, and re-rendering the tree every time a silent renew swaps the token
  // would be pointless churn.
  const tokenRef = useRef<string | null>(null);
  const managerRef = useRef<UserManager | null>(null);
  const profileRequestRef = useRef<Promise<User> | null>(null);
  // `sub` của danh tính đang áp dụng cho tab này. Dùng để nhận ra một lần
  // `userLoaded` từ gia hạn nền (automaticSilentRenew) trả về MỘT NGƯỜI KHÁC — tức
  // một tab khác vừa đăng nhập đổi tài khoản trên cookie SSO dùng chung của Keycloak
  // — thay vì âm thầm tiếp tục chạy dưới danh tính mới đó.
  const userIdRef = useRef<string | null>(null);

  const manager = () => {
    // Resolved lazily because UserManager touches window.sessionStorage, which does
    // not exist while Next renders this on the server. `getUserManager` returns the
    // one instance the callback page also uses, so its events reach this provider.
    managerRef.current ??= getUserManager(keycloakConfig, window.location.origin);
    return managerRef.current;
  };

  useEffect(() => {
    // Hai trang này tự hoàn tất callback OIDC. Nếu provider cũng bootstrap phiên tại
    // đây, iframe silent-renew sẽ gọi currentUser() -> signinSilent() -> tạo thêm một
    // iframe silent-renew khác. Kết quả là vòng lặp điều hướng/loading trông như F5 liên
    // tục ngay sau đăng nhập. Sau callback, router chuyển sang route thường và effect này
    // mới khởi tạo phiên đúng một lần.
    if (isOidcCallback) return;

    setAccessTokenReader(() => tokenRef.current);

    const loadProfile = () => {
      profileRequestRef.current ??= api.me().finally(() => {
        profileRequestRef.current = null;
      });
      return profileRequestRef.current;
    };

    const applyOidcUser = async (oidcUser: OidcUser | null) => {
      const token = accessTokenOf(oidcUser);

      // Một lần đăng nhập THẬT (qua trang callback, sau full page reload) luôn thấy
      // `userIdRef.current` là null vì tab vừa mount lại — nên guard này chỉ chặn
      // đúng trường hợp cần chặn: gia hạn nền trong MỘT tab đang sống trả về sub khác.
      if (token && userIdRef.current && oidcUser?.profile.sub !== userIdRef.current) {
        void manager().removeUser();
        return;
      }

      tokenRef.current = token;
      userIdRef.current = token ? (oidcUser?.profile.sub ?? null) : null;

      if (!token) {
        setUser(null);
        setStatus("anonymous");
        return;
      }

      // Chỉ hiện màn "loading" khi thật sự chuyển trạng thái (tải trang lần đầu, vừa
      // đăng nhập, vừa hồi phục sau đăng xuất) — KHÔNG cho một lần gia hạn nền của
      // automaticSilentRenew (mỗi ~5 phút, do access token Keycloak sống 300s) khi
      // phiên vẫn còn hợp lệ. Trước đây bước này luôn đặt lại "loading", nên mỗi lần
      // gia hạn nền là RequireLecturer xoá trắng cả trang để hiện "Đang tải…" rồi
      // hiện lại — đúng cảnh người dùng thấy app "tự F5" giữa lúc đang thao tác.
      setStatus((current) => (current === "authenticated" ? current : "loading"));

      try {
        // The profile comes from the backend, never from token claims. The token
        // carries the Keycloak `sub`; `users.id` and the resolved platform role
        // exist only in CodeMentor's own database.
        setUser(await loadProfile());
        setError(null);
        setStatus("authenticated");
      } catch (cause) {
        const rejectedIdentity =
          cause instanceof ApiClientError && (cause.status === 401 || cause.status === 403);
        if (rejectedIdentity) {
          // Chỉ phản hồi xác thực thật sự mới được phép kết luận phiên đã hết hạn. Một
          // lần gateway/service trả 5xx hoặc mất mạng không được đá người dùng qua lại
          // giữa /dashboard và /login.
          tokenRef.current = null;
          userIdRef.current = null;
          setUser(null);
          setStatus("anonymous");
          void manager().removeUser();
        }
        setError(
          rejectedIdentity
            ? "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại."
            : "Không tải được hồ sơ giảng viên. Vui lòng thử lại.",
        );
      }
    };

    const userManager = manager();
    // `currentUser` chứ không phải `getUser`: token cũ đã hết hạn thì thử gia hạn im lặng
    // trước, thay vì đá thẳng người dùng về màn đăng nhập. Xem @codementor/auth.
    void currentUser(userManager).then(applyOidcUser);

    const onLoaded = (oidcUser: OidcUser) => void applyOidcUser(oidcUser);
    const onUnloaded = () => void applyOidcUser(null);
    const onSilentRenewError = () => {
      // oidc-client có thể phát lỗi renew tạm thời trong khi access token hiện tại vẫn
      // còn hạn. Giữ nguyên màn hình trong trường hợp đó; chỉ chuyển về anonymous khi
      // kho OIDC thực sự không còn một token dùng được.
      void userManager.getUser().then((stored) => {
        if (stored && !stored.expired) return;
        void applyOidcUser(null);
      });
    };
    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onUnloaded);
    userManager.events.addSilentRenewError(onSilentRenewError);

    return () => {
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onUnloaded);
      userManager.events.removeSilentRenewError(onSilentRenewError);
    };
  }, [isOidcCallback]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      // `prompt: "login"` forces Keycloak to show the form even when an SSO session from
      // another CodeMentor app (admin, or a different lecturer account) is still alive —
      // without it, this silently signs the browser in as whoever was last authenticated.
      signIn: () => void manager().signinRedirect({ extraQueryParams: { prompt: "login" } }),
      /**
       * Thu hồi token của RIÊNG app này qua back-channel (`revokeTokens`) rồi xoá
       * khỏi kho local — KHÔNG gọi `signoutRedirect()`.
       *
       * `signoutRedirect()` là front-channel `end_session` thật: nó xoá cookie SSO
       * dùng chung ở `id.codementor.cloud`, và Keycloak thu hồi TOÀN BỘ phiên người
       * dùng — kể cả client-session của apps/client (khi đăng nhập popup) và
       * apps/admin đang mở ở tab khác. Vậy nên trước đây đăng xuất ở lecturer đá luôn
       * hai app kia ra khỏi phiên. `prompt: "login"` ở `signIn` đã buộc luôn hiện form
       * đăng nhập bất kể cookie SSO còn sống hay không, nên không cần dựa vào việc xoá
       * cookie đó để "an toàn" — chỉ cần token của app này chết là đủ.
       */
      signOut: () => {
        tokenRef.current = null;
        userIdRef.current = null;
        const userManager = manager();
        void userManager
          .revokeTokens()
          .catch(() => undefined)
          .then(() => userManager.removeUser());
      },
      realtimeToken: async () => tokenRef.current,
      refreshUser: async () => {
        if (!tokenRef.current) return;
        setError(null);
        setStatus("loading");
        try {
          setUser(await api.me());
          setStatus("authenticated");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Không tải được hồ sơ");
        }
      },
    }),
    [status, user, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
