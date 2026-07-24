export type RedactionCategory =
  | "third-party-personal-data"
  | "out-of-scope"
  | "legal-professional-privilege"
  | "safeguarding-sensitive"
  | "child-family-information"
  | "confidential-reference"
  | "identifier"
  | "duplicate"
  | "foi-exemption-candidate";

export type SuggestedTreatment = "disclose" | "redact" | "withhold-document" | "escalate";
export type ReviewDecision = "pending" | "accepted" | "rejected" | "modified" | "escalated";

export interface MatterReviewContext {
  matId: string;
  academyId?: string;
  matterId: string;
  matterType: "sar" | "foi";
  requesterName: string;
  requesterRelationship: "self" | "parent-carer" | "representative" | "other";
  dataSubjectNames: readonly string[];
  scopeSummary: string;
  scopeKeywords: readonly string[];
  dateFrom?: string;
  dateTo?: string;
  safeguardingContext: boolean;
  legalPrivilegePossible: boolean;
}

export interface DocumentLocation {
  page: number;
  startOffset?: number;
  endOffset?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface RedactionSuggestion {
  id: string;
  matId: string;
  academyId?: string;
  matterId: string;
  documentId: string;
  documentVersion: number;
  location: DocumentLocation;
  category: RedactionCategory;
  suggestedTreatment: SuggestedTreatment;
  confidence: number;
  excerptHash: string;
  explanation: string;
  legalGround?: string;
  contextualFactors: readonly string[];
  decision: ReviewDecision;
  decidedByUserId?: string;
  decidedAt?: string;
  reviewerRationale?: string;
  finalTreatment?: SuggestedTreatment;
}

export interface RedactionReviewPolicy {
  lowConfidenceThreshold: number;
  mandatoryEscalationCategories: readonly RedactionCategory[];
  secondReviewerCategories: readonly RedactionCategory[];
}

export const defaultReviewPolicy: RedactionReviewPolicy = {
  lowConfidenceThreshold: 0.72,
  mandatoryEscalationCategories: ["legal-professional-privilege", "safeguarding-sensitive"],
  secondReviewerCategories: ["child-family-information", "legal-professional-privilege", "safeguarding-sensitive"],
};

export function requiresRedactionEscalation(suggestion: RedactionSuggestion, policy = defaultReviewPolicy) {
  return suggestion.confidence < policy.lowConfidenceThreshold || policy.mandatoryEscalationCategories.includes(suggestion.category) || suggestion.suggestedTreatment === "withhold-document" || suggestion.suggestedTreatment === "escalate";
}

export function decideRedactionSuggestion(suggestion: RedactionSuggestion, input: { decision: Exclude<ReviewDecision, "pending">; reviewerUserId: string; rationale: string; finalTreatment?: SuggestedTreatment; occurredAt?: string }) {
  if (!input.rationale.trim()) throw new Error("A redaction decision requires a reviewer rationale");
  if (input.decision === "modified" && !input.finalTreatment) throw new Error("A modified redaction decision requires a final treatment");
  if (input.decision === "accepted" && input.finalTreatment && input.finalTreatment !== suggestion.suggestedTreatment) throw new Error("Use a modified decision when changing the suggested treatment");
  return { ...suggestion, decision: input.decision, decidedByUserId: input.reviewerUserId, decidedAt: input.occurredAt ?? new Date().toISOString(), reviewerRationale: input.rationale, finalTreatment: input.finalTreatment ?? suggestion.suggestedTreatment };
}

export function assertDocumentReadyForDisclosure(suggestions: readonly RedactionSuggestion[], secondReviewCompletedIds: readonly string[]) {
  const unresolved = suggestions.filter((suggestion) => suggestion.decision === "pending" || suggestion.decision === "escalated");
  if (unresolved.length) throw new Error(`${unresolved.length} redaction suggestion(s) remain unresolved`);
  const missingSecondReview = suggestions.filter((suggestion) => defaultReviewPolicy.secondReviewerCategories.includes(suggestion.category) && !secondReviewCompletedIds.includes(suggestion.id));
  if (missingSecondReview.length) throw new Error(`${missingSecondReview.length} sensitive decision(s) require second review`);
  return true;
}
