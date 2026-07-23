import { describe, expect, it } from "vitest";
import { addCalendarMonth, addWorkingDays, calculateDeadline, daysRemaining } from "../src/domain/deadlines";

describe("statutory deadlines", () => {
  it("adds 20 working days", () => {
    expect(addWorkingDays(new Date("2026-07-20T09:00:00Z"), 20).toISOString().slice(0, 10)).toBe("2026-08-17");
  });

  it("excludes supplied closure and bank-holiday dates", () => {
    expect(addWorkingDays(new Date("2026-07-20T09:00:00Z"), 5, ["2026-07-24"]).toISOString().slice(0, 10)).toBe("2026-07-28");
  });

  it("rejects invalid working-day inputs", () => {
    expect(() => addWorkingDays(new Date("2026-07-20T09:00:00Z"), -1)).toThrow("non-negative integer");
    expect(() => addWorkingDays(new Date("2026-07-20T09:00:00Z"), 1.5)).toThrow("non-negative integer");
  });

  it("adds an ordinary calendar month for SARs", () => {
    expect(addCalendarMonth(new Date("2026-07-12T09:30:00Z")).toISOString()).toBe("2026-08-12T09:30:00.000Z");
  });

  it("clamps a 31 January SAR deadline to the final day of February", () => {
    expect(calculateDeadline(new Date("2026-01-31T09:30:00Z"), "sar-calendar-month").toISOString()).toBe("2026-02-28T09:30:00.000Z");
  });

  it("uses 29 February when the target year is a leap year", () => {
    expect(calculateDeadline(new Date("2024-01-31T09:30:00Z"), "sar-calendar-month").toISOString()).toBe("2024-02-29T09:30:00.000Z");
  });

  it("carries calendar-month deadlines into a new year", () => {
    expect(calculateDeadline(new Date("2026-12-31T09:30:00Z"), "sar-calendar-month").toISOString()).toBe("2027-01-31T09:30:00.000Z");
  });

  it("calculates the 72-hour breach period", () => {
    expect(calculateDeadline(new Date("2026-07-23T10:00:00Z"), "breach-hours").toISOString()).toBe("2026-07-26T10:00:00.000Z");
  });

  it("reports days remaining", () => {
    expect(daysRemaining(new Date("2026-07-23T10:00:00Z"), new Date("2026-07-25T09:00:00Z"))).toBe(2);
  });
});
