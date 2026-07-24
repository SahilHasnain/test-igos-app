import type { JobContext, DisposalSource } from "./runner";

export interface DisposalResult {
  recordId: string;
  status: "disposed" | "held" | "skipped";
  reason?: string;
}

export interface DisposalProcessorConfig {
  enabled: boolean;
  requireApproval: boolean;
}

const DEFAULT_CONFIG: DisposalProcessorConfig = {
  enabled: true,
  requireApproval: true,
};

export async function processDisposals(
  ctx: JobContext,
  matId: string,
  source: DisposalSource,
  config: DisposalProcessorConfig = DEFAULT_CONFIG,
): Promise<DisposalResult[]> {
  if (!config.enabled) return [];

  const { disposalEligibility } = await import("@/src/domain/advanced-governance");
  const records = await source.listEligibleRecords(matId);
  const holds = await source.listActiveHolds(matId);
  const results: DisposalResult[] = [];

  for (const record of records) {
    const eligibility = disposalEligibility(record, holds, ctx.now);

    if (!eligibility.eligible) {
      results.push({ recordId: record.id, status: "held", reason: eligibility.reason });
      continue;
    }

    if (config.requireApproval && record.status !== "approved-for-disposal") {
      results.push({ recordId: record.id, status: "skipped", reason: "awaiting-approval" });
      continue;
    }

    const evidenceDocId = `disposal-${ctx.correlationId}-${record.id}`;
    await source.markDisposed(matId, record.id, evidenceDocId);
    results.push({ recordId: record.id, status: "disposed" });
  }

  return results;
}
