import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext, createRuntimeDeadlineAdjustmentRepository } from "@/src/services/runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    const matterId = url.searchParams.get("matterId");
    if (!matId || !matterId) return apiOk({ error: "matId and matterId are required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const repo = createRuntimeDeadlineAdjustmentRepository();
    const adjustments = await repo.listByMatterId({ matId }, matterId);
    return apiOk({ adjustments });
  } catch (error) {
    return apiError("GET", "/api/deadlines", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, matterId, ...adjustment } = body;
    if (!matId || !matterId) return apiOk({ error: "matId and matterId are required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const repo = createRuntimeDeadlineAdjustmentRepository();
    const saved = await repo.save({ matId }, matterId, adjustment);
    return apiOk({ adjustment: saved }, 201);
  } catch (error) {
    return apiError("POST", "/api/deadlines", error);
  }
}
