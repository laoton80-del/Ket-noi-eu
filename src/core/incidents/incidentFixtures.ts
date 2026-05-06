import type { AiCostFeatureId } from '../aiCost/aiCostTypes';
import { AI_ADMIN_ALERT_PREVIEW_FIXTURES } from '../aiAlerts';
import type { AiAdminAlertSeverity } from '../aiAlerts/aiAdminAlertTypes';
import { buildIncidentDryRunRecord } from './buildIncidentDryRunRecord';
import type { IncidentAcknowledgementPreview, IncidentStatus } from './incidentTypes';

export type IncidentDryRunFixtureRow = Readonly<{
  fixtureId: string;
  featureId: AiCostFeatureId;
  expectedNextStatus: IncidentStatus;
  preview: IncidentAcknowledgementPreview;
}>;

function expectedNextForAlertSeverity(severity: AiAdminAlertSeverity): IncidentStatus {
  return severity === 'info' || severity === 'warning' ? 'acknowledged' : 'escalated';
}

function rowFromAlertFixture(alertRow: (typeof AI_ADMIN_ALERT_PREVIEW_FIXTURES)[number]): IncidentDryRunFixtureRow {
  const preview = buildIncidentDryRunRecord({ alertPreview: alertRow.preview });
  const expectedNextStatus = expectedNextForAlertSeverity(alertRow.preview.alert.severity);
  if (preview.nextStatus !== expectedNextStatus) {
    throw new Error(
      `Incident fixture ${alertRow.fixtureId}: expected nextStatus ${expectedNextStatus}, got ${preview.nextStatus}`
    );
  }
  return {
    fixtureId: `${alertRow.fixtureId}_incident`,
    featureId: alertRow.featureId,
    expectedNextStatus,
    preview,
  };
}

/** Dry-run incident rows derived from Pack X admin alert fixtures — no I/O. */
export const INCIDENT_DRY_RUN_PREVIEW_FIXTURES: readonly IncidentDryRunFixtureRow[] = Object.freeze(
  AI_ADMIN_ALERT_PREVIEW_FIXTURES.map((r) => rowFromAlertFixture(r))
);
