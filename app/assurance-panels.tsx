"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/src/client/use-api";
import { EntityFormModal, TextField, TextAreaField, SelectField, NumberField, DateField, TagInputField } from "./components/entity-form-modal";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

interface Action { id: string; title: string; academy: string; owner: string; due: string; priority: string; status: string }
interface Finding { id: string; title: string; audit: string; academy: string; rating: string; owner: string; due: string; status: string }

interface Risk {
  id: string; matId: string; title: string; description: string;
  category: "regulatory" | "privacy" | "information-security" | "records" | "supplier" | "operational";
  ownerUserId: string; likelihood: 1 | 2 | 3 | 4 | 5; impact: 1 | 2 | 3 | 4 | 5;
  controlEffectiveness: number; controls: readonly string[]; treatments: readonly string[];
  appetite: "low" | "medium" | "high" | "critical";
  reviewDueAt: string; status: "open" | "treating" | "accepted" | "closed";
}

interface AuditProgramme {
  id: string; matId: string; title: string; scope: string;
  academyIds: readonly string[]; leadAuditorUserId: string;
  plannedStartAt: string; plannedEndAt: string;
  status: "planned" | "fieldwork" | "reporting" | "complete" | "cancelled";
}

function scoreRisk(likelihood: number, impact: number, controlEffectiveness: number) {
  const inherent = likelihood * impact;
  const residual = Math.max(1, Math.round(inherent * (1 - controlEffectiveness / 100)));
  const rating = residual >= 16 ? "critical" : residual >= 10 ? "high" : residual >= 5 ? "medium" : "low";
  return { inherent, residual, rating };
}

const emptyRisk = (matId: string): Risk => ({
  id: "", matId, title: "", description: "", category: "operational", ownerUserId: "",
  likelihood: 3, impact: 3, controlEffectiveness: 50,
  controls: [], treatments: [], appetite: "medium",
  reviewDueAt: new Date(Date.now() + 90 * 86400000).toISOString(), status: "open",
});

const emptyProgramme = (matId: string): AuditProgramme => ({
  id: "", matId, title: "", scope: "", academyIds: [], leadAuditorUserId: "",
  plannedStartAt: new Date().toISOString(), plannedEndAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  status: "planned",
});

