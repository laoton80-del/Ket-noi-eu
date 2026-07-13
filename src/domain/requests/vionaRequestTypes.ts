export const vionaRequestUniverses = [
  'home',
  'local',
  'travel',
  'academy',
  'business',
  'account',
  'sos',
  'b2bWholesale',
] as const;

export const vionaRequestIntents = [
  'askQuestion',
  'draftRequest',
  'serviceHelp',
  'travelHelp',
  'learningHelp',
  'merchantHelp',
  'profileHelp',
  'safetyGuidance',
  'wholesaleInquiry',
] as const;

export const vionaRequestStatuses = [
  'draft',
  'submitted',
  'triage',
  'needsHumanConfirmation',
  'sentToPartner',
  'partnerResponded',
  'inProgress',
  'completed',
  'cancelled',
  'failed',
] as const;

export const vionaRequestRiskLevels = ['low', 'medium', 'high', 'restricted'] as const;

export const vionaRequestHumanConfirmationStates = [
  'notRequired',
  'required',
  'requested',
  'confirmed',
  'declined',
] as const;

export type VionaRequestUniverse = (typeof vionaRequestUniverses)[number];
export type VionaRequestIntent = (typeof vionaRequestIntents)[number];
export type VionaRequestStatus = (typeof vionaRequestStatuses)[number];
export type VionaRequestRiskLevel = (typeof vionaRequestRiskLevels)[number];
export type VionaRequestHumanConfirmationState =
  (typeof vionaRequestHumanConfirmationStates)[number];

export type VionaRequestActor = 'user' | 'admin' | 'merchant' | 'partner' | 'aiAssistant' | 'system';

export type VionaRequestSafetyNote = Readonly<{
  id: string;
  note: string;
}>;

export type VionaRequestRecord = Readonly<{
  id: string;
  universe: VionaRequestUniverse;
  intent: VionaRequestIntent;
  status: VionaRequestStatus;
  riskLevel: VionaRequestRiskLevel;
  humanConfirmation: VionaRequestHumanConfirmationState;
  createdBy: VionaRequestActor;
  updatedBy: VionaRequestActor;
  auditReason: string;
}>;

export const vionaRequestSafetyNotes: readonly VionaRequestSafetyNote[] = [
  {
    id: 'submitted-not-paid',
    note: 'submitted is not paid; it only means the request left draft state.',
  },
  {
    id: 'partner-responded-not-booking-confirmed',
    note: 'partnerResponded is not booking confirmed; it only means a partner reply exists.',
  },
  {
    id: 'completed-not-settled',
    note: 'completed is not settled; it only means this request workflow reached its current terminal state.',
  },
  {
    id: 'sos-guidance-handoff-only',
    note: 'SOS request is guidance/handoff only unless ops ready.',
  },
] as const;
