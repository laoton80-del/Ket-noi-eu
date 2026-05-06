import type { TelephonyPilotReadinessDefinition, TelephonyPilotReadinessId } from './telephonyPilotTypes';

/**
 * Static pilot lanes — not runtime Twilio configuration.
 * All lanes keep production outbound blocked until separate commercial + legal gates pass.
 */
export const TELEPHONY_PILOT_REGISTRY: Readonly<
  Record<TelephonyPilotReadinessId, TelephonyPilotReadinessDefinition>
> = {
  aiReceptionistTwilioSandbox: {
    provider: 'twilio',
    status: 'docsOnly',
    allowedModes: ['noCall', 'manualOpsCallback', 'sandboxOutbound'],
    blockedModes: ['sandboxInbound', 'productionOutbound'],
    requiresHumanApproval: true,
    requiresConsent: true,
    requiresRecordingDisclosure: true,
    requiresCostGuard: true,
    requiresManualOpsFallback: true,
    productionReady: false,
    consentPosture: 'explicitConsent',
    notesKey: 'telephony.feature.aiReceptionistTwilioSandbox',
  },
  b2cAiCallAssistantSandbox: {
    provider: 'twilio',
    status: 'pilotGated',
    allowedModes: ['noCall', 'manualOpsCallback'],
    blockedModes: ['sandboxOutbound', 'sandboxInbound', 'productionOutbound'],
    requiresHumanApproval: true,
    requiresConsent: true,
    requiresRecordingDisclosure: true,
    requiresCostGuard: true,
    requiresManualOpsFallback: true,
    productionReady: false,
    consentPosture: 'marketReviewRequired',
    notesKey: 'telephony.feature.b2cAiCallAssistantSandbox',
  },
  liveInterpreterVoiceBridge: {
    provider: 'manualOps',
    status: 'productionFrozen',
    allowedModes: ['noCall', 'manualOpsCallback'],
    blockedModes: ['sandboxOutbound', 'sandboxInbound', 'productionOutbound'],
    requiresHumanApproval: true,
    requiresConsent: true,
    requiresRecordingDisclosure: true,
    requiresCostGuard: true,
    requiresManualOpsFallback: true,
    productionReady: false,
    consentPosture: 'noRecording',
    notesKey: 'telephony.feature.liveInterpreterVoiceBridge',
  },
};
