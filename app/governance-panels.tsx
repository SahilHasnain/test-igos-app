"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useApi } from "@/src/client/use-api";
import { useAuth } from "@/src/client/auth-context";

type GovernanceRole = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

interface DpiaSection { id: string; title: string; assignedRole: string; assignedUserId?: string; status: string; answers: Record<string, unknown>; submittedAt?: string; acceptedAt?: string }
interface RopaActivity { id: string; name: string; academy: string; owner: string; basis: string; review: string; score: number; status: string }
interface PolicyItem { id: string; title: string; version: string; owner: string; review: string; status: string; acknowledged: number }

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
  const displaySections = sections.length ? sections : [
    { id: "1", title: "Project description", assignedRole: "requester", status: "accepted", answers: {} },
    { id: "2", title: "Supplier security", assignedRole: "supplier", status: "submitted", answers: {} },
    { id: "3", title: "Necessity and proportionality", assignedRole: "compliance", status: "in-progress", answers: {} },
    { id: "4", title: "International transfers", assignedRole: "compliance", status: "not-started", answers: {} },
    { id: "5", title: "AI and automated decisions", assignedRole: "dpo", status: "in-progress", answers: {} },
    { id: "6", title: "Residual risk approval", assignedRole: "dpo", status: "not-started", answers: {} },
  ];

  return (
    <section className="panel governance-progress" aria-labelledby="dpia-progress-title">
      <div className="panel-head">
        <div><p className="eyebrow">Multi-party completion</p><h2 id="dpia-progress-title">AI safeguarding triage DPIA</h2></div>
        <strong>{accepted}/{displaySections.length} accepted</strong>
      </div>
      <div className="section-grid">
        {displaySections.map((section, index) => (
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
      <div className="risk-strip">
        <div><p className="eyebrow">Residual risk</p><strong>High · 15/25</strong><small>Explicit DPO acceptance required before approval</small></div>
        <div className="bar"><i style={{ width: "60%" }} /></div>
        <button className="secondary" disabled={!canReview}>Review risks</button>
      </div>
    </section>
  );
}

export function RopaPanel({ academy, role, matId }: { academy: string; role: GovernanceRole; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<RopaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draftName, setDraftName] = useState("");
  const canEdit = !["Auditor", "Read only"].includes(role);

  useEffect(() => {
    api.governance.ropa.get(matId)
      .then(r => { setItems(r.activities as RopaActivity[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId, api]);

  const createActivity = useCallback(async (name: string) => {
    const newItem: RopaActivity = { id: `ROPA-${String(items.length + 30).padStart(3, "0")}`, name, academy, owner: "Unassigned", basis: "To be confirmed", review: "23 Aug 2026", score: 38, status: "Draft" };
    const now = new Date().toISOString();
    const nextReview = new Date(Date.now() + 90 * 86400000).toISOString();
    await api.governance.ropa.save(matId, {
      ...newItem,
      matId,
      academyIds: academy === "Federation-wide" ? ["all"] : [academy],
      ownerUserId: "unassigned",
      purpose: `${name} — processing purpose to be confirmed during initial assessment.`,
      dataSubjectCategories: ["Staff", "Pupils"],
      personalDataCategories: ["Name", "Contact details"],
      specialCategoryData: false,
      criminalOffenceData: false,
      lawfulBasis: "public-task",
      recipients: [],
      processors: [],
      internationalTransfers: [],
      retentionRule: "Retention period to be confirmed",
      securityMeasures: ["Access controls", "Encryption at rest"],
      sourceSystems: ["To be confirmed"],
      destinationSystems: [],
      status: "draft",
      nextReviewAt: nextReview,
    });
    setItems(prev => [newItem, ...prev]);
  }, [items.length, academy, matId, api]);

  const rows = useMemo(() =>
    items.filter(a => (academy === "Federation-wide" || a.academy === academy || a.academy === "Federation-wide") && a.name.toLowerCase().includes(filter.toLowerCase())),
    [items, academy, filter]
  );

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register" aria-labelledby="ropa-title">
      <div className="register-toolbar">
        <div><p className="eyebrow">Article 30 inventory</p><h2 id="ropa-title">{rows.length} processing activities</h2></div>
        <div className="inline-tools">
          <input aria-label="Filter processing activities" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter activities…" />
          {canEdit && <button className="primary" onClick={() => setShowCreate(v => !v)}>＋ New activity</button>}
        </div>
      </div>
      {showCreate && (
        <form className="quick-create" onSubmit={e => { e.preventDefault(); if (!draftName.trim()) return; createActivity(draftName.trim()); setDraftName(""); setShowCreate(false); }}>
          <label>Processing activity name<input required value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="e.g. Educational visits" /></label>
          <button className="primary">Create draft</button>
          <button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancel</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Reference</th><th>Processing activity</th><th>Scope</th><th>Lawful basis</th><th>Owner</th><th>Review</th><th>Completeness</th></tr></thead>
          <tbody>
            {rows.map(activity => (
              <tr key={activity.id}>
                <td><code>{activity.id}</code></td>
                <td><strong>{activity.name}</strong><small>{activity.status}</small></td>
                <td>{activity.academy.replace(" Academy", "")}</td>
                <td>{activity.basis}</td>
                <td>{activity.owner}</td>
                <td>{activity.review}</td>
                <td><span className={`badge ${activity.score < 80 ? "risk-high" : activity.score < 100 ? "risk-medium" : "risk-low"}`}>{activity.score}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PolicyPanel({ role, matId }: { role: GovernanceRole; matId: string }) {
  const api = useApi();
  const { auth } = useAuth();
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const canApprove = role === "DPO" || role === "MAT administrator";

  useEffect(() => {
    api.governance.policy.list(matId)
      .then(r => { setItems(r.policies as PolicyItem[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId, api]);

  const createPolicy = useCallback(async (title: string) => {
    const newItem: PolicyItem = { id: `POL-${String(items.length + 14).padStart(3, "0")}`, title, version: "0.1", owner: role, review: "23 Aug 2026", status: "Draft", acknowledged: 0 };
    const now = new Date().toISOString();
    const reviewDue = new Date(Date.now() + 90 * 86400000).toISOString();
    await api.governance.policy.save(matId, {
      ...newItem,
      matId,
      academyIds: ["all"],
      ownerUserId: auth.userId,
      version: "0.1",
      status: "draft",
      reviewDueAt: reviewDue,
      documentId: "pending",
    });
    setItems(prev => [newItem, ...prev]);
  }, [items.length, role, matId, auth.userId, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register" aria-labelledby="policy-title">
      <div className="register-toolbar">
        <div><p className="eyebrow">Controlled documents</p><h2 id="policy-title">Policy register</h2></div>
        {!["Auditor", "Read only"].includes(role) && <button className="primary" onClick={() => setShowCreate(v => !v)}>＋ New policy</button>}
      </div>
      {showCreate && (
        <form className="quick-create" onSubmit={e => { e.preventDefault(); if (!draftTitle.trim()) return; createPolicy(draftTitle.trim()); setDraftTitle(""); setShowCreate(false); }}>
          <label>Policy title<input required value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="e.g. Data sharing standard" /></label>
          <button className="primary">Create draft</button>
          <button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancel</button>
        </form>
      )}
      <div className="policy-grid">
        {items.map(policy => (
          <article key={policy.id}>
            <div className="policy-icon">§</div>
            <div>
              <code>{policy.id}</code>
              <h3>{policy.title}</h3>
              <p>Version {policy.version} · {policy.owner}</p>
              <small>Review due {policy.review}</small>
            </div>
            <div className="policy-state">
              <span className={`badge ${policy.status === "Published" ? "risk-low" : policy.status === "Draft" ? "risk-medium" : "stage"}`}>{policy.status}</span>
              <strong>{policy.acknowledged}%</strong>
              <small>acknowledged</small>
              {canApprove && policy.status === "In review" && (
                <button onClick={async () => {
                  try { await api.governance.policy.transition(matId, policy.id, { matId, to: "approved" }); } catch { /* optimistic */ }
                  setItems(prev => prev.map(p => p.id === policy.id ? { ...p, status: "Approved" } : p));
                }}>Approve</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
