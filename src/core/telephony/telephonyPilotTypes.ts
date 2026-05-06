/**
 * Twilio / voice pilot readiness — documentation and client-side policy vocabulary only.
 * Does not place calls, load secrets, or enable production telephony.
 */

export type TelephonyProvider = 'twilio' | 'manualOps' | 'none';

export type TelephonyPilotStatus =
  | 'disabled'
  | 'docsOnly'
  | 'sandboxReady'
  | 'sandboxTesting'
  | 'pilotGated'
  | 'productionFrozen';

export type TelephonyCallMode =
  | 'noCall'
  | 'manualOpsCallback'
  | 'sandboxOutbound'
  | 'sandboxInbound'
  | 'productionOutbound';

export type TelephonyConsentRequirement =
  | 'explicitConsent'
  | 'recordingDisclosure'
  | 'noRecording'
  | 'marketReviewRequired';

export type TelephonyPilotReadinessId =
  | 'aiReceptionistTwilioSandbox'
  | 'b2cAiCallAssistantSandbox'
  | 'liveInterpreterVoiceBridge';

export type TelephonyPilotReadinessDefinition = Readonly<{
  provider: TelephonyProvider;
  status: TelephonyPilotStatus;
  allowedModes: readonly TelephonyCallMode[];
  blockedModes: readonly TelephonyCallMode[];
  requiresHumanApproval: boolean;
  requiresConsent: boolean;
  requiresRecordingDisclosure: boolean;
  requiresCostGuard: boolean;
  requiresManualOpsFallback: boolean;
  productionReady: boolean;
  /** Primary consent posture for ops checklist */
  consentPosture: TelephonyConsentRequirement;
  /** i18n key for short registry note */
  notesKey: string;
}>;
