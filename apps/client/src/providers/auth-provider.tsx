"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { accessTokenOf, getUserManager } from "@codementor/auth";
import type { OidcUser, UserManager } from "@codementor/auth";
import type { User } from "@codementor/types";
import { keycloakConfig } from "@/lib/env";
import { api, setAccessTokenReader } from "@/lib/api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

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
    tokenRef.current = accessTokenOf(oidcUser);

    // Back to "loading" before fetching the profile, not after. Redeeming the
    // authorization code resolves before the profile does, and the callback page
    // navigates to a guarded route immediately; leaving the status at "anonymous"
    // during that gap makes the guard bounce the user to /login and straight back.
    setStatus("loading");

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
      // A valid token with a rejected profile means a suspended or deleted
      // account. Staying "authenticated" would show an empty console instead.
      tokenRef.current = null;
      setUser(null);
      setStatus("anonymous");
      setError(cause instanceof Error ? cause.message : "Không tải được hồ sơ");
    }
  }, []);

  useEffect(() => {
    setAccessTokenReader(() => tokenRef.current);

    const userManager = manager();
    void userManager.getUser().then(applySession);

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
        try {
          // signinPopup resolves once the popup's callback (this same /auth/callback,
          // run inside the popup) posts the result back — see CallbackPage. Its
          // `userLoaded` event fires on this manager instance just like a redirect
          // would, so the effect above picks the session up the same way.
          await manager().signinPopup({
            extraQueryParams: { kc_idp_hint: provider },
            popupWindowFeatures: { width: 480, height: 640, popup: true },
          });
        } catch (cause) {
          // The user closing the popup themselves surfaces as a plain rejection —
          // not worth alarming them with an "error".
          const message = cause instanceof Error ? cause.message : String(cause);
          if (!/popup closed/i.test(message)) {
            setError("Không thể đăng nhập. Vui lòng thử lại.");
          }
        }
      },
      /**
       * Đăng xuất phải kết thúc CẢ HAI phía, nếu không lần bấm "Đăng nhập" kế tiếp sẽ
       * lặng lẽ khôi phục tài khoản cũ:
       *
       *   1. Phiên CodeMentor — cookie BFF (thu hồi refresh token ở Keycloak) và
       *      token trong tab của oidc-client-ts.
       *   2. Phiên SSO của Keycloak — cookie ở id.codementor.cloud, chỉ chết khi
       *      trình duyệt thực sự ghé end_session. Đăng nhập bằng mật khẩu không tạo
       *      cookie này (không có điều hướng nào tới Keycloak), nên chỉ phiên popup
       *      mới cần chuyến đi đó.
       *
       * Không đụng tới phiên Google/Facebook của người dùng: end_session chỉ kết thúc
       * phiên ở Keycloak, họ vẫn đăng nhập Gmail/Facebook bình thường.
       */
      signOut: async () => {
        tokenRef.current = null;
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);

        const oidcUser = await manager().getUser();
        if (oidcUser) {
          // signoutRedirect gửi id_token_hint, xoá user khỏi sessionStorage rồi quay
          // về post_logout_redirect_uri (/login). Trang này bị thay nên không cần
          // dọn state sau đó.
          await manager().signoutRedirect();
          return;
        }

        setUser(null);
        setStatus("anonymous");
        window.location.href = "/login";
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

/** `true` nếu cookie BFF còn sống. Không trả token — token không rời khỏi server. */
async function hasPasswordSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const body = (await response.json()) as { authenticated?: boolean };
    return body.authenticated === true;
  } catch {
    return false;
  }
}
