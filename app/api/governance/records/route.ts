import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext, createRuntimeAdvancedGovernanceServices } from "@/src/services/runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const academyId = url.searchParams.get("academyId") ?? undefined;
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAdvancedGovernanceServices();
    const records = await services.records.list(context, { matId, academyId });
    return apiOk({ records });
  } catch (error) {
    return apiError("GET", "/api/governance/records", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, academyId } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAdvancedGovernanceServices();
    const record = await services.records.save(context, { matId, academyId }, body);
    return apiOk({ record }, 201);
  } catch (error) {
    return apiError("POST", "/api/governance/records", error);
  }
}
