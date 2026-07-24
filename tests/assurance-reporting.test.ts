import { describe, expect, it } from "vitest";
import { academyAssuranceScorecard, buildEvidencePack } from "../src/services/assurance-reporting";

const evidence = [{ id: "evidence-1", name: "Access review", category: "audit" as const, checksum: "abc123", createdAt: "2026-07-24T10:00:00Z", sourceReference: "FND-026" }];

describe("assurance reporting", () => {
  it("builds a deterministic evidence manifest", () => { const input = { id: "pack-1", matId: "mat-1", title: "Audit evidence", generatedAt: "2026-07-24T10:00:00Z", generatedByUserId: "auditor-1", items: evidence }; expect(buildEvidencePack(input).manifestHash).toBe(buildEvidencePack(input).manifestHash); });
  it("rejects duplicate evidence identifiers", () => expect(() => buildEvidencePack({ id: "pack-1", matId: "mat-1", title: "Audit evidence", generatedAt: "2026-07-24T10:00:00Z", generatedByUserId: "auditor-1", items: [...evidence, ...evidence] })).toThrow("Duplicate"));
  it("applies risk and finding penalties to an academy score", () => {
    const result = academyAssuranceScorecard({ academyId: "academy-1", academyName: "Riverside", statutoryCompliancePercent: 90, policyCompliancePercent: 90, trainingCompliancePercent: 90, actions: [{ id: "action-1", matId: "mat-1", academyId: "academy-1", sourceType: "manual", title: "Critical action", description: "Overdue action", ownerUserId: "owner-1", priority: "critical", status: "open", dueAt: "2026-07-20T10:00:00Z", evidenceDocumentIds: [] }], findings: [], risks: [] }, new Date("2026-07-24T10:00:00Z"));
    expect(result).toMatchObject({ score: 80, rag: "amber", overdueCriticalActions: 1 });
  });
});
