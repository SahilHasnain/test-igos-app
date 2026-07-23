import { describe, expect, it } from "vitest";
import { assertDpiaReadyForApproval, requiresFullDpia, scoreDpiaRisk, type DpiaRisk, type DpiaSection } from "../src/domain/dpia";

const screening = { systematicMonitoring: false, specialCategoryOrCriminalData: true, vulnerablePeople: true, largeScale: false, matchingOrCombiningDatasets: false, innovativeTechnology: true, automatedDecisionMakingWithSignificantEffect: false, preventsExerciseOfRightOrService: false, internationalTransfer: false, aiSystem: true };
const acceptedSection: DpiaSection = { id: "request", title: "Description", assignedRole: "requester", status: "accepted", answers: {} };
const risk: DpiaRisk = { id: "risk-1", description: "Incorrect safeguarding classification", affectedPeople: ["pupils"], likelihood: 4, impact: 5, controlEffectiveness: 25, mitigations: ["Mandatory human review"], ownerUserId: "owner-1" };

describe("DPIA governance", () => {
  it("requires a full DPIA when multiple high-risk indicators are present", () => expect(requiresFullDpia(screening)).toBe(true));
  it("calculates inherent and residual risk", () => expect(scoreDpiaRisk(risk)).toEqual({ inherentScore: 20, residualScore: 15, rating: "high" }));
  it("rejects approval while a section is incomplete", () => expect(() => assertDpiaReadyForApproval([{ ...acceptedSection, status: "submitted" }], [risk])).toThrow("awaiting acceptance"));
  it("requires DPO acceptance for high residual risk", () => expect(() => assertDpiaReadyForApproval([acceptedSection], [risk])).toThrow("DPO acceptance"));
  it("accepts approval readiness after high residual risk is explicitly accepted", () => expect(assertDpiaReadyForApproval([acceptedSection], [{ ...risk, acceptedByUserId: "dpo-1", acceptanceRationale: "Pilot controls and weekly review reduce exposure while further mitigation is completed." }])).toBe(true));
});
