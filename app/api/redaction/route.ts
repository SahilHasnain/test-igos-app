import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext, createRuntimeRedactionRepositories } from "@/src/services/runtime";
import { decideRedactionSuggestion } from "@/src/domain/redaction";
import { buildRedactionManifest } from "@/src/services/redaction-manifest";

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
    const manifests = documentId ? await repos.manifests.listByMatterAndDocument({ matId }, matterId, documentId) : [];
    return apiOk({ suggestions, analysisRuns, manifests });
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
      const { id, decision, reviewerRationale, finalTreatment } = data;
      if (!id || !decision) return apiOk({ error: "id and decision are required" }, 400);
      const existing = await repos.suggestions.findById({ matId }, id);
      if (!existing) return apiOk({ error: "Suggestion not found" }, 404);
      const updated = decideRedactionSuggestion(existing, {
        decision,
        reviewerUserId: context.user.id,
        rationale: String(reviewerRationale ?? ""),
        finalTreatment,
      });
      const saved = await repos.suggestions.update({ matId }, id, updated);
      return apiOk({ suggestion: saved });
    }

    if (action === "generate-manifest") {
      const { matterId, documentId, documentVersion, originalChecksum, redactedCopyDocumentId, redactedCopyChecksum } = data;
      if (!matterId || !documentId || !documentVersion || !originalChecksum || !redactedCopyDocumentId || !redactedCopyChecksum) {
        return apiOk({ error: "matterId, documentId, documentVersion, originalChecksum, redactedCopyDocumentId and redactedCopyChecksum are required" }, 400);
      }
      const suggestions = await repos.suggestions.listByMatterAndDocument({ matId }, String(matterId), String(documentId));
      const secondReviews: Record<string, string> = {};
      await Promise.all(suggestions.map(async (suggestion) => {
        const reviews = await repos.secondReviews.listBySuggestion({ matId }, suggestion.id);
        const completed = reviews.find((review) => review.decision === "approved");
        if (completed) secondReviews[suggestion.id] = completed.reviewerUserId;
      }));
      const manifest = buildRedactionManifest({
        id: `manifest-${String(documentId)}-${Date.now()}`,
        matId,
        matterId: String(matterId),
        document: {
          documentId: String(documentId),
          documentVersion: Number(documentVersion),
          originalChecksum: String(originalChecksum),
          redactedCopyDocumentId: String(redactedCopyDocumentId),
          redactedCopyChecksum: String(redactedCopyChecksum),
        },
        generatedAt: new Date().toISOString(),
        generatedByUserId: context.user.id,
        suggestions,
        secondReviews,
      });
      const saved = await repos.manifests.save({ matId }, {
        id: manifest.id,
        matId: manifest.matId,
        matterId: manifest.matterId,
        documentId: manifest.document.documentId,
        documentVersion: manifest.document.documentVersion,
        originalChecksum: manifest.document.originalChecksum,
        redactedCopyDocumentId: manifest.document.redactedCopyDocumentId,
        redactedCopyChecksum: manifest.document.redactedCopyChecksum,
        generatedAt: manifest.generatedAt,
        generatedByUserId: manifest.generatedByUserId,
        entries: manifest.entries,
        manifestHash: manifest.manifestHash,
      });
      return apiOk({ manifest: saved }, 201);
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
      const saved = await repos.secondReviews.save({ matId }, {
        ...data,
        matId,
        reviewerUserId: context.user.id,
        reviewedAt: data.reviewedAt ?? new Date().toISOString(),
      });
      return apiOk({ review: saved }, 201);
    }

    return apiOk({ error: "Unknown action" }, 400);
  } catch (error) {
    return apiError("POST", "/api/redaction", error);
  }
}
