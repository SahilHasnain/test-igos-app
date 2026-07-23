import { z } from "zod";

export type DpiaParticipantRole = "requester" | "supplier" | "compliance" | "dpo";
export type DpiaSectionStatus = "not-started" | "in-progress" | "submitted" | "accepted" | "changes-requested";

export interface DpiaSection {
  id: string;
  title: string;
  assignedRole: DpiaParticipantRole;
  assignedUserId?: string;
  status: DpiaSectionStatus;
  answers: Readonly<Record<string, string | number | boolean | readonly string[] | null>>;
  submittedAt?: string;
  acceptedAt?: string;
}

export interface DpiaRisk {
  id: string;
  description: string;
  affectedPeople: readonly string[];
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  controlEffectiveness: number;
  mitigations: readonly string[];
  ownerUserId: string;
  dueAt?: string;
  acceptedByUserId?: string;
  acceptanceRationale?: string;
}

export type RiskRating = "low" | "medium" | "high" | "critical";

export const dpiaScreeningSchema = z.object({
  systematicMonitoring: z.boolean(),
  specialCategoryOrCriminalData: z.boolean(),
  vulnerablePeople: z.boolean(),
  largeScale: z.boolean(),
  matchingOrCombiningDatasets: z.boolean(),
  innovativeTechnology: z.boolean(),
  automatedDecisionMakingWithSignificantEffect: z.boolean(),
  preventsExerciseOfRightOrService: z.boolean(),
  internationalTransfer: z.boolean(),
  aiSystem: z.boolean(),
});

export type DpiaScreening = z.infer<typeof dpiaScreeningSchema>;

export function requiresFullDpia(screening: DpiaScreening) {
  const highRiskIndicators = Object.values(screening).filter(Boolean).length;
  return screening.automatedDecisionMakingWithSignificantEffect || screening.vulnerablePeople && screening.innovativeTechnology || highRiskIndicators >= 2;
}

export function scoreDpiaRisk(risk: Pick<DpiaRisk, "likelihood" | "impact" | "controlEffectiveness">) {
  if (risk.controlEffectiveness < 0 || risk.controlEffectiveness > 100) throw new Error("Control effectiveness must be between 0 and 100");
  const inherentScore = risk.likelihood * risk.impact;
  const residualScore = Math.max(1, Math.round(inherentScore * (1 - risk.controlEffectiveness / 100)));
  const rating: RiskRating = residualScore >= 16 ? "critical" : residualScore >= 10 ? "high" : residualScore >= 5 ? "medium" : "low";
  return { inherentScore, residualScore, rating };
}

export function assertDpiaReadyForApproval(sections: readonly DpiaSection[], risks: readonly DpiaRisk[]) {
  const incomplete = sections.filter((section) => section.status !== "accepted");
  if (incomplete.length) throw new Error(`DPIA has ${incomplete.length} section(s) awaiting acceptance`);
  if (!risks.length) throw new Error("DPIA approval requires a recorded risk assessment");

  const unacceptedHighRisks = risks.filter((risk) => {
    const { rating } = scoreDpiaRisk(risk);
    return (rating === "high" || rating === "critical") && (!risk.acceptedByUserId || !risk.acceptanceRationale?.trim());
  });
  if (unacceptedHighRisks.length) throw new Error("High residual risk requires explicit DPO acceptance and rationale");
  return true;
}

export const defaultDpiaSections: readonly Omit<DpiaSection, "answers">[] = [
  { id: "request", title: "Project and processing description", assignedRole: "requester", status: "not-started" },
  { id: "supplier", title: "Supplier security and subprocessors", assignedRole: "supplier", status: "not-started" },
  { id: "necessity", title: "Necessity and proportionality", assignedRole: "compliance", status: "not-started" },
  { id: "transfers", title: "International transfers", assignedRole: "compliance", status: "not-started" },
  { id: "ai", title: "AI and automated decision-making", assignedRole: "compliance", status: "not-started" },
  { id: "risks", title: "Risk assessment and mitigations", assignedRole: "dpo", status: "not-started" },
  { id: "approval", title: "Residual risk and approval", assignedRole: "dpo", status: "not-started" },
];
