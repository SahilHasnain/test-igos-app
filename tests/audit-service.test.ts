import { describe, expect, it } from "vitest";
import { DemoAuditRepository, resetDemoState } from "../src/demo/repositories";
import { AuditService, payloadHash } from "../src/services/audit-service";
import type { Membership } from "../src/domain/model";

const membership: Membership = { userId: "dpo-1", matId: "mat-1", academyIds: ["academy-1"], roles: ["dpo"] };
const context = { user: { id: "dpo-1", email: "dpo@example.org" }, membership, correlationId: "correlation-1" };
const scope = { matId: "mat-1", academyId: "academy-1" };

describe("audit service", () => {
  it("produces the same hash regardless of object key order", () => {
    expect(payloadHash({ action: "created", version: 1 })).toBe(payloadHash({ version: 1, action: "created" }));
  });

  it("links each matter event to the previous payload hash", async () => {
    resetDemoState();
    const repository = new DemoAuditRepository();
    const service = new AuditService(repository);
    const first = await service.record(context, scope, "matter.created", { reference: "SAR-1" }, "matter-1");
    const second = await service.record(context, scope, "workflow.transitioned", { from: "intake", to: "identity-verification" }, "matter-1");
    expect(second.previousHash).toBe(first.payloadHash);
  });

  it("does not link events belonging to a different matter", async () => {
    resetDemoState();
    const repository = new DemoAuditRepository();
    const service = new AuditService(repository);
    await service.record(context, scope, "matter.created", { reference: "SAR-1" }, "matter-1");
    const event = await service.record(context, scope, "matter.created", { reference: "FOI-1" }, "matter-2");
    expect(event.previousHash).toBeUndefined();
  });
});
