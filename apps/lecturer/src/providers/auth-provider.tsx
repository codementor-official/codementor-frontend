"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { accessTokenOf, currentUser, getUserManager } from "@codementor/auth";
import type { OidcUser, UserManager } from "@codementor/auth";
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
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The token lives in a ref rather than in state: the API client reads it during a
  // request, and re-rendering the tree every time a silent renew swaps the token
  // would be pointless churn.
  const tokenRef = useRef<string | null>(null);
  const managerRef = useRef<UserManager | null>(null);

  const manager = () => {
    // Resolved lazily because UserManager touches window.sessionStorage, which does
    // not exist while Next renders this on the server. `getUserManager` returns the
    // one instance the callback page also uses, so its events reach this provider.
    managerRef.current ??= getUserManager(keycloakConfig, window.location.origin);
    return managerRef.current;
  };

  useEffect(() => {
    setAccessTokenReader(() => tokenRef.current);

    const applyOidcUser = async (oidcUser: OidcUser | null) => {
      const token = accessTokenOf(oidcUser);
      tokenRef.current = token;

      if (!token) {
        setUser(null);
        setStatus("anonymous");
        return;
      }

      // Back to "loading" before fetching the profile, not after. Redeeming the
      // authorization code resolves before the profile does, and the callback page
      // navigates to a guarded route immediately; leaving the status at "anonymous"
      // during that gap makes the guard bounce the user to /login and straight back.
      setStatus("loading");

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
    };

    const userManager = manager();
    // `currentUser` chứ không phải `getUser`: token cũ đã hết hạn thì thử gia hạn im lặng
    // trước, thay vì đá thẳng người dùng về màn đăng nhập. Xem @codementor/auth.
    void currentUser(userManager).then(applyOidcUser);

    const onLoaded = (oidcUser: OidcUser) => void applyOidcUser(oidcUser);
    const onUnloaded = () => void applyOidcUser(null);
    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onUnloaded);
    userManager.events.addSilentRenewError(onUnloaded);

    return () => {
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onUnloaded);
      userManager.events.removeSilentRenewError(onUnloaded);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      // `prompt: "login"` forces Keycloak to show the form even when an SSO session from
      // another CodeMentor app (admin, or a different lecturer account) is still alive —
      // without it, this silently signs the browser in as whoever was last authenticated.
      signIn: () => void manager().signinRedirect({ extraQueryParams: { prompt: "login" } }),
      signOut: () => {
        tokenRef.current = null;
        void manager().signoutRedirect();
      },
      realtimeToken: async () => tokenRef.current,
      refreshUser: async () => {
        if (tokenRef.current) setUser(await api.me());
      },
    }),
    [status, user, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
