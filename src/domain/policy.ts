export type PolicyStatus = "draft" | "in-review" | "approved" | "published" | "retired";

export interface PolicyRecord {
  id: string;
  matId: string;
  academyIds: readonly string[];
  title: string;
  ownerUserId: string;
  version: string;
  status: PolicyStatus;
  reviewDueAt: string;
  documentId: string;
  approvedByUserId?: string;
  approvedAt?: string;
  publishedAt?: string;
  supersedesPolicyId?: string;
}

export interface PolicyAcknowledgement {
  id: string;
  policyId: string;
  policyVersion: string;
  userId: string;
  assignedAt: string;
  dueAt: string;
  acknowledgedAt?: string;
  exceptionId?: string;
}

export interface PolicyException {
  id: string;
  policyId: string;
  academyId?: string;
  requestedByUserId: string;
  rationale: string;
  compensatingControls: readonly string[];
  expiresAt: string;
  approvedByUserId?: string;
  approvedAt?: string;
}

const transitions: Record<PolicyStatus, readonly PolicyStatus[]> = {
  draft: ["in-review"],
  "in-review": ["draft", "approved"],
  approved: ["published", "draft"],
  published: ["retired"],
  retired: [],
};

export function transitionPolicy(policy: PolicyRecord, to: PolicyStatus, actorUserId: string, occurredAt = new Date().toISOString()): PolicyRecord {
  if (!transitions[policy.status].includes(to)) throw new Error(`Policy transition from ${policy.status} to ${to} is not permitted`);
  if (to === "approved") return { ...policy, status: to, approvedByUserId: actorUserId, approvedAt: occurredAt };
  if (to === "published") {
    if (!policy.approvedByUserId || !policy.approvedAt) throw new Error("A policy must have recorded approval before publication");
    return { ...policy, status: to, publishedAt: occurredAt };
  }
  if (to === "draft") return { ...policy, status: to, approvedByUserId: undefined, approvedAt: undefined, publishedAt: undefined };
  return { ...policy, status: to };
}

export function acknowledgementStatus(record: PolicyAcknowledgement, now = new Date()) {
  if (record.acknowledgedAt) return "acknowledged" as const;
  if (record.exceptionId) return "exception" as const;
  if (new Date(record.dueAt) < now) return "overdue" as const;
  return "outstanding" as const;
}

export function validatePolicyException(exception: PolicyException, now = new Date()) {
  if (!exception.rationale.trim()) throw new Error("A policy exception requires a rationale");
  if (!exception.compensatingControls.length) throw new Error("A policy exception requires compensating controls");
  if (new Date(exception.expiresAt) <= now) throw new Error("A policy exception must have a future expiry date");
  return exception;
}
