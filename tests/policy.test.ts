import { describe, expect, it } from "vitest";
import { acknowledgementStatus, transitionPolicy, validatePolicyException, type PolicyRecord } from "../src/domain/policy";

const policy: PolicyRecord = { id: "policy-1", matId: "mat-1", academyIds: ["academy-1"], title: "Data protection policy", ownerUserId: "dpo-1", version: "1.0", status: "in-review", reviewDueAt: "2027-07-23T10:00:00Z", documentId: "document-1" };

describe("policy governance", () => {
  it("records approval before publication", () => { const approved = transitionPolicy(policy, "approved", "approver-1", "2026-07-23T10:00:00Z"); const published = transitionPolicy(approved, "published", "publisher-1", "2026-07-24T10:00:00Z"); expect(published.approvedByUserId).toBe("approver-1"); expect(published.publishedAt).toBe("2026-07-24T10:00:00Z"); });
  it("rejects an invalid lifecycle jump", () => expect(() => transitionPolicy({ ...policy, status: "draft" }, "published", "user-1")).toThrow("not permitted"));
  it("identifies overdue acknowledgements", () => expect(acknowledgementStatus({ id: "ack-1", policyId: "policy-1", policyVersion: "1.0", userId: "user-1", assignedAt: "2026-07-01T10:00:00Z", dueAt: "2026-07-20T10:00:00Z" }, new Date("2026-07-23T10:00:00Z"))).toBe("overdue"));
  it("requires compensating controls for an exception", () => expect(() => validatePolicyException({ id: "exception-1", policyId: "policy-1", requestedByUserId: "user-1", rationale: "Temporary system limitation", compensatingControls: [], expiresAt: "2026-08-23T10:00:00Z" }, new Date("2026-07-23T10:00:00Z"))).toThrow("compensating controls"));
});
