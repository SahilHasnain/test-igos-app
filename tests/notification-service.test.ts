import { describe, expect, it } from "vitest";
import { DemoNotificationAdapter, InMemoryNotificationReceiptStore, NotificationService } from "../src/services/notification-service";

const command = {
  matId: "mat-1", academyId: "academy-1", correlationId: "correlation-1", matterId: "matter-1",
  purpose: "deadline-warning" as const, recipients: ["dpo@example.org"],
  subject: "SAR deadline approaching", text: "SAR-2026-001 is due in three days.", idempotencyKey: "matter-1:three-day-warning",
};

describe("notification service", () => {
  it("sends through a provider-neutral adapter", async () => {
    const adapter = new DemoNotificationAdapter();
    const service = new NotificationService(adapter, new InMemoryNotificationReceiptStore());
    const receipt = await service.send(command);
    expect(receipt.provider).toBe("smtp");
    expect(adapter.sent).toHaveLength(1);
  });

  it("does not send the same MAT notification twice", async () => {
    const adapter = new DemoNotificationAdapter();
    const service = new NotificationService(adapter, new InMemoryNotificationReceiptStore());
    const first = await service.send(command);
    const second = await service.send(command);
    expect(second.id).toBe(first.id);
    expect(adapter.sent).toHaveLength(1);
  });

  it("rejects an empty recipient list", async () => {
    const service = new NotificationService(new DemoNotificationAdapter(), new InMemoryNotificationReceiptStore());
    await expect(service.send({ ...command, recipients: [] })).rejects.toThrow("recipient");
  });
});
