import { createHash } from "node:crypto";
import type { AssuranceAction, AssuranceRisk, AuditFinding } from "@/src/domain/assurance";
import { scoreAssuranceRisk } from "@/src/domain/assurance";

export interface EvidenceItem {
  id: string;
  name: string;
  category: "policy" | "audit" | "case" | "risk" | "training" | "supplier" | "report";
  checksum: string;
  createdAt: string;
  sourceReference: string;
}

export interface EvidencePack {
  id: string;
  matId: string;
  academyId?: string;
  title: string;
  generatedAt: string;
  generatedByUserId: string;
  items: readonly EvidenceItem[];
  manifestHash: string;
}

const canonical = (items: readonly EvidenceItem[]) => JSON.stringify([...items].sort((a, b) => a.id.localeCompare(b)).map(({ id, checksum, sourceReference }) => ({ id, checksum, sourceReference })));

export function buildEvidencePack(input: Omit<EvidencePack, "manifestHash">): EvidencePack {
  if (!input.items.length) throw new Error("An evidence pack must contain at least one evidence item");
  const duplicate = input.items.find((item, index) => input.items.findIndex((candidate) => candidate.id === item.id) !== index);
  if (duplicate) throw new Error(`Duplicate evidence item ${duplicate.id}`);
  return { ...input, manifestHash: createHash("sha256").update(canonical(input.items)).digest("hex") };
}

export interface AcademyAssuranceInput {
  academyId: string;
  academyName: string;
  statutoryCompliancePercent: number;
  policyCompliancePercent: number;
  trainingCompliancePercent: number;
  actions: readonly AssuranceAction[];
  findings: readonly AuditFinding[];
  risks: readonly AssuranceRisk[];
}

export function academyAssuranceScorecard(input: AcademyAssuranceInput, now = new Date()) {
  const overdueCriticalActions = input.actions.filter((action) => action.status !== "complete" && action.priority === "critical" && new Date(action.dueAt) < now).length;
  const openHighFindings = input.findings.filter((finding) => finding.status !== "closed" && (finding.rating === "high" || finding.rating === "critical")).length;
  const highRisks = input.risks.filter((risk) => ["high", "critical"].includes(scoreAssuranceRisk(risk).rating)).length;
  const base = input.statutoryCompliancePercent * 0.4 + input.policyCompliancePercent * 0.3 + input.trainingCompliancePercent * 0.3;
  const score = Math.max(0, Math.round(base - overdueCriticalActions * 10 - openHighFindings * 5 - highRisks * 3));
  const rag = score >= 85 ? "green" : score >= 70 ? "amber" : "red";
  return { academyId: input.academyId, academyName: input.academyName, score, rag, overdueCriticalActions, openHighFindings, highRisks } as const;
}
