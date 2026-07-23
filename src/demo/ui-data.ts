export type MatterType = "SAR" | "FOI" | "Breach" | "DPIA";
export type MatterRisk = "Low" | "Medium" | "High";

export type DemoMatter = {
  id: string;
  type: MatterType;
  title: string;
  academy: string;
  owner: string;
  stage: string;
  due: string;
  risk: MatterRisk;
  progress: number;
  summary: string;
  tasks: string[];
  activity: string[];
};

export const academies = [
  "Federation-wide",
  "Riverside Academy",
  "Hillcrest Academy",
  "Greenfield Academy",
  "Lakeside Academy",
  "Meadow Academy",
];

export const workflowStages: Record<MatterType, string[]> = {
  SAR: ["Intake", "Identity verification", "Scope confirmation", "Evidence gathering", "Redaction", "Exemption review", "Approval", "Disclosure", "Closed"],
  FOI: ["Intake", "Validity check", "Information gathering", "Exemption review", "Public-interest test", "Approval", "Response issued", "Internal review", "Closed"],
  Breach: ["Reported", "Containment", "Risk assessment", "Notification decision", "Investigation", "Corrective actions", "Lessons learned", "Closed"],
  DPIA: ["Requested", "Screening", "Description", "Necessity & proportionality", "Risk assessment", "Mitigation", "Consultation", "Approval", "Monitoring", "Closed"],
};

export const initialMatters: DemoMatter[] = [
  { id: "SAR-2026-0178", type: "SAR", title: "Paula Leigh – pupil records", academy: "Riverside Academy", owner: "Amara Lewis", stage: "Redaction", due: "22 Jul 2026", risk: "High", progress: 56, summary: "Request for education, safeguarding and correspondence records. Identity has been verified and 128 documents are under review.", tasks: ["Complete contextual redaction review", "Record exemptions considered", "Prepare DPO approval pack"], activity: ["Documents assigned to reviewer", "Identity evidence verified", "Request acknowledged"] },
  { id: "FOI-2026-0109", type: "FOI", title: "Executive remuneration", academy: "Hillcrest Academy", owner: "Daniel Okoro", stage: "Public-interest test", due: "24 Jul 2026", risk: "High", progress: 61, summary: "Request for senior remuneration bands, consultancy spend and related approval records.", tasks: ["Complete public-interest test", "Confirm Finance figures", "Submit draft response for approval"], activity: ["Section 43 consideration added", "Finance evidence received", "Request validated"] },
  { id: "BR-2026-0012", type: "Breach", title: "Misdirected pupil letters", academy: "Hillcrest Academy", owner: "Sophie Chen", stage: "Notification decision", due: "23 Jul 2026", risk: "High", progress: 45, summary: "Twelve pupil letters were inserted into incorrect envelopes. Distribution was stopped and affected families are being confirmed.", tasks: ["Finalise risk assessment", "Record ICO notification decision", "Approve family communication"], activity: ["Containment confirmed", "DPO triage completed", "Incident reported"] },
  { id: "SAR-2026-0183", type: "SAR", title: "Safeguarding records request", academy: "Greenfield Academy", owner: "Amara Lewis", stage: "Evidence gathering", due: "4 Aug 2026", risk: "Medium", progress: 38, summary: "Parent request covering safeguarding notes and communications for the last academic year.", tasks: ["Collect pastoral mailbox evidence", "Confirm third-party data scope"], activity: ["Safeguarding lead assigned", "Identity verified"] },
  { id: "FOI-2026-0112", type: "FOI", title: "Supplier payment performance", academy: "Lakeside Academy", owner: "Daniel Okoro", stage: "Information gathering", due: "7 Aug 2026", risk: "Medium", progress: 32, summary: "Request for payment performance statistics and late-payment interest for 2024/25.", tasks: ["Receive accounts-payable extract", "Quality-check totals"], activity: ["Finance task issued", "Request acknowledged"] },
  { id: "DPIA-2026-0041", type: "DPIA", title: "AI safeguarding triage", academy: "Riverside Academy", owner: "Priya Shah", stage: "Risk assessment", due: "12 Aug 2026", risk: "High", progress: 48, summary: "Assessment of an AI-assisted safeguarding triage service before a controlled pilot.", tasks: ["Supplier to complete security section", "Assess automated decision-making", "Document human oversight controls"], activity: ["Supplier access granted", "Screening outcome: full DPIA required"] },
  { id: "BR-2026-0014", type: "Breach", title: "Email sent to wrong recipient", academy: "Meadow Academy", owner: "Sophie Chen", stage: "Corrective actions", due: "30 Jul 2026", risk: "Low", progress: 76, summary: "A routine attendance email containing limited personal data was sent to the wrong parent and deleted on request.", tasks: ["Complete staff coaching action", "Record lessons learned"], activity: ["No-notification rationale approved", "Recipient confirmed deletion"] },
];
