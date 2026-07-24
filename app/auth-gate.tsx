"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AuthProvider, type AuthState } from "@/src/client/auth-context";

function loadAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("igos-auth");
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadAuth();
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    setAuth(stored);
    setReady(true);
  }, []);

  if (!ready || !auth) return null;

  return <AuthProvider initial={auth}>{children}</AuthProvider>;
}
