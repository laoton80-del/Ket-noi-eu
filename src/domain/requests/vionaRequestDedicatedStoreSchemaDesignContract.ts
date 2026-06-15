/**
 * Pure schema-design contract for a future Dedicated VIONA Request Store.
 * NOT Prisma schema. NOT migration. NOT DB. NOT API. Pack11 design contract only.
 */

export const vionaRequestDedicatedStoreLogicalEntityIds = [
  'VionaRequest',
  'VionaRequestParticipant',
  'VionaRequestSourceLink',
  'VionaRequestStatusEvent',
  'VionaRequestAuditEvent',
  'VionaRequestAttachmentReference',
] as const;

export type VionaRequestDedicatedStoreLogicalEntityId =
  (typeof vionaRequestDedicatedStoreLogicalEntityIds)[number];

export type VionaRequestDedicatedStoreLogicalEntity = Readonly<{
  id: VionaRequestDedicatedStoreLogicalEntityId;
  label: string;
  candidateOnly: true;
  isPrismaModel: false;
  isDatabaseTable: false;
  summary: string;
}>;

export type VionaRequestDedicatedStoreFieldGroupId =
  | 'coreIdentity'
  | 'ownership'
  | 'humanReadableContent'
  | 'lifecycle'
  | 'safety'
  | 'sourceLink'
  | 'audit'
  | 'attachmentReference';

export type VionaRequestDedicatedStoreFieldGroup = Readonly<{
  id: VionaRequestDedicatedStoreFieldGroupId;
  label: string;
  fields: readonly string[];
  notes: string;
}>;

export type VionaRequestDedicatedStoreLifecycleStateId =
  | 'draftIntake'
  | 'triaged'
  | 'waitingForHumanConfirmation'
  | 'readyForOperatorReview'
  | 'operatorReviewing'
  | 'waitingForExternalProvider'
  | 'closedByHuman'
  | 'cancelledByHuman'
  | 'archived';

export type VionaRequestDedicatedStoreLifecycleState = Readonly<{
  id: VionaRequestDedicatedStoreLifecycleStateId;
  label: string;
  impliesPaymentCaptured: false;
  impliesBookingConfirmed: false;
  impliesSosDispatched: false;
}>;

export type VionaRequestDedicatedStoreSourceLinkPolicy = Readonly<{
  directLocalServiceRequestReuseAllowed: false;
  hybridBridgeFutureOnly: true;
  requiresExplicitMappingContract: true;
  bridgeAllowedField: 'bridgeAllowed';
  bridgePolicyField: 'bridgePolicy';
}>;

export type VionaRequestDedicatedStoreAuditEventContract = Readonly<{
  appendOnly: true;
  isPaymentLedger: false;
  isBookingConfirmationTruth: false;
  requiredFields: readonly string[];
  actorTypes: readonly string[];
}>;

export type VionaRequestDedicatedStoreBlockedImplementationItem = Readonly<{
  id: string;
  label: string;
  blockedInPack11: true;
}>;

export type VionaRequestDedicatedStoreSchemaDesignContract = Readonly<{
  pack: 'pack11';
  contractKind: 'schemaDesignOnly';
  approvedSourceOfTruthOptionId: 'dedicatedVionaRequestStore';
  humanApprovalRecordedInPack10c: true;
  isPrismaSchema: false;
  isMigration: false;
  isApi: false;
  isPersistenceAdapter: false;
  isMutation: false;
  logicalEntities: readonly VionaRequestDedicatedStoreLogicalEntity[];
  fieldGroups: readonly VionaRequestDedicatedStoreFieldGroup[];
  lifecycleStates: readonly VionaRequestDedicatedStoreLifecycleState[];
  sourceLinkPolicy: VionaRequestDedicatedStoreSourceLinkPolicy;
  auditEventContract: VionaRequestDedicatedStoreAuditEventContract;
  blockedImplementationItems: readonly VionaRequestDedicatedStoreBlockedImplementationItem[];
  requiredSafeCopy: readonly string[];
  nonGoals: readonly string[];
}>;

