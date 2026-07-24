export type AssurancePriority = "low" | "medium" | "high" | "critical";
export type ActionStatus = "open" | "in-progress" | "blocked" | "awaiting-evidence" | "complete" | "cancelled";

export interface AssuranceAction {
  id: string;
  matId: string;
  academyId?: string;
  sourceType: "audit-finding" | "risk-treatment" | "incident" | "dpia" | "policy" | "manual";
  sourceId?: string;
  title: string;
  description: string;
  ownerUserId: string;
  priority: AssurancePriority;
  status: ActionStatus;
  dueAt: string;
  evidenceDocumentIds: readonly string[];
  completedAt?: string;
  completedByUserId?: string;
  closureRationale?: string;
}

export interface AuditProgramme {
  id: string;
  matId: string;
  title: string;
  scope: string;
  academyIds: readonly string[];
  leadAuditorUserId: string;
  plannedStartAt: string;
  plannedEndAt: string;
  status: "planned" | "fieldwork" | "reporting" | "complete" | "cancelled";
}

export interface AuditFinding {
  id: string;
  matId: string;
  academyId?: string;
  auditProgrammeId: string;
  title: string;
  description: string;
  rating: AssurancePriority;
  rootCause: string;
  recommendation: string;
  managementResponse?: string;
  ownerUserId: string;
  dueAt: string;
  status: "open" | "accepted" | "in-remediation" | "ready-to-verify" | "closed";
  verifiedByUserId?: string;
  verifiedAt?: string;
  evidenceDocumentIds: readonly string[];
}

export interface AssuranceRisk {
  id: string;
  matId: string;
  academyId?: string;
  title: string;
  description: string;
  category: "regulatory" | "privacy" | "information-security" | "records" | "supplier" | "operational";
  ownerUserId: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  controlEffectiveness: number;
  controls: readonly string[];
  treatments: readonly string[];
  appetite: AssurancePriority;
  reviewDueAt: string;
  status: "open" | "treating" | "accepted" | "closed";
  acceptedByUserId?: string;
  acceptanceRationale?: string;
}

export function scoreAssuranceRisk(risk: Pick<AssuranceRisk, "likelihood" | "impact" | "controlEffectiveness">) {
  if (risk.controlEffectiveness < 0 || risk.controlEffectiveness > 100) throw new Error("Control effectiveness must be between 0 and 100");
  const inherent = risk.likelihood * risk.impact;
  const residual = Math.max(1, Math.round(inherent * (1 - risk.controlEffectiveness / 100)));
  const rating: AssurancePriority = residual >= 16 ? "critical" : residual >= 10 ? "high" : residual >= 5 ? "medium" : "low";
  return { inherent, residual, rating };
}

export function closeAssuranceAction(action: AssuranceAction, actorUserId: string, rationale: string, occurredAt = new Date().toISOString()): AssuranceAction {
  if (!rationale.trim()) throw new Error("Action closure requires a rationale");
  if (!action.evidenceDocumentIds.length) throw new Error("Action closure requires supporting evidence");
  return { ...action, status: "complete", completedAt: occurredAt, completedByUserId: actorUserId, closureRationale: rationale };
}

export function verifyAuditFinding(finding: AuditFinding, verifierUserId: string, occurredAt = new Date().toISOString()): AuditFinding {
  if (finding.status !== "ready-to-verify") throw new Error("Only a finding ready for verification can be closed");
  if (!finding.evidenceDocumentIds.length) throw new Error("Finding verification requires supporting evidence");
  return { ...finding, status: "closed", verifiedByUserId: verifierUserId, verifiedAt: occurredAt };
}

export function validateRiskAcceptance(risk: AssuranceRisk) {
  const { rating } = scoreAssuranceRisk(risk);
  if ((rating === "high" || rating === "critical") && (!risk.acceptedByUserId || !risk.acceptanceRationale?.trim())) throw new Error("High residual risk requires explicit acceptance and rationale");
  return risk;
}
