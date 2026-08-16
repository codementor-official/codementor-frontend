"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { accessTokenOf, getUserManager, registrationUrl } from "@codementor/auth";
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
  /** Full-page redirect to Keycloak — used for deep-link "you must log in" prompts, not the /login form. */
  signIn: () => void;
  /**
   * Opens Keycloak in a popup so /login never navigates away. No `provider` shows
   * the plain username/password form; a provider skips straight to that IdP via
   * `kc_idp_hint`. Rejects on cancel/error.
   */
  signInWithPopup: (provider?: SocialProvider) => Promise<void>;
  signUp: () => void;
  signOut: () => void;
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
    void userManager.getUser().then(applyOidcUser);

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
      // `prompt: login` forces Keycloak to re-authenticate even if its own SSO
      // session (a separate cookie from ours) is still alive from a prior login —
      // without it, "Login" after "Logout" can silently resume the last identity
      // (including a linked Google/Facebook broker session) instead of asking again.
      signIn: () => void manager().signinRedirect({ extraQueryParams: { prompt: "login" } }),
      signInWithPopup: async (provider) => {
        setError(null);
        try {
          // signinPopup resolves once the popup's callback (this same /auth/callback,
          // run inside the popup) posts the result back — see CallbackPage. Its
          // `userLoaded` event fires on this manager instance just like a redirect
          // would, so the effect above picks the session up the same way.
          await manager().signinPopup({
            // No provider → plain login form. `prompt: login` there for the same
            // reason `signIn` needs it: an alive Keycloak SSO session would otherwise
            // skip the form and silently resume whoever was last signed in.
            extraQueryParams: provider ? { kc_idp_hint: provider } : { prompt: "login" },
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
      signUp: () => {
        window.location.href = registrationUrl(keycloakConfig, window.location.origin);
      },
      signOut: () => {
        tokenRef.current = null;
        void manager().signoutRedirect();
      },
      refreshUser: async () => {
        if (tokenRef.current) setUser(await api.me());
      },
    }),
    [status, user, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
