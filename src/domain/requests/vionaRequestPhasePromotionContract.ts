export const vionaRequestPhasePromotionStageIds = [
  'fixtureOnlyAdminDebugPreview',
  'persistenceAuditReadinessContract',
  'sourceOfTruthAuthTenantMappingContract',
  'sotSignoffPhasePromotionReadinessContract',
  'futureFounderArchitectSignedSourceOfTruth',
  'futureDedicatedStoreSchemaDesignCandidate',
  'futureReadOnlyPersistenceApiCandidate',
  'futureAuditReadImplementationCandidate',
  'futureMutationCandidateBlocked',
] as const;

export type VionaRequestPhasePromotionStageId =
  (typeof vionaRequestPhasePromotionStageIds)[number];

export type VionaRequestPhasePromotionStatus = 'pending' | 'active' | 'blocked' | 'future';

export type VionaRequestPhasePromotionGate =
  | 'founderArchitectSignoffRequired'
  | 'serverAuthSourceOfTruthRequired'
  | 'tenantAccessMatrixApprovedRequired'
  | 'operatorPolicyResolvedRequired'
  | 'auditReadBeforeLiveReadsRequired'
  | 'appendOnlyAuditBeforeWritesRequired'
  | 'idempotencyBeforeWritesRequired'
  | 'humanConfirmationBeforeProtectedActionsRequired'
  | 'dedicatedStoreSchemaDesignApprovedRequired'
  | 'noLocalServiceRequestDirectReuse'
  | 'adminDebugFixtureOnlyUntilExplicitPromotion'
  | 'noPaymentBookingSosWalletLiveAiInRequestEngine';

export const vionaRequestSotSignoffRoleIds = [
  'founder',
  'principalArchitect',
  'productOwner',
  'safetyOwner',
  'opsRunbookOwner',
] as const;

export type VionaRequestSotSignoffRoleId = (typeof vionaRequestSotSignoffRoleIds)[number];

export type VionaRequestSotSignoffRole = Readonly<{
  id: VionaRequestSotSignoffRoleId;
  operatingProtocolRole: string;
  requiredForSoTSignoff: boolean;
  note: string;
}>;

export const VIONA_REQUEST_SOT_SIGNOFF_ROLES = [
  {
    id: 'founder',
    operatingProtocolRole: 'Executive Sponsor / Founder Delegate',
    requiredForSoTSignoff: true,
    note: 'Must approve source-of-truth direction and commercial posture.',
  },
  {
    id: 'principalArchitect',
    operatingProtocolRole: 'Principal Architect',
    requiredForSoTSignoff: true,
    note: 'Must approve dedicated store vs hybrid architecture and phase boundaries.',
  },
  {
    id: 'productOwner',
    operatingProtocolRole: 'Chief Product Officer (CPO) Surface Owner',
    requiredForSoTSignoff: false,
    note: 'Reviews demo/pilot/live truth for operator surfaces.',
  },
  {
    id: 'safetyOwner',
    operatingProtocolRole: 'Trust & Safety Lead (Product + UX)',
    requiredForSoTSignoff: false,
    note: 'Reviews tenant isolation and no-fake-production boundaries.',
  },
  {
    id: 'opsRunbookOwner',
    operatingProtocolRole: 'Operations / Incident Commander',
    requiredForSoTSignoff: true,
    note: 'Must be identified before any live operator persistence reads.',
  },
] as const satisfies readonly VionaRequestSotSignoffRole[];

export type VionaRequestSotSignoffChecklistItem = Readonly<{
  id: string;
  label: string;
  required: true;
  satisfied: false;
  blocksPromotionUntilHumanSignoff: true;
}>;

export type VionaRequestSotSignoffRecord = Readonly<{
  signOffStatus: 'pending';
  sourceOfTruthDecisionSignedOff: false;
  selectedSourceOfTruthOptionId: null;
  recommendedSourceOfTruthOptionId: 'dedicatedVionaRequestStore';
  founderSignoffRecorded: false;
  architectSignoffRecorded: false;
  agentOrCursorMayFlipSignoff: false;
  note: string;
}>;

