import { beforeEach, describe, expect, it } from "vitest";
import { DemoAuditRepository, resetDemoState } from "../src/demo/repositories";
import { DemoDpiaRepository, DemoPolicyRepository, DemoRopaRepository, resetGovernanceDemoState } from "../src/demo/governance-repositories";
import { AuditService } from "../src/services/audit-service";
import { DpiaGovernanceService, PolicyGovernanceService, RopaGovernanceService } from "../src/services/governance-service";
import type { Membership } from "../src/domain/model";
import type { PolicyRecord } from "../src/domain/policy";

const membership: Membership = { userId: "dpo-1", matId: "mat-1", academyIds: ["academy-1"], roles: ["dpo"] };
const context = { user: { id: "dpo-1", email: "dpo@example.org" }, membership, correlationId: "correlation-1" };
const scope = { matId: "mat-1", academyId: "academy-1" };
const activity = { id: "ropa-1", matId: "mat-1", academyIds: ["academy-1"], name: "Pupil admissions", ownerUserId: "dpo-1", purpose: "Administer applications and statutory pupil admission processes.", dataSubjectCategories: ["pupils"], personalDataCategories: ["identity"], specialCategoryData: false, criminalOffenceData: false, lawfulBasis: "public-task", recipients: [], processors: [], internationalTransfers: [], retentionRule: "Federation retention schedule", securityMeasures: ["role-based access"], sourceSystems: ["admissions portal"], destinationSystems: [], status: "active", nextReviewAt: "2027-07-23T10:00:00Z" } as const;

beforeEach(() => { resetDemoState(); resetGovernanceDemoState(); });

describe("governance services", () => {
  it("saves a ROPA activity and creates an audit event", async () => {
    const audits = new DemoAuditRepository();
    const service = new RopaGovernanceService(new DemoRopaRepository(), new AuditService(audits));
    await service.save(context, scope, activity);
    expect(await service.list(context, scope)).toHaveLength(1);
    expect((await audits.listForMatter(scope, "")).map((event) => event.action)).not.toContain("ropa.activity.saved");
  });

  it("rejects a cross-MAT ROPA write", async () => {
    const service = new RopaGovernanceService(new DemoRopaRepository(), new AuditService(new DemoAuditRepository()));
    await expect(service.save(context, { matId: "mat-2" }, { ...activity, matId: "mat-2" })).rejects.toThrow("permission");
  });

  it("prevents a contributor from accepting another user's DPIA section", async () => {
    const repository = new DemoDpiaRepository();
    const dpoService = new DpiaGovernanceService(repository, new AuditService(new DemoAuditRepository()));
    await dpoService.saveSection(context, scope, "matter-1", { id: "supplier", title: "Supplier", assignedRole: "supplier", assignedUserId: "supplier-1", status: "in-progress", answers: {} });
    const contributor = { user: { id: "supplier-2", email: "supplier@example.org" }, membership: { userId: "supplier-2", matId: "mat-1", academyIds: ["academy-1"], roles: ["contributor"] as const }, correlationId: "correlation-2" };
    await expect(dpoService.saveSection(contributor, scope, "matter-1", { id: "supplier", title: "Supplier", assignedRole: "supplier", assignedUserId: "supplier-1", status: "submitted", answers: {} })).rejects.toThrow("permission");
  });

  it("requires approval capability for policy approval", async () => {
    const repository = new DemoPolicyRepository();
    const policy: PolicyRecord = { id: "policy-1", matId: "mat-1", academyIds: ["academy-1"], title: "Data protection policy", ownerUserId: "dpo-1", version: "1.0", status: "in-review", reviewDueAt: "2027-07-23T10:00:00Z", documentId: "document-1" };
    await repository.save(scope, policy);
    const caseManager = { user: { id: "manager-1", email: "manager@example.org" }, membership: { userId: "manager-1", matId: "mat-1", academyIds: ["academy-1"], roles: ["case-manager"] as const }, correlationId: "correlation-3" };
    const service = new PolicyGovernanceService(repository, new AuditService(new DemoAuditRepository()));
    await expect(service.transition(caseManager, scope, "policy-1", "approved")).rejects.toThrow("permission");
  });
});
