"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "../src/client/use-api";
import type { DemoMatter } from "../src/demo/ui-data";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";
type Decision = "accepted" | "rejected" | "modified" | "escalated";

interface Suggestion {
  id: string;
  matterId: string;
  documentId: string;
  documentVersion: number;
  location?: { page?: number };
  category: string;
  suggestedTreatment: string;
  finalTreatment?: string;
  confidence: number;
  explanation: string;
  legalGround?: string;
  decision: "pending" | Decision;
  reviewerRationale?: string;
}

interface Manifest {
  id: string;
  generatedAt: string;
  generatedByUserId: string;
  manifestHash: string;
  redactedCopyDocumentId: string;
}

const sensitiveCategories = new Set(["child-family-information", "legal-professional-privilege", "safeguarding-sensitive"]);

export function RedactionWorkspace({ role, matId, matters }: { role: Role; matId: string; matters: readonly DemoMatter[] }) {
  const api = useApi();
  const reviewMatters = useMemo(() => matters.filter((matter) => matter.type === "SAR" || matter.type === "FOI"), [matters]);
  const [matterId, setMatterId] = useState(reviewMatters[0]?._serverId ?? reviewMatters[0]?.id ?? "");
  const [documentId, setDocumentId] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [rationales, setRationales] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canDecide = ["DPO", "MAT administrator", "Case manager"].includes(role);
  const canGenerate = ["DPO", "MAT administrator"].includes(role);

  useEffect(() => {
    if (!matterId && reviewMatters[0]) setMatterId(reviewMatters[0]._serverId ?? reviewMatters[0].id);
  }, [matterId, reviewMatters]);

  useEffect(() => {
    if (!matterId || !documentId.trim()) {
      setSuggestions([]);
      setManifests([]);
      return;
    }
    setLoading(true);
    setError("");
    api.redaction.list(matId, matterId, documentId.trim())
      .then((res) => {
        setSuggestions((res.suggestions ?? []) as Suggestion[]);
        setManifests((res.manifests ?? []) as Manifest[]);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load redaction data"))
      .finally(() => setLoading(false));
  }, [api, matId, matterId, documentId]);

  const decide = useCallback(async (suggestion: Suggestion, decision: Decision) => {
    const reviewerRationale = rationales[suggestion.id]?.trim();
    if (!reviewerRationale) {
      setError("A reviewer rationale is required before recording a redaction decision.");
      return;
    }
    setError("");
    const finalTreatment = decision === "modified" ? "redact" : undefined;
    const res = await api.redaction.decide({ matId, id: suggestion.id, decision, reviewerRationale, finalTreatment });
    setSuggestions((items) => items.map((item) => item.id === suggestion.id ? res.suggestion as Suggestion : item));
  }, [api, matId, rationales]);

  const saveSecondReview = useCallback(async (suggestion: Suggestion) => {
    const rationale = rationales[suggestion.id]?.trim();
    if (!rationale) {
      setError("A second-review rationale is required.");
      return;
    }
    await api.redaction.saveReview({
      matId,
      id: `review-${suggestion.id}-${Date.now()}`,
      matterId: suggestion.matterId,
      suggestionId: suggestion.id,
      reviewerUserId: "current-user",
      decision: "approved",
      rationale,
      reviewedAt: new Date().toISOString(),
    });
    setError("Second review recorded. You can now generate the manifest if all decisions are complete.");
  }, [api, matId, rationales]);

  const generateManifest = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    const res = await api.redaction.generateManifest({
      matId,
      matterId,
      documentId: documentId.trim(),
      documentVersion: Number(data.get("documentVersion") || suggestions[0]?.documentVersion || 1),
      originalChecksum: String(data.get("originalChecksum") || ""),
      redactedCopyDocumentId: String(data.get("redactedCopyDocumentId") || ""),
      redactedCopyChecksum: String(data.get("redactedCopyChecksum") || ""),
    });
    setManifests((items) => [res.manifest as Manifest, ...items]);
  }, [api, documentId, matId, matterId, suggestions]);

  const unresolved = suggestions.filter((item) => item.decision === "pending" || item.decision === "escalated").length;
  const selectedMatter = reviewMatters.find((matter) => (matter._serverId ?? matter.id) === matterId);

  return <div className="redaction-shell">
    <section className="panel redaction-head">
      <div>
        <p className="eyebrow">Human-controlled disclosure review</p>
        <h2>Production redaction workspace</h2>
        <p>Select a SAR/FOI matter and document ID. Original documents remain immutable; this workspace records decisions and generates a checksum manifest for a separately stored disclosure copy.</p>
      </div>
      <div className="redaction-summary"><span><b>{suggestions.length}</b> suggestions</span><span className={unresolved ? "risk-high" : "risk-low"}><b>{unresolved}</b> unresolved</span><span><b>{manifests.length}</b> manifests</span></div>
    </section>

    <section className="panel register">
      <div className="field-row">
        <label>Matter<select value={matterId} onChange={(e) => setMatterId(e.target.value)}>{reviewMatters.map((matter) => <option key={matter._serverId ?? matter.id} value={matter._serverId ?? matter.id}>{matter.id} - {matter.title}</option>)}</select></label>
        <label>Document ID<input value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="Appwrite document/file ID" /></label>
      </div>
      {selectedMatter && <p className="notice"><span>{selectedMatter.type}</span> {selectedMatter.title} · {selectedMatter.academy}</p>}
      {error && <p className="notice risk-high"><span>Redaction notice</span> {error}</p>}
      {loading && <p>Loading redaction records...</p>}
    </section>

    <div className="redaction-grid">
      <section className="panel document-preview" aria-label="Document preview">
        <header><strong>Document evidence</strong></header>
        <div className="paper">
          <p><strong>Document ID:</strong> {documentId || "No document selected"}</p>
          <p>Render the source document from secure storage in this panel. IGOS does not modify originals; disclosure copies must be stored as separate documents and linked by checksum in the manifest.</p>
          {!suggestions.length && <p className="no-suggestions">No stored suggestions for this matter/document pair.</p>}
        </div>
      </section>

      <aside className="panel suggestion-panel" aria-label="Redaction suggestions">
        <div className="panel-head"><div><p className="eyebrow">Review decisions</p><h2>Suggestions</h2></div></div>
        {suggestions.map((item) => {
          const needsSecondReview = sensitiveCategories.has(item.category);
          return <article key={item.id} className={item.decision !== "pending" ? "decided" : ""}>
            <div className="suggestion-title"><span className={`confidence ${item.confidence < 0.72 ? "low" : needsSecondReview ? "sensitive" : ""}`}>{Math.round(item.confidence * 100)}%</span><div><strong>{item.category}</strong><small>Page {item.location?.page ?? "?"} · {item.suggestedTreatment}</small></div></div>
            <p>{item.explanation}</p>
            {item.legalGround && <details><summary>Legal ground</summary><small>{item.legalGround}</small></details>}
            <label>Decision rationale<textarea rows={3} value={rationales[item.id] ?? item.reviewerRationale ?? ""} onChange={(e) => setRationales((prev) => ({ ...prev, [item.id]: e.target.value }))} placeholder="Why is this accepted, rejected, modified or escalated?" /></label>
            <div className="decision-row"><span className="stage">{item.decision}</span>{canDecide && <><button onClick={() => decide(item, "accepted")}>Accept</button><button onClick={() => decide(item, "rejected")}>Reject</button><button onClick={() => decide(item, "modified")}>Modify</button><button onClick={() => decide(item, "escalated")}>Escalate</button></>}{canGenerate && needsSecondReview && item.decision !== "pending" && <button onClick={() => saveSecondReview(item)}>Second review</button>}</div>
          </article>;
        })}
      </aside>
    </div>

    <section className="panel register">
      <div className="panel-head"><div><p className="eyebrow">Disclosure control</p><h2>Manifest generation</h2></div></div>
      <form className="entity-form" onSubmit={generateManifest}>
        <div className="field-row"><label>Document version<input name="documentVersion" type="number" min="1" defaultValue={suggestions[0]?.documentVersion ?? 1} required /></label><label>Original checksum<input name="originalChecksum" required placeholder="sha256 of immutable source" /></label></div>
        <div className="field-row"><label>Disclosure copy document ID<input name="redactedCopyDocumentId" required placeholder="separate stored file/document ID" /></label><label>Disclosure copy checksum<input name="redactedCopyChecksum" required placeholder="sha256 of disclosure copy" /></label></div>
        <button className="primary" disabled={!canGenerate || unresolved > 0 || !suggestions.length}>Generate manifest</button>
      </form>
      <div className="timeline large">{manifests.map((manifest) => <div className="audit-row" key={manifest.id}><span>MAN</span><div><strong>{manifest.manifestHash}</strong><small>{manifest.redactedCopyDocumentId} · {new Date(manifest.generatedAt).toLocaleString("en-GB")}</small></div></div>)}</div>
    </section>
  </div>;
}
