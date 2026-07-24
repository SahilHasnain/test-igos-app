import { createHash, randomUUID } from "node:crypto";
import type { MatterReviewContext, RedactionCategory, RedactionSuggestion, SuggestedTreatment } from "@/src/domain/redaction";

export interface DocumentChunk {
  documentId: string;
  documentVersion: number;
  page: number;
  text: string;
}

export interface RedactionProviderCapabilities {
  provider: string;
  processingLocation: string;
  customerDataTraining: false;
  retention: "none" | "contract-controlled";
  supportsBoundingBoxes: boolean;
}

export interface RedactionAnalysisProvider {
  readonly capabilities: RedactionProviderCapabilities;
  analyse(context: MatterReviewContext, chunks: readonly DocumentChunk[]): Promise<readonly RedactionSuggestion[]>;
}

export interface RedactionAnalysisRequest {
  context: MatterReviewContext;
  chunks: readonly DocumentChunk[];
  providerApprovedForMat: boolean;
}

export async function analyseForRedaction(provider: RedactionAnalysisProvider, request: RedactionAnalysisRequest) {
  if (!request.providerApprovedForMat) throw new Error("The analysis provider is not approved for this MAT");
  if (provider.capabilities.customerDataTraining !== false) throw new Error("Providers that train on customer data are prohibited");
  if (!request.chunks.length) throw new Error("At least one document chunk is required");
  return provider.analyse(request.context, request.chunks);
}

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const makeSuggestion = (context: MatterReviewContext, chunk: DocumentChunk, excerpt: string, category: RedactionCategory, treatment: SuggestedTreatment, confidence: number, explanation: string, legalGround?: string): RedactionSuggestion => ({ id: randomUUID(), matId: context.matId, academyId: context.academyId, matterId: context.matterId, documentId: chunk.documentId, documentVersion: chunk.documentVersion, location: { page: chunk.page, startOffset: chunk.text.indexOf(excerpt), endOffset: chunk.text.indexOf(excerpt) + excerpt.length }, category, suggestedTreatment: treatment, confidence, excerptHash: hash(excerpt), explanation, legalGround, contextualFactors: [context.scopeSummary], decision: "pending" });

export class DemoLocalRedactionProvider implements RedactionAnalysisProvider {
  readonly capabilities = { provider: "demo-local", processingLocation: "local-development-only", customerDataTraining: false as const, retention: "none" as const, supportsBoundingBoxes: false };
  async analyse(context: MatterReviewContext, chunks: readonly DocumentChunk[]) {
    const suggestions: RedactionSuggestion[] = [];
    for (const chunk of chunks) {
      const emailMatches = chunk.text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
      for (const email of emailMatches) suggestions.push(makeSuggestion(context, chunk, email, "identifier", "redact", 0.97, "Email address detected; confirm whether it belongs to the requester/data subject or a third party.", "UK GDPR and DPA 2018 third-party personal data review"));
      const safeguarding = chunk.text.match(/safeguarding|child protection|risk of harm/i)?.[0];
      if (safeguarding) suggestions.push(makeSuggestion(context, chunk, safeguarding, "safeguarding-sensitive", "escalate", 0.82, "Safeguarding terminology detected. Contextual review is required before disclosure."));
      const privilege = chunk.text.match(/legal advice|without prejudice|privileged/i)?.[0];
      if (privilege) suggestions.push(makeSuggestion(context, chunk, privilege, "legal-professional-privilege", "escalate", 0.78, "Potential legally privileged material detected.", "DPA 2018 Schedule 2 legal professional privilege restriction"));
    }
    return suggestions;
  }
}
