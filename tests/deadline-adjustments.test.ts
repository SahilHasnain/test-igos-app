import { describe, expect, it } from "vitest";
import { calculateAdjustedDeadline, pauseDuration, validateDeadlineAdjustment, type DeadlineExtension, type DeadlinePause } from "../src/domain/deadline-adjustments";

const sarExtension: DeadlineExtension = {
  id: "adjustment-1", matterId: "matter-1", kind: "extension", reason: "sar-complexity-extension",
  recordedAt: "2026-07-23T10:00:00Z", recordedByUserId: "dpo-1", approvedByUserId: "dpo-2",
  rationale: "The request spans several academies and a high volume of safeguarding records.",
  originalDueAt: "2026-08-23T10:00:00Z", revisedDueAt: "2026-10-23T10:00:00Z",
};

const foiPause: DeadlinePause = {
  id: "adjustment-2", matterId: "matter-2", kind: "pause", reason: "foi-clarification",
  startedAt: "2026-07-24T10:00:00Z", resumedAt: "2026-07-27T10:00:00Z",
  recordedByUserId: "case-manager-1", rationale: "The description did not identify the requested procurement exercise.",
};

describe("deadline adjustments", () => {
  it("accepts an approved SAR complexity extension within two additional months", () => {
    expect(validateDeadlineAdjustment("sar", sarExtension)).toEqual(sarExtension);
  });

  it("rejects a SAR complexity extension without approval", () => {
    expect(() => validateDeadlineAdjustment("sar", { ...sarExtension, approvedByUserId: undefined })).toThrow("requires approval");
  });

  it("prevents breach notification deadlines from being paused", () => {
    expect(() => validateDeadlineAdjustment("breach", { ...foiPause, reason: "foi-clarification" })).toThrow("cannot pause");
  });

  it("adds a completed pause to the operative deadline", () => {
    expect(calculateAdjustedDeadline(new Date("2026-08-20T10:00:00Z"), "foi", [foiPause]).toISOString()).toBe("2026-08-23T10:00:00.000Z");
  });

  it("calculates an open pause against the supplied operational time", () => {
    const openPause = { ...foiPause, resumedAt: undefined };
    expect(pauseDuration(openPause, new Date("2026-07-25T16:00:00Z"))).toEqual({ hours: 30, days: 1 });
  });
});
