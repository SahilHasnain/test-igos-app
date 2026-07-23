import { daysRemaining } from "@/src/domain/deadlines";
import type { Matter } from "@/src/domain/model";

export type DeadlineLevel = "overdue" | "critical" | "due-soon" | "on-track";

export interface DeadlineSignal {
  matterId: string;
  reference: string;
  level: DeadlineLevel;
  daysRemaining: number;
}

export function classifyDeadline(now: Date, matter: Matter): DeadlineSignal | null {
  if (!matter.statutoryDueAt || matter.status === "closed") return null;
  const remaining = daysRemaining(now, new Date(matter.statutoryDueAt));
  const level: DeadlineLevel = remaining < 0 ? "overdue" : remaining <= 2 ? "critical" : remaining <= 7 ? "due-soon" : "on-track";
  return { matterId: matter.id, reference: matter.reference, level, daysRemaining: remaining };
}

export function scanDeadlines(now: Date, matters: readonly Matter[]): readonly DeadlineSignal[] {
  return matters.map((matter) => classifyDeadline(now, matter)).filter((signal): signal is DeadlineSignal => signal !== null).sort((a,b) => a.daysRemaining - b.daysRemaining);
}
