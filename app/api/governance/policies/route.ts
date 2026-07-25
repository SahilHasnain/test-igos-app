import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext } from "@/src/services/runtime";
import { governanceRuntime } from "@/src/services/governance-runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const academyId = url.searchParams.get("academyId") ?? undefined;
    const context = await resolveRuntimeContext(request, matId);
    return apiOk({ policies: await governanceRuntime().policy.list(context, { matId, academyId }) });
  } catch (cause) {
    return apiError("GET", "/api/governance/policies", cause);
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const matId = input.matId;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    return apiOk({ policy: await governanceRuntime().policy.save(context, { matId }, input) }, 201);
  } catch (cause) {
    return apiError("POST", "/api/governance/policies", cause);
  }
}
