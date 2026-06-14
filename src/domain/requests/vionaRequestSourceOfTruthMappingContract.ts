import type { VionaRequestStatus } from './vionaRequestTypes';

/**
 * Source-of-truth options for cross-universe VIONA Request Engine.
 * Contract only — no DB, no Prisma, no runtime selection logic.
 */
export type VionaRequestSourceOfTruthOption =
  | 'dedicatedVionaRequestStore'
  | 'mappedFromLocalServiceRequest'
  | 'hybridWithMappingContract';

export type VionaRequestSourceOfTruthRecommendation = Readonly<{
  recommendedOption: 'dedicatedVionaRequestStore';
  requiresFounderArchitectSignoff: true;
  rationale: string;
  deferredUntilSignoff: readonly VionaRequestSourceOfTruthOption[];
}>;

export const VIONA_REQUEST_SOURCE_OF_TRUTH_RECOMMENDATION: VionaRequestSourceOfTruthRecommendation =
  {
    recommendedOption: 'dedicatedVionaRequestStore',
    requiresFounderArchitectSignoff: true,
    rationale:
      'Cross-universe VIONA Request Engine needs a dedicated store with universe/intent/risk/human-confirmation fields. LocalServiceRequest is Local-only, wallet-coupled, and status-incompatible for direct reuse.',
    deferredUntilSignoff: ['mappedFromLocalServiceRequest', 'hybridWithMappingContract'],
  };

/**
 * External reference kinds for hybrid mapping. Reference-only — not live links.
 */
export type VionaRequestExternalSourceKind =
  | 'localServiceRequest'
  | 'tourismBooking'
  | 'legacyBooking';

export type VionaRequestExternalSourceLink = Readonly<{
  kind: VionaRequestExternalSourceKind;
  externalId: string;
  universe: 'local' | 'travel';
  referenceOnly: true;
  mappingContractRequired: true;
  note: string;
}>;

/**
 * Local Prisma LocalServiceRequestStatus reference values.
 * String literals only — no Prisma client import.
 */
export const VIONA_REQUEST_LOCAL_STATUS_REFERENCE_VALUES = [
  'DRAFT',
  'REQUESTED',
  'MERCHANT_REVIEW',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'USER_CANCELLED',
  'OPS_CANCELLED',
  'EXPIRED',
] as const;

export type VionaRequestLocalStatusReference =
  (typeof VIONA_REQUEST_LOCAL_STATUS_REFERENCE_VALUES)[number];

/**
 * One Local status may map to zero or more VIONA statuses with explicit semantic notes.
 * Many-to-one and one-to-many mappings are intentional — direct 1:1 reuse is unsafe.
 */
export type VionaRequestLocalToVionaStatusMapping = Readonly<{
  localStatus: VionaRequestLocalStatusReference;
  vionaStatusCandidates: readonly VionaRequestStatus[];
  directReuseSafe: false;
  semanticNote: string;
}>;

export const VIONA_REQUEST_LOCAL_TO_VIONA_STATUS_MAPPINGS = [
  {
    localStatus: 'DRAFT',
    vionaStatusCandidates: ['draft'],
    directReuseSafe: false,
    semanticNote: 'Local DRAFT aligns loosely with VIONA draft; wallet/policy context differs.',
  },
  {
    localStatus: 'REQUESTED',
    vionaStatusCandidates: ['submitted', 'triage'],
    directReuseSafe: false,
    semanticNote: 'Local REQUESTED may imply merchant-bound service; VIONA submitted is cross-universe.',
  },
  {
    localStatus: 'MERCHANT_REVIEW',
    vionaStatusCandidates: ['triage', 'needsHumanConfirmation'],
    directReuseSafe: false,
    semanticNote: 'Merchant review is Local-tenant scoped; VIONA triage may be operator-global.',
  },
  {
    localStatus: 'CONFIRMED',
    vionaStatusCandidates: ['sentToPartner', 'partnerResponded'],
    directReuseSafe: false,
    semanticNote: 'Local CONFIRMED is not booking confirmed and not VIONA partnerResponded.',
  },
  {
    localStatus: 'IN_PROGRESS',
    vionaStatusCandidates: ['sentToPartner', 'partnerResponded'],
    directReuseSafe: false,
    semanticNote: 'In-progress fulfillment is Local-specific; no VIONA 1:1 equivalent.',
  },
  {
    localStatus: 'COMPLETED',
    vionaStatusCandidates: ['completed'],
    directReuseSafe: false,
    semanticNote: 'VIONA completed is workflow terminal only — not ledger or settlement truth.',
  },
  {
    localStatus: 'REJECTED',
    vionaStatusCandidates: ['cancelled', 'failed'],
    directReuseSafe: false,
    semanticNote: 'Rejection reason and actor differ between Local merchant ops and VIONA operator flow.',
  },
  {
    localStatus: 'USER_CANCELLED',
    vionaStatusCandidates: ['cancelled'],
    directReuseSafe: false,
    semanticNote: 'User-initiated cancel; audit actor type must be recorded separately.',
  },
  {
    localStatus: 'OPS_CANCELLED',
    vionaStatusCandidates: ['cancelled', 'failed'],
    directReuseSafe: false,
    semanticNote: 'Ops cancel may map to cancelled or failed depending on protected-action context.',
  },
  {
    localStatus: 'EXPIRED',
    vionaStatusCandidates: ['failed', 'cancelled'],
    directReuseSafe: false,
    semanticNote: 'Expiry is Local SLA-driven; VIONA failed may allow return to draft.',
  },
] as const satisfies readonly VionaRequestLocalToVionaStatusMapping[];

export type VionaRequestHybridMappingContract = Readonly<{
  vionaRequestId: string;
  externalLinks: readonly VionaRequestExternalSourceLink[];
  mappingContractVersion: string;
  approved: false;
  directLocalReuseAllowed: false;
  note: string;
}>;

export type VionaRequestSourceOfTruthSignoffRequirement = Readonly<{
  gateId: 'founderArchitectSignoffOnSourceOfTruth';
  requiredRoles: readonly ['Executive Sponsor / Founder Delegate', 'Principal Architect'];
  blocks: readonly [
    'persistenceApiActive',
    'prismaSchemaActive',
    'auditLogActive',
    'requestMutationActive',
    'adminDebugUsesFixturesOnly flip',
  ];
  currentStatus: 'pending';
}>;

export const VIONA_REQUEST_SOURCE_OF_TRUTH_SIGNOFF_REQUIREMENT: VionaRequestSourceOfTruthSignoffRequirement =
  {
    gateId: 'founderArchitectSignoffOnSourceOfTruth',
    requiredRoles: ['Executive Sponsor / Founder Delegate', 'Principal Architect'],
    blocks: [
      'persistenceApiActive',
      'prismaSchemaActive',
      'auditLogActive',
      'requestMutationActive',
      'adminDebugUsesFixturesOnly flip',
    ],
    currentStatus: 'pending',
  };
