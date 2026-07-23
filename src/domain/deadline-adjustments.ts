import type { MatterType } from "./model";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export type DeadlineAdjustmentReason =
  | "sar-complexity-extension"
  | "sar-identity-evidence"
  | "sar-fee-payment"
  | "foi-clarification"
  | "manual-correction";

export interface DeadlineExtension {
  id: string;
  matterId: string;
  kind: "extension";
  reason: "sar-complexity-extension" | "manual-correction";
  recordedAt: string;
  recordedByUserId: string;
  rationale: string;
  originalDueAt: string;
  revisedDueAt: string;
  approvedByUserId?: string;
}

export interface DeadlinePause {
  id: string;
  matterId: string;
  kind: "pause";
  reason: "sar-identity-evidence" | "sar-fee-payment" | "foi-clarification";
  startedAt: string;
  resumedAt?: string;
  recordedByUserId: string;
  rationale: string;
}

export type DeadlineAdjustment = DeadlineExtension | DeadlinePause;

const pauseReasonsByType: Record<MatterType, readonly DeadlinePause["reason"][]> = {
  sar: ["sar-identity-evidence", "sar-fee-payment"],
  foi: ["foi-clarification"],
  breach: [],
  dpia: [],
};

export function validateDeadlineAdjustment(type: MatterType, adjustment: DeadlineAdjustment) {
  if (!adjustment.rationale.trim()) throw new Error("A deadline adjustment rationale is required");

  if (adjustment.kind === "pause") {
    if (!pauseReasonsByType[type].includes(adjustment.reason)) {
      throw new Error(`${adjustment.reason} cannot pause a ${type} deadline`);
    }
    if (adjustment.resumedAt && new Date(adjustment.resumedAt) < new Date(adjustment.startedAt)) {
      throw new Error("A deadline pause cannot resume before it starts");
    }
    return adjustment;
  }

  if (adjustment.reason === "sar-complexity-extension") {
    if (type !== "sar") throw new Error("A complexity extension applies only to SAR matters");
    if (!adjustment.approvedByUserId) throw new Error("A SAR complexity extension requires approval");
    const maximum = new Date(adjustment.originalDueAt);
    maximum.setUTCMonth(maximum.getUTCMonth() + 2);
    if (new Date(adjustment.revisedDueAt) > maximum) throw new Error("A SAR complexity extension cannot exceed two additional months");
  }

  if (new Date(adjustment.revisedDueAt) <= new Date(adjustment.originalDueAt)) {
    throw new Error("A revised deadline must be later than the original deadline");
  }
  return adjustment;
}

export function calculateAdjustedDeadline(originalDueAt: Date, type: MatterType, adjustments: readonly DeadlineAdjustment[], now = new Date()) {
  let dueAt = new Date(originalDueAt);

  for (const adjustment of adjustments) {
    validateDeadlineAdjustment(type, adjustment);
    if (adjustment.kind === "extension") {
      const revised = new Date(adjustment.revisedDueAt);
      if (revised > dueAt) dueAt = revised;
      continue;
    }

    const start = new Date(adjustment.startedAt);
    const end = adjustment.resumedAt ? new Date(adjustment.resumedAt) : now;
    const pauseMilliseconds = Math.max(0, end.getTime() - start.getTime());
    dueAt = new Date(dueAt.getTime() + pauseMilliseconds);
  }

  return dueAt;
}

export function pauseDuration(adjustment: DeadlinePause, now = new Date()) {
  const end = adjustment.resumedAt ? new Date(adjustment.resumedAt) : now;
  const milliseconds = Math.max(0, end.getTime() - new Date(adjustment.startedAt).getTime());
  return { hours: Math.floor(milliseconds / HOUR_MS), days: Math.floor(milliseconds / DAY_MS) };
}
