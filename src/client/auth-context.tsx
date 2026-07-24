"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface AuthState {
  userId: string;
  roles: string[];
  academyIds: string[];
  jwt?: string;
}

interface AuthContextValue {
  auth: AuthState;
  setAuth: (state: AuthState) => void;
  headers: Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_AUTH: AuthState = { userId: "demo-dpo", roles: ["dpo"], academyIds: [] };

export function AuthProvider({ children, initial }: { children: ReactNode; initial?: Partial<AuthState> }) {
  const [auth, setAuthState] = useState<AuthState>({ ...DEFAULT_AUTH, ...initial });

  const setAuth = useCallback((state: AuthState) => setAuthState(state), []);

  const headers: Record<string, string> = {};
  if (auth.jwt) {
    headers["Authorization"] = `Bearer ${auth.jwt}`;
  } else {
    headers["x-demo-user-id"] = auth.userId;
    headers["x-demo-roles"] = auth.roles.join(",");
    if (auth.academyIds.length) headers["x-demo-academies"] = auth.academyIds.join(",");
  }

  return <AuthContext.Provider value={{ auth, setAuth, headers }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