export function AssuranceOverviewPanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [actions, setActions] = useState<Action[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const canManage = !["Auditor", "Read only"].includes(role);

  useEffect(() => {
    Promise.all([
      api.assurance.actions.list(matId),
      api.assurance.findings.list(matId),
      api.assurance.risks.list(matId),
    ]).then(([a, f, r]) => {
      setActions(a.actions as Action[]);
      setFindings(f.findings as Finding[]);
      setRisks(r.risks as Risk[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [matId]);

  const completeAction = useCallback(async (actionId: string) => {
    await api.assurance.actions.save({ matId, id: actionId, status: "Complete" });
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "Complete" } : a));
  }, [matId, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  const academyScores = [{ name: "Riverside", score: 82, rag: "amber" }, { name: "Hillcrest", score: 68, rag: "red" }, { name: "Greenfield", score: 91, rag: "green" }, { name: "Lakeside", score: 87, rag: "green" }, { name: "Meadow", score: 94, rag: "green" }];

  return (
    <div className="assurance-layout">
      <section className="panel span-2">
        <div className="panel-head">
          <div><p className="eyebrow">Remediation control</p><h2>Priority actions</h2></div>
          <span className="badge risk-high">{actions.filter(item => item.status !== "Complete").length} open</span>
        </div>
        <div className="assurance-list">
          {actions.map(action => (
            <article key={action.id}>
              <code>{action.id}</code>
              <div><strong>{action.title}</strong><small>{action.academy} · {action.owner}</small></div>
              <span className={`badge risk-${action.priority === "Critical" || action.priority === "High" ? "high" : "medium"}`}>{action.priority}</span>
              <time>{action.due}</time>
              {canManage && (
                <button
                  aria-label={`Complete ${action.title}`}
                  disabled={action.status === "Complete"}
                  onClick={() => completeAction(action.id)}
                >✓</button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div><p className="eyebrow">Federation assurance</p><h2>Academy scorecard</h2></div>
        </div>
        <div className="scorecards">
          {academyScores.map(academy => (
            <div key={academy.name}>
              <span className={`rag rag-${academy.rag}`} />
              <strong>{academy.name}</strong>
              <div className="bar"><i style={{ width: `${academy.score}%` }} /></div>
              <b>{academy.score}%</b>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div><p className="eyebrow">Audit readiness</p><h2>Evidence coverage</h2></div>
        </div>
        <div className="coverage-ring"><div><strong>86%</strong><span>evidenced</span></div></div>
        <button className="evidence-button">Generate evidence pack</button>
      </section>

      <section className="panel span-2">
        <div className="panel-head">
          <div><p className="eyebrow">Internal assurance</p><h2>Open audit findings</h2></div>
        </div>
        <FindingTable findings={findings} />
      </section>
    </div>
  );
}

export function RiskRegisterPanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Risk | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const canAccept = role === "DPO" || role === "MAT administrator";

  useEffect(() => {
    api.assurance.risks.list(matId)
      .then(r => { setItems(r.risks as Risk[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const handleSave = useCallback(async (draft: Risk) => {
    const toSave = { ...draft, matId };
    await api.assurance.risks.save(toSave);
    if (draft.id && items.some(i => i.id === draft.id)) {
      setItems(prev => prev.map(i => i.id === draft.id ? toSave : i));
    } else {
      setItems(prev => [{ ...toSave, id: `RSK-${String(Date.now()).slice(-6)}` }, ...prev]);
    }
  }, [matId, items, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register">
      <div className="register-toolbar">
        <div><p className="eyebrow">Federation risk register</p><h2>{items.length} information-governance risks</h2></div>
        {canAccept && <button className="primary" onClick={() => setShowCreate(true)}>＋ New risk</button>}
      </div>
      <div className="risk-cards">
        {items.map(risk => {
          const s = scoreRisk(risk.likelihood, risk.impact, risk.controlEffectiveness);
          return (
            <article key={risk.id} onClick={() => canAccept && setEditing(risk)}>
              <div><code>{risk.id}</code><h3>{risk.title}</h3><p>{risk.category} · Owner: {risk.ownerUserId}</p></div>
              <div className="risk-numbers">
                <span>Inherent <b>{s.inherent}</b></span>
                <span>Residual <b>{s.residual}</b></span>
                <span className={`badge risk-${s.rating}`}>{s.rating}</span>
              </div>
            </article>
          );
        })}
      </div>
      {showCreate && <RiskForm matId={matId} onSave={handleSave} onClose={() => setShowCreate(false)} />}
      {editing && <RiskForm matId={matId} item={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </section>
  );
}

function RiskForm({ matId, item, onSave, onClose }: { matId: string; item?: Risk; onSave: (d: Risk) => Promise<void>; onClose: () => void }) {
  const base = item ?? emptyRisk(matId);
  const [draft, setDraft] = useState(base);
  const set = <K extends keyof Risk>(key: K, value: Risk[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal title={item ? `Edit ${item.title || item.id}` : "New risk"} onClose={onClose} onSubmit={() => onSave(draft)} submitLabel={item ? "Update" : "Create"}>
      <fieldset>
        <legend>Core</legend>
        <TextField label="Risk title" value={draft.title} onChange={v => set("title", v)} required placeholder="e.g. Inadequate data retention" />
        <TextAreaField label="Description" value={draft.description} onChange={v => set("description", v)} required placeholder="Describe the risk" />
        <div className="field-row">
          <SelectField label="Category" value={draft.category} onChange={v => set("category", v as Risk["category"])} options={["regulatory", "privacy", "information-security", "records", "supplier", "operational"]} required />
          <SelectField label="Status" value={draft.status} onChange={v => set("status", v as Risk["status"])} options={["open", "treating", "accepted", "closed"]} required />
        </div>
      </fieldset>
      <fieldset>
        <legend>Scoring</legend>
        <div className="field-row">
          <SelectField label="Likelihood" value={String(draft.likelihood)} onChange={v => set("likelihood", Number(v) as Risk["likelihood"])} options={["1", "2", "3", "4", "5"]} required />
          <SelectField label="Impact" value={String(draft.impact)} onChange={v => set("impact", Number(v) as Risk["impact"])} options={["1", "2", "3", "4", "5"]} required />
        </div>
        <NumberField label="Control effectiveness (%)" value={draft.controlEffectiveness} onChange={v => set("controlEffectiveness", v)} min={0} max={100} required />
        <div className="field-row">
          <span style={{ fontSize: 10, color: "#698087", padding: "6px 0" }}>Inherent: <b>{draft.likelihood * draft.impact}</b></span>
          <span style={{ fontSize: 10, color: "#698087", padding: "6px 0" }}>Residual: <b>{Math.max(1, Math.round(draft.likelihood * draft.impact * (1 - draft.controlEffectiveness / 100)))}</b></span>
        </div>
      </fieldset>
      <fieldset>
        <legend>Controls</legend>
        <TagInputField label="Controls" value={draft.controls as string[]} onChange={v => set("controls", v)} placeholder="Existing controls" />
        <TagInputField label="Treatments" value={draft.treatments as string[]} onChange={v => set("treatments", v)} placeholder="Planned treatments" />
        <SelectField label="Risk appetite" value={draft.appetite} onChange={v => set("appetite", v as Risk["appetite"])} options={["low", "medium", "high", "critical"]} required />
      </fieldset>
      <fieldset>
        <legend>Review</legend>
        <TextField label="Owner" value={draft.ownerUserId} onChange={v => set("ownerUserId", v)} required placeholder="User ID" />
        <DateField label="Review due" value={draft.reviewDueAt} onChange={v => set("reviewDueAt", v)} required />
      </fieldset>
    </EntityFormModal>
  );
}

export function AuditProgrammePanel({ matId }: { matId: string }) {
  const api = useApi();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.assurance.findings.list(matId)
      .then(f => { setFindings(f.findings as Finding[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const handleSave = useCallback(async (draft: AuditProgramme) => {
    const toSave = { ...draft, matId };
    await api.assurance.programmes.save(toSave);
    setShowCreate(false);
  }, [matId, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register">
      <div className="register-toolbar">
        <div><p className="eyebrow">Assurance programme</p><h2>Audit findings and verification</h2></div>
        <button className="primary" onClick={() => setShowCreate(true)}>＋ Plan audit</button>
      </div>
      <FindingTable findings={findings} />
      {showCreate && <ProgrammeForm matId={matId} onSave={handleSave} onClose={() => setShowCreate(false)} />}
    </section>
  );
}

function ProgrammeForm({ matId, onSave, onClose }: { matId: string; onSave: (d: AuditProgramme) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState(emptyProgramme(matId));
  const set = <K extends keyof AuditProgramme>(key: K, value: AuditProgramme[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal title="Plan audit programme" onClose={onClose} onSubmit={() => onSave(draft)} submitLabel="Create">
      <fieldset>
        <legend>Core</legend>
        <TextField label="Audit title" value={draft.title} onChange={v => set("title", v)} required placeholder="e.g. Annual IG audit 2026" />
        <TextAreaField label="Scope" value={draft.scope} onChange={v => set("scope", v)} required placeholder="What does this audit cover?" />
      </fieldset>
      <fieldset>
        <legend>Team</legend>
        <TextField label="Lead auditor" value={draft.leadAuditorUserId} onChange={v => set("leadAuditorUserId", v)} required placeholder="User ID" />
        <TagInputField label="Academy IDs" value={draft.academyIds as string[]} onChange={v => set("academyIds", v)} placeholder="Comma-separated academy IDs" />
      </fieldset>
      <fieldset>
        <legend>Schedule</legend>
        <div className="field-row">
          <DateField label="Planned start" value={draft.plannedStartAt} onChange={v => set("plannedStartAt", v)} required />
          <DateField label="Planned end" value={draft.plannedEndAt} onChange={v => set("plannedEndAt", v)} required />
        </div>
      </fieldset>
    </EntityFormModal>
  );
}

function FindingTable({ findings }: { findings: Finding[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Reference</th><th>Finding</th><th>Audit</th><th>Academy</th><th>Rating</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
        <tbody>
          {findings.map(finding => (
            <tr key={finding.id}>
              <td><code>{finding.id}</code></td>
              <td><strong>{finding.title}</strong></td>
              <td>{finding.audit}</td>
              <td>{finding.academy}</td>
              <td><span className={`badge risk-${finding.rating.toLowerCase()}`}>{finding.rating}</span></td>
              <td>{finding.owner}</td>
              <td>{finding.due}</td>
              <td><span className="stage">{finding.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
