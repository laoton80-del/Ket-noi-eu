import type { AiAdminAlertPreview, AiAdminAlertSeverity } from '../aiAlerts/aiAdminAlertTypes';

export type IncidentSeverity = AiAdminAlertSeverity;

export type IncidentStatus =
  | 'previewOnly'
  | 'open'
  | 'acknowledged'
  | 'escalated'
  | 'resolved'
  | 'suppressed';

export type IncidentSource =
  | 'aiUsage'
  | 'aiCost'
  | 'aiAutoPause'
  | 'aiAdminAlert'
  | 'telephony'
  | 'manualOps'
  | 'system';

export type IncidentAcknowledgementMode = 'previewOnly' | 'manualOps' | 'adminAction' | 'automatedLater';

/** Short id for UI / i18n — maps to `incidents.ownerRole.*` */
export type IncidentOwnerRoleId = 'pilotOwner' | 'backupOwner' | 'merchantSuccessOwner' | 'opsReviewer' | 'none';

export type IncidentMetadata = Readonly<Record<string, string | number | boolean>>;

export type IncidentDryRunRecord = Readonly<{
  incidentId: string;
  source: IncidentSource;
  severity: IncidentSeverity;
  status: IncidentStatus;
  titleKey: string;
  bodyKey: string;
  recommendedActionKey: string;
  ownerRole: IncidentOwnerRoleId;
  backupOwnerRole: IncidentOwnerRoleId;
  acknowledgementMode: IncidentAcknowledgementMode;
  requiresHumanReview: boolean;
  requiresIncidentLog: boolean;
  productionPersisted: boolean;
  createdAtIso: string;
  evidenceLabel: string;
  metadata?: IncidentMetadata;
}>;

export type IncidentAcknowledgementPreview = Readonly<{
  incident: IncidentDryRunRecord;
  canAcknowledgeInPreview: boolean;
  acknowledgementLabelKey: string;
  nextStatus: IncidentStatus;
  productionPersisted: boolean;
  notesKey: string;
}>;

export type BuildIncidentDryRunInput = Readonly<{
  alertPreview: AiAdminAlertPreview;
  createdAtIso?: string;
  evidenceLabel?: string;
}>;
