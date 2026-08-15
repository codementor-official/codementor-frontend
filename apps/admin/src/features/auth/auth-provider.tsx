"use client";

import { userFromToken } from "@codementor/auth";
import type { User } from "@codementor/types";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getKeycloakClient, initializeKeycloak } from "./keycloak-client";

interface AdminAuthContextValue {
  initialized: boolean;
  authenticated: boolean;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const syncState = useCallback(() => {
    const keycloak = getKeycloakClient();
    setAuthenticated(Boolean(keycloak.authenticated));
    setUser(keycloak.authenticated ? userFromToken(keycloak.tokenParsed) : null);
  }, []);

  useEffect(() => {
    let active = true;
    const keycloak = getKeycloakClient();
    keycloak.onTokenExpired = () => {
      void keycloak.updateToken(30).then(syncState).catch(() => keycloak.clearToken());
    };
    void initializeKeycloak()
      .then(() => {
        if (active) syncState();
      })
      .finally(() => {
        if (active) setInitialized(true);
      });
    return () => {
      active = false;
    };
  }, [syncState]);

  const login = useCallback(async () => {
    await getKeycloakClient().login({ redirectUri: `${window.location.origin}/dashboard` });
  }, []);

  const logout = useCallback(async () => {
    await getKeycloakClient().logout({ redirectUri: `${window.location.origin}/login` });
  }, []);

  const getAccessToken = useCallback(async () => {
    const keycloak = getKeycloakClient();
    if (!keycloak.authenticated) return null;
    await keycloak.updateToken(30);
    return keycloak.token ?? null;
  }, []);

  const value = useMemo(
    () => ({ initialized, authenticated, user, login, logout, getAccessToken }),
    [authenticated, getAccessToken, initialized, login, logout, user],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
