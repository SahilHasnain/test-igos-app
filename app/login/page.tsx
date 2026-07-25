"use client";

import { useState, FormEvent } from "react";
import { Client, Account } from "appwrite";

type DemoRole = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";
const demoRoles: DemoRole[] = ["DPO", "MAT administrator", "Case manager", "Academy lead", "Auditor", "Read only"];

function createAppwriteClient() {
  const client = new Client();
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (endpoint && projectId) {
    client.setEndpoint(endpoint).setProject(projectId);
  }
  return client;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoRole, setDemoRole] = useState<DemoRole>("DPO");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAppwrite = process.env.NEXT_PUBLIC_IGOS_DATA_MODE === "appwrite";

  async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 500): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === attempts - 1) throw err;
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
    throw new Error("unreachable");
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isAppwrite) {
        const client = createAppwriteClient();
        const account = new Account(client);

        try { await account.deleteSession("current"); } catch { /* no session to delete */ }
        await withRetry(() => account.createEmailPasswordSession(email, password));
        const user = await withRetry(() => account.get());
        const jwtResult = await withRetry(() => account.createJWT());

        const memberships = await fetch("/api/memberships/current", {
          headers: { Authorization: `Bearer ${jwtResult.jwt}` },
        });
        const membershipData = await memberships.json();

        sessionStorage.setItem("igos-auth", JSON.stringify({
          userId: user.$id,
          roles: membershipData.roles ?? ["read-only"],
          academyIds: membershipData.academyIds ?? [],
          matId: membershipData.matId,
          jwt: jwtResult.jwt,
        }));
      } else {
        const roleMap: Record<DemoRole, string[]> = {
          "DPO": ["dpo"],
          "MAT administrator": ["mat-admin"],
          "Case manager": ["case-manager"],
          "Academy lead": ["academy-lead"],
          "Auditor": ["auditor"],
          "Read only": ["read-only"],
        };
        sessionStorage.setItem("igos-auth", JSON.stringify({
          userId: `demo-${demoRole.toLowerCase().replace(/\s+/g, "-")}`,
          roles: roleMap[demoRole],
          academyIds: [],
        }));
      }

      window.location.href = "/";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message.includes("Invalid credentials") || message.includes("401") ? "Invalid email or password." : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <form onSubmit={handleLogin} style={{ width: 360, padding: 32, border: "1px solid #ddd", borderRadius: 8 }}>
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: "#2563eb" }}>I</span>
          <h1 style={{ margin: "4px 0 0", fontSize: 18 }}>IGOS</h1>
          <p style={{ margin: 0, color: "#666", fontSize: 13 }}>Sign in to Information Governance</p>
        </div>

        {!isAppwrite && (
          <div style={{ marginBottom: 12, padding: "8px 10px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, color: "#0369a1", fontSize: 12, textAlign: "center" }}>
            Demo mode — records stay in this browser session
          </div>
        )}

        {error && <div style={{ marginBottom: 16, padding: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", fontSize: 13 }}>{error}</div>}

        {isAppwrite ? (
          <>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rosa-federation.igos.local"
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 20 }}>
              <span style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
              />
            </label>
          </>
        ) : (
          <label style={{ display: "block", marginBottom: 20 }}>
            <span style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Demo role</span>
            <select
              value={demoRole}
              onChange={(e) => setDemoRole(e.target.value as DemoRole)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
            >
              {demoRoles.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "10px 0", background: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}
        >
          {loading ? "Signing in…" : isAppwrite ? "Sign in" : "Enter workspace"}
        </button>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#888" }}>Appwrite-ready · M365 optional</p>
      </form>
    </div>
  );
}
