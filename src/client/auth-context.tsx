"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface AuthState {
  userId: string;
  roles: string[];
  academyIds: string[];
  matId?: string;
  jwt?: string;
}

interface AuthContextValue {
  auth: AuthState;
  setAuth: (state: AuthState) => void;
  headers: Record<string, string>;
  refreshJwt: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_AUTH: AuthState = { userId: "demo-dpo", roles: ["dpo"], academyIds: [] };

export function AuthProvider({ children, initial }: { children: ReactNode; initial?: Partial<AuthState> }) {
  const [auth, setAuthState] = useState<AuthState>({ ...DEFAULT_AUTH, ...initial });

  const setAuth = useCallback((state: AuthState) => setAuthState(state), []);

  const refreshJwt = useCallback(async (): Promise<string | null> => {
    try {
      const { Client, Account } = await import("appwrite");
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      if (!endpoint || !projectId) return null;
      const client = new Client().setEndpoint(endpoint).setProject(projectId);
      const account = new Account(client);
      const result = await account.createJWT();
      const newJwt = result.jwt;
      setAuthState((prev) => {
        const updated = { ...prev, jwt: newJwt };
        sessionStorage.setItem("igos-auth", JSON.stringify(updated));
        return updated;
      });
      return newJwt;
    } catch {
      sessionStorage.removeItem("igos-auth");
      window.location.href = "/login";
      return null;
    }
  }, []);

  const headers: Record<string, string> = {};
  if (auth.jwt) {
    headers["Authorization"] = `Bearer ${auth.jwt}`;
  } else {
    headers["x-demo-user-id"] = auth.userId;
    headers["x-demo-roles"] = auth.roles.join(",");
    if (auth.academyIds.length) headers["x-demo-academies"] = auth.academyIds.join(",");
  }

  return <AuthContext.Provider value={{ auth, setAuth, headers, refreshJwt }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
