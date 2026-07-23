import { describe, expect, it } from "vitest";
import { scanGovernanceReviews } from "../src/jobs/governance-reminders";

const items = [
  { id: "policy-1", matId: "mat-1", type: "policy-review" as const, title: "Data protection policy", ownerUserId: "dpo-1", dueAt: "2026-07-20T10:00:00Z" },
  { id: "ropa-1", matId: "mat-1", academyId: "academy-1", type: "ropa-review" as const, title: "Admissions processing", ownerUserId: "owner-1", dueAt: "2026-07-28T10:00:00Z" },
  { id: "supplier-1", matId: "mat-1", type: "supplier-review" as const, title: "Supplier review", ownerUserId: "owner-2", dueAt: "2026-09-30T10:00:00Z" },
  { id: "done-1", matId: "mat-1", type: "dpia-mitigation" as const, title: "Completed mitigation", ownerUserId: "owner-3", dueAt: "2026-07-20T10:00:00Z", completedAt: "2026-07-19T10:00:00Z" },
];

describe("governance reminders", () => {
  const reminders = scanGovernanceReviews(items, new Date("2026-07-23T10:00:00Z"));
  it("returns only incomplete items within 30 days", () => expect(reminders.map((item) => item.itemId)).toEqual(["policy-1", "ropa-1"]));
  it("marks past reviews as overdue", () => expect(reminders[0].severity).toBe("overdue"));
  it("marks reviews within seven days as due soon", () => expect(reminders[1].severity).toBe("due-soon"));
  it("creates stable MAT-scoped idempotency keys", () => expect(reminders[0].idempotencyKey).toBe("mat-1:policy-review:policy-1:2026-07-20"));
});
