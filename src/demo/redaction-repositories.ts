import { randomUUID } from "node:crypto";
import type { RedactionSuggestion, RedactionReviewPolicy, defaultReviewPolicy } from "@/src/domain/redaction";
import type { TenantScope } from "@/src/domain/model";
import type { RedactionAnalysisRun, RedactionAnalysisRepository } from "@/src/appwrite/redaction-analysis-repository";
import type { RedactionSuggestionRepository } from "@/src/appwrite/redaction-suggestion-repository";
import type { SecondReview, SecondReviewRepository } from "@/src/appwrite/second-review-repository";
import type { RedactionManifest, RedactionManifestRepository } from "@/src/appwrite/redaction-manifest-repository";

const analysisState: { matId: string; value: RedactionAnalysisRun }[] = [];
const suggestionState: { matId: string; value: RedactionSuggestion }[] = [];
const reviewState: { matId: string; value: SecondReview }[] = [];
const manifestState: { matId: string; value: RedactionManifest }[] = [];

export class DemoRedactionAnalysisRepository implements RedactionAnalysisRepository {
  async list(scope: TenantScope, matterId: string): Promise<readonly RedactionAnalysisRun[]> {
    return analysisState.filter(i => i.matId === scope.matId && i.value.matterId === matterId).map(i => i.value);
  }
  async findById(scope: TenantScope, id: string): Promise<RedactionAnalysisRun | null> {
    return analysisState.find(i => i.matId === scope.matId && i.value.id === id)?.value ?? null;
  }
  async save(scope: TenantScope, run: RedactionAnalysisRun): Promise<RedactionAnalysisRun> {
    const record = { ...run, id: run.id || randomUUID() };
    analysisState.push({ matId: scope.matId, value: record });
    return record;
  }
}

export class DemoRedactionSuggestionRepository implements RedactionSuggestionRepository {
  async listByMatterAndDocument(scope: TenantScope, matterId: string, documentId: string): Promise<readonly RedactionSuggestion[]> {
    return suggestionState.filter(i => i.matId === scope.matId && i.value.matterId === matterId && i.value.documentId === documentId).map(i => i.value);
  }
  async findById(scope: TenantScope, id: string): Promise<RedactionSuggestion | null> {
    return suggestionState.find(i => i.matId === scope.matId && i.value.id === id)?.value ?? null;
  }
  async save(scope: TenantScope, suggestion: RedactionSuggestion): Promise<RedactionSuggestion> {
    const record = { ...suggestion, id: suggestion.id || randomUUID() };
    suggestionState.push({ matId: scope.matId, value: record });
    return record;
  }
  async update(scope: TenantScope, id: string, suggestion: RedactionSuggestion): Promise<RedactionSuggestion> {
    const existing = suggestionState.find(i => i.matId === scope.matId && i.value.id === id);
    if (!existing) throw new Error("Suggestion not found");
    existing.value = suggestion;
    return suggestion;
  }
}

export class DemoSecondReviewRepository implements SecondReviewRepository {
  async listBySuggestion(scope: TenantScope, suggestionId: string): Promise<readonly SecondReview[]> {
    return reviewState.filter(i => i.matId === scope.matId && i.value.suggestionId === suggestionId).map(i => i.value);
  }
  async save(scope: TenantScope, review: SecondReview): Promise<SecondReview> {
    const record = { ...review, id: review.id || randomUUID() };
    reviewState.push({ matId: scope.matId, value: record });
    return record;
  }
}

export class DemoRedactionManifestRepository implements RedactionManifestRepository {
  async listByMatterAndDocument(scope: TenantScope, matterId: string, documentId: string): Promise<readonly RedactionManifest[]> {
    return manifestState.filter(i => i.matId === scope.matId && i.value.matterId === matterId && i.value.documentId === documentId).map(i => i.value);
  }
  async findById(scope: TenantScope, id: string): Promise<RedactionManifest | null> {
    return manifestState.find(i => i.matId === scope.matId && i.value.id === id)?.value ?? null;
  }
  async save(scope: TenantScope, manifest: RedactionManifest): Promise<RedactionManifest> {
    const record = { ...manifest, id: manifest.id || randomUUID() };
    manifestState.push({ matId: scope.matId, value: record });
    return record;
  }
}

export function resetRedactionDemoState() {
  analysisState.length = 0;
  suggestionState.length = 0;
  reviewState.length = 0;
  manifestState.length = 0;
}
