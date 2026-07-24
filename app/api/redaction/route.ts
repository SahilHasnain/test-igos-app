import { NextResponse } from "next/server";
import { resolveRuntimeContext, createRuntimeRedactionRepositories } from "@/src/services/runtime";

function errorStatus(message: string) {
  if (message.includes("permission")) return 403;
  if (message.includes("not found")) return 404;
  if (message.includes("required") || message.includes("outside")) return 400;
  return 500;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    const matterId = url.searchParams.get("matterId");
    const documentId = url.searchParams.get("documentId");
    if (!matId || !matterId) return NextResponse.json({ error: "matId and matterId are required" }, { status: 400 });
    const context = await resolveRuntimeContext(request, matId);
    const repos = createRuntimeRedactionRepositories();
    const suggestions = documentId
      ? await repos.suggestions.listByMatterAndDocument({ matId }, matterId, documentId)
      : [];
    const analysisRuns = await repos.analysis.list({ matId }, matterId);
    return NextResponse.json({ suggestions, analysisRuns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, action, ...data } = body;
    if (!matId) return NextResponse.json({ error: "matId is required" }, { status: 400 });
    const context = await resolveRuntimeContext(request, matId);
    const repos = createRuntimeRedactionRepositories();

    if (action === "decide") {
      const { id, decision, reviewerRationale, decidedByUserId } = data;
      if (!id || !decision) return NextResponse.json({ error: "id and decision are required" }, { status: 400 });
      const existing = await repos.suggestions.findById({ matId }, id);
      if (!existing) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
      const updated = { ...existing, decision, decidedByUserId, decidedAt: new Date().toISOString(), reviewerRationale };
      const saved = await repos.suggestions.update({ matId }, id, updated);
      return NextResponse.json({ suggestion: saved });
    }

    if (action === "save-analysis") {
      const saved = await repos.analysis.save({ matId }, data);
      return NextResponse.json({ analysis: saved }, { status: 201 });
    }

    if (action === "save-suggestion") {
      const saved = await repos.suggestions.save({ matId }, data);
      return NextResponse.json({ suggestion: saved }, { status: 201 });
    }

    if (action === "save-manifest") {
      const saved = await repos.manifests.save({ matId }, data);
      return NextResponse.json({ manifest: saved }, { status: 201 });
    }

    if (action === "save-review") {
      const saved = await repos.secondReviews.save({ matId }, data);
      return NextResponse.json({ review: saved }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
