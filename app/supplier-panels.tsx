"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/src/client/use-api";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

interface SupplierAssessment {
  id: string;
  supplierName: string;
  category: string;
  riskLevel: string;
  status: string;
  lastReview: string;
  nextReview: string;
  owner: string;
}

export function SupplierRegisterPanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<SupplierAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const canManage = !["Auditor", "Read only"].includes(role);

  useEffect(() => {
    api.suppliers.list(matId)
      .then(r => { setItems(r.assessments as SupplierAssessment[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const addAssessment = useCallback(async () => {
    const newItem: SupplierAssessment = {
      id: `SUP-${String(items.length + 1).padStart(3, "0")}`,
      supplierName: "New supplier awaiting assessment",
      category: "Unassigned",
      riskLevel: "Medium",
      status: "Draft",
      lastReview: "",
      nextReview: "24 Aug 2026",
      owner: "Unassigned",
    };
    await api.suppliers.save({ matId, ...newItem });
    setItems(prev => [newItem, ...prev]);
  }, [matId, items.length, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register">
      <div className="register-toolbar">
        <div><p className="eyebrow">Supplier assurance</p><h2>{items.length} supplier assessments</h2></div>
        {canManage && <button className="primary" onClick={addAssessment}>＋ New assessment</button>}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Supplier</th>
              <th>Category</th>
              <th>Risk level</th>
              <th>Status</th>
              <th>Last review</th>
              <th>Next review</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td><code>{item.id}</code></td>
                <td><strong>{item.supplierName}</strong></td>
                <td>{item.category}</td>
                <td><span className={`badge risk-${item.riskLevel === "High" || item.riskLevel === "Critical" ? "high" : item.riskLevel === "Medium" ? "medium" : "low"}`}>{item.riskLevel}</span></td>
                <td><span className="stage">{item.status}</span></td>
                <td>{item.lastReview || "—"}</td>
                <td>{item.nextReview}</td>
                <td>{item.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
