const BASE = "";

export type RequestHeaders = Record<string, string>;

async function request<T>(path: string, headers: RequestHeaders = {}, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...headers, ...init?.headers },
    ...init,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed: ${res.status}`);
  return json as T;
}

export function createApiClient(authHeaders: RequestHeaders = {}, refreshJwt?: () => Promise<string | null>) {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    try {
      return await request<T>(path, authHeaders, init);
    } catch (err) {
      if (refreshJwt && err instanceof Error && /expired|invalid token/i.test(err.message)) {
        const newJwt = await refreshJwt();
        if (newJwt) {
          authHeaders["Authorization"] = `Bearer ${newJwt}`;
          return request<T>(path, authHeaders, init);
        }
      }
      throw err;
    }
  }
  return {
    matters: {
      list: (matId: string) => req<{ matters: readonly unknown[] }>(`/api/matters?matId=${encodeURIComponent(matId)}`),
      create: (body: Record<string, unknown>) => req<{ matter: unknown }>("/api/matters", { method: "POST", body: JSON.stringify(body) }),
      get: (matId: string) => req<{ matter: unknown }>(`/api/matters/${matId}`),
      patch: (matId: string, body: Record<string, unknown>) => req<{ matter: unknown }>(`/api/matters/${matId}`, { method: "PATCH", body: JSON.stringify(body) }),
    },

    workflow: {
      get: (matId: string) => req<{ workflow: unknown }>(`/api/workflows/${matId}`),
      save: (body: Record<string, unknown>) => req<{ workflow: unknown }>(`/api/workflows/${body.matId}`, { method: "POST", body: JSON.stringify(body) }),
      transition: (body: Record<string, unknown>) => req<{ workflow: unknown }>(`/api/workflows/${body.matId}/transition`, { method: "POST", body: JSON.stringify(body) }),
    },

    governance: {
      dpia: {
        get: (matId: string, matterId: string) => req<{ sections: readonly unknown[]; risks: readonly unknown[] }>(`/api/governance/dpia/${matterId}?matId=${matId}`),
        save: (matId: string, matterId: string, body: Record<string, unknown>) => req<{ section?: unknown; risk?: unknown; approved?: boolean }>(`/api/governance/dpia/${matterId}?matId=${matId}`, { method: "POST", body: JSON.stringify(body) }),
      },
      ropa: {
        get: (matId: string) => req<{ activities: readonly unknown[] }>(`/api/governance/ropa?matId=${matId}`),
        save: (matId: string, body: Record<string, unknown>) => req<{ activity: unknown }>("/api/governance/ropa", { method: "POST", body: JSON.stringify({ ...body, matId }) }),
      },
      policy: {
        list: (matId: string) => req<{ policies: readonly unknown[] }>(`/api/governance/policies?matId=${matId}`),
        save: (matId: string, body: Record<string, unknown>) => req<{ policy: unknown }>("/api/governance/policies", { method: "POST", body: JSON.stringify({ ...body, matId }) }),
        transition: (matId: string, id: string, body: Record<string, unknown>) => req<{ policy: unknown }>(`/api/governance/policies/${id}/transition`, { method: "POST", body: JSON.stringify({ ...body, matId }) }),
      },
    },

    assurance: {
      actions: {
        list: (matId: string) => req<{ actions: readonly unknown[] }>(`/api/assurance/actions?matId=${matId}`),
        save: (body: Record<string, unknown>) => req<{ action: unknown }>("/api/assurance/actions", { method: "POST", body: JSON.stringify(body) }),
      },
      programmes: {
        list: (matId: string) => req<{ programmes: readonly unknown[] }>(`/api/assurance/programmes?matId=${matId}`),
        save: (body: Record<string, unknown>) => req<{ programme: unknown }>("/api/assurance/programmes", { method: "POST", body: JSON.stringify(body) }),
      },
      findings: {
        list: (matId: string) => req<{ findings: readonly unknown[] }>(`/api/assurance/findings?matId=${matId}`),
        save: (body: Record<string, unknown>) => req<{ finding: unknown }>("/api/assurance/findings", { method: "POST", body: JSON.stringify(body) }),
      },
      risks: {
        list: (matId: string) => req<{ risks: readonly unknown[] }>(`/api/assurance/risks?matId=${matId}`),
        save: (body: Record<string, unknown>) => req<{ risk: unknown }>("/api/assurance/risks", { method: "POST", body: JSON.stringify(body) }),
      },
    },

    advancedGovernance: {
      aiSystems: {
        list: (matId: string) => req<{ systems: readonly unknown[] }>(`/api/governance/ai-systems?matId=${matId}`),
        save: (body: Record<string, unknown>) => req<{ system: unknown }>("/api/governance/ai-systems", { method: "POST", body: JSON.stringify(body) }),
      },
      assets: {
        list: (matId: string) => req<{ assets: readonly unknown[] }>(`/api/governance/assets?matId=${matId}`),
        save: (body: Record<string, unknown>) => req<{ asset: unknown }>("/api/governance/assets", { method: "POST", body: JSON.stringify(body) }),
      },
      records: {
        list: (matId: string) => req<{ records: readonly unknown[] }>(`/api/governance/records?matId=${matId}`),
        save: (body: Record<string, unknown>) => req<{ record: unknown }>("/api/governance/records", { method: "POST", body: JSON.stringify(body) }),
      },
      contracts: {
        list: (matId: string) => req<{ contracts: readonly unknown[] }>(`/api/governance/contracts?matId=${matId}`),
        save: (body: Record<string, unknown>) => req<{ contract: unknown }>("/api/governance/contracts", { method: "POST", body: JSON.stringify(body) }),
      },
    },

    suppliers: {
      list: (matId: string) => req<{ assessments: readonly unknown[] }>(`/api/governance/suppliers?matId=${matId}`),
      save: (body: Record<string, unknown>) => req<{ assessment: unknown }>("/api/governance/suppliers", { method: "POST", body: JSON.stringify(body) }),
    },

    deadlines: {
      list: (matId: string, matterId: string) => req<{ adjustments: readonly unknown[] }>(`/api/deadlines?matId=${matId}&matterId=${matterId}`),
      save: (body: Record<string, unknown>) => req<{ adjustment: unknown }>("/api/deadlines", { method: "POST", body: JSON.stringify(body) }),
    },

    redaction: {
      list: (matId: string, matterId: string, documentId?: string) => {
        const params = `matId=${matId}&matterId=${matterId}${documentId ? `&documentId=${documentId}` : ""}`;
        return req<{ suggestions: readonly unknown[]; analysisRuns: readonly unknown[]; manifests: readonly unknown[] }>(`/api/redaction?${params}`);
      },
      decide: (body: Record<string, unknown>) => req<{ suggestion: unknown }>("/api/redaction", { method: "POST", body: JSON.stringify({ ...body, matId: body.matId, action: "decide" }) }),
      generateManifest: (body: Record<string, unknown>) => req<{ manifest: unknown }>("/api/redaction", { method: "POST", body: JSON.stringify({ ...body, action: "generate-manifest" }) }),
      saveAnalysis: (body: Record<string, unknown>) => req<{ analysis: unknown }>("/api/redaction", { method: "POST", body: JSON.stringify({ ...body, action: "save-analysis" }) }),
      saveSuggestion: (body: Record<string, unknown>) => req<{ suggestion: unknown }>("/api/redaction", { method: "POST", body: JSON.stringify({ ...body, action: "save-suggestion" }) }),
      saveManifest: (body: Record<string, unknown>) => req<{ manifest: unknown }>("/api/redaction", { method: "POST", body: JSON.stringify({ ...body, action: "save-manifest" }) }),
      saveReview: (body: Record<string, unknown>) => req<{ review: unknown }>("/api/redaction", { method: "POST", body: JSON.stringify({ ...body, action: "save-review" }) }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
