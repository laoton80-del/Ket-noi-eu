import type { AiUsageMeterResult } from '../aiUsage/aiUsageTypes';
import { DEFAULT_AI_AUTO_PAUSE_POLICY } from './aiAutoPausePolicy';
import type { AiAutoPauseAction, AiAutoPauseDecision, AiAutoPausePolicy } from './aiAutoPauseTypes';

function buildEvidenceLabel(result: AiUsageMeterResult): string {
  return `meter:${result.featureId}:${result.reason}`;
}

function notifyForAction(
  policy: AiAutoPausePolicy,
  action: AiAutoPauseAction
): boolean {
  if (!policy.requireAdminNotification) {
    return false;
  }
  return action !== 'none' && action !== 'warnUser';
}

/**
 * Maps a usage meter verdict to an auto-pause **recommendation** or (when `mode === 'enforced'`
 * and `allowProductionEnforcement` is true) a production-shaped decision.
 * Default policy is always dry-run — no gateway side-effects from this module.
 */
export function evaluateAiAutoPauseDecision(
  result: AiUsageMeterResult,
  policy: AiAutoPausePolicy = DEFAULT_AI_AUTO_PAUSE_POLICY
): AiAutoPauseDecision {
  const evidenceLabel = buildEvidenceLabel(result);
  const isPassiveMode = policy.mode === 'dryRun' || policy.mode === 'auditOnly';

  if (result.verdict === 'allow') {
    return {
      featureId: result.featureId,
      verdict: result.verdict,
      mode: policy.mode,
      action: 'none',
      shouldBlock: false,
      shouldPause: false,
      shouldNotifyAdmin: false,
      reason: 'verdict_allow',
      evidenceLabel,
      productionEnforced: false,
    };
  }

  if (result.verdict === 'warn') {
    const action: AiAutoPauseAction = result.autoPauseRecommended ? 'warnAdmin' : 'warnUser';
    return {
      featureId: result.featureId,
      verdict: result.verdict,
      mode: policy.mode,
      action,
      shouldBlock: false,
      shouldPause: false,
      shouldNotifyAdmin: notifyForAction(policy, action),
      reason: 'verdict_warn',
      evidenceLabel,
      productionEnforced: false,
    };
  }

  if (result.verdict === 'autoPause') {
    if (isPassiveMode || !policy.allowProductionEnforcement || policy.requireHumanApprovalForPause) {
      const action: AiAutoPauseAction = 'requireManualApproval';
      return {
        featureId: result.featureId,
        verdict: result.verdict,
        mode: policy.mode,
        action,
        shouldBlock: false,
        shouldPause: false,
        shouldNotifyAdmin: notifyForAction(policy, action),
        reason: isPassiveMode ? 'auto_pause_dry_run' : 'auto_pause_gated_or_human_required',
        evidenceLabel,
        productionEnforced: false,
      };
    }
    return {
      featureId: result.featureId,
      verdict: result.verdict,
      mode: policy.mode,
      action: 'pauseFeature',
      shouldBlock: false,
      shouldPause: true,
      shouldNotifyAdmin: notifyForAction(policy, 'pauseFeature'),
      reason: 'auto_pause_enforced',
      evidenceLabel,
      productionEnforced: true,
    };
  }

  // blocked
  if (isPassiveMode || !policy.allowProductionEnforcement) {
    const action: AiAutoPauseAction = 'blockRequest';
    return {
      featureId: result.featureId,
      verdict: result.verdict,
      mode: policy.mode,
      action,
      shouldBlock: false,
      shouldPause: false,
      shouldNotifyAdmin: notifyForAction(policy, action),
      reason: 'blocked_dry_run',
      evidenceLabel,
      productionEnforced: false,
    };
  }

  return {
    featureId: result.featureId,
    verdict: result.verdict,
    mode: policy.mode,
    action: 'blockRequest',
    shouldBlock: true,
    shouldPause: false,
    shouldNotifyAdmin: notifyForAction(policy, 'blockRequest'),
    reason: 'blocked_enforced',
    evidenceLabel,
    productionEnforced: true,
  };
}
