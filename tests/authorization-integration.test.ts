import { describe, expect, it } from "vitest";
import { can } from "../src/domain/authorisation";
import type { Capability, Membership, TenantScope } from "../src/domain/model";

const matAdmin: Membership = { userId: "u-mat", matId: "mat-1", academyIds: [], roles: ["mat-admin"] };
const dpo: Membership = { userId: "u-dpo", matId: "mat-1", academyIds: [], roles: ["dpo"] };
const caseManager: Membership = { userId: "u-cm", matId: "mat-1", academyIds: ["a1", "a2"], roles: ["case-manager"] };
const academyLead: Membership = { userId: "u-al", matId: "mat-1", academyIds: ["a1"], roles: ["academy-lead"] };
const contributor: Membership = { userId: "u-ct", matId: "mat-1", academyIds: ["a1"], roles: ["contributor"] };
const auditor: Membership = { userId: "u-au", matId: "mat-1", academyIds: [], roles: ["auditor"] };
const readOnly: Membership = { userId: "u-ro", matId: "mat-1", academyIds: [], roles: ["read-only"] };
const platformAdmin: Membership = { userId: "u-pa", matId: "mat-1", academyIds: [], roles: ["platform-admin"] };

const inScope: TenantScope = { matId: "mat-1" };
const inScopeA1: TenantScope = { matId: "mat-1", academyId: "a1" };
const inScopeA3: TenantScope = { matId: "mat-1", academyId: "a3" };
const crossMat: TenantScope = { matId: "mat-2" };
const crossMatA1: TenantScope = { matId: "mat-2", academyId: "a1" };

const allCapabilities: Capability[] = [
  "matter:create", "matter:read", "matter:update", "matter:approve", "matter:close",
  "document:upload", "audit:read", "report:read", "tenant:admin",
];

describe("MAT isolation", () => {
  it("denies cross-MAT read for every role", () => {
    for (const member of [matAdmin, dpo, caseManager, academyLead, contributor, auditor, readOnly, platformAdmin]) {
      expect(can(member, crossMat, "matter:read"), `${member.roles[0]} should not read cross-MAT`).toBe(false);
    }
  });

  it("denies cross-MAT write for every role", () => {
    for (const member of [matAdmin, dpo, caseManager, academyLead, contributor]) {
      expect(can(member, crossMatA1, "matter:create"), `${member.roles[0]} should not write cross-MAT`).toBe(false);
    }
  });

  it("allows in-scope reads for mat-admin", () => {
    expect(can(matAdmin, inScope, "matter:read")).toBe(true);
    expect(can(matAdmin, inScopeA1, "matter:read")).toBe(true);
  });

  it("allows in-scope reads for dpo", () => {
    expect(can(dpo, inScope, "matter:read")).toBe(true);
    expect(can(dpo, inScopeA1, "matter:read")).toBe(true);
  });
});

describe("Academy-scoped access", () => {
  it("academy lead can read within assigned academy", () => {
    expect(can(academyLead, inScopeA1, "matter:read")).toBe(true);
  });

  it("academy lead cannot read unassigned academy", () => {
    expect(can(academyLead, inScopeA3, "matter:read")).toBe(false);
  });

  it("academy lead can update within assigned academy", () => {
    expect(can(academyLead, inScopeA1, "matter:update")).toBe(true);
  });

  it("academy lead cannot approve matters", () => {
    expect(can(academyLead, inScopeA1, "matter:approve")).toBe(false);
  });

  it("academy lead cannot close matters", () => {
    expect(can(academyLead, inScopeA1, "matter:close")).toBe(false);
  });

  it("mat-admin bypasses academy scoping", () => {
    expect(can(matAdmin, inScopeA3, "matter:read")).toBe(true);
    expect(can(matAdmin, inScopeA3, "matter:update")).toBe(true);
  });

  it("dpo bypasses academy scoping", () => {
    expect(can(dpo, inScopeA3, "matter:read")).toBe(true);
    expect(can(dpo, inScopeA3, "matter:update")).toBe(true);
  });
});

