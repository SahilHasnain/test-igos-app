import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext } from "@/src/services/runtime";
import { governanceRuntime } from "@/src/services/governance-runtime";

export async function GET(request: Request, { params }: { params: Promise<{ matterId: string }> }) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const academyId = url.searchParams.get("academyId") ?? undefined;
    const { matterId } = await params;
    const context = await resolveRuntimeContext(request, matId);
    const [sections, risks] = await Promise.all([
      governanceRuntime().dpia.listSections(context, { matId, academyId }, matterId),
      governanceRuntime().dpia.listRisks(context, { matId, academyId }, matterId),
    ]);
    return apiOk({ sections, risks });
  } catch (cause) {
    return apiError("GET", "/api/governance/dpia/[matterId]", cause);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ matterId: string }> }) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const command = await request.json();
    const { matterId } = await params;
    const context = await resolveRuntimeContext(request, matId);
    if (command.action === "save-section") return apiOk({ section: await governanceRuntime().dpia.saveSection(context, { matId }, matterId, command.section) });
    if (command.action === "save-risk") return apiOk({ risk: await governanceRuntime().dpia.saveRisk(context, { matId }, matterId, command.risk) });
    return apiOk(await governanceRuntime().dpia.approve(context, { matId }, matterId));
  } catch (cause) {
    return apiError("POST", "/api/governance/dpia/[matterId]", cause);
  }
}
