import { describe, expect, it } from "vitest";
import { academyRopa, article30Readiness, processingActivitySchema } from "../src/domain/ropa";

const activity = { id: "ropa-1", matId: "mat-1", academyIds: ["academy-1"], name: "Pupil admissions", ownerUserId: "owner-1", purpose: "Administer pupil applications, offers and statutory admissions processes.", dataSubjectCategories: ["pupils", "parents and carers"], personalDataCategories: ["identity", "contact", "education history"], specialCategoryData: false, criminalOffenceData: false, lawfulBasis: "public-task", recipients: ["local authority"], processors: ["admissions platform"], internationalTransfers: [], retentionRule: "Retain in accordance with the Federation records retention schedule.", securityMeasures: ["role-based access", "encryption"], sourceSystems: ["admissions portal"], destinationSystems: ["management information system"], status: "active", nextReviewAt: "2027-07-23T10:00:00Z" } as const;

describe("ROPA governance", () => {
  it("accepts an Article 30-complete processing activity", () => expect(processingActivitySchema.parse(activity).name).toBe("Pupil admissions"));
  it("requires an Article 9 condition for special-category processing", () => expect(article30Readiness({ ...activity, specialCategoryData: true }).issues.join(" ")).toContain("Article 9"));
  it("requires a transfer risk assessment for international transfers", () => expect(article30Readiness({ ...activity, internationalTransfers: [{ destination: "United States", mechanism: "UK IDTA" }] }).issues.join(" ")).toContain("transfer risk assessment"));
  it("creates an academy-specific ROPA without retired activities", () => { const parsed = processingActivitySchema.parse(activity); expect(academyRopa([parsed, { ...parsed, id: "ropa-2", status: "retired" }], "mat-1", "academy-1")).toHaveLength(1); });
});
