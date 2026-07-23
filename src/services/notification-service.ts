import { randomUUID } from "node:crypto";
import type { IntegrationContext, NotificationAdapter, NotificationMessage } from "@/src/integrations/provider";

export type NotificationPurpose =
  | "request-acknowledgement"
  | "deadline-warning"
  | "task-assignment"
  | "approval-request"
  | "breach-escalation";

export interface NotificationCommand extends IntegrationContext {
  purpose: NotificationPurpose;
  recipients: readonly string[];
  subject: string;
  text: string;
  html?: string;
  matterId?: string;
  idempotencyKey: string;
}

export interface NotificationReceipt {
  id: string;
  provider: string;
  externalId: string;
  purpose: NotificationPurpose;
  recipients: readonly string[];
  sentAt: string;
  matterId?: string;
  idempotencyKey: string;
}

export interface NotificationReceiptStore {
  findByIdempotencyKey(matId: string, idempotencyKey: string): Promise<NotificationReceipt | null>;
  save(receipt: NotificationReceipt): Promise<NotificationReceipt>;
}

export class NotificationService {
  constructor(private readonly adapter: NotificationAdapter, private readonly receipts: NotificationReceiptStore) {}

  async send(command: NotificationCommand) {
    if (!command.recipients.length) throw new Error("At least one notification recipient is required");
    if (!command.subject.trim() || !command.text.trim()) throw new Error("Notification subject and text are required");

    const existing = await this.receipts.findByIdempotencyKey(command.matId, command.idempotencyKey);
    if (existing) return existing;

    const message: NotificationMessage = { to: command.recipients, subject: command.subject, text: command.text, html: command.html };
    const result = await this.adapter.send(command, message);
    return this.receipts.save({
      id: randomUUID(),
      provider: this.adapter.provider,
      externalId: result.externalId,
      purpose: command.purpose,
      recipients: command.recipients,
      sentAt: new Date().toISOString(),
      matterId: command.matterId,
      idempotencyKey: command.idempotencyKey,
    });
  }
}

export class InMemoryNotificationReceiptStore implements NotificationReceiptStore {
  private readonly records: NotificationReceipt[] = [];
  async findByIdempotencyKey(matId: string, idempotencyKey: string) {
    return this.records.find((record) => record.idempotencyKey === idempotencyKey && record.id.startsWith("") && matId.length > 0) ?? null;
  }
  async save(receipt: NotificationReceipt) { this.records.push(receipt); return receipt; }
  list() { return [...this.records]; }
}

export class DemoNotificationAdapter implements NotificationAdapter {
  readonly provider = "smtp" as const;
  readonly sent: Array<{ context: IntegrationContext; message: NotificationMessage }> = [];
  async send(context: IntegrationContext, message: NotificationMessage) {
    this.sent.push({ context, message });
    return { externalId: `demo-${this.sent.length}` };
  }
}
