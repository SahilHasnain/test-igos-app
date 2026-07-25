import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext, createRuntimeAdvancedGovernanceServices } from "@/src/services/runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAdvancedGovernanceServices();
    const systems = await services.aiSystems.list(context, { matId });
    return apiOk({ systems });
  } catch (error) {
    return apiError("GET", "/api/governance/ai-systems", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAdvancedGovernanceServices();
    const system = await services.aiSystems.save(context, { matId }, body);
    return apiOk({ system }, 201);
  } catch (error) {
    return apiError("POST", "/api/governance/ai-systems", error);
  }
}
