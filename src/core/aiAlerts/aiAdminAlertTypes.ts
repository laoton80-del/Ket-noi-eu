import type { AiCostFeatureId } from '../aiCost/aiCostTypes';
import type { AiAutoPauseAction, AiAutoPauseDecision } from '../aiEnforcement/aiAutoPauseTypes';
import type { AiUsageMeterResult, AiUsageMeterVerdict } from '../aiUsage/aiUsageTypes';

export type AiAdminAlertSeverity = 'info' | 'warning' | 'critical' | 'blocked';

export type AiAdminAlertChannel = 'dashboard' | 'email' | 'slack' | 'sms' | 'manualOps';

export type AiAdminAlertStatus = 'previewOnly' | 'queued' | 'sent' | 'acknowledged' | 'suppressed';

export type AiAdminAlertMetadata = Readonly<Record<string, string | number | boolean>>;

export type AiAdminAlertDefinition = Readonly<{
  alertId: string;
  featureId: AiCostFeatureId;
  severity: AiAdminAlertSeverity;
  status: AiAdminAlertStatus;
  titleKey: string;
  bodyKey: string;
  recommendedActionKey: string;
  channels: readonly AiAdminAlertChannel[];
  requiresOwnerReview: boolean;
  requiresIncidentLog: boolean;
  productionSendEnabled: boolean;
  createdAtIso: string;
  evidenceLabel: string;
  metadata?: AiAdminAlertMetadata;
}>;

export type AiAdminAlertPreview = Readonly<{
  alert: AiAdminAlertDefinition;
  usageVerdict: AiUsageMeterVerdict;
  autoPauseAction: AiAutoPauseAction;
  productionEnforced: boolean;
  shouldNotifyAdmin: boolean;
  previewOnly: boolean;
  reason: string;
}>;

export type BuildAiAdminAlertPreviewInput = Readonly<{
  usageResult: AiUsageMeterResult;
  autoPauseDecision: AiAutoPauseDecision;
  createdAtIso?: string;
  evidenceLabel?: string;
}>;