export const VIONA_REQUEST_DEDICATED_STORE_ENTITY_CANDIDATES = [
  {
    id: 'VionaRequest',
    label: 'VionaRequest',
    candidateOnly: true,
    isPrismaModel: false,
    isDatabaseTable: false,
    summary: 'Core request aggregate — logical contract candidate only.',
  },
  {
    id: 'VionaRequestParticipant',
    label: 'VionaRequestParticipant',
    candidateOnly: true,
    isPrismaModel: false,
    isDatabaseTable: false,
    summary: 'Requester, operator, merchant, partner participation — candidate only.',
  },
  {
    id: 'VionaRequestSourceLink',
    label: 'VionaRequestSourceLink',
    candidateOnly: true,
    isPrismaModel: false,
    isDatabaseTable: false,
    summary: 'External source bridge metadata — future hybrid only.',
  },
  {
    id: 'VionaRequestStatusEvent',
    label: 'VionaRequestStatusEvent',
    candidateOnly: true,
    isPrismaModel: false,
    isDatabaseTable: false,
    summary: 'Lifecycle transition event — not payment or booking truth.',
  },
  {
    id: 'VionaRequestAuditEvent',
    label: 'VionaRequestAuditEvent',
    candidateOnly: true,
    isPrismaModel: false,
    isDatabaseTable: false,
    summary: 'Append-only audit entry — not a ledger.',
  },
  {
    id: 'VionaRequestAttachmentReference',
    label: 'VionaRequestAttachmentReference',
    candidateOnly: true,
    isPrismaModel: false,
    isDatabaseTable: false,
    summary: 'Opaque attachment pointer — not blob storage implementation.',
  },
] as const satisfies readonly VionaRequestDedicatedStoreLogicalEntity[];

export const VIONA_REQUEST_DEDICATED_STORE_FIELD_GROUPS = [
  {
    id: 'coreIdentity',
    label: 'Core identity',
    fields: [
      'requestId',
      'tenantId',
      'universe',
      'requestType',
      'sourceChannel',
      'createdAt',
      'updatedAt',
    ],
    notes: 'Primary identity and routing — no wallet or payment fields.',
  },
  {
    id: 'ownership',
    label: 'Ownership',
    fields: [
      'requesterUserId',
      'merchantId',
      'assignedOperatorId',
      'tenantCountryCode',
      'tenantRegionCode',
    ],
    notes: 'Tenant and actor ownership boundaries.',
  },
  {
    id: 'humanReadableContent',
    label: 'Human-readable request content',
    fields: ['title', 'summary', 'locale', 'userIntentSummary', 'operatorNotesRef'],
    notes: 'Display and triage copy — not payment settlement.',
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    fields: [
      'lifecycleState',
      'previousLifecycleState',
      'stateChangedAt',
      'stateChangedByActorType',
      'stateChangeReasonCode',
    ],
    notes: 'Non-production-claiming lifecycle — no booking/payment/SOS confirmation names.',
  },
  {
    id: 'safety',
    label: 'Safety',
    fields: [
      'humanConfirmationRequired',
      'protectedActionRequired',
      'protectedActionBlocked',
      'safetyGateReason',
    ],
    notes: 'Human confirmation and protected-action gates.',
  },
  {
    id: 'sourceLink',
    label: 'Source link',
    fields: [
      'sourceSystem',
      'sourceRecordId',
      'sourceRecordType',
      'sourceSnapshotHash',
      'bridgePolicy',
      'bridgeAllowed',
    ],
    notes: 'Hybrid bridge metadata — direct LocalServiceRequest reuse disallowed.',
  },
  {
    id: 'audit',
    label: 'Audit',
    fields: [
      'auditEventId',
      'actionType',
      'actorType',
      'actorId',
      'correlationId',
      'auditCreatedAt',
      'auditMetadataRef',
    ],
    notes: 'Append-only audit — audit log is not a payment ledger.',
  },
  {
    id: 'attachmentReference',
    label: 'Attachment reference',
    fields: [
      'attachmentRefId',
      'attachmentKind',
      'storageProvider',
      'storageKeyRef',
      'virusScanStatus',
      'retentionPolicy',
    ],
    notes: 'Opaque attachment pointers only.',
  },
] as const satisfies readonly VionaRequestDedicatedStoreFieldGroup[];

