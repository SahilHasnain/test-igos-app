"use client";

import { useState } from "react";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

const initialActions = [
  { id: "ACT-104", title: "Complete CCTV legitimate-interests review", academy: "Hillcrest", owner: "Operations Lead", due: "22 Jul 2026", priority: "High", status: "Overdue" },
  { id: "ACT-109", title: "Update supplier breach-notification clause", academy: "Federation", owner: "Procurement", due: "29 Jul 2026", priority: "Medium", status: "In progress" },
  { id: "ACT-117", title: "Evidence safeguarding system access review", academy: "Riverside", owner: "DSL", due: "2 Aug 2026", priority: "Critical", status: "Awaiting evidence" },
];
const findings = [
  { id: "FND-026", title: "Leaver access not removed consistently", audit: "Identity and access audit", academy: "Federation", rating: "High", owner: "Technology", due: "31 Jul 2026", status: "In remediation" },
  { id: "FND-031", title: "Retention disposal evidence incomplete", audit: "Records review", academy: "Greenfield", rating: "Medium", owner: "Business Manager", due: "16 Aug 2026", status: "Accepted" },
  { id: "FND-034", title: "Supplier register missing subprocessors", audit: "Processor assurance", academy: "Federation", rating: "High", owner: "Procurement", due: "8 Aug 2026", status: "Ready to verify" },
];
const risks = [
  { id: "RSK-012", title: "Special-category data disclosed through misdirected email", category: "Privacy", owner: "DPO", inherent: 20, residual: 12, rating: "High", treatment: 67 },
  { id: "RSK-019", title: "Unsupported records retained beyond schedule", category: "Records", owner: "Information Governance", inherent: 16, residual: 8, rating: "Medium", treatment: 43 },
  { id: "RSK-023", title: "Critical supplier service interruption", category: "Supplier", owner: "Technology", inherent: 15, residual: 6, rating: "Medium", treatment: 78 },
];

export function AssuranceOverviewPanel({ role }: { role: Role }) {
  const [actions, setActions] = useState(initialActions);
  const canManage = !["Auditor", "Read only"].includes(role);
  const academyScores = [{ name: "Riverside", score: 82, rag: "amber" }, { name: "Hillcrest", score: 68, rag: "red" }, { name: "Greenfield", score: 91, rag: "green" }, { name: "Lakeside", score: 87, rag: "green" }, { name: "Meadow", score: 94, rag: "green" }];
  return <div className="assurance-layout"><section className="panel span-2"><div className="panel-head"><div><p className="eyebrow">Remediation control</p><h2>Priority actions</h2></div><span className="badge risk-high">{actions.filter((item) => item.status !== "Complete").length} open</span></div><div className="assurance-list">{actions.map((action) => <article key={action.id}><code>{action.id}</code><div><strong>{action.title}</strong><small>{action.academy} · {action.owner}</small></div><span className={`badge risk-${action.priority === "Critical" || action.priority === "High" ? "high" : "medium"}`}>{action.priority}</span><time>{action.due}</time>{canManage && <button aria-label={`Complete ${action.title}`} disabled={action.status === "Complete"} onClick={() => setActions((records) => records.map((record) => record.id === action.id ? { ...record, status: "Complete" } : record))}>✓</button>}</article>)}</div></section><section className="panel"><div className="panel-head"><div><p className="eyebrow">Federation assurance</p><h2>Academy scorecard</h2></div></div><div className="scorecards">{academyScores.map((academy) => <div key={academy.name}><span className={`rag rag-${academy.rag}`} /><strong>{academy.name}</strong><div className="bar"><i style={{ width: `${academy.score}%` }} /></div><b>{academy.score}%</b></div>)}</div></section><section className="panel"><div className="panel-head"><div><p className="eyebrow">Audit readiness</p><h2>Evidence coverage</h2></div></div><div className="coverage-ring"><div><strong>86%</strong><span>evidenced</span></div></div><button className="evidence-button">Generate evidence pack</button></section><section className="panel span-2"><div className="panel-head"><div><p className="eyebrow">Internal assurance</p><h2>Open audit findings</h2></div></div><FindingTable /></section></div>;
}

export function RiskRegisterPanel({ role }: { role: Role }) {
  const [items, setItems] = useState(risks);
  const canAccept = role === "DPO" || role === "MAT administrator";
  return <section className="panel register"><div className="register-toolbar"><div><p className="eyebrow">Federation risk register</p><h2>{items.length} information-governance risks</h2></div>{canAccept && <button className="primary" onClick={() => setItems((records) => [{ id: `RSK-${String(records.length + 24).padStart(3, "0")}`, title: "New risk awaiting assessment", category: "Operational", owner: "Unassigned", inherent: 9, residual: 9, rating: "Medium", treatment: 0 }, ...records])}>＋ New risk</button>}</div><div className="risk-cards">{items.map((risk) => <article key={risk.id}><div><code>{risk.id}</code><h3>{risk.title}</h3><p>{risk.category} · Owner: {risk.owner}</p></div><div className="risk-numbers"><span>Inherent <b>{risk.inherent}</b></span><span>Residual <b>{risk.residual}</b></span><span className={`badge risk-${risk.rating.toLowerCase()}`}>{risk.rating}</span></div><div><small>Treatment progress</small><div className="bar"><i style={{ width: `${risk.treatment}%` }} /></div><b>{risk.treatment}%</b></div></article>)}</div></section>;
}

export function AuditProgrammePanel() {
  return <section className="panel register"><div className="register-toolbar"><div><p className="eyebrow">Assurance programme</p><h2>Audit findings and verification</h2></div><button className="primary">＋ Plan audit</button></div><FindingTable /></section>;
}

function FindingTable() { return <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Finding</th><th>Audit</th><th>Academy</th><th>Rating</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>{findings.map((finding) => <tr key={finding.id}><td><code>{finding.id}</code></td><td><strong>{finding.title}</strong></td><td>{finding.audit}</td><td>{finding.academy}</td><td><span className={`badge risk-${finding.rating.toLowerCase()}`}>{finding.rating}</span></td><td>{finding.owner}</td><td>{finding.due}</td><td><span className="stage">{finding.status}</span></td></tr>)}</tbody></table></div>; }
