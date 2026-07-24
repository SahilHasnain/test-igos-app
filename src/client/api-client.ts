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

export function createApiClient(authHeaders: RequestHeaders = {}) {
  return {
    matters: {
      list: () => request<{ matters: readonly unknown[] }>("/api/matters", authHeaders),
      create: (body: Record<string, unknown>) => request<{ matter: unknown }>("/api/matters", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      get: (matId: string) => request<{ matter: unknown }>(`/api/matters/${matId}`, authHeaders),
      patch: (matId: string, body: Record<string, unknown>) => request<{ matter: unknown }>(`/api/matters/${matId}`, authHeaders, { method: "PATCH", body: JSON.stringify(body) }),
    },

    workflow: {
      get: (matId: string) => request<{ workflow: unknown }>(`/api/workflows/${matId}`, authHeaders),
      save: (body: Record<string, unknown>) => request<{ workflow: unknown }>(`/api/workflows/${body.matId}`, authHeaders, { method: "POST", body: JSON.stringify(body) }),
      transition: (body: Record<string, unknown>) => request<{ workflow: unknown }>(`/api/workflows/${body.matId}/transition`, authHeaders, { method: "POST", body: JSON.stringify(body) }),
    },

    governance: {
      dpia: {
        get: (matId: string, matterId: string) => request<{ sections: readonly unknown[]; risks: readonly unknown[] }>(`/api/governance/dpia/${matterId}?matId=${matId}`, authHeaders),
        save: (matId: string, matterId: string, body: Record<string, unknown>) => request<{ section?: unknown; risk?: unknown; approved?: boolean }>(`/api/governance/dpia/${matterId}?matId=${matId}`, authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
      ropa: {
        get: (matId: string) => request<{ activities: readonly unknown[] }>(`/api/governance/ropa?matId=${matId}`, authHeaders),
        save: (matId: string, body: Record<string, unknown>) => request<{ activity: unknown }>("/api/governance/ropa", authHeaders, { method: "POST", body: JSON.stringify({ ...body, matId }) }),
      },
      policy: {
        list: (matId: string) => request<{ policies: readonly unknown[] }>(`/api/governance/policies?matId=${matId}`, authHeaders),
        save: (matId: string, body: Record<string, unknown>) => request<{ policy: unknown }>("/api/governance/policies", authHeaders, { method: "POST", body: JSON.stringify({ ...body, matId }) }),
        transition: (matId: string, id: string, body: Record<string, unknown>) => request<{ policy: unknown }>(`/api/governance/policies/${id}/transition`, authHeaders, { method: "POST", body: JSON.stringify({ ...body, matId }) }),
      },
    },

    assurance: {
      actions: {
        list: (matId: string) => request<{ actions: readonly unknown[] }>(`/api/assurance/actions?matId=${matId}`, authHeaders),
        save: (body: Record<string, unknown>) => request<{ action: unknown }>("/api/assurance/actions", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
      programmes: {
        list: (matId: string) => request<{ programmes: readonly unknown[] }>(`/api/assurance/programmes?matId=${matId}`, authHeaders),
        save: (body: Record<string, unknown>) => request<{ programme: unknown }>("/api/assurance/programmes", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
      findings: {
        list: (matId: string) => request<{ findings: readonly unknown[] }>(`/api/assurance/findings?matId=${matId}`, authHeaders),
        save: (body: Record<string, unknown>) => request<{ finding: unknown }>("/api/assurance/findings", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
      risks: {
        list: (matId: string) => request<{ risks: readonly unknown[] }>(`/api/assurance/risks?matId=${matId}`, authHeaders),
        save: (body: Record<string, unknown>) => request<{ risk: unknown }>("/api/assurance/risks", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
    },

    advancedGovernance: {
      aiSystems: {
        list: (matId: string) => request<{ systems: readonly unknown[] }>(`/api/governance/ai-systems?matId=${matId}`, authHeaders),
        save: (body: Record<string, unknown>) => request<{ system: unknown }>("/api/governance/ai-systems", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
      assets: {
        list: (matId: string) => request<{ assets: readonly unknown[] }>(`/api/governance/assets?matId=${matId}`, authHeaders),
        save: (body: Record<string, unknown>) => request<{ asset: unknown }>("/api/governance/assets", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
      records: {
        list: (matId: string) => request<{ records: readonly unknown[] }>(`/api/governance/records?matId=${matId}`, authHeaders),
        save: (body: Record<string, unknown>) => request<{ record: unknown }>("/api/governance/records", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
      contracts: {
        list: (matId: string) => request<{ contracts: readonly unknown[] }>(`/api/governance/contracts?matId=${matId}`, authHeaders),
        save: (body: Record<string, unknown>) => request<{ contract: unknown }>("/api/governance/contracts", authHeaders, { method: "POST", body: JSON.stringify(body) }),
      },
    },

    suppliers: {
      list: (matId: string) => request<{ assessments: readonly unknown[] }>(`/api/governance/suppliers?matId=${matId}`, authHeaders),
      save: (body: Record<string, unknown>) => request<{ assessment: unknown }>("/api/governance/suppliers", authHeaders, { method: "POST", body: JSON.stringify(body) }),
    },

    deadlines: {
      list: (matId: string, matterId: string) => request<{ adjustments: readonly unknown[] }>(`/api/deadlines?matId=${matId}&matterId=${matterId}`, authHeaders),
      save: (body: Record<string, unknown>) => request<{ adjustment: unknown }>("/api/deadlines", authHeaders, { method: "POST", body: JSON.stringify(body) }),
    },

    redaction: {
      list: (matId: string, matterId: string, documentId?: string) => {
        const params = `matId=${matId}&matterId=${matterId}${documentId ? `&documentId=${documentId}` : ""}`;
        return request<{ suggestions: readonly unknown[]; analysisRuns: readonly unknown[] }>(`/api/redaction?${params}`, authHeaders);
      },
      decide: (body: Record<string, unknown>) => request<{ suggestion: unknown }>("/api/redaction", authHeaders, { method: "POST", body: JSON.stringify({ ...body, matId: body.matId, action: "decide" }) }),
      saveAnalysis: (body: Record<string, unknown>) => request<{ analysis: unknown }>("/api/redaction", authHeaders, { method: "POST", body: JSON.stringify({ ...body, action: "save-analysis" }) }),
      saveSuggestion: (body: Record<string, unknown>) => request<{ suggestion: unknown }>("/api/redaction", authHeaders, { method: "POST", body: JSON.stringify({ ...body, action: "save-suggestion" }) }),
      saveManifest: (body: Record<string, unknown>) => request<{ manifest: unknown }>("/api/redaction", authHeaders, { method: "POST", body: JSON.stringify({ ...body, action: "save-manifest" }) }),
      saveReview: (body: Record<string, unknown>) => request<{ review: unknown }>("/api/redaction", authHeaders, { method: "POST", body: JSON.stringify({ ...body, action: "save-review" }) }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
