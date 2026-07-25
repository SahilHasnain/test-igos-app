import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext, createRuntimeSupplierService } from "@/src/services/runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const service = createRuntimeSupplierService();
    const assessments = await service.listAssessments(context, { matId });
    return apiOk({ assessments });
  } catch (error) {
    return apiError("GET", "/api/governance/suppliers", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const service = createRuntimeSupplierService();
    const assessment = await service.saveAssessment(context, { matId }, body);
    return apiOk({ assessment }, 201);
  } catch (error) {
    return apiError("POST", "/api/governance/suppliers", error);
  }
}
