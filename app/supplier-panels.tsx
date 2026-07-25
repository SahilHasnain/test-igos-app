"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/src/client/use-api";
import { EntityFormModal, TextField, TextAreaField, SelectField, CheckField, NumberField, DateField, TagInputField } from "./components/entity-form-modal";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";

interface SupplierAssessment {
  id: string; matId: string; supplierName: string; serviceDescription: string;
  relationship: "processor" | "joint-controller" | "independent-controller" | "subprocessor";
  ownerUserId: string;
  securityQuestionnaireStatus: "not-issued" | "issued" | "submitted" | "accepted" | "changes-required";
  contractStatus: "not-started" | "under-review" | "approved" | "expired";
  dataProtectionTermsConfirmed: boolean;
  subprocessors: readonly string[]; certifications: readonly string[];
  internationalTransfers: boolean;
  riskRating: "low" | "medium" | "high" | "critical";
  reviewDueAt: string;
  status: "draft" | "in-review" | "approved" | "suspended" | "offboarded";
}

const emptySupplier = (matId: string): SupplierAssessment => ({
  id: "", matId, supplierName: "", serviceDescription: "",
  relationship: "processor", ownerUserId: "",
  securityQuestionnaireStatus: "not-issued", contractStatus: "not-started",
  dataProtectionTermsConfirmed: false, subprocessors: [], certifications: [],
  internationalTransfers: false, riskRating: "medium",
  reviewDueAt: new Date(Date.now() + 90 * 86400000).toISOString(), status: "draft",
});

export function SupplierRegisterPanel({ role, matId }: { role: Role; matId: string }) {
  const api = useApi();
  const [items, setItems] = useState<SupplierAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SupplierAssessment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const canManage = !["Auditor", "Read only"].includes(role);

  useEffect(() => {
    api.suppliers.list(matId)
      .then(r => { setItems(r.assessments as SupplierAssessment[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matId]);

  const handleSave = useCallback(async (draft: SupplierAssessment) => {
    const toSave = { ...draft, matId, id: draft.id || `SUP-${String(Date.now()).slice(-6)}`, ownerUserId: draft.ownerUserId || "unassigned" };
    await api.suppliers.save(toSave);
    if (draft.id && items.some(i => i.id === draft.id)) {
      setItems(prev => prev.map(i => i.id === draft.id ? toSave : i));
    } else {
      setItems(prev => [{ ...toSave }, ...prev]);
    }
  }, [matId, items, api]);

  if (loading) return <div className="panel"><p>Loading...</p></div>;

  return (
    <section className="panel register">
      <div className="register-toolbar">
        <div><p className="eyebrow">Supplier assurance</p><h2>{items.length} supplier assessments</h2></div>
        {canManage && <button className="primary" onClick={() => setShowCreate(true)}>＋ New assessment</button>}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th><th>Supplier</th><th>Category</th><th>Risk</th><th>Status</th><th>Review</th><th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => canManage && setEditing(item)}>
                <td><code>{item.id}</code></td>
                <td><strong>{item.supplierName}</strong></td>
                <td>{item.relationship}</td>
                <td><span className={`badge risk-${item.riskRating === "high" || item.riskRating === "critical" ? "high" : item.riskRating === "medium" ? "medium" : "low"}`}>{item.riskRating}</span></td>
                <td><span className="stage">{item.status}</span></td>
                <td>{item.reviewDueAt ? new Date(item.reviewDueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                <td>{item.ownerUserId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreate && <SupplierForm matId={matId} onSave={handleSave} onClose={() => setShowCreate(false)} />}
      {editing && <SupplierForm matId={matId} item={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </section>
  );
}

function SupplierForm({ matId, item, onSave, onClose }: { matId: string; item?: SupplierAssessment; onSave: (d: SupplierAssessment) => Promise<void>; onClose: () => void }) {
  const base = item ?? emptySupplier(matId);
  const [draft, setDraft] = useState(base);
  const set = <K extends keyof SupplierAssessment>(key: K, value: SupplierAssessment[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <EntityFormModal title={item ? `Edit ${item.supplierName || item.id}` : "New supplier assessment"} onClose={onClose} onSubmit={() => onSave(draft)} submitLabel={item ? "Update" : "Create"}>
      <fieldset>
        <legend>Core</legend>
        <TextField label="Supplier name" value={draft.supplierName} onChange={v => set("supplierName", v)} required placeholder="e.g. Capita SIMS" />
        <TextAreaField label="Service description" value={draft.serviceDescription} onChange={v => set("serviceDescription", v)} required placeholder="What service does this supplier provide?" />
        <div className="field-row">
          <SelectField label="Relationship" value={draft.relationship} onChange={v => set("relationship", v as SupplierAssessment["relationship"])} options={["processor", "joint-controller", "independent-controller", "subprocessor"]} required />
          <SelectField label="Status" value={draft.status} onChange={v => set("status", v as SupplierAssessment["status"])} options={["draft", "in-review", "approved", "suspended", "offboarded"]} required />
        </div>
      </fieldset>
      <fieldset>
        <legend>Security &amp; Contract</legend>
        <div className="field-row">
          <SelectField label="Security questionnaire" value={draft.securityQuestionnaireStatus} onChange={v => set("securityQuestionnaireStatus", v as SupplierAssessment["securityQuestionnaireStatus"])} options={["not-issued", "issued", "submitted", "accepted", "changes-required"]} required />
          <SelectField label="Contract status" value={draft.contractStatus} onChange={v => set("contractStatus", v as SupplierAssessment["contractStatus"])} options={["not-started", "under-review", "approved", "expired"]} required />
        </div>
        <CheckField label="Data protection terms confirmed" checked={draft.dataProtectionTermsConfirmed} onChange={v => set("dataProtectionTermsConfirmed", v)} />
        <CheckField label="International transfers" checked={draft.internationalTransfers} onChange={v => set("internationalTransfers", v)} />
      </fieldset>
      <fieldset>
        <legend>Risk</legend>
        <SelectField label="Risk rating" value={draft.riskRating} onChange={v => set("riskRating", v as SupplierAssessment["riskRating"])} options={["low", "medium", "high", "critical"]} required />
        <TagInputField label="Subprocessors" value={draft.subprocessors as string[]} onChange={v => set("subprocessors", v)} placeholder="Comma-separated subprocessor names" />
        <TagInputField label="Certifications" value={draft.certifications as string[]} onChange={v => set("certifications", v)} placeholder="e.g. ISO 27001, Cyber Essentials" />
      </fieldset>
      <fieldset>
        <legend>Review</legend>
        <TextField label="Owner" value={draft.ownerUserId} onChange={v => set("ownerUserId", v)} required placeholder="User ID" />
        <DateField label="Review due" value={draft.reviewDueAt} onChange={v => set("reviewDueAt", v)} required />
      </fieldset>
    </EntityFormModal>
  );
}
