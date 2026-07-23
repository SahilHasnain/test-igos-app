# Stage 2 — governance framework

## Scope

This stacked branch extends Stage 1 with the domain and persistence foundation for DPIAs, ROPA and policy management. It does not require Microsoft 365.

## DPIA

- configurable multi-party sections for requester, supplier, compliance and DPO contributors;
- section assignment, submission, acceptance and changes-requested states;
- high-risk screening for vulnerable people, innovative technology, AI, automated decisions, monitoring and transfers;
- inherent and residual risk scoring;
- mandatory explicit DPO acceptance and rationale for high or critical residual risk;
- approval blocked until every section is accepted and risks are recorded;
- standard sections covering processing, supplier assurance, proportionality, transfers, AI, mitigations and approval.

## ROPA

- Federation and academy-scoped processing activities;
- purposes, people, data categories, lawful basis and Article 9 conditions;
- processors, recipients, sources, destinations and security measures;
- retention rules and review dates;
- international transfers linked to transfer-risk assessments;
- Article 30 completeness reporting;
- academy-specific ROPA generation excluding retired activities.

## Policy management

- controlled draft, review, approval, publication and retirement lifecycle;
- version and document linkage;
- recorded approval and publication history;
- user acknowledgement assignment, due dates and overdue status;
- time-limited exceptions with rationale and compensating controls.

## Appwrite schema

`infra/appwrite/schema.json` version 3 adds:

- `dpia-sections`;
- `dpia-risks`;
- `processing-activities`;
- `policies`;
- `policy-acknowledgements`;
- `policy-exceptions`.

The Dev must provision these only after the Stage 1 version 2 resources are in place. Environment identifiers and credentials must remain outside source control.

## Next implementation slice

The next slice should add tenant-scoped repositories and APIs for the new records, followed by operational DPIA, ROPA and policy screens. Server-side services must derive roles and academy access from authenticated membership; browser-supplied roles are never authoritative.

## Acceptance conditions

- a supplier can access only assigned DPIA sections and cannot see unrelated MAT data;
- the DPO can return a submitted section with recorded reasons;
- high residual risk cannot be silently approved;
- special-category processing cannot become active without an Article 9 condition;
- transfers cannot become active without a linked assessment;
- academy ROPAs contain only applicable active records;
- policies cannot publish without recorded approval;
- acknowledgements remain tied to the exact policy version;
- expired policy exceptions appear as overdue actions;
- every approval, return, acceptance, publication and exception decision creates an audit event.
