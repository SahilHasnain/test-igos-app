const DAY_MS = 86_400_000;

export type DeadlineRegime = "sar-calendar-month" | "foi-working-days" | "breach-hours";

const isWorkingDay = (date: Date) => date.getUTCDay() !== 0 && date.getUTCDay() !== 6;

export function addWorkingDays(receivedAt: Date, days: number, holidays: readonly string[] = []) {
  if (!Number.isInteger(days) || days < 0) throw new Error("Working days must be a non-negative integer");

  const result = new Date(receivedAt);
  let remaining = days;
  const closed = new Set(holidays);

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (isWorkingDay(result) && !closed.has(result.toISOString().slice(0, 10))) remaining--;
  }

  return result;
}

/**
 * Adds one calendar month without JavaScript's end-of-month rollover.
 * For example, 31 January becomes the final day of February rather than March.
 */
export function addCalendarMonth(receivedAt: Date) {
  const result = new Date(receivedAt);
  const originalDay = result.getUTCDate();
  const absoluteTargetMonth = result.getUTCMonth() + 1;
  const targetYear = result.getUTCFullYear() + Math.floor(absoluteTargetMonth / 12);
  const targetMonth = absoluteTargetMonth % 12;
  const lastTargetDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  result.setUTCDate(1);
  result.setUTCFullYear(targetYear);
  result.setUTCMonth(targetMonth);
  result.setUTCDate(Math.min(originalDay, lastTargetDay));
  return result;
}

export function calculateDeadline(receivedAt: Date, regime: DeadlineRegime, holidays: readonly string[] = []) {
  if (regime === "foi-working-days") return addWorkingDays(receivedAt, 20, holidays);
  if (regime === "breach-hours") return new Date(receivedAt.getTime() + 72 * 60 * 60 * 1000);
  return addCalendarMonth(receivedAt);
}

export const daysRemaining = (now: Date, dueAt: Date) => Math.ceil((dueAt.getTime() - now.getTime()) / DAY_MS);