export type VionaRequestPhasePromotionStage = Readonly<{
  id: VionaRequestPhasePromotionStageId;
  label: string;
  status: VionaRequestPhasePromotionStatus;
  active: boolean;
  summary: string;
  requiredBeforePromotion: readonly string[];
  forbiddenPromotions: readonly string[];
  gates: readonly VionaRequestPhasePromotionGate[];
}>;

export type VionaRequestPhasePromotionContract = Readonly<{
  signOffRecord: VionaRequestSotSignoffRecord;
  signOffRoles: readonly VionaRequestSotSignoffRole[];
  stages: readonly VionaRequestPhasePromotionStage[];
  readOnlyApiPrerequisites: readonly string[];
  writeBlockers: readonly string[];
  agentSignoffForbidden: true;
}>;

export const VIONA_REQUEST_SOT_SIGNOFF_RECORD: VionaRequestSotSignoffRecord = {
  signOffStatus: 'pending',
  sourceOfTruthDecisionSignedOff: false,
  selectedSourceOfTruthOptionId: null,
  recommendedSourceOfTruthOptionId: 'dedicatedVionaRequestStore',
  founderSignoffRecorded: false,
  architectSignoffRecorded: false,
  agentOrCursorMayFlipSignoff: false,
  note:
    'Sign-off is pending. Cursor/agent packs must not flip sourceOfTruthDecisionSignedOff or activate chosen SoT.',
} as const;

