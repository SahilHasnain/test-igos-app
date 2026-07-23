import { DemoAuditRepository } from "@/src/demo/repositories";
import { DemoDpiaRepository, DemoPolicyRepository, DemoRopaRepository } from "@/src/demo/governance-repositories";
import { AuditService } from "./audit-service";
import { DpiaGovernanceService, PolicyGovernanceService, RopaGovernanceService } from "./governance-service";
import { dataMode } from "./runtime";

const audit = new AuditService(new DemoAuditRepository());
const dpia = new DpiaGovernanceService(new DemoDpiaRepository(), audit);
const ropa = new RopaGovernanceService(new DemoRopaRepository(), audit);
const policy = new PolicyGovernanceService(new DemoPolicyRepository(), audit);

function ensureSupported() {
  if (dataMode() !== "demo") throw new Error("Stage 2 Appwrite repositories must be configured before persistent governance mode is enabled");
}

export function governanceRuntime() {
  ensureSupported();
  return { dpia, ropa, policy };
}
