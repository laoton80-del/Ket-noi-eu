import type {
  VionaRequestHumanConfirmationState,
  VionaRequestIntent,
  VionaRequestRiskLevel,
  VionaRequestStatus,
  VionaRequestUniverse,
} from './vionaRequestTypes';

/**
 * Pure field manifest for a future dedicated VIONA Request Store.
 * This is NOT Prisma schema. No migration. No DB activation in Pack9.
 */

export const vionaRequestDedicatedStoreFieldCategories = [
  'identity',
  'domain',
  'ownership',
  'tenantScope',
  'riskSafety',
  'humanConfirmation',
  'audit',
  'hybridLink',
  'localeMarket',
  'lifecycle',
  'idempotency',
] as const;

export type VionaRequestDedicatedStoreFieldCategory =
  (typeof vionaRequestDedicatedStoreFieldCategories)[number];

export type VionaRequestDedicatedStoreFieldRequirement = Readonly<{
  name: string;
  category: VionaRequestDedicatedStoreFieldCategory;
  required: boolean;
  presentOnVionaRequestRecord: boolean;
  copyFromLocalAllowed: false;
  note: string;
}>;

export type VionaRequestDedicatedStoreField = VionaRequestDedicatedStoreFieldRequirement;

export const VIONA_REQUEST_DEDICATED_STORE_FIELD_MANIFEST = [
  { name: 'id', category: 'identity', required: true, presentOnVionaRequestRecord: true, copyFromLocalAllowed: false, note: 'UUID primary key.' },
  { name: 'createdAt', category: 'lifecycle', required: true, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Immutable creation timestamp.' },
  { name: 'updatedAt', category: 'lifecycle', required: true, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Last workflow update timestamp.' },
  { name: 'version', category: 'identity', required: true, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Optimistic lock or revision counter for future writes.' },
  { name: 'universe', category: 'domain', required: true, presentOnVionaRequestRecord: true, copyFromLocalAllowed: false, note: 'Cross-universe routing dimension.' },
  { name: 'intent', category: 'domain', required: true, presentOnVionaRequestRecord: true, copyFromLocalAllowed: false, note: 'Request intent within universe.' },
  { name: 'status', category: 'domain', required: true, presentOnVionaRequestRecord: true, copyFromLocalAllowed: false, note: 'VionaRequestStatus — not LocalServiceRequestStatus.' },
  { name: 'riskLevel', category: 'riskSafety', required: true, presentOnVionaRequestRecord: true, copyFromLocalAllowed: false, note: 'Risk tier for triage and human confirmation.' },
  { name: 'humanConfirmation', category: 'humanConfirmation', required: true, presentOnVionaRequestRecord: true, copyFromLocalAllowed: false, note: 'Human confirmation state separate from status.' },
  { name: 'requesterUserId', category: 'ownership', required: true, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'B2C/requester scope key.' },
  { name: 'businessId', category: 'ownership', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Merchant tenant scope when universe is local/business.' },
  { name: 'partnerId', category: 'ownership', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Explicit partner assignment only — no global partner lists.' },
  { name: 'assignedPartnerUserId', category: 'ownership', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Assigned partner user reference.' },
  { name: 'tenantScope', category: 'tenantScope', required: true, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'globalOps | requesterOwned | merchantBusinessOwned | partnerAssigned.' },
  { name: 'universeFilter', category: 'tenantScope', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Required on global ops list reads.' },
  { name: 'auditReason', category: 'audit', required: true, presentOnVionaRequestRecord: true, copyFromLocalAllowed: false, note: 'Workflow audit reason string.' },
  { name: 'externalSourceKind', category: 'hybridLink', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Hybrid bridge reference kind — reference-only until signed off.' },
  { name: 'externalSourceId', category: 'hybridLink', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Hybrid bridge external id — not Local SoT.' },
  { name: 'locale', category: 'localeMarket', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Locale metadata for ops review.' },
  { name: 'market', category: 'localeMarket', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Market/country context — not product scope limit.' },
  { name: 'sourceChannel', category: 'localeMarket', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Origin channel for audit (app, admin, reference lab).' },
  { name: 'idempotencyKey', category: 'idempotency', required: false, presentOnVionaRequestRecord: false, copyFromLocalAllowed: false, note: 'Required before durable writes and audit append.' },
] as const satisfies readonly VionaRequestDedicatedStoreField[];

export const VIONA_REQUEST_LOCAL_FIELD_COPY_BLOCKLIST = [
  'walletMode',
  'walletPhase',
  'totalVioCredits',
  'heldVioCredits',
  'releasedVioCredits',
  'platformFeeVioCredits',
  'providerEarningsVioCredits',
  'LocalServiceRequestStatus',
  'merchantReviewDeadlineAt',
  'providerSettledAt',
  'confirmedAt',
  'rejectedAt',
  'serviceType',
  'fixerProfileKey',
  'legacyBookingId',
  'scheduledStartAt',
  'scheduledEndAt',
] as const;

export type VionaRequestDedicatedStoreManifestNote = Readonly<{
  isPrismaSchema: false;
  migrationInThisPack: false;
  dbActivation: false;
  fieldsAreFutureDesignCandidatesOnly: true;
  localWalletFieldsMustNotImplyCompletedPaidSettled: true;
  vionaCompletedIsNotLedgerTruth: true;
}>;

export const VIONA_REQUEST_DEDICATED_STORE_MANIFEST_NOTE: VionaRequestDedicatedStoreManifestNote =
  {
    isPrismaSchema: false,
    migrationInThisPack: false,
    dbActivation: false,
    fieldsAreFutureDesignCandidatesOnly: true,
    localWalletFieldsMustNotImplyCompletedPaidSettled: true,
    vionaCompletedIsNotLedgerTruth: true,
  } as const;

/** Shape reference for future dedicated store row — types only, not a DB model. */
export type VionaRequestDedicatedStoreRowShape = Readonly<{
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  universe: VionaRequestUniverse;
  intent: VionaRequestIntent;
  status: VionaRequestStatus;
  riskLevel: VionaRequestRiskLevel;
  humanConfirmation: VionaRequestHumanConfirmationState;
  requesterUserId: string;
  businessId: string | null;
  partnerId: string | null;
  assignedPartnerUserId: string | null;
  tenantScope: string;
  universeFilter: readonly VionaRequestUniverse[] | null;
  auditReason: string;
  externalSourceKind: string | null;
  externalSourceId: string | null;
  locale: string | null;
  market: string | null;
  sourceChannel: string | null;
  idempotencyKey: string | null;
}>;
