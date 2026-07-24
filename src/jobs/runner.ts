import type { Matter } from "@/src/domain/model";
import type { NotificationService } from "@/src/services/notification-service";
import { scanDeadlines } from "./deadline-scan";
import { type GovernanceReviewItem, scanGovernanceReviews } from "./governance-reminders";
import { type RecordInstance, type RecordsHold, disposalEligibility } from "@/src/domain/advanced-governance";

export interface JobContext {
  now: Date;
  correlationId: string;
}

export interface DeadlineScanSource {
  listOpenMatters(matId: string): Promise<readonly Matter[]>;
}

export interface GovernanceReviewSource {
  listPendingReviews(matId: string): Promise<readonly GovernanceReviewItem[]>;
}

export interface DisposalSource {
  listEligibleRecords(matId: string): Promise<readonly RecordInstance[]>;
  listActiveHolds(matId: string): Promise<readonly RecordsHold[]>;
  markDisposed(matId: string, recordId: string, evidenceDocumentId: string): Promise<void>;
}

export interface JobResult {
  deadlineSignals: number;
  governanceReminders: number;
  disposalActions: number;
}

const DAY_MS = 86_400_000;

function formatDeadlineReminder(signal: { reference: string; level: string; daysRemaining: number }): string {
  const label = signal.level === "overdue" ? "OVERDUE" : signal.level === "critical" ? "critically overdue" : "due soon";
  return `Case ${signal.reference} is ${label} (${Math.abs(signal.daysRemaining)} day${Math.abs(signal.daysRemaining) !== 1 ? "s" : ""})`;
}

export async function runDeadlineScan(
  ctx: JobContext,
  matId: string,
  source: DeadlineScanSource,
  notify: NotificationService,
  recipients: readonly string[],
): Promise<number> {
  const matters = await source.listOpenMatters(matId);
  const signals = scanDeadlines(ctx.now, matters).filter((s) => s.level !== "on-track");

  for (const signal of signals) {
    if (!recipients.length) continue;
    await notify.send({
      matId,
      correlationId: ctx.correlationId,
      purpose: "deadline-warning",
      recipients,
      subject: `[IGOS] ${signal.reference} — deadline ${signal.level.replace("-", " ")}`,
      text: formatDeadlineReminder(signal),
      matterId: signal.matterId,
      idempotencyKey: `deadline:${matId}:${signal.matterId}:${signal.level}:${ctx.now.toISOString().slice(0, 10)}`,
    });
  }

  return signals.length;
}

export async function runGovernanceReminders(
  ctx: JobContext,
  matId: string,
  source: GovernanceReviewSource,
  notify: NotificationService,
  getRecipients: (ownerUserId: string) => Promise<readonly string[]>,
): Promise<number> {
  const items = await source.listPendingReviews(matId);
  const reminders = scanGovernanceReviews(items, ctx.now);
  let sent = 0;

  for (const reminder of reminders) {
    if (reminder.severity === "upcoming") continue;
    const recipients = await getRecipients(reminder.ownerUserId);
    if (!recipients.length) continue;

    const label = reminder.severity === "overdue" ? "OVERDUE" : reminder.severity === "critical" ? "critically overdue" : "due soon";
    await notify.send({
      matId,
      correlationId: ctx.correlationId,
      purpose: "deadline-warning",
      recipients,
      subject: `[IGOS] ${reminder.type.replace(/-/g, " ")} — ${label}`,
      text: `Review item ${reminder.itemId} (${reminder.type}) is ${label}. Due: ${reminder.dueAt}`,
      idempotencyKey: reminder.idempotencyKey,
    });
    sent++;
  }

  return sent;
}

export async function runDisposalScan(
  ctx: JobContext,
  matId: string,
  source: DisposalSource,
): Promise<string[]> {
  const records = await source.listEligibleRecords(matId);
  const holds = await source.listActiveHolds(matId);
  const disposed: string[] = [];

  for (const record of records) {
    const eligibility = disposalEligibility(record, holds, ctx.now);
    if (!eligibility.eligible) continue;

    await source.markDisposed(matId, record.id, `auto-disposal-${ctx.correlationId}`);
    disposed.push(record.id);
  }

  return disposed;
}

export function createIntervalRunner(intervalMs: number, task: () => Promise<void>): () => void {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      await task();
    } catch (err) {
      console.error("[IGOS JobRunner] Task failed:", err instanceof Error ? err.message : err);
    }
    if (!stopped) setTimeout(tick, intervalMs);
  };
  setTimeout(tick, intervalMs);
  return () => { stopped = true; };
}

export function scheduleJobRunner(intervalMs: number, tasks: Array<() => Promise<void>>): () => void {
  const stoppers = tasks.map((task) => createIntervalRunner(intervalMs, task));
  return () => { for (const stop of stoppers) stop(); };
}
