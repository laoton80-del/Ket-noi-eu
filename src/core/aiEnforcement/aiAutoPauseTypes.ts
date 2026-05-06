import type { AiCostFeatureId } from '../aiCost/aiCostTypes';
import type { AiUsageMeterVerdict } from '../aiUsage/aiUsageTypes';

export type AiEnforcementMode = 'dryRun' | 'auditOnly' | 'enforced';

export type AiAutoPauseAction =
  | 'none'
  | 'warnUser'
  | 'warnAdmin'
  | 'pauseFeature'
  | 'requireManualApproval'
  | 'blockRequest';

export type AiAutoPauseDecision = Readonly<{
  featureId: AiCostFeatureId;
  verdict: AiUsageMeterVerdict;
  mode: AiEnforcementMode;
  action: AiAutoPauseAction;
  shouldBlock: boolean;
  shouldPause: boolean;
  shouldNotifyAdmin: boolean;
  reason: string;
  evidenceLabel: string;
  productionEnforced: boolean;
}>;

export type AiAutoPausePolicy = Readonly<{
  mode: AiEnforcementMode;
  allowProductionEnforcement: boolean;
  requireHumanApprovalForPause: boolean;
  requireAuditLog: boolean;
  requireAdminNotification: boolean;
  notesKey: string;
}>;
