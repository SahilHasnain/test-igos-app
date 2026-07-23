import { describe, expect, it } from "vitest";
import { supplierAssessmentSchema, transferAssessmentSchema } from "../src/domain/supplier";

const supplier = { id: "supplier-1", matId: "mat-1", supplierName: "Example Education Systems", serviceDescription: "Cloud-hosted safeguarding case management for Federation academies.", relationship: "processor", ownerUserId: "owner-1", securityQuestionnaireStatus: "accepted", contractStatus: "approved", dataProtectionTermsConfirmed: true, breachNotificationHours: 24, subprocessors: [], certifications: ["ISO 27001"], internationalTransfers: false, riskRating: "medium", reviewDueAt: "2027-07-23T10:00:00Z", status: "approved" } as const;

describe("supplier assurance", () => {
  it("accepts a fully assured supplier", () => expect(supplierAssessmentSchema.parse(supplier).status).toBe("approved"));
  it("blocks supplier approval before security review is accepted", () => expect(() => supplierAssessmentSchema.parse({ ...supplier, securityQuestionnaireStatus: "submitted" })).toThrow("Supplier approval requires"));
  it("requires a transfer assessment when international transfers occur", () => expect(() => supplierAssessmentSchema.parse({ ...supplier, internationalTransfers: true })).toThrow("linked transfer assessment"));
  it("requires supplementary measures for a UK IDTA transfer", () => expect(() => transferAssessmentSchema.parse({ id: "transfer-1", matId: "mat-1", supplierId: "supplier-1", destinationCountries: ["United States"], transferMechanism: "uk-idta", dataCategories: ["pupil data"], supplementaryMeasures: [], localLawAssessment: "The assessment identifies access risks in the destination jurisdiction.", residualRisk: "medium", reviewDueAt: "2027-07-23T10:00:00Z" })).toThrow("supplementary measures"));
});
