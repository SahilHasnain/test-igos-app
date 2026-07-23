import { describe, expect, it } from "vitest";
import { can } from "../src/domain/authorisation";
import type { Membership } from "../src/domain/model";

const member: Membership = { userId:"u1", matId:"mat-a", academyIds:["academy-1"], roles:["academy-lead"] };

describe("tenant authorisation", () => {
  it("denies cross-MAT access", () => expect(can(member,{matId:"mat-b",academyId:"academy-1"},"matter:read")).toBe(false));
  it("denies access to another academy", () => expect(can(member,{matId:"mat-a",academyId:"academy-2"},"matter:read")).toBe(false));
  it("allows an academy lead within scope", () => expect(can(member,{matId:"mat-a",academyId:"academy-1"},"matter:update")).toBe(true));
  it("does not give academy leads approval rights", () => expect(can(member,{matId:"mat-a",academyId:"academy-1"},"matter:approve")).toBe(false));
});
