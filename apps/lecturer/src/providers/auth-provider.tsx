"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@codementor/types";
import { api } from "@/lib/api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  realtimeToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(8_000) })
      .then(async (response) => {
        const body = (await response.json()) as { authenticated: boolean; user: User | null };
        if (!active) return;
        if (response.ok && body.authenticated) {
          setUser(body.user);
          setStatus("authenticated");
        } else {
          setUser(null);
          setStatus("anonymous");
        }
      })
      .catch(() => {
        if (active) { setError("Không kiểm tra được phiên đăng nhập."); setStatus("anonymous"); }
      });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = (await response.json()) as { message?: string; user?: User };
    if (!response.ok || !body.user) throw new Error(body.message ?? "Đăng nhập thất bại.");
    setUser(body.user);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(() => {
    void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
      .finally(() => { setUser(null); setStatus("anonymous"); window.location.assign("/login"); });
  }, []);

  const refreshUser = useCallback(async () => {
    setError(null);
    try {
      const profile = await api.me();
      setUser(profile);
      setStatus("authenticated");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được hồ sơ.");
    }
  }, []);

  const realtimeToken = useCallback(async () => {
    const response = await fetch("/api/auth/realtime-token", { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as { token?: string };
    return body.token ?? null;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ status, user, error,
    signIn, signOut, refreshUser, realtimeToken }),
    [status, user, error, signIn, signOut, refreshUser, realtimeToken]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
