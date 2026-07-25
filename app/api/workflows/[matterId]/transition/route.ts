import { apiError, apiOk } from "@/src/lib/api-handler";
import { createRuntimeWorkflowService, resolveRuntimeContext } from "@/src/services/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ matterId: string }> }) {
  try {
    const { matterId } = await params;
    const input = await request.json();
    const matId = input.matId;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const workflow = await createRuntimeWorkflowService().transition(context, { ...input, matterId, to: input.to as never });
    return apiOk({ workflow });
  } catch (error) {
    return apiError("POST", "/api/workflows/[matterId]/transition", error);
  }
}
