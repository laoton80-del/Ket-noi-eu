import type {
  AiAdminAlertChannel,
  AiAdminAlertDefinition,
  AiAdminAlertPreview,
  AiAdminAlertSeverity,
  BuildAiAdminAlertPreviewInput,
} from './aiAdminAlertTypes';
import type { AiUsageMeterVerdict } from '../aiUsage/aiUsageTypes';

function channelsForSeverity(severity: AiAdminAlertSeverity): readonly AiAdminAlertChannel[] {
  if (severity === 'info') {
    return ['dashboard'] as const;
  }
  return ['dashboard', 'manualOps'] as const;
}

function mapVerdictToAlertFields(verdict: AiUsageMeterVerdict): {
  severity: AiAdminAlertSeverity;
  titleKey: string;
  bodyKey: string;
  recommendedActionKey: string;
  requiresOwnerReview: boolean;
  requiresIncidentLog: boolean;
  reason: string;
} {
  switch (verdict) {
    case 'allow':
      return {
        severity: 'info',
        titleKey: 'aiAlerts.title.usageWithinPolicy',
        bodyKey: 'aiAlerts.body.usageWithinPolicy',
        recommendedActionKey: 'aiAlerts.action.noAction',
        requiresOwnerReview: false,
        requiresIncidentLog: false,
        reason: 'pack_x_verdict_allow',
      };
    case 'warn':
      return {
        severity: 'warning',
        titleKey: 'aiAlerts.title.usageWarn',
        bodyKey: 'aiAlerts.body.usageWarn',
        recommendedActionKey: 'aiAlerts.action.reviewUsage',
        requiresOwnerReview: false,
        requiresIncidentLog: false,
        reason: 'pack_x_verdict_warn',
      };
    case 'autoPause':
      return {
        severity: 'critical',
        titleKey: 'aiAlerts.title.usageCritical',
        bodyKey: 'aiAlerts.body.autoPauseRisk',
        recommendedActionKey: 'aiAlerts.action.pauseRecommended',
        requiresOwnerReview: true,
        requiresIncidentLog: true,
        reason: 'pack_x_verdict_auto_pause',
      };
    case 'blocked':
      return {
        severity: 'blocked',
        titleKey: 'aiAlerts.title.usageBlocked',
        bodyKey: 'aiAlerts.body.blocked',
        recommendedActionKey: 'aiAlerts.action.blockRecommended',
        requiresOwnerReview: true,
        requiresIncidentLog: true,
        reason: 'pack_x_verdict_blocked',
      };
  }
}

/**
 * Builds a dashboard-only admin alert preview — no network, no persistence, no delivery.
 */
export function buildAiAdminAlertPreview(input: BuildAiAdminAlertPreviewInput): AiAdminAlertPreview {
  const { usageResult, autoPauseDecision } = input;
  const createdAtIso = input.createdAtIso ?? new Date().toISOString();
  const evidenceLabel = input.evidenceLabel ?? autoPauseDecision.evidenceLabel;
  const fields = mapVerdictToAlertFields(usageResult.verdict);

  let bodyKey = fields.bodyKey;
  let recommendedActionKey = fields.recommendedActionKey;
  if (usageResult.verdict === 'warn' && usageResult.estimatedMarginMinor < 0) {
    bodyKey = 'aiAlerts.body.marginWarn';
    recommendedActionKey = 'aiAlerts.action.reviewMargin';
  }

  const alertId = `aiadm_preview_${usageResult.featureId}_${usageResult.reason.replace(/[^a-zA-Z0-9_-]+/g, '_')}`;

  const alert: AiAdminAlertDefinition = {
    alertId,
    featureId: usageResult.featureId,
    severity: fields.severity,
    status: 'previewOnly',
    titleKey: fields.titleKey,
    bodyKey,
    recommendedActionKey,
    channels: channelsForSeverity(fields.severity),
    requiresOwnerReview: fields.requiresOwnerReview,
    requiresIncidentLog: fields.requiresIncidentLog,
    productionSendEnabled: false,
    createdAtIso,
    evidenceLabel,
    metadata: Object.freeze({
      meterReason: usageResult.reason,
      autoPauseReason: autoPauseDecision.reason,
    }),
  };

  const shouldNotifyAdmin = usageResult.verdict !== 'allow';

  return {
    alert,
    usageVerdict: usageResult.verdict,
    autoPauseAction: autoPauseDecision.action,
    productionEnforced: autoPauseDecision.productionEnforced,
    shouldNotifyAdmin,
    previewOnly: true,
    reason: fields.reason,
  };
}
