"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useApi } from "@/src/client/use-api";
import { useAuth } from "@/src/client/auth-context";
import { EntityFormModal, TextField, TextAreaField, SelectField, CheckField, DateField, TagInputField } from "./components/entity-form-modal";

type GovernanceRole = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

interface DpiaSection { id: string; title: string; assignedRole: string; assignedUserId?: string; status: string; answers: Record<string, unknown>; submittedAt?: string; acceptedAt?: string }

interface RopaActivity {
  id: string; matId: string; name: string; ownerUserId: string; purpose: string;
  dataSubjectCategories: readonly string[]; personalDataCategories: readonly string[];
  specialCategoryData: boolean; criminalOffenceData: boolean;
  lawfulBasis: string; recipients: readonly string[]; processors: readonly string[];
  internationalTransfers: readonly { destination: string; mechanism: string; transferRiskAssessmentId?: string }[];
  retentionRule: string; securityMeasures: readonly string[];
  sourceSystems: readonly string[]; destinationSystems: readonly string[];
  status: string; nextReviewAt: string; academyIds: readonly string[];
}

interface PolicyItem {
  id: string; matId: string; title: string; ownerUserId: string; version: string;
  status: string; reviewDueAt: string; academyIds: readonly string[];
}

const emptyRopa = (matId: string, academy: string): RopaActivity => ({
  id: "", matId, name: "", ownerUserId: "", purpose: "",
  dataSubjectCategories: [], personalDataCategories: [],
  specialCategoryData: false, criminalOffenceData: false,
  lawfulBasis: "public-task", recipients: [], processors: [],
  internationalTransfers: [], retentionRule: "", securityMeasures: [], sourceSystems: [], destinationSystems: [],
  status: "draft", nextReviewAt: new Date(Date.now() + 90 * 86400000).toISOString(),
  academyIds: academy === "Federation-wide" ? ["all"] : [academy],
});

const emptyPolicy = (matId: string): PolicyItem => ({
  id: "", matId, title: "", ownerUserId: "", version: "0.1",
  status: "draft", reviewDueAt: new Date(Date.now() + 90 * 86400000).toISOString(),
  academyIds: ["all"],
});

