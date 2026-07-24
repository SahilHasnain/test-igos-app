"use client";

import { FormEvent, useMemo, useState } from "react";
import { academies, DemoMatter, initialMatters, MatterType, workflowStages } from "../src/demo/ui-data";
import { DpiaProgressPanel, PolicyPanel, RopaPanel } from "./governance-panels";
import { AssuranceOverviewPanel, AuditProgrammePanel, RiskRegisterPanel } from "./assurance-panels";
import { RedactionWorkspace } from "./redaction-workspace";
import { AiGovernancePanel, AssetRegisterPanel, ContractGovernancePanel, RecordsManagementPanel } from "./advanced-governance-panels";

type View = "Overview" | MatterType | "ROPA" | "Policies" | "Redaction" | "AI" | "Assets" | "Records" | "Contracts" | "Assurance" | "Risks" | "Audits" | "Actions" | "Audit";
type DemoRole = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";
const demoRoles: DemoRole[] = ["DPO", "MAT administrator", "Case manager", "Academy lead", "Auditor", "Read only"];
const moduleLabels: Record<MatterType, string> = { SAR: "SARs", FOI: "FOI", Breach: "Breaches", DPIA: "DPIAs" };
const icons: Record<string, string> = { Overview: "⌂", SAR: "◫", FOI: "◎", Breach: "△", DPIA: "◇", ROPA: "↔", Policies: "§", Redaction: "◩", AI: "✦", Assets: "▦", Records: "▧", Contracts: "⌁", Assurance: "◉", Risks: "!", Audits: "▤", Actions: "✓", Audit: "≡" };

function RiskBadge({ risk }: { risk: DemoMatter["risk"] }) {
  return <span className={`badge risk-${risk.toLowerCase()}`}>{risk}</span>;
}

function daysUntil(due: string) {
  const date = new Date(due.replace(/(\d+) (\w+) (\d+)/, "$2 $1, $3"));
  return Math.ceil((date.getTime() - new Date("2026-07-23T12:00:00Z").getTime()) / 86400000);
}

