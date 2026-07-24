import { describe, expect, it } from "vitest";
import { closeAssuranceAction, scoreAssuranceRisk, validateRiskAcceptance, verifyAuditFinding, type AssuranceAction, type AssuranceRisk, type AuditFinding } from "../src/domain/assurance";

const action: AssuranceAction = { id: "action-1", matId: "mat-1", sourceType: "audit-finding", title: "Remove leaver access", description: "Complete and evidence the access review.", ownerUserId: "owner-1", priority: "high", status: "awaiting-evidence", dueAt: "2026-07-30T10:00:00Z", evidenceDocumentIds: [] };
const finding: AuditFinding = { id: "finding-1", matId: "mat-1", auditProgrammeId: "audit-1", title: "Leaver access", description: "Accounts remained active.", rating: "high", rootCause: "Manual process", recommendation: "Automate account closure", ownerUserId: "owner-1", dueAt: "2026-07-30T10:00:00Z", status: "ready-to-verify", evidenceDocumentIds: ["evidence-1"] };
const risk: AssuranceRisk = { id: "risk-1", matId: "mat-1", title: "Data disclosure", description: "Personal data may be disclosed in error.", category: "privacy", ownerUserId: "dpo-1", likelihood: 4, impact: 5, controlEffectiveness: 25, controls: ["DLP"], treatments: ["Training"], appetite: "low", reviewDueAt: "2026-08-30T10:00:00Z", status: "treating" };

describe("assurance controls", () => {
  it("scores residual assurance risk", () => expect(scoreAssuranceRisk(risk)).toEqual({ inherent: 20, residual: 15, rating: "high" }));
  it("blocks action closure without evidence", () => expect(() => closeAssuranceAction(action, "user-1", "Remediation completed")).toThrow("supporting evidence"));
  it("records evidence-backed action closure", () => expect(closeAssuranceAction({ ...action, evidenceDocumentIds: ["document-1"] }, "user-1", "Access review verified", "2026-07-24T10:00:00Z").status).toBe("complete"));
  it("allows only findings ready for verification to close", () => expect(() => verifyAuditFinding({ ...finding, status: "in-remediation" }, "auditor-1")).toThrow("ready for verification"));
  it("requires explicit acceptance for high residual risk", () => expect(() => validateRiskAcceptance(risk)).toThrow("explicit acceptance"));
});