export function DpiaProgressPanel({ role, matId }: { role: GovernanceRole; matId: string }) {
  const api = useApi();
  const [sections, setSections] = useState<DpiaSection[]>([]);
  const [loading, setLoading] = useState(true);
  const canReview = role === "DPO" || role === "MAT administrator";

  useEffect(() => {
    api.governance.dpia.get(matId, matId)
      .then(r => { setSections(r.sections as DpiaSection[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId, api]);

  const acceptSection = useCallback(async (index: number) => {
    const section = sections[index];
    if (!section) return;
    const updated = { ...section, status: "accepted" as const };
    await api.governance.dpia.save(matId, matId, { action: "save-section", section: updated });
    setSections(prev => prev.map((s, i) => i === index ? updated : s));
  }, [sections, matId, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  const accepted = sections.filter(s => s.status === "accepted").length;

  return (
    <section className="panel governance-progress" aria-labelledby="dpia-progress-title">
      <div className="panel-head">
        <div><p className="eyebrow">Multi-party completion</p><h2 id="dpia-progress-title">DPIA progress</h2></div>
        <strong>{accepted}/{sections.length || 0} accepted</strong>
      </div>
      {!sections.length ? (
        <div className="empty" style={{ padding: "40px 20px" }}>
          <b>📋</b>
          <h3>No DPIA sections</h3>
          <p>Sections will appear when a DPIA is linked to this matter.</p>
        </div>
      ) : (
        <div className="section-grid">
          {sections.map((section, index) => (
            <article key={section.id}>
              <div>
                <span className={`status-dot status-${section.status.toLowerCase().replaceAll(" ", "-")}`} />
                <strong>{section.title}</strong>
                <small>{section.assignedRole}</small>
              </div>
              <span className="stage">{section.status}</span>
              {canReview && section.status === "submitted" && (
                <button onClick={() => acceptSection(index)}>Accept</button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function RopaPanel({ academy, role, matId }: { academy: string; role: GovernanceRole; matId: string }) {
  const api = useApi();
  const { auth } = useAuth();
  const [items, setItems] = useState<RopaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RopaActivity | null>(null);
  const canEdit = !["Auditor", "Read only"].includes(role);

  useEffect(() => {
    api.governance.ropa.get(matId)
      .then(r => { setItems(r.activities as RopaActivity[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId, api]);

  const handleSave = useCallback(async (draft: RopaActivity) => {
    const toSave = { ...draft, matId, ownerUserId: auth.userId || draft.ownerUserId || "unassigned", id: draft.id || `ROPA-${String(Date.now()).slice(-6)}` };
    await api.governance.ropa.save(matId, toSave);
    if (draft.id && items.some(i => i.id === draft.id)) {
      setItems(prev => prev.map(i => i.id === draft.id ? toSave : i));
    } else {
      setItems(prev => [{ ...toSave }, ...prev]);
    }
  }, [matId, auth.userId, items, api]);

  const rows = useMemo(() =>
    items.filter(a => (academy === "Federation-wide" || a.academyIds?.includes(academy) || a.academyIds?.includes("all")) && a.name.toLowerCase().includes(filter.toLowerCase())),
    [items, academy, filter]
  );

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register" aria-labelledby="ropa-title">
      <div className="register-toolbar">
        <div><p className="eyebrow">Article 30 inventory</p><h2 id="ropa-title">{rows.length} processing activities</h2></div>
        <div className="inline-tools">
          <input aria-label="Filter processing activities" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter activities…" />
          {canEdit && <button className="primary" onClick={() => setShowCreate(true)}>＋ New activity</button>}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Reference</th><th>Processing activity</th><th>Lawful basis</th><th>Owner</th><th>Status</th><th>Review</th></tr></thead>
          <tbody>
            {rows.map(activity => (
              <tr key={activity.id} onClick={() => canEdit && setEditing(activity)}>
                <td><code>{activity.id}</code></td>
                <td><strong>{activity.name}</strong></td>
                <td>{activity.lawfulBasis}</td>
                <td>{activity.ownerUserId || "—"}</td>
                <td><span className="stage">{activity.status}</span></td>
                <td>{activity.nextReviewAt ? new Date(activity.nextReviewAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreate && <RopaForm matId={matId} academy={academy} onSave={handleSave} onClose={() => setShowCreate(false)} />}
      {editing && <RopaForm matId={matId} academy={academy} item={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </section>
  );
}

function RopaForm({ matId, academy, item, onSave, onClose }: { matId: string; academy: string; item?: RopaActivity; onSave: (d: RopaActivity) => Promise<void>; onClose: () => void }) {
  const base = item ?? emptyRopa(matId, academy);
  const [draft, setDraft] = useState(base);
  const set = <K extends keyof RopaActivity>(key: K, value: RopaActivity[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal title={item ? `Edit ${item.name || item.id}` : "New processing activity"} onClose={onClose} onSubmit={() => onSave(draft)} submitLabel={item ? "Update" : "Create"}>
      <fieldset>
        <legend>Core</legend>
        <TextField label="Activity name" value={draft.name} onChange={v => set("name", v)} required placeholder="e.g. Educational visits" />
        <TextAreaField label="Purpose" value={draft.purpose} onChange={v => set("purpose", v)} required placeholder="What is the purpose of this processing?" minLength={10} />
      </fieldset>
      <fieldset>
        <legend>Data subjects &amp; categories</legend>
        <TagInputField label="Data subject categories" value={draft.dataSubjectCategories as string[]} onChange={v => set("dataSubjectCategories", v)} placeholder="e.g. Staff, Pupils, Parents" />
        <TagInputField label="Personal data categories" value={draft.personalDataCategories as string[]} onChange={v => set("personalDataCategories", v)} placeholder="e.g. Name, Contact details, Health" />
        <div className="field-row">
          <CheckField label="Special category data" checked={draft.specialCategoryData} onChange={v => set("specialCategoryData", v)} />
          <CheckField label="Criminal offence data" checked={draft.criminalOffenceData} onChange={v => set("criminalOffenceData", v)} />
        </div>
      </fieldset>
      <fieldset>
        <legend>Legal basis</legend>
        <SelectField label="Lawful basis" value={draft.lawfulBasis} onChange={v => set("lawfulBasis", v)} options={["consent", "contract", "legal-obligation", "vital-interests", "public-task", "legitimate-interests"]} required />
        <TagInputField label="Recipients" value={draft.recipients as string[]} onChange={v => set("recipients", v)} placeholder="Who receives this data?" />
        <TagInputField label="Processors" value={draft.processors as string[]} onChange={v => set("processors", v)} placeholder="Third-party processors" />
      </fieldset>
      <fieldset>
        <legend>Retention &amp; Security</legend>
        <TextAreaField label="Retention rule" value={draft.retentionRule} onChange={v => set("retentionRule", v)} required placeholder="How long is data kept?" />
        <TagInputField label="Security measures" value={draft.securityMeasures as string[]} onChange={v => set("securityMeasures", v)} placeholder="e.g. Access controls, Encryption" />
        <TagInputField label="Source systems" value={draft.sourceSystems as string[]} onChange={v => set("sourceSystems", v)} placeholder="Where does data come from?" />
        <TagInputField label="Destination systems" value={draft.destinationSystems as string[]} onChange={v => set("destinationSystems", v)} placeholder="Where is data sent?" />
      </fieldset>
      <fieldset>
        <legend>Review</legend>
        <SelectField label="Status" value={draft.status} onChange={v => set("status", v)} options={["draft", "active", "under-review", "retired"]} required />
        <DateField label="Next review" value={draft.nextReviewAt} onChange={v => set("nextReviewAt", v)} required />
      </fieldset>
    </EntityFormModal>
  );
}

export function PolicyPanel({ role, matId }: { role: GovernanceRole; matId: string }) {
  const api = useApi();
  const { auth } = useAuth();
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PolicyItem | null>(null);
  const canApprove = role === "DPO" || role === "MAT administrator";
  const canEdit = !["Auditor", "Read only"].includes(role);

  useEffect(() => {
    api.governance.policy.list(matId)
      .then(r => { setItems(r.policies as PolicyItem[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId, api]);

  const handleSave = useCallback(async (draft: PolicyItem) => {
    const toSave = { ...draft, matId, ownerUserId: auth.userId, documentId: draft.id ? "exists" : "pending" };
    await api.governance.policy.save(matId, toSave);
    if (draft.id && items.some(i => i.id === draft.id)) {
      setItems(prev => prev.map(i => i.id === draft.id ? toSave : i));
    } else {
      setItems(prev => [{ ...toSave, id: `POL-${String(Date.now()).slice(-6)}` }, ...prev]);
    }
  }, [matId, auth.userId, items, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register" aria-labelledby="policy-title">
      <div className="register-toolbar">
        <div><p className="eyebrow">Controlled documents</p><h2 id="policy-title">Policy register</h2></div>
        {canEdit && <button className="primary" onClick={() => setShowCreate(true)}>＋ New policy</button>}
      </div>
      <div className="policy-grid">
        {items.map(policy => (
          <article key={policy.id} onClick={() => canEdit && setEditing(policy)} style={{ cursor: canEdit ? "pointer" : undefined }}>
            <div className="policy-icon">§</div>
            <div>
              <code>{policy.id}</code>
              <h3>{policy.title}</h3>
              <p>Version {policy.version} · {policy.ownerUserId}</p>
              <small>Review due {policy.reviewDueAt ? new Date(policy.reviewDueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</small>
            </div>
            <div className="policy-state">
              <span className={`badge ${policy.status === "published" ? "risk-low" : policy.status === "draft" ? "risk-medium" : "stage"}`}>{policy.status}</span>
              {canApprove && policy.status === "in-review" && (
                <button onClick={async (e) => {
                  e.stopPropagation();
                  try { await api.governance.policy.transition(matId, policy.id, { matId, to: "approved" }); } catch { /* optimistic */ }
                  setItems(prev => prev.map(p => p.id === policy.id ? { ...p, status: "approved" } : p));
                }}>Approve</button>
              )}
            </div>
          </article>
        ))}
      </div>
      {showCreate && <PolicyForm matId={matId} onSave={handleSave} onClose={() => setShowCreate(false)} />}
      {editing && <PolicyForm matId={matId} item={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </section>
  );
}

function PolicyForm({ matId, item, onSave, onClose }: { matId: string; item?: PolicyItem; onSave: (d: PolicyItem) => Promise<void>; onClose: () => void }) {
  const base = item ?? emptyPolicy(matId);
  const [draft, setDraft] = useState(base);
  const set = <K extends keyof PolicyItem>(key: K, value: PolicyItem[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal title={item ? `Edit ${item.title || item.id}` : "New policy"} onClose={onClose} onSubmit={() => onSave(draft)} submitLabel={item ? "Update" : "Create"}>
      <fieldset>
        <legend>Core</legend>
        <TextField label="Policy title" value={draft.title} onChange={v => set("title", v)} required placeholder="e.g. Data sharing standard" />
        <div className="field-row">
          <TextField label="Version" value={draft.version} onChange={v => set("version", v)} required placeholder="0.1" />
          <SelectField label="Status" value={draft.status} onChange={v => set("status", v)} options={["draft", "in-review", "approved", "published", "retired"]} required />
        </div>
      </fieldset>
      <fieldset>
        <legend>Review</legend>
        <DateField label="Review due" value={draft.reviewDueAt} onChange={v => set("reviewDueAt", v)} required />
        <TagInputField label="Academy IDs" value={draft.academyIds as string[]} onChange={v => set("academyIds", v)} placeholder="all = federation-wide" />
      </fieldset>
    </EntityFormModal>
  );
}