export default function IgosClient() {
  const [view, setView] = useState<View>("Overview");
  const [role, setRole] = useState<DemoRole>("DPO");
  const [academy, setAcademy] = useState(academies[0]);
  const [query, setQuery] = useState("");
  const [matters, setMatters] = useState(initialMatters);
  const [selected, setSelected] = useState<DemoMatter | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"Summary" | "Tasks" | "Documents" | "Audit">("Summary");

  const filtered = useMemo(() => matters.filter((matter) => {
    const academyMatch = academy === academies[0] || matter.academy === academy;
    const viewMatch = !["SAR", "FOI", "Breach", "DPIA"].includes(view) || matter.type === view;
    const haystack = `${matter.id} ${matter.title} ${matter.academy} ${matter.owner}`.toLowerCase();
    return academyMatch && viewMatch && haystack.includes(query.toLowerCase());
  }), [academy, matters, query, view]);

  function advance(matter: DemoMatter) {
    const stages = workflowStages[matter.type];
    const next = Math.min(stages.indexOf(matter.stage) + 1, stages.length - 1);
    const updated = { ...matter, stage: stages[next], progress: Math.round((next / (stages.length - 1)) * 100), activity: [`Advanced to ${stages[next]}`, ...matter.activity] };
    setMatters((items) => items.map((item) => item.id === matter.id ? updated : item));
    setSelected(updated);
  }

  function createMatter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const type = String(data.get("type")) as MatterType;
    const count = matters.filter((item) => item.type === type).length + 1;
    const prefixes: Record<MatterType, string> = { SAR: "SAR", FOI: "FOI", Breach: "BR", DPIA: "DPIA" };
    const matter: DemoMatter = {
      id: `${prefixes[type]}-2026-${String(200 + count).padStart(4, "0")}`,
      type,
      title: String(data.get("title")),
      academy: String(data.get("academy")),
      owner: "Unassigned",
      stage: workflowStages[type][0],
      due: "21 Aug 2026",
      risk: "Medium",
      progress: 8,
      summary: String(data.get("summary") || "New matter awaiting initial triage."),
      tasks: ["Complete initial triage", "Assign case owner"],
      activity: ["Matter created in placeholder mode"],
    };
    setMatters((items) => [matter, ...items]);
    setShowCreate(false);
    setSelected(matter);
  }

  const canCreate = !["Auditor", "Read only"].includes(role);
  const canAdvance = ["DPO", "MAT administrator", "Case manager"].includes(role);
  const canViewAudit = ["DPO", "MAT administrator", "Auditor"].includes(role);
  const availableViews = (["Overview", "SAR", "FOI", "Breach", "DPIA", "ROPA", "Policies", "Redaction", "AI", "Assets", "Records", "Contracts", "Assurance", "Risks", "Audits", "Actions", "Audit"] as View[]).filter((item) => item !== "Audit" || canViewAudit);
  const active = filtered.filter((item) => item.stage !== "Closed");
  const urgent = [...active].sort((a, b) => daysUntil(a.due) - daysUntil(b.due)).slice(0, 5);
  const metrics = [
    ["Open SARs", filtered.filter((x) => x.type === "SAR").length, "Statutory requests"],
    ["Open FOIs", filtered.filter((x) => x.type === "FOI").length, "Information requests"],
    ["Active DPIAs", filtered.filter((x) => x.type === "DPIA").length, "Assessments underway"],
    ["High-risk matters", filtered.filter((x) => x.risk === "High").length, "Require attention"],
  ];

  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">I</span><div><strong>IGOS</strong><small>Information governance</small></div></div>
      <nav aria-label="Primary navigation">
        {availableViews.map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}><span>{icons[item]}</span>{item === "SAR" ? "SARs" : item === "Breach" ? "Breaches" : item === "DPIA" ? "DPIAs" : item}</button>)}
      </nav>
      <div className="sidebar-foot"><div className="mode-dot" /> Demo workspace<br/><small>Appwrite-ready · M365 optional</small></div>
    </aside>

    <main id="main-content" tabIndex={-1}>
      <header className="topbar">
        <div><p className="eyebrow">Federation operations centre</p><h1>{view === "Overview" ? "Information governance overview" : view === "Actions" ? "Open actions" : view === "Audit" ? "Audit and assurance" : view === "ROPA" ? "Records of processing activities" : view === "Policies" ? "Policy management" : view === "Redaction" ? "AI-assisted review and redaction" : view === "AI" ? "AI governance" : view === "Assets" ? "Information Asset Register" : view === "Records" ? "Records management" : view === "Contracts" ? "Contract governance" : view === "Assurance" ? "Assurance overview" : view === "Risks" ? "Information governance risks" : view === "Audits" ? "Audit programme" : `${moduleLabels[view as MatterType]} register`}</h1></div>
        <div className="top-actions"><label className="search"><span>⌕</span><input aria-label="Search matters" placeholder="Search cases…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><select aria-label="Active role" value={role} onChange={(e) => { const nextRole = e.target.value as DemoRole; setRole(nextRole); if (view === "Audit" && !["DPO", "MAT administrator", "Auditor"].includes(nextRole)) setView("Overview"); }}>{demoRoles.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Academy filter" value={academy} onChange={(e) => setAcademy(e.target.value)}>{academies.map((item) => <option key={item}>{item}</option>)}</select>{canCreate && <button className="primary" onClick={() => setShowCreate(true)}>＋ New matter</button>}<span className="avatar" title={role} aria-label={`Current role: ${role}`}>{role.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span></div>
      </header>

      <section className="content">
        <div className="notice"><span>Placeholder environment</span> Records are stored in this browser session. Connect Appwrite when your project credentials are ready.</div>
        {view === "Overview" && <>
          <div className="metric-grid">{metrics.map(([label, value, hint], i) => <article className="metric" key={String(label)}><div className={`metric-icon tone-${i}`}>{["◫", "◎", "◇", "!"][i]}</div><p>{label}</p><strong>{value}</strong><small>{hint}</small></article>)}</div>
          <div className="dashboard-grid">
            <section className="panel span-2"><div className="panel-head"><div><p className="eyebrow">Deadline control</p><h2>Priority matters</h2></div><button className="text-button" onClick={() => setView("SAR")}>View registers →</button></div><MatterTable matters={urgent} onSelect={setSelected} /></section>
            <section className="panel"><div className="panel-head"><div><p className="eyebrow">Assurance</p><h2>Academy health</h2></div></div>{academies.slice(1).map((name, index) => { const score = [82, 71, 91, 86, 94][index]; return <div className="health" key={name}><div><strong>{name.replace(" Academy", "")}</strong><small>{score >= 90 ? "On track" : score >= 80 ? "Watch" : "Action required"}</small></div><div className="bar"><i style={{width: `${score}%`}} /></div><b>{score}%</b></div>})}</section>
            <section className="panel"><div className="panel-head"><div><p className="eyebrow">Workload</p><h2>By module</h2></div></div><div className="donut"><div><strong>{active.length}</strong><span>active</span></div></div><div className="legend">{(["SAR", "FOI", "Breach", "DPIA"] as MatterType[]).map((type) => <button key={type} onClick={() => setView(type)}><i className={`dot dot-${type.toLowerCase()}`} />{moduleLabels[type]} <b>{filtered.filter((x) => x.type === type).length}</b></button>)}</div></section>
            <section className="panel span-2"><div className="panel-head"><div><p className="eyebrow">Accountability</p><h2>Recent activity</h2></div></div><div className="timeline">{matters.slice(0, 4).map((matter) => <button key={matter.id} onClick={() => setSelected(matter)}><span>{matter.type}</span><div><strong>{matter.activity[0]}</strong><small>{matter.id} · {matter.academy}</small></div><time>Today</time></button>)}</div></section>
          </div>
        </>}
        {["SAR", "FOI", "Breach", "DPIA"].includes(view) && <section className="panel register"><div className="register-toolbar"><div><p className="eyebrow">Single source of truth</p><h2>{filtered.length} active records</h2></div><div className="pills"><button className="selected">All</button><button>Due soon</button><button>High risk</button></div></div><MatterTable matters={filtered} onSelect={setSelected} /></section>}
        {view === "DPIA" && <DpiaProgressPanel role={role} />}
        {view === "ROPA" && <RopaPanel academy={academy} role={role} />}
        {view === "Policies" && <PolicyPanel role={role} />}
        {view === "Redaction" && <RedactionWorkspace role={role} />}
        {view === "AI" && <AiGovernancePanel role={role} />}
        {view === "Assets" && <AssetRegisterPanel role={role} />}
        {view === "Records" && <RecordsManagementPanel role={role} />}
        {view === "Contracts" && <ContractGovernancePanel />}
        {view === "Assurance" && <AssuranceOverviewPanel role={role} />}
        {view === "Risks" && <RiskRegisterPanel role={role} />}
        {view === "Audits" && <AuditProgrammePanel />}
        {view === "Actions" && <section className="panel register"><div className="panel-head"><div><p className="eyebrow">Cross-module tracking</p><h2>Open actions</h2></div></div><div className="actions-list">{filtered.flatMap((matter) => matter.tasks.map((task, index) => <button key={`${matter.id}-${index}`} onClick={() => setSelected(matter)}><span className="check"/><div><strong>{task}</strong><small>{matter.id} · {matter.owner}</small></div><RiskBadge risk={matter.risk}/><time>{matter.due}</time></button>))}</div></section>}
        {view === "Audit" && <section className="panel register"><div className="panel-head"><div><p className="eyebrow">Immutable evidence</p><h2>Audit activity</h2></div></div><div className="timeline large">{matters.flatMap((matter) => matter.activity.slice(0, 2).map((event, index) => <button key={`${matter.id}-${index}`} onClick={() => setSelected(matter)}><span>{index ? "SYS" : matter.type}</span><div><strong>{event}</strong><small>{matter.id} · {matter.owner} · {matter.academy}</small></div><time>{index ? "Yesterday" : "Today"}</time></button>))}</div></section>}
      </section>
    </main>

    {selected && <div className="drawer-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="matter-title" onMouseDown={(e) => e.stopPropagation()}><button className="close" aria-label="Close matter details" onClick={() => setSelected(null)}>×</button><p className="eyebrow">{selected.type} matter</p><h2 id="matter-title">{selected.title}</h2><div className="drawer-meta"><code>{selected.id}</code><RiskBadge risk={selected.risk}/><span>{selected.academy}</span></div><div className="progress-label"><span>{selected.stage}</span><b>{selected.progress}%</b></div><div className="progress"><i style={{width: `${selected.progress}%`}} /></div><div className="tabs">{(["Summary", "Tasks", "Documents", "Audit"] as const).map((name) => <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>)}</div><div className="tab-body">{tab === "Summary" && <><h3>Case summary</h3><p>{selected.summary}</p><dl><div><dt>Case owner</dt><dd>{selected.owner}</dd></div><div><dt>Statutory / target date</dt><dd>{selected.due}</dd></div><div><dt>Current workflow stage</dt><dd>{selected.stage}</dd></div></dl></>}{tab === "Tasks" && <><h3>Outstanding tasks</h3>{selected.tasks.map((task) => <label className="task" key={task}><input type="checkbox" />{task}</label>)}</>}{tab === "Documents" && <div className="empty"><b>▣</b><h3>Evidence repository</h3><p>Documents will appear here when Appwrite Storage or an optional Microsoft 365 provider is connected.</p><button>Upload document</button></div>}{tab === "Audit" && <div className="timeline large">{selected.activity.map((event, index) => <div className="audit-row" key={event}><span>{index + 1}</span><div><strong>{event}</strong><small>Recorded by IGOS · {index ? "Yesterday" : "Today"}</small></div></div>)}</div>}</div><footer><button className="secondary">Add note</button><button className="primary" disabled={selected.stage === "Closed" || !canAdvance} title={!canAdvance ? "Your current role cannot advance workflows" : undefined} onClick={() => advance(selected)}>Advance workflow →</button></footer></aside></div>}

    {showCreate && <div className="modal-backdrop" role="presentation"><form className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title" onSubmit={createMatter}><button type="button" className="close" aria-label="Close new matter form" onClick={() => setShowCreate(false)}>×</button><p className="eyebrow">Intake</p><h2 id="create-title">Create governance matter</h2><label>Module<select name="type" defaultValue="SAR">{Object.keys(moduleLabels).map((type) => <option key={type} value={type}>{moduleLabels[type as MatterType]}</option>)}</select></label><label>Title<input required name="title" placeholder="Name or short description" /></label><label>Academy<select name="academy">{academies.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label>Initial summary<textarea name="summary" rows={4} placeholder="What has been requested or reported?" /></label><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary">Create matter</button></div></form></div>}
  </div>;
}

function MatterTable({ matters, onSelect }: { matters: DemoMatter[]; onSelect: (matter: DemoMatter) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Matter</th><th>Academy</th><th>Stage</th><th>Owner</th><th>Due</th><th>Risk</th></tr></thead><tbody>{matters.map((matter) => <tr key={matter.id} onClick={() => onSelect(matter)}><td><code>{matter.id}</code></td><td><strong>{matter.title}</strong><small>{matter.type}</small></td><td>{matter.academy.replace(" Academy", "")}</td><td><span className="stage">{matter.stage}</span></td><td>{matter.owner}</td><td className={daysUntil(matter.due) <= 1 ? "overdue" : ""}>{matter.due}<small>{daysUntil(matter.due) < 0 ? `${Math.abs(daysUntil(matter.due))}d overdue` : `${daysUntil(matter.due)}d remaining`}</small></td><td><RiskBadge risk={matter.risk}/></td></tr>)}</tbody></table>{!matters.length && <div className="empty"><h3>No matching matters</h3><p>Try another academy or search term.</p></div>}</div>;
}
