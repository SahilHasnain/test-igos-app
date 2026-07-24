"use client";

import { useMemo, useState } from "react";

type Role = "DPO" | "MAT administrator" | "Case manager" | "Academy lead" | "Auditor" | "Read only";
type Decision = "Pending" | "Accepted" | "Rejected" | "Escalated";

const initialSuggestions = [
  { id: "SUG-001", page: 2, category: "Third-party personal data", treatment: "Redact", confidence: 96, text: "[third-party email address]", reason: "Email address may identify a third party not covered by the request.", ground: "DPA 2018 third-party personal data review", decision: "Pending" as Decision, sensitive: false },
  { id: "SUG-002", page: 4, category: "Safeguarding-sensitive", treatment: "Escalate", confidence: 82, text: "[safeguarding contextual passage]", reason: "Disclosure could reveal risk-of-harm information requiring contextual review.", ground: "Safeguarding and third-party rights assessment", decision: "Escalated" as Decision, sensitive: true },
  { id: "SUG-003", page: 7, category: "Potential privilege", treatment: "Escalate", confidence: 78, text: "[potential legal advice passage]", reason: "The passage may contain confidential legal advice.", ground: "DPA 2018 Schedule 2 legal professional privilege restriction", decision: "Pending" as Decision, sensitive: true },
  { id: "SUG-004", page: 9, category: "Out of scope", treatment: "Redact", confidence: 71, text: "[record outside requested date range]", reason: "The record appears outside the SAR date range; low-confidence review required.", ground: "Request scope", decision: "Pending" as Decision, sensitive: false },
];

export function RedactionWorkspace({ role }: { role: Role }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [selectedPage, setSelectedPage] = useState(2);
  const canDecide = ["DPO", "MAT administrator", "Case manager"].includes(role);
  const pending = suggestions.filter((item) => item.decision === "Pending" || item.decision === "Escalated").length;
  const pageSuggestions = useMemo(() => suggestions.filter((item) => item.page === selectedPage), [selectedPage, suggestions]);
  const decide = (id: string, decision: Decision) => setSuggestions((items) => items.map((item) => item.id === id ? { ...item, decision } : item));
  return <div className="redaction-shell">
    <section className="panel redaction-head"><div><p className="eyebrow">SAR-2026-0178 · Paula Leigh</p><h2>AI-assisted document review</h2><p>Matter context: pupil records, safeguarding correspondence and internal communications · 1 Sep 2024–30 Jun 2026</p></div><div className="redaction-summary"><span><b>12</b> documents</span><span><b>{suggestions.length}</b> suggestions</span><span className="risk-high"><b>{pending}</b> unresolved</span><button className="primary" disabled={pending > 0 || !canDecide}>Generate disclosure copy</button></div></section>
    <div className="redaction-grid"><aside className="panel document-list" aria-label="SAR documents"><div className="panel-head"><div><p className="eyebrow">Evidence set</p><h2>Documents</h2></div></div>{["Safeguarding chronology.pdf", "Principal correspondence.pdf", "Meeting notes.docx", "Legal advice email.pdf"].map((name, index) => <button key={name} className={index === 0 ? "active" : ""}><span>▣</span><div><strong>{name}</strong><small>{index === 0 ? "12 pages · 4 suggestions" : `${index + 3} pages · ${index} suggestions`}</small></div></button>)}</aside>
      <section className="panel document-preview" aria-label="Document preview"><header><button aria-label="Previous page" onClick={() => setSelectedPage((page) => Math.max(1, page - 1))}>←</button><strong>Page {selectedPage} of 12</strong><button aria-label="Next page" onClick={() => setSelectedPage((page) => Math.min(12, page + 1))}>→</button></header><div className="paper"><p>Safeguarding chronology — contextual extract</p><p>This protected preview represents the document review surface. Original documents remain unchanged in secure storage.</p>{pageSuggestions.map((item) => <mark key={item.id} className={item.sensitive ? "mark-sensitive" : ""}>{item.text}<span>{item.treatment} · {item.confidence}%</span></mark>)}{!pageSuggestions.length && <p className="no-suggestions">No suggestions detected on this page. Human review is still required.</p>}</div></section>
      <aside className="panel suggestion-panel" aria-label="Redaction suggestions"><div className="panel-head"><div><p className="eyebrow">Human decision required</p><h2>Suggestions</h2></div></div>{suggestions.map((item) => <article key={item.id} className={item.decision !== "Pending" ? "decided" : ""}><div className="suggestion-title"><span className={`confidence ${item.confidence < 72 ? "low" : item.sensitive ? "sensitive" : ""}`}>{item.confidence}%</span><div><strong>{item.category}</strong><small>Page {item.page} · {item.treatment}</small></div></div><p>{item.reason}</p><details><summary>Reason and legal ground</summary><small>{item.ground}</small></details><div className="decision-row"><span className="stage">{item.decision}</span>{canDecide && <><button onClick={() => decide(item.id, "Accepted")}>Accept</button><button onClick={() => decide(item.id, "Rejected")}>Reject</button><button onClick={() => decide(item.id, "Escalated")}>Escalate</button></>}</div></article>)}</aside>
    </div><section className="notice redaction-note"><span>Human-controlled review</span> AI suggestions are advisory. Sensitive and low-confidence decisions require escalation or second review; every action is recorded in the disclosure manifest.</section>
  </div>;
}
