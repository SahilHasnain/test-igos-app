import { readServerEnvironment } from "@/src/config/env";
import { createAppwriteAdmin } from "./server";
import { AppwriteMatterRepository } from "./matter-repository";
import { AppwriteAuditRepository } from "./audit-repository";
import { AuditService } from "@/src/services/audit-service";
import { MatterService } from "@/src/services/matter-service";

export function createMatterService() {
  const env = readServerEnvironment();
  const admin = createAppwriteAdmin();
  const matters = new AppwriteMatterRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_CASES_TABLE_ID);
  const auditRepository = new AppwriteAuditRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_AUDIT_TABLE_ID);
  return new MatterService(matters, new AuditService(auditRepository));
}
