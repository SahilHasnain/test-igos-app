import { z } from "zod";

export const lawfulBases = ["consent", "contract", "legal-obligation", "vital-interests", "public-task", "legitimate-interests"] as const;
export const specialCategoryConditions = ["explicit-consent", "employment-social-protection", "vital-interests", "not-for-profit", "made-public", "legal-claims", "substantial-public-interest", "health-social-care", "public-health", "research-statistics"] as const;

export const processingActivitySchema = z.object({
  id: z.string().min(1),
  matId: z.string().min(1),
  academyIds: z.array(z.string().min(1)).min(1),
  name: z.string().trim().min(3).max(512),
  ownerUserId: z.string().min(1),
  purpose: z.string().trim().min(10).max(10_000),
  dataSubjectCategories: z.array(z.string().trim().min(1)).min(1),
  personalDataCategories: z.array(z.string().trim().min(1)).min(1),
  specialCategoryData: z.boolean(),
  criminalOffenceData: z.boolean(),
  lawfulBasis: z.enum(lawfulBases),
  specialCategoryCondition: z.enum(specialCategoryConditions).optional(),
  recipients: z.array(z.string().trim().min(1)),
  processors: z.array(z.string().trim().min(1)),
  internationalTransfers: z.array(z.object({ destination: z.string().min(2), mechanism: z.string().min(2), transferRiskAssessmentId: z.string().optional() })),
  retentionRule: z.string().trim().min(3).max(2_000),
  securityMeasures: z.array(z.string().trim().min(1)).min(1),
  sourceSystems: z.array(z.string().trim().min(1)).min(1),
  destinationSystems: z.array(z.string().trim().min(1)),
  status: z.enum(["draft", "active", "under-review", "retired"]),
  lastReviewedAt: z.string().datetime({ offset: true }).optional(),
  nextReviewAt: z.string().datetime({ offset: true }),
}).superRefine((value, context) => {
  if (value.specialCategoryData && !value.specialCategoryCondition) context.addIssue({ code: "custom", path: ["specialCategoryCondition"], message: "Special-category processing requires an Article 9 condition" });
  value.internationalTransfers.forEach((transfer, index) => {
    if (!transfer.transferRiskAssessmentId) context.addIssue({ code: "custom", path: ["internationalTransfers", index, "transferRiskAssessmentId"], message: "An international transfer requires a linked transfer risk assessment" });
  });
});

export type ProcessingActivity = z.infer<typeof processingActivitySchema>;

export function article30Readiness(input: unknown) {
  const result = processingActivitySchema.safeParse(input);
  if (result.success) return { complete: true, issues: [] as string[] };
  return { complete: false, issues: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
}

export function academyRopa(activities: readonly ProcessingActivity[], matId: string, academyId: string) {
  return activities.filter((activity) => activity.matId === matId && activity.academyIds.includes(academyId) && activity.status !== "retired");
}
