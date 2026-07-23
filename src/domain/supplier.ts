import { z } from "zod";

export const supplierAssessmentSchema = z.object({
  id: z.string().min(1),
  matId: z.string().min(1),
  supplierName: z.string().trim().min(2).max(512),
  serviceDescription: z.string().trim().min(10).max(10_000),
  relationship: z.enum(["processor", "joint-controller", "independent-controller", "subprocessor"]),
  ownerUserId: z.string().min(1),
  securityQuestionnaireStatus: z.enum(["not-issued", "issued", "submitted", "accepted", "changes-required"]),
  contractStatus: z.enum(["not-started", "under-review", "approved", "expired"]),
  dataProtectionTermsConfirmed: z.boolean(),
  breachNotificationHours: z.number().int().positive().max(72).optional(),
  subprocessors: z.array(z.string().trim().min(1)),
  certifications: z.array(z.string().trim().min(1)),
  internationalTransfers: z.boolean(),
  transferAssessmentId: z.string().optional(),
  riskRating: z.enum(["low", "medium", "high", "critical"]),
  residualRisksAcceptedByUserId: z.string().optional(),
  residualRiskRationale: z.string().trim().min(10).optional(),
  reviewDueAt: z.string().datetime({ offset: true }),
  status: z.enum(["draft", "in-review", "approved", "suspended", "offboarded"]),
}).superRefine((value, context) => {
  if (value.internationalTransfers && !value.transferAssessmentId) context.addIssue({ code: "custom", path: ["transferAssessmentId"], message: "International transfers require a linked transfer assessment" });
  if ((value.riskRating === "high" || value.riskRating === "critical") && (!value.residualRisksAcceptedByUserId || !value.residualRiskRationale)) context.addIssue({ code: "custom", path: ["residualRisksAcceptedByUserId"], message: "High supplier risk requires explicit acceptance and rationale" });
  if (value.status === "approved" && (!value.dataProtectionTermsConfirmed || value.contractStatus !== "approved" || value.securityQuestionnaireStatus !== "accepted")) context.addIssue({ code: "custom", path: ["status"], message: "Supplier approval requires accepted security, contract and data-protection checks" });
});

export const transferAssessmentSchema = z.object({
  id: z.string().min(1),
  matId: z.string().min(1),
  supplierId: z.string().min(1),
  destinationCountries: z.array(z.string().min(2)).min(1),
  transferMechanism: z.enum(["adequacy", "uk-idta", "uk-addendum", "binding-corporate-rules", "derogation"]),
  dataCategories: z.array(z.string().min(1)).min(1),
  supplementaryMeasures: z.array(z.string().min(1)),
  localLawAssessment: z.string().trim().min(10).max(20_000),
  residualRisk: z.enum(["low", "medium", "high", "critical"]),
  approvedByUserId: z.string().optional(),
  approvalRationale: z.string().trim().min(10).optional(),
  reviewDueAt: z.string().datetime({ offset: true }),
}).superRefine((value, context) => {
  if ((value.residualRisk === "high" || value.residualRisk === "critical") && (!value.approvedByUserId || !value.approvalRationale)) context.addIssue({ code: "custom", path: ["approvedByUserId"], message: "High transfer risk requires explicit DPO approval and rationale" });
  if (value.transferMechanism !== "adequacy" && !value.supplementaryMeasures.length) context.addIssue({ code: "custom", path: ["supplementaryMeasures"], message: "Restricted transfers require documented supplementary measures" });
});

export type SupplierAssessment = z.infer<typeof supplierAssessmentSchema>;
export type TransferAssessment = z.infer<typeof transferAssessmentSchema>;
