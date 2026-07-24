"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useApi } from "@/src/client/use-api";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

interface AiSystem { id: string; name: string; owner: string; supplier: string; tier: string; status: string; review: string; oversight: number }
interface Asset { id: string; name: string; type: string; owner: string; classification: string; criticality: string; location: string; review: string; links: number }
interface RecordItem { id: string; category: string; academy: string; due: string; action: string; status: string; hold: string; count: number }
interface Contract { id: string; title: string; supplier: string; owner: string; expiry: string; notice: string; compliance: number; status: string }

export function AiGovernancePanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<AiSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = ["DPO", "MAT administrator"].includes(role);

  useEffect(() => {
    api.advancedGovernance.aiSystems.list(matId)
      .then(r => { setItems(r.systems as AiSystem[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const addSystem = useCallback(async () => {
    const newItem: AiSystem = { id: `AI-${String(items.length + 8).padStart(3, "0")}`, name: "New AI use awaiting screening", owner: "Unassigned", supplier: "To be confirmed", tier: "High", status: "Proposed", review: "24 Aug 2026", oversight: 0 };
    await api.advancedGovernance.aiSystems.save({ matId, ...newItem });
    setItems(prev => [newItem, ...prev]);
  }, [matId, items.length, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <Register title="AI system register" eyebrow="Human-controlled technology governance" action={canCreate ? addSystem : undefined} actionLabel="New AI system">
      <table>
        <thead><tr><th>Reference</th><th>AI system</th><th>Owner</th><th>Supplier</th><th>Risk tier</th><th>Status</th><th>Review</th><th>Control readiness</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td><code>{item.id}</code></td>
              <td><strong>{item.name}</strong></td>
              <td>{item.owner}</td>
              <td>{item.supplier}</td>
              <td><span className={`badge risk-${item.tier === "High" ? "high" : "medium"}`}>{item.tier}</span></td>
              <td><span className="stage">{item.status}</span></td>
              <td>{item.review}</td>
              <td><Progress value={item.oversight} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Register>
  );
}

export function AssetRegisterPanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = !["Auditor", "Read only"].includes(role);

  useEffect(() => {
    api.advancedGovernance.assets.list(matId)
      .then(r => { setItems(r.assets as Asset[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const addAsset = useCallback(async () => {
    const newItem: Asset = { id: `IAR-${String(items.length + 35).padStart(3, "0")}`, name: "New asset awaiting classification", type: "Unknown", owner: "Unassigned", classification: "Internal", criticality: "Medium", location: "UK", review: "24 Aug 2026", links: 0 };
    await api.advancedGovernance.assets.save({ matId, ...newItem });
    setItems(prev => [newItem, ...prev]);
  }, [matId, items.length, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <Register title="Information Asset Register" eyebrow="Systems, datasets and record collections" action={canCreate ? addAsset : undefined} actionLabel="New asset">
      <table>
        <thead><tr><th>Reference</th><th>Asset</th><th>Type</th><th>Owner</th><th>Classification</th><th>Criticality</th><th>Hosting</th><th>Links</th><th>Review</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td><code>{item.id}</code></td>
              <td><strong>{item.name}</strong></td>
              <td>{item.type}</td>
              <td>{item.owner}</td>
              <td><span className={`badge ${item.classification === "Restricted" ? "risk-high" : item.classification === "Confidential" ? "risk-medium" : "risk-low"}`}>{item.classification}</span></td>
              <td>{item.criticality}</td>
              <td>{item.location}</td>
              <td>{item.links}</td>
              <td>{item.review}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Register>
  );
}

export function RecordsManagementPanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const canDispose = ["DPO", "MAT administrator"].includes(role);

  useEffect(() => {
    api.advancedGovernance.records.list(matId)
      .then(r => { setItems(r.records as RecordItem[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const submitForApproval = useCallback(async (itemId: string) => {
    await api.advancedGovernance.records.save({ matId, id: itemId, status: "Awaiting approval" });
    setItems(prev => prev.map(row => row.id === itemId ? { ...row, status: "Awaiting approval" } : row));
  }, [matId, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  const eligibleCount = items.filter(i => i.status === "Eligible").length;
  const heldCount = items.filter(i => i.status === "Held").length;
  const awaitingCount = items.filter(i => i.status === "Awaiting approval").length;

  return (
    <Register title="Retention and disposal" eyebrow="Defensible records management">
      <div className="records-summary">
        <span><b>{eligibleCount}</b> eligible records</span>
        <span><b>{heldCount}</b> records on hold</span>
        <span><b>{awaitingCount}</b> awaiting approval</span>
      </div>
      <table>
        <thead><tr><th>Reference</th><th>Record category</th><th>Scope</th><th>Disposition due</th><th>Action</th><th>Hold</th><th>Records</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td><code>{item.id}</code></td>
              <td><strong>{item.category}</strong></td>
              <td>{item.academy}</td>
              <td>{item.due}</td>
              <td>{item.action}</td>
              <td>{item.hold}</td>
              <td>{item.count}</td>
              <td><span className={`badge ${item.status === "Held" ? "risk-high" : "risk-medium"}`}>{item.status}</span></td>
              <td>{canDispose && item.status === "Eligible" && <button className="row-action" onClick={() => submitForApproval(item.id)}>Submit</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Register>
  );
}

export function ContractGovernancePanel({ matId }: { matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.advancedGovernance.contracts.list(matId)
      .then(r => { setItems(r.contracts as Contract[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <Register title="Information governance contracts" eyebrow="Obligations, expiry and offboarding">
      <table>
        <thead><tr><th>Reference</th><th>Contract</th><th>Supplier</th><th>Owner</th><th>Expiry</th><th>Notice date</th><th>IG terms</th><th>Status</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td><code>{item.id}</code></td>
              <td><strong>{item.title}</strong></td>
              <td>{item.supplier}</td>
              <td>{item.owner}</td>
              <td>{item.expiry}</td>
              <td>{item.notice}</td>
              <td><Progress value={item.compliance} /></td>
              <td><span className={`badge ${item.status === "Expiring" ? "risk-high" : item.status === "Review" ? "risk-medium" : "risk-low"}`}>{item.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Register>
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