export const VIONA_REQUEST_DEDICATED_STORE_LIFECYCLE_STATES = [
  { id: 'draftIntake', label: 'Draft intake', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
  { id: 'triaged', label: 'Triaged', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
  { id: 'waitingForHumanConfirmation', label: 'Waiting for human confirmation', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
  { id: 'readyForOperatorReview', label: 'Ready for operator review', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
  { id: 'operatorReviewing', label: 'Operator reviewing', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
  { id: 'waitingForExternalProvider', label: 'Waiting for external provider', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
  { id: 'closedByHuman', label: 'Closed by human', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
  { id: 'cancelledByHuman', label: 'Cancelled by human', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
  { id: 'archived', label: 'Archived', impliesPaymentCaptured: false, impliesBookingConfirmed: false, impliesSosDispatched: false },
] as const satisfies readonly VionaRequestDedicatedStoreLifecycleState[];

export const VIONA_REQUEST_DEDICATED_STORE_SOURCE_LINK_POLICY = {
  directLocalServiceRequestReuseAllowed: false,
  hybridBridgeFutureOnly: true,
  requiresExplicitMappingContract: true,
  bridgeAllowedField: 'bridgeAllowed',
  bridgePolicyField: 'bridgePolicy',
} as const satisfies VionaRequestDedicatedStoreSourceLinkPolicy;

export const VIONA_REQUEST_DEDICATED_STORE_AUDIT_EVENT_CONTRACT = {
  appendOnly: true,
  isPaymentLedger: false,
  isBookingConfirmationTruth: false,
  requiredFields: [
    'auditEventId',
    'actionType',
    'actorType',
    'actorId',
    'correlationId',
    'auditCreatedAt',
    'auditMetadataRef',
  ],
  actorTypes: ['requester', 'operator', 'admin', 'merchant', 'system', 'aiDraftOnly'],
} as const satisfies VionaRequestDedicatedStoreAuditEventContract;

export const VIONA_REQUEST_DEDICATED_STORE_BLOCKED_IMPLEMENTATION_ITEMS = [
  { id: 'prismaSchema', label: 'Prisma schema', blockedInPack11: true },
  { id: 'prismaMigration', label: 'Prisma migration', blockedInPack11: true },
  { id: 'persistenceApi', label: 'Persistence API', blockedInPack11: true },
  { id: 'persistenceAdapter', label: 'Persistence adapter', blockedInPack11: true },
  { id: 'requestMutation', label: 'Request mutation', blockedInPack11: true },
  { id: 'adminDebugLiveData', label: 'Admin Debug live data', blockedInPack11: true },
  { id: 'operatorPrismaAuth', label: 'OPERATOR Prisma/Auth role', blockedInPack11: true },
  { id: 'paymentCapture', label: 'Payment capture', blockedInPack11: true },
  { id: 'bookingConfirmation', label: 'Booking confirmation truth', blockedInPack11: true },
  { id: 'sosDispatch', label: 'SOS dispatch', blockedInPack11: true },
  { id: 'walletMutation', label: 'Wallet mutation', blockedInPack11: true },
  { id: 'liveAiProtectedActions', label: 'Live AI protected actions', blockedInPack11: true },
  { id: 'liveMerchantExecution', label: 'Live merchant execution', blockedInPack11: true },
] as const satisfies readonly VionaRequestDedicatedStoreBlockedImplementationItem[];

export const VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT = {
  pack: 'pack11',
  contractKind: 'schemaDesignOnly',
  approvedSourceOfTruthOptionId: 'dedicatedVionaRequestStore',
  humanApprovalRecordedInPack10c: true,
  isPrismaSchema: false,
  isMigration: false,
  isApi: false,
  isPersistenceAdapter: false,
  isMutation: false,
  logicalEntities: VIONA_REQUEST_DEDICATED_STORE_ENTITY_CANDIDATES,
  fieldGroups: VIONA_REQUEST_DEDICATED_STORE_FIELD_GROUPS,
  lifecycleStates: VIONA_REQUEST_DEDICATED_STORE_LIFECYCLE_STATES,
  sourceLinkPolicy: VIONA_REQUEST_DEDICATED_STORE_SOURCE_LINK_POLICY,
  auditEventContract: VIONA_REQUEST_DEDICATED_STORE_AUDIT_EVENT_CONTRACT,
  blockedImplementationItems: VIONA_REQUEST_DEDICATED_STORE_BLOCKED_IMPLEMENTATION_ITEMS,
  requiredSafeCopy: [
    'Dedicated Store Schema Design Contract',
    'Schema-design contract only',
    'Logical entities are candidates only',
    'Not Prisma schema',
    'Not migration',
    'Not API',
    'Not persistence adapter',
    'Direct LocalServiceRequest reuse is not allowed',
    'Hybrid bridge remains future-only',
    'Audit log is not a ledger',
    'Admin Debug remains fixture-only',
    'No payment captured',
    'Not booking confirmed',
    'No SOS dispatch',
    'No wallet mutation',
    'No live merchant execution',
  ],
  nonGoals: [
    'No Prisma in Pack11',
    'No migration in Pack11',
    'No API in Pack11',
    'No persistence adapter in Pack11',
    'No request writes in Pack11',
    'No Admin Debug data-source change in Pack11',
    'No payment in Pack11',
    'No booking in Pack11',
    'No SOS dispatch in Pack11',
    'No wallet in Pack11',
    'No live AI in Pack11',
  ],
} as const satisfies VionaRequestDedicatedStoreSchemaDesignContract;

export function getVionaRequestDedicatedStoreSchemaDesignContract(): VionaRequestDedicatedStoreSchemaDesignContract {
  return VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT;
}

export function isVionaRequestDedicatedStoreSchemaDesignOnly(): boolean {
  const contract = VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT;
  if (contract.isPrismaSchema) return false;
  if (contract.isMigration) return false;
  if (contract.isApi) return false;
  if (contract.isPersistenceAdapter) return false;
  if (contract.isMutation) return false;
  return contract.contractKind === 'schemaDesignOnly';
}
