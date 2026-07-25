import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext, createRuntimeRedactionRepositories } from "@/src/services/runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    const matterId = url.searchParams.get("matterId");
    const documentId = url.searchParams.get("documentId");
    if (!matId || !matterId) return apiOk({ error: "matId and matterId are required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const repos = createRuntimeRedactionRepositories();
    const suggestions = documentId
      ? await repos.suggestions.listByMatterAndDocument({ matId }, matterId, documentId)
      : [];
    const analysisRuns = await repos.analysis.list({ matId }, matterId);
    return apiOk({ suggestions, analysisRuns });
  } catch (error) {
    return apiError("GET", "/api/redaction", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, action, ...data } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const repos = createRuntimeRedactionRepositories();

    if (action === "decide") {
      const { id, decision, reviewerRationale, decidedByUserId } = data;
      if (!id || !decision) return apiOk({ error: "id and decision are required" }, 400);
      const existing = await repos.suggestions.findById({ matId }, id);
      if (!existing) return apiOk({ error: "Suggestion not found" }, 404);
      const updated = { ...existing, decision, decidedByUserId, decidedAt: new Date().toISOString(), reviewerRationale };
      const saved = await repos.suggestions.update({ matId }, id, updated);
      return apiOk({ suggestion: saved });
    }

    if (action === "save-analysis") {
      const saved = await repos.analysis.save({ matId }, data);
      return apiOk({ analysis: saved }, 201);
    }

    if (action === "save-suggestion") {
      const saved = await repos.suggestions.save({ matId }, data);
      return apiOk({ suggestion: saved }, 201);
    }

    if (action === "save-manifest") {
      const saved = await repos.manifests.save({ matId }, data);
      return apiOk({ manifest: saved }, 201);
    }

    if (action === "save-review") {
      const saved = await repos.secondReviews.save({ matId }, data);
      return apiOk({ review: saved }, 201);
    }

    return apiOk({ error: "Unknown action" }, 400);
  } catch (error) {
    return apiError("POST", "/api/redaction", error);
  }
}
