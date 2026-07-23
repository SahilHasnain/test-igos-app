"use client";

import { useMemo, useState } from "react";

type GovernanceRole = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

const activities = [
  { id: "ROPA-001", name: "Pupil admissions", academy: "Federation-wide", owner: "Admissions Director", basis: "Public task", review: "18 Sep 2026", score: 100, status: "Active" },
  { id: "ROPA-014", name: "Safeguarding case management", academy: "Riverside Academy", owner: "DSL", basis: "Legal obligation", review: "2 Aug 2026", score: 92, status: "Under review" },
  { id: "ROPA-021", name: "Staff recruitment", academy: "Federation-wide", owner: "People Director", basis: "Contract", review: "12 Oct 2026", score: 84, status: "Active" },
  { id: "ROPA-029", name: "CCTV monitoring", academy: "Hillcrest Academy", owner: "Operations Lead", basis: "Legitimate interests", review: "28 Jul 2026", score: 71, status: "Action required" },
];

const policies = [
  { id: "POL-001", title: "Data protection policy", version: "4.2", owner: "DPO", review: "16 Sep 2026", status: "Published", acknowledged: 93 },
  { id: "POL-006", title: "Records retention schedule", version: "3.0", owner: "Information Governance", review: "4 Aug 2026", status: "In review", acknowledged: 100 },
  { id: "POL-009", title: "Acceptable use policy", version: "2.7", owner: "Technology Director", review: "20 Oct 2026", status: "Published", acknowledged: 78 },
  { id: "POL-013", title: "AI governance standard", version: "0.8", owner: "DPO", review: "30 Jul 2026", status: "Draft", acknowledged: 0 },
];

export function DpiaProgressPanel({ role }: { role: GovernanceRole }) {
  const [sections, setSections] = useState([
    { name: "Project description", party: "Requester", status: "Accepted" },
    { name: "Supplier security", party: "Supplier", status: "Submitted" },
    { name: "Necessity and proportionality", party: "Compliance", status: "In progress" },
    { name: "International transfers", party: "Compliance", status: "Not started" },
    { name: "AI and automated decisions", party: "DPO", status: "In progress" },
    { name: "Residual risk approval", party: "DPO", status: "Not started" },
  ]);
  const accepted = sections.filter((section) => section.status === "Accepted").length;
  const canReview = role === "DPO" || role === "MAT administrator";
  return <section className="panel governance-progress" aria-labelledby="dpia-progress-title">
    <div className="panel-head"><div><p className="eyebrow">Multi-party completion</p><h2 id="dpia-progress-title">AI safeguarding triage DPIA</h2></div><strong>{accepted}/{sections.length} accepted</strong></div>
    <div className="section-grid">{sections.map((section, index) => <article key={section.name}><div><span className={`status-dot status-${section.status.toLowerCase().replaceAll(" ", "-")}`} /><strong>{section.name}</strong><small>{section.party}</small></div><span className="stage">{section.status}</span>{canReview && section.status === "Submitted" && <button onClick={() => setSections((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, status: "Accepted" } : item))}>Accept</button>}</article>)}</div>
    <div className="risk-strip"><div><p className="eyebrow">Residual risk</p><strong>High · 15/25</strong><small>Explicit DPO acceptance required before approval</small></div><div className="bar"><i style={{ width: "60%" }} /></div><button className="secondary" disabled={!canReview}>Review risks</button></div>
  </section>;
}

export function RopaPanel({ academy, role }: { academy: string; role: GovernanceRole }) {
  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draftName, setDraftName] = useState("");
  const rows = useMemo(() => activities.filter((activity) => (academy === "Federation-wide" || activity.academy === academy || activity.academy === "Federation-wide") && activity.name.toLowerCase().includes(filter.toLowerCase())), [academy, filter]);
  const canEdit = !["Auditor", "Read only"].includes(role);
  return <section className="panel register" aria-labelledby="ropa-title"><div className="register-toolbar"><div><p className="eyebrow">Article 30 inventory</p><h2 id="ropa-title">{rows.length} processing activities</h2></div><div className="inline-tools"><input aria-label="Filter processing activities" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter activities…" />{canEdit && <button className="primary" onClick={() => setShowCreate((value) => !value)}>＋ New activity</button>}</div></div>{showCreate && <form className="quick-create" onSubmit={(event) => { event.preventDefault(); if (!draftName.trim()) return; activities.unshift({ id: `ROPA-${String(activities.length + 30).padStart(3, "0")}`, name: draftName.trim(), academy, owner: "Unassigned", basis: "To be confirmed", review: "23 Aug 2026", score: 38, status: "Draft" }); setDraftName(""); setShowCreate(false); }}><label>Processing activity name<input required value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="e.g. Educational visits" /></label><button className="primary">Create draft</button><button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancel</button></form>}<div className="table-wrap"><table><thead><tr><th>Reference</th><th>Processing activity</th><th>Scope</th><th>Lawful basis</th><th>Owner</th><th>Review</th><th>Completeness</th></tr></thead><tbody>{rows.map((activity) => <tr key={activity.id}><td><code>{activity.id}</code></td><td><strong>{activity.name}</strong><small>{activity.status}</small></td><td>{activity.academy.replace(" Academy", "")}</td><td>{activity.basis}</td><td>{activity.owner}</td><td>{activity.review}</td><td><span className={`badge ${activity.score < 80 ? "risk-high" : activity.score < 100 ? "risk-medium" : "risk-low"}`}>{activity.score}%</span></td></tr>)}</tbody></table></div></section>;
}

export function PolicyPanel({ role }: { role: GovernanceRole }) {
  const [items, setItems] = useState(policies);
  const [showCreate, setShowCreate] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const canApprove = role === "DPO" || role === "MAT administrator";
  return <section className="panel register" aria-labelledby="policy-title"><div className="register-toolbar"><div><p className="eyebrow">Controlled documents</p><h2 id="policy-title">Policy register</h2></div>{!["Auditor", "Read only"].includes(role) && <button className="primary" onClick={() => setShowCreate((value) => !value)}>＋ New policy</button>}</div>{showCreate && <form className="quick-create" onSubmit={(event) => { event.preventDefault(); if (!draftTitle.trim()) return; setItems((records) => [{ id: `POL-${String(records.length + 14).padStart(3, "0")}`, title: draftTitle.trim(), version: "0.1", owner: role, review: "23 Aug 2026", status: "Draft", acknowledged: 0 }, ...records]); setDraftTitle(""); setShowCreate(false); }}><label>Policy title<input required value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="e.g. Data sharing standard" /></label><button className="primary">Create draft</button><button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancel</button></form>}<div className="policy-grid">{items.map((policy) => <article key={policy.id}><div className="policy-icon">§</div><div><code>{policy.id}</code><h3>{policy.title}</h3><p>Version {policy.version} · {policy.owner}</p><small>Review due {policy.review}</small></div><div className="policy-state"><span className={`badge ${policy.status === "Published" ? "risk-low" : policy.status === "Draft" ? "risk-medium" : "stage"}`}>{policy.status}</span><strong>{policy.acknowledged}%</strong><small>acknowledged</small>{canApprove && policy.status === "In review" && <button onClick={() => setItems((records) => records.map((record) => record.id === policy.id ? { ...record, status: "Published" } : record))}>Approve</button>}</div></article>)}</div></section>;
}
