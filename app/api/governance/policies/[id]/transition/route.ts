import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext } from "@/src/services/runtime";
import { governanceRuntime } from "@/src/services/governance-runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = await request.json();
    const { id } = await params;
    const matId = input.matId;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    return apiOk({ policy: await governanceRuntime().policy.transition(context, input, id, input.to) });
  } catch (cause) {
    return apiError("POST", "/api/governance/policies/[id]/transition", cause);
  }
}