export const VIONA_REQUEST_PHASE_PROMOTION_STAGES = [
  {
    id: 'fixtureOnlyAdminDebugPreview',
    label: 'Fixture-only Admin Debug preview',
    status: 'active',
    active: true,
    summary: 'Pack6 Admin Debug operator inbox uses Pack2 fixtures only.',
    requiredBeforePromotion: ['Pack7 persistence audit readiness contract'],
    forbiddenPromotions: ['Must not wire Admin Debug to REST or Prisma'],
    gates: ['adminDebugFixtureOnlyUntilExplicitPromotion'],
  },
  {
    id: 'persistenceAuditReadinessContract',
    label: 'Persistence and audit readiness contract',
    status: 'active',
    active: true,
    summary: 'Pack7 pure audit/persistence contracts without backend activation.',
    requiredBeforePromotion: ['Pack8 source-of-truth/auth/tenant mapping contract'],
    forbiddenPromotions: ['Must not add API or DB in Pack7'],
    gates: ['appendOnlyAuditBeforeWritesRequired', 'idempotencyBeforeWritesRequired'],
  },
  {
    id: 'sourceOfTruthAuthTenantMappingContract',
    label: 'Source-of-truth auth tenant mapping contract',
    status: 'active',
    active: true,
    summary: 'Pack8 SoT candidates, Local reference mapping, role/tenant access matrix.',
    requiredBeforePromotion: ['Pack9 sign-off phase promotion readiness contract'],
    forbiddenPromotions: ['Must not map LocalServiceRequest directly without contract'],
    gates: ['noLocalServiceRequestDirectReuse', 'operatorPolicyResolvedRequired'],
  },
  {
    id: 'sotSignoffPhasePromotionReadinessContract',
    label: 'SoT sign-off phase promotion readiness contract',
    status: 'active',
    active: true,
    summary: 'Pack9 formalizes founder/architect sign-off checklist and future phase gates.',
    requiredBeforePromotion: [
      'Founder/architect human sign-off on source-of-truth',
      'Dedicated store field manifest reviewed',
    ],
    forbiddenPromotions: [
      'Must not flip sourceOfTruthDecisionSignedOff in Pack9',
      'Must not add API, DB, Prisma, adapter, or mutation',
    ],
    gates: ['founderArchitectSignoffRequired', 'adminDebugFixtureOnlyUntilExplicitPromotion'],
  },
  {
    id: 'futureFounderArchitectSignedSourceOfTruth',
    label: 'Founder/architect signed source-of-truth',
    status: 'future',
    active: false,
    summary: 'Future: human sign-off records chosen SoT option. Not active in Pack9.',
    requiredBeforePromotion: [
      'founderSignoffRecorded and architectSignoffRecorded',
      'selectedSourceOfTruthOptionId set by humans',
    ],
    forbiddenPromotions: ['Must not be signed off by Cursor/agent'],
    gates: ['founderArchitectSignoffRequired'],
  },
  {
    id: 'futureDedicatedStoreSchemaDesignCandidate',
    label: 'Dedicated store schema design candidate',
    status: 'future',
    active: false,
    summary: 'Future: Prisma schema design pack after sign-off. Field manifest is not schema.',
    requiredBeforePromotion: ['sourceOfTruthDecisionSignedOff', 'schemaDesignApproved'],
    forbiddenPromotions: ['Must not add Prisma migration in sign-off readiness pack'],
    gates: ['dedicatedStoreSchemaDesignApprovedRequired', 'noLocalServiceRequestDirectReuse'],
  },
  {
    id: 'futureReadOnlyPersistenceApiCandidate',
    label: 'Read-only persistence API candidate',
    status: 'future',
    active: false,
    summary: 'Future: read-only API after server auth, tenant scope, auditRead, and dedicated store plan.',
    requiredBeforePromotion: [
      'Server auth source-of-truth implemented',
      'Tenant access matrix approved for live API',
      'auditRead before live operator reads',
      'Repository adapter implementing VionaRequestRepositoryContract',
    ],
    forbiddenPromotions: ['Must not enable status writes before append-only audit'],
    gates: [
      'serverAuthSourceOfTruthRequired',
      'tenantAccessMatrixApprovedRequired',
      'auditReadBeforeLiveReadsRequired',
    ],
  },
  {
    id: 'futureAuditReadImplementationCandidate',
    label: 'Audit read implementation candidate',
    status: 'future',
    active: false,
    summary: 'Future: auditRead logging for operator list/detail reads.',
    requiredBeforePromotion: ['Append-only audit store or equivalent'],
    forbiddenPromotions: ['Must not treat audit log as ledger'],
    gates: ['auditReadBeforeLiveReadsRequired'],
  },
  {
    id: 'futureMutationCandidateBlocked',
    label: 'Mutation candidate blocked',
    status: 'blocked',
    active: false,
    summary: 'Future status writes remain blocked until audit, idempotency, human confirmation, ops readiness.',
    requiredBeforePromotion: [
      'Append-only audit live',
      'Idempotency for writes live',
      'Human confirmation records for protected transitions',
      'Ops runbook owner signoff',
    ],
    forbiddenPromotions: [
      'Must not bypass human confirmation',
      'Must not enable payment/booking/SOS/wallet/live AI in Request Engine',
    ],
    gates: [
      'appendOnlyAuditBeforeWritesRequired',
      'idempotencyBeforeWritesRequired',
      'humanConfirmationBeforeProtectedActionsRequired',
      'noPaymentBookingSosWalletLiveAiInRequestEngine',
    ],
  },
] as const satisfies readonly VionaRequestPhasePromotionStage[];

export const VIONA_REQUEST_PHASE_PROMOTION_CONTRACT: VionaRequestPhasePromotionContract = {
  signOffRecord: VIONA_REQUEST_SOT_SIGNOFF_RECORD,
  signOffRoles: VIONA_REQUEST_SOT_SIGNOFF_ROLES,
  stages: VIONA_REQUEST_PHASE_PROMOTION_STAGES,
  readOnlyApiPrerequisites: [
    'sourceOfTruthDecisionSignedOff by founder/architect (human only)',
    'Server JWT + Prisma role enforcement for all persistence reads',
    'Tenant access matrix approved and server-enforced',
    'OPERATOR policy: ADMIN-equivalent server gate + auditRead until Prisma OPERATOR exists',
    'auditRead event before live operator list/detail reads',
    'Dedicated store schema design approved in separate post-sign-off pack',
    'No LocalOpsAudit API or merchant inbox API reuse',
  ],
  writeBlockers: [
    'Append-only audit log before status writes',
    'Idempotency keys before durable writes',
    'Human confirmation before protected transitions',
    'Ops runbook owner signoff',
    'Audit log is not ledger or payment truth',
  ],
  agentSignoffForbidden: true,
} as const;

export type VionaRequestRecommendedSoT = 'dedicatedVionaRequestStore';
