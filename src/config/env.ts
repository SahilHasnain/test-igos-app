import { z } from "zod";
const publicSchema=z.object({NEXT_PUBLIC_APPWRITE_ENDPOINT:z.string().url(),NEXT_PUBLIC_APPWRITE_PROJECT_ID:z.string().min(1)});
const serverSchema=publicSchema.extend({
 APPWRITE_API_KEY:z.string().min(20),APPWRITE_DATABASE_ID:z.string().min(1),
 APPWRITE_CASES_TABLE_ID:z.string().min(1),APPWRITE_AUDIT_TABLE_ID:z.string().min(1),APPWRITE_MEMBERSHIPS_TABLE_ID:z.string().min(1),APPWRITE_DOCUMENTS_TABLE_ID:z.string().min(1),APPWRITE_DOCUMENTS_BUCKET_ID:z.string().min(1),
 APPWRITE_WORKFLOWS_TABLE_ID:z.string().min(1),APPWRITE_DEADLINE_ADJUSTMENTS_TABLE_ID:z.string().min(1),APPWRITE_NOTIFICATION_RECEIPTS_TABLE_ID:z.string().min(1),
 APPWRITE_DPIA_SECTIONS_TABLE_ID:z.string().min(1),APPWRITE_DPIA_RISKS_TABLE_ID:z.string().min(1),APPWRITE_PROCESSING_ACTIVITIES_TABLE_ID:z.string().min(1),APPWRITE_POLICIES_TABLE_ID:z.string().min(1),APPWRITE_POLICY_ACKNOWLEDGEMENTS_TABLE_ID:z.string().min(1),APPWRITE_POLICY_EXCEPTIONS_TABLE_ID:z.string().min(1),
 APPWRITE_SUPPLIER_ASSESSMENTS_TABLE_ID:z.string().min(1),APPWRITE_TRANSFER_ASSESSMENTS_TABLE_ID:z.string().min(1),
 APPWRITE_ASSURANCE_ACTIONS_TABLE_ID:z.string().min(1),APPWRITE_AUDIT_PROGRAMMES_TABLE_ID:z.string().min(1),APPWRITE_AUDIT_FINDINGS_TABLE_ID:z.string().min(1),APPWRITE_ASSURANCE_RISKS_TABLE_ID:z.string().min(1),APPWRITE_EVIDENCE_PACKS_TABLE_ID:z.string().min(1),
 APPWRITE_REDACTION_ANALYSIS_TABLE_ID:z.string().min(1),APPWRITE_REDACTION_SUGGESTIONS_TABLE_ID:z.string().min(1),APPWRITE_SECOND_REVIEWS_TABLE_ID:z.string().min(1),APPWRITE_REDACTION_MANIFESTS_TABLE_ID:z.string().min(1),
 APPWRITE_AI_SYSTEMS_TABLE_ID:z.string().min(1),APPWRITE_INFORMATION_ASSETS_TABLE_ID:z.string().min(1),APPWRITE_RETENTION_RULES_TABLE_ID:z.string().min(1),APPWRITE_RECORD_INSTANCES_TABLE_ID:z.string().min(1),APPWRITE_RECORDS_HOLDS_TABLE_ID:z.string().min(1),APPWRITE_CONTRACT_GOVERNANCE_TABLE_ID:z.string().min(1),
 IGOS_BASE_URL:z.string().url(),IGOS_DATA_MODE:z.enum(["demo","appwrite"]).default("demo"),
 INTEGRATION_MICROSOFT_365_ENABLED:z.enum(["true","false"]).default("false"),INTEGRATION_GOOGLE_WORKSPACE_ENABLED:z.enum(["true","false"]).default("false")
});
export const readPublicEnvironment=()=>publicSchema.parse(process.env);
export const readServerEnvironment=()=>serverSchema.parse(process.env);
