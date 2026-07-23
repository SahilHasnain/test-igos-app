import { describe, expect, it } from "vitest";
import { validateRegulatoryIntake } from "../src/domain/intake";

const common = { matId: "mat-1", academyId: "academy-1", title: "New regulatory matter", receivedAt: "2026-07-23T10:00:00Z", receivedChannel: "email", description: "A sufficiently detailed description of the new regulatory matter.", ownerUserId: "user-1" } as const;

describe("regulatory intake", () => {
  it("accepts a complete SAR intake", () => {
    const result = validateRegulatoryIntake({ ...common, type: "sar", requesterName: "Alex Morgan", requesterEmail: "alex@example.org", requestScope: "All education and safeguarding records for the current academic year.", identityStatus: "verified", dataSubjectCategory: "pupil" });
    expect(result.type).toBe("sar");
  });

  it("requires a SAR response address", () => {
    expect(() => validateRegulatoryIntake({ ...common, type: "sar", requesterName: "Alex Morgan", requestScope: "All education and safeguarding records for the current academic year.", identityStatus: "verified", dataSubjectCategory: "pupil" })).toThrow();
  });

  it("rejects a purported FOI request without a real name", () => {
    expect(() => validateRegulatoryIntake({ ...common, type: "foi", requesterName: "Anonymous", contactAddress: "requester@example.org", requestText: "Please provide expenditure records for the last financial year.", isWrittenRequest: true, providesRealName: false, sufficientlyDescribed: true, environmentalInformation: false })).toThrow("real name");
  });

  it("accepts an EIR-triaged written information request", () => {
    const result = validateRegulatoryIntake({ ...common, type: "foi", requesterName: "Taylor Jones", contactAddress: "taylor@example.org", requestText: "Please provide the academy energy consumption figures for 2025/26.", isWrittenRequest: true, providesRealName: true, sufficientlyDescribed: true, environmentalInformation: true });
    expect(result.type === "foi" && result.environmentalInformation).toBe(true);
  });

  it("rejects a breach occurrence timestamp later than detection", () => {
    expect(() => validateRegulatoryIntake({ ...common, type: "breach", detectedAt: "2026-07-23T10:00:00Z", occurredAt: "2026-07-23T11:00:00Z", reporterName: "Jamie Patel", incidentLocation: "Riverside reception", dataCategories: ["pupil contact data"], dataSubjectCategories: ["pupils"], specialCategoryData: false, criminalOffenceData: false, containmentActions: "Distribution stopped", ongoing: false })).toThrow("Occurrence cannot be later than detection");
  });
});
