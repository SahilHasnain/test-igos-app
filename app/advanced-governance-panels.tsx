"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useApi } from "@/src/client/use-api";
import { EntityFormModal, TextField, TextAreaField, SelectField, CheckField, NumberField, DateField, TagInputField } from "./components/entity-form-modal";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

interface AiSystemRecord {
  id: string; matId: string; name: string; purpose: string; ownerUserId: string;
  supplierId?: string; modelProvider: string; modelReference: string;
  riskTier: "prohibited" | "high" | "limited" | "minimal";
  status: "proposed" | "assessment" | "approved-pilot" | "approved-production" | "suspended" | "retired";
  personalDataUsed: boolean; specialCategoryDataUsed: boolean;
  automatedDecisionSignificantEffect: boolean; humanOversightDescription: string;
  explainabilityDescription: string; trainingDataDescription?: string;
  dpiaId?: string; supplierAssessmentId?: string;
  monitoringMetrics: readonly string[]; reviewDueAt: string;
  approvedByUserId?: string; approvalRationale?: string;
}

function oversightScore(item: AiSystemRecord): number {
  let done = 0;
  let total = 6;
  if (item.purpose.trim()) done++;
  if (item.modelProvider.trim()) done++;
  if (item.humanOversightDescription.trim()) done++;
  if (item.explainabilityDescription.trim()) done++;
  if (item.monitoringMetrics.length) done++;
  if (item.reviewDueAt) done++;
  return Math.round((done / total) * 100);
}

const emptySystem = (matId: string): AiSystemRecord => ({
  id: "", matId, name: "", purpose: "", ownerUserId: "",
  modelProvider: "", modelReference: "",
  riskTier: "limited", status: "proposed",
  personalDataUsed: false, specialCategoryDataUsed: false,
  automatedDecisionSignificantEffect: false,
  humanOversightDescription: "", explainabilityDescription: "",
  monitoringMetrics: [], reviewDueAt: new Date(Date.now() + 90 * 86400000).toISOString(),
});

