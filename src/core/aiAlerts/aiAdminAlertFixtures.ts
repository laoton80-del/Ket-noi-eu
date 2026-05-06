import type { AiCostFeatureId } from '../aiCost/aiCostTypes';
import { DEFAULT_AI_AUTO_PAUSE_POLICY, evaluateAiAutoPauseDecision } from '../aiEnforcement';
import { AI_USAGE_AUDIT_FIXTURES, evaluateAiUsageFixtureForAudit } from '../aiUsage';
import { buildAiAdminAlertPreview } from './buildAiAdminAlertPreview';
import type { AiAdminAlertPreview, AiAdminAlertSeverity } from './aiAdminAlertTypes';

export type AiAdminAlertFixtureRow = Readonly<{
  fixtureId: string;
  featureId: AiCostFeatureId;
  expectedSeverity: AiAdminAlertSeverity;
  preview: AiAdminAlertPreview;
}>;

function rowFromUsageFixture(usageFixtureId: string, expectedSeverity: AiAdminAlertSeverity): AiAdminAlertFixtureRow {
  const usageFixture = AI_USAGE_AUDIT_FIXTURES.find((f) => f.id === usageFixtureId);
  if (!usageFixture) {
    throw new Error(`Unknown usage fixture id: ${usageFixtureId}`);
  }
  const usageResult = evaluateAiUsageFixtureForAudit(usageFixture);
  const autoPauseDecision = evaluateAiAutoPauseDecision(usageResult, DEFAULT_AI_AUTO_PAUSE_POLICY);
  const preview = buildAiAdminAlertPreview({ usageResult, autoPauseDecision });
  if (preview.alert.severity !== expectedSeverity) {
    throw new Error(
      `Fixture ${usageFixtureId}: expected severity ${expectedSeverity}, got ${preview.alert.severity}`
    );
  }
  return {
    fixtureId: usageFixture.id,
    featureId: usageFixture.featureId,
    expectedSeverity,
    preview,
  };
}

/** Readonly alert previews aligned to Pack U usage audit fixtures — no I/O. */
export const AI_ADMIN_ALERT_PREVIEW_FIXTURES: readonly AiAdminAlertFixtureRow[] = Object.freeze([
  rowFromUsageFixture('receptionist_demo_within_cap', 'info'),
  rowFromUsageFixture('receptionist_pilot_near_cap', 'critical'),
  rowFromUsageFixture('live_interpreter_over_cap', 'critical'),
  rowFromUsageFixture('outbound_marketing_frozen', 'blocked'),
  rowFromUsageFixture('negative_margin_high_risk', 'critical'),
]);
