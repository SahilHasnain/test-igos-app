import type { Capability, MatterType, TenantScope } from "./model";

export const workflowStages = {
  sar: ["intake","identity-verification","scope-confirmation","evidence-gathering","redaction","exemption-review","approval","disclosure","closed"],
  foi: ["intake","validity-check","information-gathering","exemption-review","public-interest-test","approval","response-issued","internal-review","closed"],
  breach: ["reported","containment","risk-assessment","notification-decision","investigation","corrective-actions","lessons-learned","closed"],
  dpia: ["requested","screening","description","necessity-proportionality","risk-assessment","mitigation","consultation","approval","monitoring","closed"]
} as const;

export type WorkflowStage<T extends MatterType = MatterType> = (typeof workflowStages)[T][number];

export interface CaseWorkflow extends TenantScope {
  matterId: string;
  type: MatterType;
  stage: WorkflowStage;
  assignedUserId: string;
  dueAt?: string;
  completedStages: readonly string[];
  updatedAt: string;
  version: number;
}

export interface TransitionDefinition {
  from: string;
  to: string;
  capability: Capability;
  requiresReason?: boolean;
  requiresApproval?: boolean;
}

export const transitions: Record<MatterType, readonly TransitionDefinition[]> = {
  sar: [
    {from:"intake",to:"identity-verification",capability:"matter:update"},
    {from:"identity-verification",to:"scope-confirmation",capability:"matter:update"},
    {from:"scope-confirmation",to:"evidence-gathering",capability:"matter:update"},
    {from:"evidence-gathering",to:"redaction",capability:"matter:update"},
    {from:"redaction",to:"exemption-review",capability:"matter:update"},
    {from:"exemption-review",to:"approval",capability:"matter:update"},
    {from:"approval",to:"disclosure",capability:"matter:approve",requiresApproval:true},
    {from:"disclosure",to:"closed",capability:"matter:close"}
  ],
  foi: [
    {from:"intake",to:"validity-check",capability:"matter:update"},
    {from:"validity-check",to:"information-gathering",capability:"matter:update"},
    {from:"information-gathering",to:"exemption-review",capability:"matter:update"},
    {from:"exemption-review",to:"public-interest-test",capability:"matter:update"},
    {from:"public-interest-test",to:"approval",capability:"matter:update",requiresReason:true},
    {from:"approval",to:"response-issued",capability:"matter:approve",requiresApproval:true},
    {from:"response-issued",to:"internal-review",capability:"matter:update",requiresReason:true},
    {from:"response-issued",to:"closed",capability:"matter:close"},
    {from:"internal-review",to:"closed",capability:"matter:close"}
  ],
  breach: [
    {from:"reported",to:"containment",capability:"matter:update"},
    {from:"containment",to:"risk-assessment",capability:"matter:update"},
    {from:"risk-assessment",to:"notification-decision",capability:"matter:update"},
    {from:"notification-decision",to:"investigation",capability:"matter:approve",requiresReason:true,requiresApproval:true},
    {from:"investigation",to:"corrective-actions",capability:"matter:update"},
    {from:"corrective-actions",to:"lessons-learned",capability:"matter:update"},
    {from:"lessons-learned",to:"closed",capability:"matter:close"}
  ],
  dpia: [
    {from:"requested",to:"screening",capability:"matter:update"},
    {from:"screening",to:"description",capability:"matter:update"},
    {from:"description",to:"necessity-proportionality",capability:"matter:update"},
    {from:"necessity-proportionality",to:"risk-assessment",capability:"matter:update"},
    {from:"risk-assessment",to:"mitigation",capability:"matter:update"},
    {from:"mitigation",to:"consultation",capability:"matter:update"},
    {from:"consultation",to:"approval",capability:"matter:update"},
    {from:"approval",to:"monitoring",capability:"matter:approve",requiresApproval:true},
    {from:"monitoring",to:"closed",capability:"matter:close"}
  ]
};

export function initialStage(type:MatterType):WorkflowStage { return workflowStages[type][0] }

export function findTransition(type:MatterType,from:string,to:string):TransitionDefinition {
  const transition=transitions[type].find(item=>item.from===from&&item.to===to);
  if(!transition) throw new Error(`Transition from ${from} to ${to} is not permitted for ${type}`);
  return transition;
}
