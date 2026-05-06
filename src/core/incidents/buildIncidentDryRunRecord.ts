import type { AiAdminAlertSeverity } from '../aiAlerts/aiAdminAlertTypes';
import type {
  BuildIncidentDryRunInput,
  IncidentAcknowledgementPreview,
  IncidentDryRunRecord,
  IncidentOwnerRoleId,
  IncidentStatus,
} from './incidentTypes';

function ownerRolesForSeverity(severity: AiAdminAlertSeverity): {
  ownerRole: IncidentOwnerRoleId;
  backupOwnerRole: IncidentOwnerRoleId;
} {
  if (severity === 'critical' || severity === 'blocked') {
    return { ownerRole: 'pilotOwner', backupOwnerRole: 'backupOwner' };
  }
  if (severity === 'warning') {
    return { ownerRole: 'merchantSuccessOwner', backupOwnerRole: 'opsReviewer' };
  }
  return { ownerRole: 'opsReviewer', backupOwnerRole: 'none' };
}

function nextStatusForSeverity(severity: AiAdminAlertSeverity): IncidentStatus {
  if (severity === 'info' || severity === 'warning') {
    return 'acknowledged';
  }
  return 'escalated';
}

/**
 * Pure dry-run projection of an admin alert into an incident acknowledgement preview.
 * No DB, no outbound notifications, no tickets.
 */
export function buildIncidentDryRunRecord(input: BuildIncidentDryRunInput): IncidentAcknowledgementPreview {
  const { alertPreview } = input;
  const alert = alertPreview.alert;
  const createdAtIso = input.createdAtIso ?? alert.createdAtIso;
  const evidenceLabel = input.evidenceLabel ?? alert.evidenceLabel;
  const { ownerRole, backupOwnerRole } = ownerRolesForSeverity(alert.severity);
  const nextStatus = nextStatusForSeverity(alert.severity);

  const incidentId = `incdry_${alert.alertId.replace(/[^a-zA-Z0-9_-]+/g, '_')}`;

  const incident: IncidentDryRunRecord = {
    incidentId,
    source: 'aiAdminAlert',
    severity: alert.severity,
    status: 'previewOnly',
    titleKey: alert.titleKey,
    bodyKey: alert.bodyKey,
    recommendedActionKey: alert.recommendedActionKey,
    ownerRole,
    backupOwnerRole,
    acknowledgementMode: 'previewOnly',
    requiresHumanReview: alert.requiresOwnerReview,
    requiresIncidentLog: alert.requiresIncidentLog,
    productionPersisted: false,
    createdAtIso,
    evidenceLabel,
    metadata: alert.metadata,
  };

  return {
    incident,
    canAcknowledgeInPreview: true,
    acknowledgementLabelKey: 'incidents.action.acknowledgePreview',
    nextStatus,
    productionPersisted: false,
    notesKey: 'incidents.preview.runbookNotes',
  };
}
