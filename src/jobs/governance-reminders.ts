const DAY_MS = 86_400_000;

export type GovernanceReviewType = "dpia-mitigation" | "ropa-review" | "policy-review" | "policy-acknowledgement" | "supplier-review" | "transfer-review";

export interface GovernanceReviewItem {
  id: string;
  matId: string;
  academyId?: string;
  type: GovernanceReviewType;
  title: string;
  ownerUserId: string;
  dueAt: string;
  completedAt?: string;
}

export interface GovernanceReminder {
  itemId: string;
  matId: string;
  academyId?: string;
  type: GovernanceReviewType;
  ownerUserId: string;
  dueAt: string;
  severity: "upcoming" | "due-soon" | "overdue" | "critical";
  daysRemaining: number;
  idempotencyKey: string;
}

export function scanGovernanceReviews(items: readonly GovernanceReviewItem[], now = new Date()): GovernanceReminder[] {
  return items.filter((item) => !item.completedAt).map((item) => {
    const daysRemaining = Math.ceil((new Date(item.dueAt).getTime() - now.getTime()) / DAY_MS);
    const severity = daysRemaining < -7 ? "critical" : daysRemaining < 0 ? "overdue" : daysRemaining <= 7 ? "due-soon" : "upcoming";
    return { itemId: item.id, matId: item.matId, academyId: item.academyId, type: item.type, ownerUserId: item.ownerUserId, dueAt: item.dueAt, severity, daysRemaining, idempotencyKey: `${item.matId}:${item.type}:${item.id}:${item.dueAt.slice(0, 10)}` };
  }).filter((reminder) => reminder.daysRemaining <= 30).sort((a, b) => a.daysRemaining - b.daysRemaining);
}