export function AiGovernancePanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<AiSystemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AiSystemRecord | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const canCreate = ["DPO", "MAT administrator"].includes(role);

  useEffect(() => {
    api.advancedGovernance.aiSystems.list(matId)
      .then(r => { setItems(r.systems as AiSystemRecord[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const handleSave = useCallback(async (draft: AiSystemRecord) => {
    const toSave = { ...draft, matId, id: draft.id || `AI-${String(Date.now()).slice(-6)}`, ownerUserId: draft.ownerUserId || "unassigned", status: draft.status || "proposed" as const };
    await api.advancedGovernance.aiSystems.save(toSave);
    if (draft.id && items.some(i => i.id === draft.id)) {
      setItems(prev => prev.map(i => i.id === draft.id ? toSave : i));
    } else {
      setItems(prev => [{ ...toSave }, ...prev]);
    }
  }, [matId, items, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <Register
      title="AI system register"
      eyebrow="Human-controlled technology governance"
      action={canCreate ? () => setShowCreate(true) : undefined}
      actionLabel="New AI system"
    >
      <table>
        <thead><tr><th>Reference</th><th>AI system</th><th>Owner</th><th>Risk tier</th><th>Status</th><th>Review</th><th>Control readiness</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} onClick={() => canCreate && setEditing(item)}>
              <td><code>{item.id}</code></td>
              <td><strong>{item.name || "Untitled"}</strong></td>
              <td>{item.ownerUserId}</td>
              <td><span className={`badge risk-${item.riskTier === "prohibited" || item.riskTier === "high" ? "high" : "medium"}`}>{item.riskTier}</span></td>
              <td><span className="stage">{item.status}</span></td>
              <td>{item.reviewDueAt ? new Date(item.reviewDueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
              <td><Progress value={oversightScore(item)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showCreate && (
        <AiSystemForm
          matId={matId}
          onSave={handleSave}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editing && (
        <AiSystemForm
          matId={matId}
          item={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </Register>
  );
}

function AiSystemForm({
  matId,
  item,
  onSave,
  onClose,
}: {
  matId: string;
  item?: AiSystemRecord;
  onSave: (draft: AiSystemRecord) => Promise<void>;
  onClose: () => void;
}) {
  const base = item ?? emptySystem(matId);
  const [draft, setDraft] = useState(base);
  const set = <K extends keyof AiSystemRecord>(key: K, value: AiSystemRecord[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal
      title={item ? `Edit ${item.name || item.id}` : "New AI system"}
      onClose={onClose}
      onSubmit={() => onSave(draft)}
      submitLabel={item ? "Update" : "Create"}
    >
      <fieldset>
        <legend>Core</legend>
        <TextField label="System name" value={draft.name} onChange={v => set("name", v)} required placeholder="e.g. AI safeguarding triage" />
        <TextAreaField label="Purpose" value={draft.purpose} onChange={v => set("purpose", v)} required placeholder="What does this AI system do?" />
        <TextField label="Owner" value={draft.ownerUserId} onChange={v => set("ownerUserId", v)} required placeholder="User ID of responsible person" />
        <div className="field-row">
          <TextField label="Model provider" value={draft.modelProvider} onChange={v => set("modelProvider", v)} required placeholder="e.g. OpenAI, Google" />
          <TextField label="Model reference" value={draft.modelReference} onChange={v => set("modelReference", v)} required placeholder="e.g. GPT-4o" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Risk &amp; Compliance</legend>
        <div className="field-row">
          <SelectField label="Risk tier" value={draft.riskTier} onChange={v => set("riskTier", v as AiSystemRecord["riskTier"])} options={["prohibited", "high", "limited", "minimal"]} required />
          <SelectField label="Status" value={draft.status} onChange={v => set("status", v as AiSystemRecord["status"])} options={["proposed", "assessment", "approved-pilot", "approved-production", "suspended", "retired"]} required />
        </div>
        <div className="field-row">
          <CheckField label="Uses personal data" checked={draft.personalDataUsed} onChange={v => set("personalDataUsed", v)} />
          <CheckField label="Uses special-category data" checked={draft.specialCategoryDataUsed} onChange={v => set("specialCategoryDataUsed", v)} />
        </div>
        <CheckField label="Automated decisions with significant effect" checked={draft.automatedDecisionSignificantEffect} onChange={v => set("automatedDecisionSignificantEffect", v)} />
      </fieldset>

      <fieldset>
        <legend>Oversight &amp; Explainability</legend>
        <TextAreaField label="Human oversight description" value={draft.humanOversightDescription} onChange={v => set("humanOversightDescription", v)} required placeholder="How is human oversight maintained?" />
        <TextAreaField label="Explainability description" value={draft.explainabilityDescription} onChange={v => set("explainabilityDescription", v)} required placeholder="How are decisions explained?" />
        <TagInputField label="Monitoring metrics" value={draft.monitoringMetrics as string[]} onChange={v => set("monitoringMetrics", v)} placeholder="e.g. accuracy, false-positive rate" />
      </fieldset>

      <fieldset>
        <legend>Review</legend>
        <DateField label="Review due" value={draft.reviewDueAt} onChange={v => set("reviewDueAt", v)} required />
      </fieldset>
    </EntityFormModal>
  );
}

interface Asset {
  id: string; matId: string; name: string;
  assetType: "system" | "dataset" | "document-collection" | "physical-records" | "integration";
  ownerUserId: string; classification: "public" | "internal" | "confidential" | "restricted";
  criticality: "low" | "medium" | "high" | "critical";
  hostingLocations: readonly string[]; containsPersonalData: boolean; containsSpecialCategoryData: boolean;
  ropaActivityIds: readonly string[]; dpiaIds: readonly string[]; supplierIds: readonly string[]; retentionRuleIds: readonly string[];
  recoveryTimeHours?: number; recoveryPointHours?: number;
  nextReviewAt: string; status: "active" | "under-review" | "retiring" | "retired";
  academyIds: readonly string[];
}

const emptyAsset = (matId: string): Asset => ({
  id: "", matId, name: "", assetType: "system", ownerUserId: "", academyIds: [],
  classification: "internal", criticality: "medium",
  hostingLocations: [], containsPersonalData: false, containsSpecialCategoryData: false,
  ropaActivityIds: [], dpiaIds: [], supplierIds: [], retentionRuleIds: [],
  nextReviewAt: new Date(Date.now() + 90 * 86400000).toISOString(), status: "active",
});

export function AssetRegisterPanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const canCreate = !["Auditor", "Read only"].includes(role);

  useEffect(() => {
    api.advancedGovernance.assets.list(matId)
      .then(r => { setItems(r.assets as Asset[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const handleSave = useCallback(async (draft: Asset) => {
    const toSave = { ...draft, matId, id: draft.id || `IAR-${String(Date.now()).slice(-6)}`, ownerUserId: draft.ownerUserId || "unassigned" };
    await api.advancedGovernance.assets.save(toSave);
    if (draft.id && items.some(i => i.id === draft.id)) {
      setItems(prev => prev.map(i => i.id === draft.id ? toSave : i));
    } else {
      setItems(prev => [{ ...toSave }, ...prev]);
    }
  }, [matId, items, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <Register title="Information Asset Register" eyebrow="Systems, datasets and record collections" action={canCreate ? () => setShowCreate(true) : undefined} actionLabel="New asset">
      <table>
        <thead><tr><th>Reference</th><th>Asset</th><th>Type</th><th>Owner</th><th>Classification</th><th>Criticality</th><th>Hosting</th><th>Status</th><th>Review</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} onClick={() => canCreate && setEditing(item)}>
              <td><code>{item.id}</code></td>
              <td><strong>{item.name || "Untitled"}</strong></td>
              <td>{item.assetType}</td>
              <td>{item.ownerUserId}</td>
              <td><span className={`badge ${item.classification === "restricted" ? "risk-high" : item.classification === "confidential" ? "risk-medium" : "risk-low"}`}>{item.classification}</span></td>
              <td>{item.criticality}</td>
              <td>{item.hostingLocations.join(", ") || "—"}</td>
              <td><span className="stage">{item.status}</span></td>
              <td>{item.nextReviewAt ? new Date(item.nextReviewAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showCreate && <AssetForm matId={matId} onSave={handleSave} onClose={() => setShowCreate(false)} />}
      {editing && <AssetForm matId={matId} item={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </Register>
  );
}

function AssetForm({ matId, item, onSave, onClose }: { matId: string; item?: Asset; onSave: (d: Asset) => Promise<void>; onClose: () => void }) {
  const base = item ?? emptyAsset(matId);
  const [draft, setDraft] = useState(base);
  const set = <K extends keyof Asset>(key: K, value: Asset[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal title={item ? `Edit ${item.name || item.id}` : "New information asset"} onClose={onClose} onSubmit={() => onSave(draft)} submitLabel={item ? "Update" : "Create"}>
      <fieldset>
        <legend>Core</legend>
        <TextField label="Asset name" value={draft.name} onChange={v => set("name", v)} required placeholder="e.g. SIMS, CPOMS, HR file store" />
        <div className="field-row">
          <SelectField label="Asset type" value={draft.assetType} onChange={v => set("assetType", v as Asset["assetType"])} options={["system", "dataset", "document-collection", "physical-records", "integration"]} required />
          <SelectField label="Status" value={draft.status} onChange={v => set("status", v as Asset["status"])} options={["active", "under-review", "retiring", "retired"]} required />
        </div>
        <TextField label="Owner" value={draft.ownerUserId} onChange={v => set("ownerUserId", v)} required placeholder="User ID of asset owner" />
      </fieldset>
      <fieldset>
        <legend>Classification</legend>
        <div className="field-row">
          <SelectField label="Classification" value={draft.classification} onChange={v => set("classification", v as Asset["classification"])} options={["public", "internal", "confidential", "restricted"]} required />
          <SelectField label="Criticality" value={draft.criticality} onChange={v => set("criticality", v as Asset["criticality"])} options={["low", "medium", "high", "critical"]} required />
        </div>
      </fieldset>
      <fieldset>
        <legend>Data &amp; Hosting</legend>
        <div className="field-row">
          <CheckField label="Contains personal data" checked={draft.containsPersonalData} onChange={v => set("containsPersonalData", v)} />
          <CheckField label="Contains special-category data" checked={draft.containsSpecialCategoryData} onChange={v => set("containsSpecialCategoryData", v)} />
        </div>
        <TagInputField label="Hosting locations" value={draft.hostingLocations as string[]} onChange={v => set("hostingLocations", v)} placeholder="e.g. UK data centre, AWS eu-west-2" />
      </fieldset>
      <fieldset>
        <legend>Links</legend>
        <TagInputField label="ROPA activity IDs" value={draft.ropaActivityIds as string[]} onChange={v => set("ropaActivityIds", v)} placeholder="Comma-separated ROPA IDs" />
        <TagInputField label="DPIA IDs" value={draft.dpiaIds as string[]} onChange={v => set("dpiaIds", v)} placeholder="Comma-separated DPIA IDs" />
        <TagInputField label="Supplier IDs" value={draft.supplierIds as string[]} onChange={v => set("supplierIds", v)} placeholder="Comma-separated supplier IDs" />
        <TagInputField label="Retention rule IDs" value={draft.retentionRuleIds as string[]} onChange={v => set("retentionRuleIds", v)} placeholder="Comma-separated rule IDs" />
      </fieldset>
      <fieldset>
        <legend>Review</legend>
        <DateField label="Next review" value={draft.nextReviewAt} onChange={v => set("nextReviewAt", v)} required />
      </fieldset>
    </EntityFormModal>
  );
}

interface RecordItem {
  id: string; matId: string; assetId: string; retentionRuleId: string;
  triggerAt: string; dispositionDueAt: string;
  status: "active" | "held" | "eligible" | "approved-for-disposal" | "disposed" | "archived";
  category: string; academy: string; due: string; action: string; hold: string; count: number;
}

interface Contract {
  id: string; matId: string; title: string; supplierId: string; ownerUserId: string;
  startsAt: string; expiresAt: string; renewalNoticeAt: string;
  dataProcessingTerms: boolean; confidentialityTerms: boolean; auditRights: boolean;
  subprocessorApprovalRequired: boolean; breachNotificationHours?: number;
  returnOrDeletionTerms: boolean; status: string;
  supplier: string; owner: string; expiry: string; notice: string; compliance: number;
}

export function RecordsManagementPanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const canDispose = ["DPO", "MAT administrator"].includes(role);

  useEffect(() => {
    api.advancedGovernance.records.list(matId)
      .then(r => { setItems(r.records as RecordItem[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const handleSave = useCallback(async (draft: RecordItem) => {
    const toSave = { ...draft, matId, id: draft.id || `REC-${String(Date.now()).slice(-6)}` };
    await api.advancedGovernance.records.save(toSave);
    if (draft.id && items.some(i => i.id === draft.id)) {
      setItems(prev => prev.map(i => i.id === draft.id ? toSave : i));
    } else {
      setItems(prev => [{ ...toSave, count: 0, hold: "None", action: "Review" }, ...prev]);
    }
  }, [matId, items, api]);

  const submitForApproval = useCallback(async (itemId: string) => {
    await api.advancedGovernance.records.save({ matId, id: itemId, status: "approved-for-disposal" });
    setItems(prev => prev.map(row => row.id === itemId ? { ...row, status: "approved-for-disposal" } : row));
  }, [matId, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  const eligibleCount = items.filter(i => i.status === "eligible").length;
  const heldCount = items.filter(i => i.status === "held").length;
  const awaitingCount = items.filter(i => i.status === "approved-for-disposal").length;

  return (
    <Register title="Retention and disposal" eyebrow="Defensible records management" action={() => setShowCreate(true)} actionLabel="New record">
      <div className="records-summary">
        <span><b>{eligibleCount}</b> eligible records</span>
        <span><b>{heldCount}</b> records on hold</span>
        <span><b>{awaitingCount}</b> awaiting approval</span>
      </div>
      <table>
        <thead><tr><th>Reference</th><th>Record category</th><th>Scope</th><th>Disposition due</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} onClick={() => canDispose && setEditing(item)}>
              <td><code>{item.id}</code></td>
              <td><strong>{item.category || item.assetId}</strong></td>
              <td>{item.academy}</td>
              <td>{item.dispositionDueAt ? new Date(item.dispositionDueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
              <td><span className={`badge ${item.status === "held" ? "risk-high" : "risk-medium"}`}>{item.status}</span></td>
              <td>{canDispose && item.status === "eligible" && <button className="row-action" onClick={(e) => { e.stopPropagation(); submitForApproval(item.id); }}>Submit</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showCreate && <RecordForm matId={matId} onSave={handleSave} onClose={() => setShowCreate(false)} />}
      {editing && <RecordForm matId={matId} item={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </Register>
  );
}

function RecordForm({ matId, item, onSave, onClose }: { matId: string; item?: RecordItem; onSave: (d: RecordItem) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState<RecordItem>(item ?? {
    id: "", matId, assetId: "", retentionRuleId: "", triggerAt: new Date().toISOString(),
    dispositionDueAt: new Date(Date.now() + 365 * 86400000).toISOString(), status: "active",
    category: "", academy: "", due: "", action: "Review", hold: "None", count: 0,
  });
  const set = <K extends keyof RecordItem>(key: K, value: RecordItem[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal title={item ? `Edit ${item.id}` : "New record instance"} onClose={onClose} onSubmit={() => onSave(draft)} submitLabel={item ? "Update" : "Create"}>
      <fieldset>
        <legend>Core</legend>
        <TextField label="Category" value={draft.category} onChange={v => set("category", v)} required placeholder="e.g. Pupil records, HR files" />
        <div className="field-row">
          <TextField label="Asset ID" value={draft.assetId} onChange={v => set("assetId", v)} required placeholder="Linked asset ID" />
          <TextField label="Retention rule ID" value={draft.retentionRuleId} onChange={v => set("retentionRuleId", v)} required placeholder="Linked rule ID" />
        </div>
      </fieldset>
      <fieldset>
        <legend>Schedule</legend>
        <div className="field-row">
          <DateField label="Trigger date" value={draft.triggerAt} onChange={v => set("triggerAt", v)} required />
          <DateField label="Disposition due" value={draft.dispositionDueAt} onChange={v => set("dispositionDueAt", v)} required />
        </div>
        <SelectField label="Status" value={draft.status} onChange={v => set("status", v as RecordItem["status"])} options={["active", "held", "eligible", "approved-for-disposal", "disposed", "archived"]} required />
      </fieldset>
    </EntityFormModal>
  );
}

export function ContractGovernancePanel({ matId }: { matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);

  useEffect(() => {
    api.advancedGovernance.contracts.list(matId)
      .then(r => { setItems(r.contracts as Contract[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const handleSave = useCallback(async (draft: Contract) => {
    const toSave = { ...draft, matId, id: draft.id || `CTR-${String(Date.now()).slice(-6)}`, ownerUserId: draft.ownerUserId || "unassigned" };
    await api.advancedGovernance.contracts.save(toSave);
    if (draft.id && items.some(i => i.id === draft.id)) {
      setItems(prev => prev.map(i => i.id === draft.id ? toSave : i));
    } else {
      setItems(prev => [{ ...toSave, supplier: draft.supplierId, owner: draft.ownerUserId, expiry: draft.expiresAt, notice: draft.renewalNoticeAt, compliance: 0 }, ...prev]);
    }
  }, [matId, items, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <Register title="Information governance contracts" eyebrow="Obligations, expiry and offboarding" action={() => setShowCreate(true)} actionLabel="New contract">
      <table>
        <thead><tr><th>Reference</th><th>Contract</th><th>Supplier</th><th>Owner</th><th>Expiry</th><th>Notice date</th><th>Status</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} onClick={() => setEditing(item)}>
              <td><code>{item.id}</code></td>
              <td><strong>{item.title}</strong></td>
              <td>{item.supplier || item.supplierId}</td>
              <td>{item.owner || item.ownerUserId}</td>
              <td>{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
              <td>{item.renewalNoticeAt ? new Date(item.renewalNoticeAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
              <td><span className={`badge ${item.status === "expiring" || item.status === "Expiring" ? "risk-high" : item.status === "review" || item.status === "Review" ? "risk-medium" : "risk-low"}`}>{item.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showCreate && <ContractForm matId={matId} onSave={handleSave} onClose={() => setShowCreate(false)} />}
      {editing && <ContractForm matId={matId} item={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </Register>
  );
}

function ContractForm({ matId, item, onSave, onClose }: { matId: string; item?: Contract; onSave: (d: Contract) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState<Contract>(item ?? {
    id: "", matId, title: "", supplierId: "", ownerUserId: "",
    startsAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    renewalNoticeAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    dataProcessingTerms: false, confidentialityTerms: false, auditRights: false,
    subprocessorApprovalRequired: false, returnOrDeletionTerms: false, status: "draft",
    supplier: "", owner: "", expiry: "", notice: "", compliance: 0,
  });
  const set = <K extends keyof Contract>(key: K, value: Contract[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal title={item ? `Edit ${item.title || item.id}` : "New contract"} onClose={onClose} onSubmit={() => onSave(draft)} submitLabel={item ? "Update" : "Create"}>
      <fieldset>
        <legend>Core</legend>
        <TextField label="Contract title" value={draft.title} onChange={v => set("title", v)} required placeholder="e.g. SIMS data processing agreement" />
        <div className="field-row">
          <TextField label="Supplier ID" value={draft.supplierId} onChange={v => set("supplierId", v)} required placeholder="Linked supplier" />
          <TextField label="Owner" value={draft.ownerUserId} onChange={v => set("ownerUserId", v)} required placeholder="User ID" />
        </div>
        <SelectField label="Status" value={draft.status} onChange={v => set("status", v)} options={["draft", "review", "approved", "expiring", "terminated"]} required />
      </fieldset>
      <fieldset>
        <legend>Dates</legend>
        <div className="field-row">
          <DateField label="Starts" value={draft.startsAt} onChange={v => set("startsAt", v)} required />
          <DateField label="Expires" value={draft.expiresAt} onChange={v => set("expiresAt", v)} required />
        </div>
        <DateField label="Renewal notice" value={draft.renewalNoticeAt} onChange={v => set("renewalNoticeAt", v)} required />
      </fieldset>
      <fieldset>
        <legend>IG Terms</legend>
        <div className="field-row">
          <CheckField label="Data processing terms" checked={draft.dataProcessingTerms} onChange={v => set("dataProcessingTerms", v)} />
          <CheckField label="Confidentiality terms" checked={draft.confidentialityTerms} onChange={v => set("confidentialityTerms", v)} />
        </div>
        <div className="field-row">
          <CheckField label="Audit rights" checked={draft.auditRights} onChange={v => set("auditRights", v)} />
          <CheckField label="Return / deletion terms" checked={draft.returnOrDeletionTerms} onChange={v => set("returnOrDeletionTerms", v)} />
        </div>
        <CheckField label="Subprocessor approval required" checked={draft.subprocessorApprovalRequired} onChange={v => set("subprocessorApprovalRequired", v)} />
      </fieldset>
    </EntityFormModal>
  );
}

function Register({ title, eyebrow, action, actionLabel, children }: { title: string; eyebrow: string; action?: () => void; actionLabel?: string; children: ReactNode }) {
  return (
    <section className="panel register advanced-register">
      <div className="register-toolbar">
        <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
        {action && <button className="primary" onClick={action}>＋ {actionLabel}</button>}
      </div>
      <div className="table-wrap">{children}</div>
    </section>
  );
}

function Progress({ value }: { value: number }) {
  return <div className="mini-progress"><div className="bar"><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>;
}
