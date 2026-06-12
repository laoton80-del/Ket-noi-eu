export const vionaAutomationPhases = [
  'phaseA_sourceOfTruth',
  'phaseB_readOnlyCopilot',
  'phaseC_humanConfirmedAction',
  'phaseD_limitedAutonomousGated',
] as const;

export const vionaAutomationActionCategories = [
  'readOnly',
  'draftOnly',
  'humanConfirmed',
  'opsConfirmed',
  'prohibited',
] as const;

export const vionaAutomationActionIds = [
  'explainStatus',
  'classifyRequest',
  'draftUserMessage',
  'draftMerchantResponse',
  'prepareProfileDraft',
  'sendHumanConfirmedRequest',
  'sendOpsConfirmedPartnerMessage',
  'capturePayment',
  'refund',
  'settle',
  'payout',
  'bookTravelTicketHotel',
  'dispatchSosRescuePoliceAmbulance',
  'sendLegalMedicalAuthorityReport',
  'performIrreversibleAutonomousAction',
] as const;

export type VionaAutomationPhase = (typeof vionaAutomationPhases)[number];
export type VionaAutomationActionCategory = (typeof vionaAutomationActionCategories)[number];
export type VionaAutomationActionId = (typeof vionaAutomationActionIds)[number];

export type VionaAutomationPhaseGate = Readonly<{
  action: VionaAutomationActionId;
  category: VionaAutomationActionCategory;
  minimumPhase: VionaAutomationPhase | null;
  requiresHumanConfirmation: boolean;
  requiresOpsConfirmation: boolean;
  requiresAuditLog: boolean;
  reason: string;
}>;

const phaseRank: Readonly<Record<VionaAutomationPhase, number>> = {
  phaseA_sourceOfTruth: 0,
  phaseB_readOnlyCopilot: 1,
  phaseC_humanConfirmedAction: 2,
  phaseD_limitedAutonomousGated: 3,
};

export const vionaAutomationSafetyGates = {
  explainStatus: {
    action: 'explainStatus',
    category: 'readOnly',
    minimumPhase: 'phaseB_readOnlyCopilot',
    requiresHumanConfirmation: false,
    requiresOpsConfirmation: false,
    requiresAuditLog: false,
    reason: 'AI may explain visible status from approved source-of-truth data.',
  },
  classifyRequest: {
    action: 'classifyRequest',
    category: 'readOnly',
    minimumPhase: 'phaseB_readOnlyCopilot',
    requiresHumanConfirmation: false,
    requiresOpsConfirmation: false,
    requiresAuditLog: true,
    reason: 'AI may classify a request for triage without external side effects.',
  },
  draftUserMessage: {
    action: 'draftUserMessage',
    category: 'draftOnly',
    minimumPhase: 'phaseB_readOnlyCopilot',
    requiresHumanConfirmation: false,
    requiresOpsConfirmation: false,
    requiresAuditLog: true,
    reason: 'AI may draft text for the user to review before sending.',
  },
  draftMerchantResponse: {
    action: 'draftMerchantResponse',
    category: 'draftOnly',
    minimumPhase: 'phaseB_readOnlyCopilot',
    requiresHumanConfirmation: false,
    requiresOpsConfirmation: false,
    requiresAuditLog: true,
    reason: 'AI may draft merchant response text for a human operator or merchant to approve.',
  },
  prepareProfileDraft: {
    action: 'prepareProfileDraft',
    category: 'draftOnly',
    minimumPhase: 'phaseB_readOnlyCopilot',
    requiresHumanConfirmation: false,
    requiresOpsConfirmation: false,
    requiresAuditLog: true,
    reason: 'AI may prepare a profile change draft; mutation is outside this foundation.',
  },
  sendHumanConfirmedRequest: {
    action: 'sendHumanConfirmedRequest',
    category: 'humanConfirmed',
    minimumPhase: 'phaseC_humanConfirmedAction',
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: false,
    requiresAuditLog: true,
    reason: 'Sending a request requires explicit user confirmation and audit logging.',
  },
  sendOpsConfirmedPartnerMessage: {
    action: 'sendOpsConfirmedPartnerMessage',
    category: 'opsConfirmed',
    minimumPhase: 'phaseD_limitedAutonomousGated',
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Partner communication requires user confirmation, ops confirmation, and audit logging.',
  },
  capturePayment: {
    action: 'capturePayment',
    category: 'prohibited',
    minimumPhase: null,
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Prohibited until payment rails, ledger source of truth, reconciliation, and owner signoff exist.',
  },
  refund: {
    action: 'refund',
    category: 'prohibited',
    minimumPhase: null,
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Prohibited until payment operations and ledger rollback controls exist.',
  },
  settle: {
    action: 'settle',
    category: 'prohibited',
    minimumPhase: null,
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Prohibited until settlement ownership, accounting, and reconciliation are approved.',
  },
  payout: {
    action: 'payout',
    category: 'prohibited',
    minimumPhase: null,
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Prohibited until payout ownership, clawback, and ledger controls are approved.',
  },
  bookTravelTicketHotel: {
    action: 'bookTravelTicketHotel',
    category: 'prohibited',
    minimumPhase: null,
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Prohibited until supplier source of truth, booking ownership, and cancellation controls exist.',
  },
  dispatchSosRescuePoliceAmbulance: {
    action: 'dispatchSosRescuePoliceAmbulance',
    category: 'prohibited',
    minimumPhase: null,
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Prohibited until SOS legal review, local routing, consent, and operations are approved.',
  },
  sendLegalMedicalAuthorityReport: {
    action: 'sendLegalMedicalAuthorityReport',
    category: 'prohibited',
    minimumPhase: null,
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Prohibited until legal, medical, privacy, and authority-reporting controls are approved.',
  },
  performIrreversibleAutonomousAction: {
    action: 'performIrreversibleAutonomousAction',
    category: 'prohibited',
    minimumPhase: null,
    requiresHumanConfirmation: true,
    requiresOpsConfirmation: true,
    requiresAuditLog: true,
    reason: 'Prohibited unless a future high-risk autonomy review explicitly approves the action.',
  },
} as const satisfies Readonly<Record<VionaAutomationActionId, VionaAutomationPhaseGate>>;

export function getAutomationPhaseGate(
  action: VionaAutomationActionId
): VionaAutomationPhaseGate {
  return vionaAutomationSafetyGates[action];
}

export function isAutomationActionAllowed(
  action: VionaAutomationActionId,
  phase: VionaAutomationPhase
): boolean {
  const gate = getAutomationPhaseGate(action);
  if (gate.category === 'prohibited' || gate.minimumPhase === null) return false;
  return phaseRank[phase] >= phaseRank[gate.minimumPhase];
}

export function requiresHumanConfirmation(action: VionaAutomationActionId): boolean {
  return getAutomationPhaseGate(action).requiresHumanConfirmation;
}
