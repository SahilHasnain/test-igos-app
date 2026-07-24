import type { IntegrationContext, NotificationAdapter, NotificationMessage } from "./provider";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: { user: string; pass: string };
  from: string;
}

export interface SmtpTransport {
  sendMail(options: { from: string; to: string | string[]; subject: string; text: string; html?: string }): Promise<{ messageId: string }>;
}

export class SmtpNotificationAdapter implements NotificationAdapter {
  readonly provider = "smtp" as const;

  constructor(
    private readonly transport: SmtpTransport,
    private readonly from: string,
  ) {}

  async send(context: IntegrationContext, message: NotificationMessage): Promise<{ externalId: string }> {
    const result = await this.transport.sendMail({
      from: this.from,
      to: message.to as string[],
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { externalId: result.messageId };
  }
}

export class WebhookNotificationAdapter implements NotificationAdapter {
  readonly provider = "generic-webhook" as const;

  constructor(
    private readonly webhookUrl: string,
    private readonly headers: Record<string, string> = {},
  ) {}

  async send(context: IntegrationContext, message: NotificationMessage): Promise<{ externalId: string }> {
    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.headers },
      body: JSON.stringify({ context, message, timestamp: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    const body = await response.json() as { id?: string };
    return { externalId: body.id ?? `webhook-${Date.now()}` };
  }
}
