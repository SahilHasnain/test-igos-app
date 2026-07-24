# AI-assisted document review and redaction

## Purpose

The module assists authorised reviewers by identifying passages that may require disclosure, redaction, document withholding or escalation. It uses the SAR or FOI matter context, including scope, date range, requester relationship, named data subjects and safeguarding/privilege indicators.

AI output is advisory. IGOS never treats a model suggestion as the final legal decision.

## Review categories

- third-party personal data;
- information outside the request scope;
- potential legal professional privilege;
- safeguarding-sensitive information;
- child and family information;
- confidential references;
- direct identifiers;
- duplicate records;
- FOI exemption candidates.

SAR restrictions and FOI exemptions must remain separately configured and explained. A suggestion from one regime must not be reused as the legal conclusion for another.

## Mandatory controls

- an analysis provider must be explicitly approved for the MAT;
- the provider contract/capability record must prohibit training on customer data;
- processing location and retention behaviour must be recorded;
- original documents remain immutable and protected;
- analysis uses a specific document version and input checksum;
- disclosure copies are stored as separate documents;
- every suggestion records location, category, confidence, explanation and excerpt hash;
- every human decision records reviewer, time, rationale and final treatment;
- low-confidence, safeguarding, privilege and whole-document withholding suggestions are escalated;
- safeguarding, child/family and privilege decisions require second review;
- disclosure is blocked while suggestions are pending or escalated;
- the final manifest records every applied treatment and both document checksums;
- all activity is tenant and academy scoped and written to the audit trail.

## Data minimisation

Send only the document chunks and matter context required for the review. Avoid unnecessary case history, identity evidence and unrelated special-category data. Provider prompts and diagnostic logs must not contain full documents.

The demo adapter is local and deterministic. It is not a production AI service and is designed only to exercise the review workflow safely.

## Human review workflow

1. Verify the SAR/FOI scope and document set.
2. OCR and checksum the immutable source version.
3. Run analysis using an approved provider.
4. Review each suggestion in its surrounding context.
5. Accept, reject, modify or escalate with a recorded rationale.
6. Obtain second review where required.
7. Generate a separate redacted disclosure copy.
8. Compare the disclosure copy against the manifest and original.
9. Complete quality-assurance sampling and response approval.
10. Release only the approved disclosure bundle.

## Production acceptance

Before live use, complete a DPIA for the AI capability, security and model-risk review, documented accuracy testing across representative MAT documents, bias and false-positive/negative assessment, prompt-injection testing, supplier due diligence, retention confirmation and DPO approval.

Automated disclosure or irreversible redaction is prohibited.
