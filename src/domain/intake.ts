import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });
const nonEmptyList = z.array(z.string().trim().min(1)).min(1);

const common = z.object({
  matId: z.string().trim().min(1),
  academyId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(3).max(512),
  receivedAt: isoDateTime,
  receivedChannel: z.enum(["email", "portal", "post", "telephone", "in-person", "internal"]),
  description: z.string().trim().min(10).max(20_000),
  ownerUserId: z.string().trim().min(1),
});

export const sarIntakeSchema = common.extend({
  type: z.literal("sar"),
  requesterName: z.string().trim().min(2).max(256),
  requesterEmail: z.string().email().optional(),
  requesterPostalAddress: z.string().trim().min(5).max(2_000).optional(),
  requestScope: z.string().trim().min(10).max(20_000),
  identityStatus: z.enum(["not-required", "required", "requested", "verified"]),
  representative: z.object({ name: z.string().trim().min(2), authorityReceived: z.boolean() }).optional(),
  dataSubjectCategory: z.enum(["pupil", "parent-carer", "employee", "former-employee", "applicant", "supplier", "other"]),
}).superRefine((value, context) => {
  if (!value.requesterEmail && !value.requesterPostalAddress) context.addIssue({ code: "custom", path: ["requesterEmail"], message: "An email or postal response address is required" });
  if (value.representative && !value.representative.authorityReceived) context.addIssue({ code: "custom", path: ["representative", "authorityReceived"], message: "Authority must be received before disclosing to a representative" });
});

export const foiIntakeSchema = common.extend({
  type: z.literal("foi"),
  requesterName: z.string().trim().min(2).max(256),
  contactAddress: z.string().trim().min(5).max(2_000),
  requestText: z.string().trim().min(10).max(20_000),
  isWrittenRequest: z.boolean(),
  providesRealName: z.boolean(),
  sufficientlyDescribed: z.boolean(),
  environmentalInformation: z.boolean().default(false),
}).superRefine((value, context) => {
  if (!value.isWrittenRequest) context.addIssue({ code: "custom", path: ["isWrittenRequest"], message: "A FOI request must be recorded in writing" });
  if (!value.providesRealName) context.addIssue({ code: "custom", path: ["providesRealName"], message: "A valid FOI request must provide the requester's real name" });
});

export const breachIntakeSchema = common.extend({
  type: z.literal("breach"),
  detectedAt: isoDateTime,
  occurredAt: isoDateTime.optional(),
  reporterName: z.string().trim().min(2).max(256),
  incidentLocation: z.string().trim().min(2).max(512),
  dataCategories: nonEmptyList,
  dataSubjectCategories: nonEmptyList,
  approximateDataSubjectCount: z.number().int().nonnegative().optional(),
  specialCategoryData: z.boolean(),
  criminalOffenceData: z.boolean(),
  containmentActions: z.string().trim().min(3).max(10_000),
  ongoing: z.boolean(),
}).superRefine((value, context) => {
  if (value.occurredAt && new Date(value.occurredAt) > new Date(value.detectedAt)) context.addIssue({ code: "custom", path: ["occurredAt"], message: "Occurrence cannot be later than detection" });
});

export type SarIntake = z.infer<typeof sarIntakeSchema>;
export type FoiIntake = z.infer<typeof foiIntakeSchema>;
export type BreachIntake = z.infer<typeof breachIntakeSchema>;
export type RegulatoryIntake = SarIntake | FoiIntake | BreachIntake;

export function validateRegulatoryIntake(input: unknown): RegulatoryIntake {
  const type = z.object({ type: z.enum(["sar", "foi", "breach"]) }).parse(input).type;
  if (type === "sar") return sarIntakeSchema.parse(input);
  if (type === "foi") return foiIntakeSchema.parse(input);
  return breachIntakeSchema.parse(input);
}
