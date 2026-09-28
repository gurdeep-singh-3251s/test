"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API } from "@/lib/api-base";
import type { AuthUser, Role } from "@/lib/roles";
import { clearSession, getAuthToken, readSession, writeSession } from "@/lib/session";

export type { AuthUser, Role };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

class AuthRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AuthRequestError((body as { error?: string } | null)?.error ?? "Request failed", response.status);
  }
  return body as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readSession();
    if (!saved?.token) {
      setReady(true);
      return;
    }

    setToken(saved.token);
    if (saved.user) setUser(saved.user);
    setReady(true);

    void request<AuthUser>("/auth/me", { headers: { Authorization: `Bearer ${saved.token}` } })
      .then((fresh) => {
        setUser(fresh);
        writeSession(saved.token, fresh);
      })
      .catch((err) => {
        if (err instanceof AuthRequestError && err.status === 401) {
          clearSession();
          setToken(null);
          setUser(null);
        }
      });

    function onStorage() {
      const next = readSession();
      if (!next?.token) {
        setToken(null);
        setUser(null);
        return;
      }
      setToken(next.token);
      if (next.user) setUser(next.user);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      login: async (email, password) => {
        const result = await request<{ token: string; user: AuthUser }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        writeSession(result.token, result.user);
        setToken(result.token);
        setUser(result.user);
        return result.user;
      },
      signup: async (name, email, password) => {
        const result = await request<{ token: string; user: AuthUser }>("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        writeSession(result.token, result.user);
        setToken(result.token);
        setUser(result.user);
        return result.user;
      },
      logout: async () => {
        const current = token || getAuthToken();
        if (current) {
          void request("/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${current}` },
          }).catch(() => undefined);
        }
        clearSession();
        setToken(null);
        setUser(null);
      },
    }),
    [token, user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function authHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
