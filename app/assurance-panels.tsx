"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/src/client/use-api";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

interface Action { id: string; title: string; academy: string; owner: string; due: string; priority: string; status: string }
interface Finding { id: string; title: string; audit: string; academy: string; rating: string; owner: string; due: string; status: string }
interface Risk { id: string; title: string; category: string; owner: string; inherent: number; residual: number; rating: string; treatment: number }

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
  const canAccept = role === "DPO" || role === "MAT administrator";

  useEffect(() => {
    api.assurance.risks.list(matId)
      .then(r => { setItems(r.risks as Risk[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const addRisk = useCallback(async () => {
    const newRisk: Risk = { id: `RSK-${String(items.length + 24).padStart(3, "0")}`, title: "New risk awaiting assessment", category: "Operational", owner: "Unassigned", inherent: 9, residual: 9, rating: "Medium", treatment: 0 };
    await api.assurance.risks.save({ matId, ...newRisk });
    setItems(prev => [newRisk, ...prev]);
  }, [matId, items.length, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register">
      <div className="register-toolbar">
        <div><p className="eyebrow">Federation risk register</p><h2>{items.length} information-governance risks</h2></div>
        {canAccept && <button className="primary" onClick={addRisk}>＋ New risk</button>}
      </div>
      <div className="risk-cards">
        {items.map(risk => (
          <article key={risk.id}>
            <div><code>{risk.id}</code><h3>{risk.title}</h3><p>{risk.category} · Owner: {risk.owner}</p></div>
            <div className="risk-numbers">
              <span>Inherent <b>{risk.inherent}</b></span>
              <span>Residual <b>{risk.residual}</b></span>
              <span className={`badge risk-${risk.rating.toLowerCase()}`}>{risk.rating}</span>
            </div>
            <div><small>Treatment progress</small><div className="bar"><i style={{ width: `${risk.treatment}%` }} /></div><b>{risk.treatment}%</b></div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AuditProgrammePanel({ matId }: { matId: string }) {
  const api = useApi();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.assurance.findings.list(matId)
      .then(f => { setFindings(f.findings as Finding[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register">
      <div className="register-toolbar">
        <div><p className="eyebrow">Assurance programme</p><h2>Audit findings and verification</h2></div>
        <button className="primary">＋ Plan audit</button>
      </div>
      <FindingTable findings={findings} />
    </section>
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