describe("Role-based capability enforcement", () => {
  describe("platform-admin", () => {
    it("has all capabilities", () => {
      for (const cap of allCapabilities) {
        expect(can(platformAdmin, inScope, cap), `platform-admin should have ${cap}`).toBe(true);
      }
    });
  });

  describe("mat-admin", () => {
    it("has all standard capabilities", () => {
      for (const cap of allCapabilities) {
        expect(can(matAdmin, inScope, cap), `mat-admin should have ${cap}`).toBe(true);
      }
    });
  });

  describe("dpo", () => {
    it("can create, read, update, approve, close matters", () => {
      expect(can(dpo, inScope, "matter:create")).toBe(true);
      expect(can(dpo, inScope, "matter:read")).toBe(true);
      expect(can(dpo, inScope, "matter:update")).toBe(true);
      expect(can(dpo, inScope, "matter:approve")).toBe(true);
      expect(can(dpo, inScope, "matter:close")).toBe(true);
    });

    it("can upload documents and read audit/report", () => {
      expect(can(dpo, inScope, "document:upload")).toBe(true);
      expect(can(dpo, inScope, "audit:read")).toBe(true);
      expect(can(dpo, inScope, "report:read")).toBe(true);
    });

    it("cannot administer tenants", () => {
      expect(can(dpo, inScope, "tenant:admin")).toBe(false);
    });
  });

  describe("case-manager", () => {
    it("can create, read, update, close matters", () => {
      expect(can(caseManager, inScope, "matter:create")).toBe(true);
      expect(can(caseManager, inScope, "matter:read")).toBe(true);
      expect(can(caseManager, inScope, "matter:update")).toBe(true);
      expect(can(caseManager, inScope, "matter:close")).toBe(true);
    });

    it("cannot approve matters", () => {
      expect(can(caseManager, inScope, "matter:approve")).toBe(false);
    });

    it("can upload documents and read reports", () => {
      expect(can(caseManager, inScope, "document:upload")).toBe(true);
      expect(can(caseManager, inScope, "report:read")).toBe(true);
    });

    it("cannot read audit trail", () => {
      expect(can(caseManager, inScope, "audit:read")).toBe(false);
    });

    it("cannot administer tenants", () => {
      expect(can(caseManager, inScope, "tenant:admin")).toBe(false);
    });
  });

  describe("academy-lead", () => {
    it("can create, read, update matters", () => {
      expect(can(academyLead, inScopeA1, "matter:create")).toBe(true);
      expect(can(academyLead, inScopeA1, "matter:read")).toBe(true);
      expect(can(academyLead, inScopeA1, "matter:update")).toBe(true);
    });

    it("cannot approve or close matters", () => {
      expect(can(academyLead, inScopeA1, "matter:approve")).toBe(false);
      expect(can(academyLead, inScopeA1, "matter:close")).toBe(false);
    });

    it("can upload documents and read reports", () => {
      expect(can(academyLead, inScopeA1, "document:upload")).toBe(true);
      expect(can(academyLead, inScopeA1, "report:read")).toBe(true);
    });

    it("cannot read audit trail or administer tenants", () => {
      expect(can(academyLead, inScopeA1, "audit:read")).toBe(false);
      expect(can(academyLead, inScopeA1, "tenant:admin")).toBe(false);
    });
  });

  describe("contributor", () => {
    it("can read and update matters", () => {
      expect(can(contributor, inScopeA1, "matter:read")).toBe(true);
      expect(can(contributor, inScopeA1, "matter:update")).toBe(true);
    });

    it("cannot create, approve, or close matters", () => {
      expect(can(contributor, inScopeA1, "matter:create")).toBe(false);
      expect(can(contributor, inScopeA1, "matter:approve")).toBe(false);
      expect(can(contributor, inScopeA1, "matter:close")).toBe(false);
    });

    it("can upload documents", () => {
      expect(can(contributor, inScopeA1, "document:upload")).toBe(true);
    });

    it("cannot read audit, reports, or administer tenants", () => {
      expect(can(contributor, inScopeA1, "audit:read")).toBe(false);
      expect(can(contributor, inScopeA1, "report:read")).toBe(false);
      expect(can(contributor, inScopeA1, "tenant:admin")).toBe(false);
    });
  });

  describe("auditor", () => {
    it("can read matters, audit, and reports", () => {
      expect(can(auditor, inScope, "matter:read")).toBe(true);
      expect(can(auditor, inScope, "audit:read")).toBe(true);
      expect(can(auditor, inScope, "report:read")).toBe(true);
    });

    it("cannot create, update, approve, or close matters", () => {
      expect(can(auditor, inScope, "matter:create")).toBe(false);
      expect(can(auditor, inScope, "matter:update")).toBe(false);
      expect(can(auditor, inScope, "matter:approve")).toBe(false);
      expect(can(auditor, inScope, "matter:close")).toBe(false);
    });

    it("cannot upload documents or administer tenants", () => {
      expect(can(auditor, inScope, "document:upload")).toBe(false);
      expect(can(auditor, inScope, "tenant:admin")).toBe(false);
    });
  });

  describe("read-only", () => {
    it("can only read matters", () => {
      expect(can(readOnly, inScope, "matter:read")).toBe(true);
    });

    it("cannot do anything else", () => {
      expect(can(readOnly, inScope, "matter:create")).toBe(false);
      expect(can(readOnly, inScope, "matter:update")).toBe(false);
      expect(can(readOnly, inScope, "matter:approve")).toBe(false);
      expect(can(readOnly, inScope, "matter:close")).toBe(false);
      expect(can(readOnly, inScope, "document:upload")).toBe(false);
      expect(can(readOnly, inScope, "audit:read")).toBe(false);
      expect(can(readOnly, inScope, "report:read")).toBe(false);
      expect(can(readOnly, inScope, "tenant:admin")).toBe(false);
    });
  });
});

describe("Edge cases", () => {
  it("multi-role member gets union of capabilities", () => {
    const multiRole: Membership = { userId: "u-multi", matId: "mat-1", academyIds: ["a1"], roles: ["academy-lead", "auditor"] };
    expect(can(multiRole, inScopeA1, "matter:approve")).toBe(false);
    expect(can(multiRole, inScopeA1, "audit:read")).toBe(true);
    expect(can(multiRole, inScopeA1, "matter:update")).toBe(true);
  });

  it("empty academyIds on non-admin still denies unscoped academy access", () => {
    const leadNoAcademies: Membership = { userId: "u-lna", matId: "mat-1", academyIds: [], roles: ["academy-lead"] };
    expect(can(leadNoAcademies, inScopeA1, "matter:read")).toBe(false);
  });

  it("contributor with no academy assignment cannot read in-scope academy", () => {
    const ctNoAcademy: Membership = { userId: "u-ctna", matId: "mat-1", academyIds: [], roles: ["contributor"] };
    expect(can(ctNoAcademy, inScopeA1, "matter:read")).toBe(false);
  });
});
