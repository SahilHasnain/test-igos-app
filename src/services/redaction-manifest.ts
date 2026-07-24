import { createHash } from "node:crypto";
import { assertDocumentReadyForDisclosure, type RedactionSuggestion } from "@/src/domain/redaction";

export interface DisclosureDocument {
  documentId: string;
  documentVersion: number;
  originalChecksum: string;
  redactedCopyDocumentId: string;
  redactedCopyChecksum: string;
}

export interface RedactionManifestEntry {
  suggestionId: string;
  page: number;
  category: string;
  treatment: string;
  legalGround?: string;
  decidedByUserId: string;
  decidedAt: string;
  rationale: string;
  excerptHash: string;
  secondReviewedByUserId?: string;
}

export interface RedactionManifest {
  id: string;
  matId: string;
  matterId: string;
  document: DisclosureDocument;
  generatedAt: string;
  generatedByUserId: string;
  entries: readonly RedactionManifestEntry[];
  manifestHash: string;
}

export function buildRedactionManifest(input: Omit<RedactionManifest, "entries" | "manifestHash"> & { suggestions: readonly RedactionSuggestion[]; secondReviews: Readonly<Record<string, string>> }) {
  if (input.document.originalChecksum === input.document.redactedCopyChecksum) throw new Error("The disclosure copy must be stored separately from the immutable original");
  assertDocumentReadyForDisclosure(input.suggestions, Object.keys(input.secondReviews));
  const entries = input.suggestions.filter((suggestion) => suggestion.finalTreatment !== "disclose").map((suggestion) => {
    if (!suggestion.decidedByUserId || !suggestion.decidedAt || !suggestion.reviewerRationale || !suggestion.finalTreatment) throw new Error(`Suggestion ${suggestion.id} has an incomplete review decision`);
    return { suggestionId: suggestion.id, page: suggestion.location.page, category: suggestion.category, treatment: suggestion.finalTreatment, legalGround: suggestion.legalGround, decidedByUserId: suggestion.decidedByUserId, decidedAt: suggestion.decidedAt, rationale: suggestion.reviewerRationale, excerptHash: suggestion.excerptHash, secondReviewedByUserId: input.secondReviews[suggestion.id] };
  });
  const payload = JSON.stringify({ document: input.document, entries: [...entries].sort((a, b) => a.suggestionId.localeCompare(b.suggestionId)) });
  return { id: input.id, matId: input.matId, matterId: input.matterId, document: input.document, generatedAt: input.generatedAt, generatedByUserId: input.generatedByUserId, entries, manifestHash: createHash("sha256").update(payload).digest("hex") };
}
