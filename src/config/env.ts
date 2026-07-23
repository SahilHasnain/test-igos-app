import { z } from "zod";
const publicSchema=z.object({NEXT_PUBLIC_APPWRITE_ENDPOINT:z.string().url(),NEXT_PUBLIC_APPWRITE_PROJECT_ID:z.string().min(1)});
const serverSchema=publicSchema.extend({
 APPWRITE_API_KEY:z.string().min(20),APPWRITE_DATABASE_ID:z.string().min(1),APPWRITE_CASES_TABLE_ID:z.string().min(1),APPWRITE_AUDIT_TABLE_ID:z.string().min(1),APPWRITE_MEMBERSHIPS_TABLE_ID:z.string().min(1),APPWRITE_DOCUMENTS_TABLE_ID:z.string().min(1),APPWRITE_DOCUMENTS_BUCKET_ID:z.string().min(1),
 IGOS_BASE_URL:z.string().url(),IGOS_DATA_MODE:z.enum(["demo","appwrite"]).default("demo"),
 INTEGRATION_MICROSOFT_365_ENABLED:z.enum(["true","false"]).default("false"),INTEGRATION_GOOGLE_WORKSPACE_ENABLED:z.enum(["true","false"]).default("false")
});
export const readPublicEnvironment=()=>publicSchema.parse(process.env);
export const readServerEnvironment=()=>serverSchema.parse(process.env);
