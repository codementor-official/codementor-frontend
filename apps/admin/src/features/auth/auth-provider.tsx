"use client";

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

interface AdminAuthContextValue {
  initialized: boolean;
  authenticated: boolean;
  user: User | null;
  signInWithPassword: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(8_000) })
      .then(async (response) => {
        const session = (await response.json()) as { authenticated: boolean; user: User | null };
        if (active) {
          setAuthenticated(session.authenticated);
          setUser(session.user);
        }
      })
      .catch(() => {
        if (active) {
          setAuthenticated(false);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setInitialized(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const signInWithPassword = useCallback(async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = (await response.json()) as { message?: string; user?: User };
    if (!response.ok || !body.user) throw new Error(body.message ?? "Đăng nhập thất bại.");
    setUser(body.user);
    setAuthenticated(true);
    setInitialized(true);
  }, []);

  const logout = useCallback(async () => {
    window.location.assign("/api/auth/logout");
  }, []);

  const value = useMemo(
    () => ({ initialized, authenticated, user, signInWithPassword, logout }),
    [authenticated, initialized, signInWithPassword, logout, user],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
