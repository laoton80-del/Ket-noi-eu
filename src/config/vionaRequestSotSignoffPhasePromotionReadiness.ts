import {
  VIONA_REQUEST_PHASE_PROMOTION_STAGES,
  type VionaRequestPhasePromotionStageId,
} from '../domain/requests/vionaRequestPhasePromotionContract';

export { VIONA_REQUEST_PHASE_PROMOTION_STAGES };

export const vionaRequestSotSignoffChecklistIds = [
  'sourceOfTruthOptionChosenByFounderArchitect',
  'dedicatedVionaRequestStoreRecommended',
  'directLocalServiceRequestReuseRejected',
  'hybridBridgeRequiresMappingContract',
  'operatorPolicyDecided',
  'operatorReadsRequireAdminEquivalentAndAuditRead',
  'tenantMatrixApprovedForServerEnforcement',
  'serverAuthSourceOfTruthApproved',
  'auditReadRequiredBeforeLiveOperatorReads',
  'appendOnlyAuditRequiredBeforeWrites',
  'idempotencyRequiredBeforeWrites',
  'humanConfirmationRequiredBeforeProtectedTransitions',
  'adminDebugStaysFixtureOnlyUntilExplicitPromotion',
  'noPaymentBookingSosWalletLiveAiInRequestEngine',
  'runbookOwnerIdentified',
] as const;

export type VionaRequestSotSignoffChecklistId =
  (typeof vionaRequestSotSignoffChecklistIds)[number];

export type VionaRequestSotSignoffChecklistItem = Readonly<{
  id: VionaRequestSotSignoffChecklistId;
  label: string;
  satisfied: false;
  requiresHumanSignoff: true;
}>;

export type VionaRequestSotSignoffPhasePromotionReadiness = Readonly<{
  pack: 'pack9';
  masterBaselineCommit: '26d6018';
  masterBaselinePr: '#63';
  currentPhaseId: 'sotSignoffPhasePromotionReadinessContract';
  sotSignoffReadinessContractActive: boolean;
  /** Pack10 pointer — founder/architect sign-off packet prepared. */
  founderArchitectSignoffPacketActive: boolean;
  /** Pack10C pointer — offline human approval recorded; Pack11 discovery only. */
  humanApprovalRecordActive: boolean;
  pack11DiscoveryPermitted: boolean;
  pack11SchemaDesignContractOnly: boolean;
  pack11Started: false;
  /** Pack11 pointer — dedicated store schema design contract; review required. */
  pack11DedicatedStoreSchemaDesignContractActive: boolean;
  schemaDesignContractCreated: boolean;
  schemaDesignReviewRequired: boolean;
  schemaDesignHumanApprovalRecorded: boolean;
  schemaDesignApprovedBy: 'Nong Si Buong';
  schemaDesignApprovalDate: '2026-06-15';
  schemaDesignApproved: boolean;
  pack12PlanningPermitted: boolean;
  pack12PlanningReadinessBoundaryOnly: boolean;
  pack12PrismaSchemaReadinessBoundaryActive: boolean;
  pack12PlanningStarted: boolean;
  pack12PlanningOnly: boolean;
  pack12ImplementationApproved: false;
  futurePrismaSchemaImplementationRequiresHumanApproval: boolean;
  pack12Started: false;
  signOffStatus: 'approved';
  sourceOfTruthDecisionSignedOff: true;
  selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore';
  recommendedSourceOfTruthOptionId: 'dedicatedVionaRequestStore';
  founderSignoffRecorded: true;
  architectSignoffRecorded: true;
  authSessionSourceOfTruthApproved: false;
  tenantAccessMatrixApprovedForLiveApi: false;
  operatorPolicyResolved: false;
  operatorRoleAddedToAuth: false;
  readOnlyApiPhasePromoted: false;
  persistenceApiActive: false;
  prismaSchemaActive: false;
  auditLogActive: false;
  requestMutationActive: false;
  productionLiveOpsActive: false;
  adminDebugUsesFixturesOnly: true;
  agentMayFlipSignoff: false;
  signoffChecklist: readonly VionaRequestSotSignoffChecklistItem[];
  phasePromotionStages: typeof VIONA_REQUEST_PHASE_PROMOTION_STAGES;
  requiredSafeCopy: readonly string[];
  forbiddenPromotions: readonly string[];
  nonGoals: readonly string[];
}>;

export const VIONA_REQUEST_SOT_SIGNOFF_CHECKLIST = [
  {
    id: 'sourceOfTruthOptionChosenByFounderArchitect',
    label: 'Source-of-truth option chosen by founder/architect',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'dedicatedVionaRequestStoreRecommended',
    label: 'Dedicated VIONA Request Store recommended as long-term candidate',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'directLocalServiceRequestReuseRejected',
    label: 'Direct LocalServiceRequest reuse rejected',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'hybridBridgeRequiresMappingContract',
    label: 'Hybrid bridge requires explicit mapping/link contract',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'operatorPolicyDecided',
    label: 'OPERATOR policy decided (ADMIN-equivalent alias until Prisma role exists)',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'operatorReadsRequireAdminEquivalentAndAuditRead',
    label: 'Until OPERATOR exists, operator reads require ADMIN-equivalent server gate + auditRead',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'tenantMatrixApprovedForServerEnforcement',
    label: 'Tenant matrix approved for server enforcement',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'serverAuthSourceOfTruthApproved',
    label: 'Server auth source-of-truth approved',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'auditReadRequiredBeforeLiveOperatorReads',
    label: 'auditRead required before live operator reads',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'appendOnlyAuditRequiredBeforeWrites',
    label: 'Append-only audit required before writes',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'idempotencyRequiredBeforeWrites',
    label: 'Idempotency required before writes',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'humanConfirmationRequiredBeforeProtectedTransitions',
    label: 'Human confirmation required before protected transitions',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'adminDebugStaysFixtureOnlyUntilExplicitPromotion',
    label: 'Admin Debug stays fixture-only until explicit promotion',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'noPaymentBookingSosWalletLiveAiInRequestEngine',
    label: 'No payment/booking/SOS/wallet/live AI behavior in Request Engine pack',
    satisfied: false,
    requiresHumanSignoff: true,
  },
  {
    id: 'runbookOwnerIdentified',
    label: 'Runbook owner identified',
    satisfied: false,
    requiresHumanSignoff: true,
  },
] as const satisfies readonly VionaRequestSotSignoffChecklistItem[];

export const VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS = {
  pack: 'pack9',
  masterBaselineCommit: '26d6018',
  masterBaselinePr: '#63',
  currentPhaseId: 'sotSignoffPhasePromotionReadinessContract',
  sotSignoffReadinessContractActive: true,
  founderArchitectSignoffPacketActive: true,
  humanApprovalRecordActive: true,
  pack11DiscoveryPermitted: true,
  pack11SchemaDesignContractOnly: true,
  pack11Started: false,
  pack11DedicatedStoreSchemaDesignContractActive: true,
  schemaDesignContractCreated: true,
  schemaDesignReviewRequired: false,
  schemaDesignHumanApprovalRecorded: true,
  schemaDesignApprovedBy: 'Nong Si Buong',
  schemaDesignApprovalDate: '2026-06-15',
  schemaDesignApproved: true,
  pack12PlanningPermitted: true,
  pack12PlanningReadinessBoundaryOnly: true,
  pack12PrismaSchemaReadinessBoundaryActive: true,
  pack12PlanningStarted: true,
  pack12PlanningOnly: true,
  pack12ImplementationApproved: false,
  futurePrismaSchemaImplementationRequiresHumanApproval: true,
  pack12Started: false,
  signOffStatus: 'approved',
  sourceOfTruthDecisionSignedOff: true,
  selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore',
  recommendedSourceOfTruthOptionId: 'dedicatedVionaRequestStore',
  founderSignoffRecorded: true,
  architectSignoffRecorded: true,
  authSessionSourceOfTruthApproved: false,
  tenantAccessMatrixApprovedForLiveApi: false,
  operatorPolicyResolved: false,
  operatorRoleAddedToAuth: false,
  readOnlyApiPhasePromoted: false,
  persistenceApiActive: false,
  prismaSchemaActive: false,
  auditLogActive: false,
  requestMutationActive: false,
  productionLiveOpsActive: false,
  adminDebugUsesFixturesOnly: true,
  agentMayFlipSignoff: false,
  signoffChecklist: VIONA_REQUEST_SOT_SIGNOFF_CHECKLIST,
  phasePromotionStages: VIONA_REQUEST_PHASE_PROMOTION_STAGES,
  requiredSafeCopy: [
    'Source-of-truth sign-off phase promotion readiness contract',
    'Human approval recorded — Pack11 discovery only',
    'Fixture-only Admin Debug preview remains unchanged',
    'API and persistence are future gates',
    'No database schema or migration in this pack',
    'No payment captured',
    'Not booking confirmed',
    'No SOS dispatch',
    'No live merchant execution',
    'Human confirmation required before any future protected action',
    'Audit log is not a ledger',
    'LocalServiceRequest is reference-only',
    'Direct LocalServiceRequest reuse is not allowed',
    'Client-only role checks are not sufficient for persistence APIs',
    'Cursor/agent cannot flip source-of-truth sign-off',
  ],
  forbiddenPromotions: [
    'Do not flip sourceOfTruthDecisionSignedOff in Pack9',
    'Do not add API routes in Pack9',
    'Do not add DB schema/migrations in Pack9',
    'Do not add persistence adapter in Pack9',
    'Do not wire Admin Debug preview to REST/Prisma in Pack9',
    'Do not add OPERATOR to Prisma or client auth in Pack9',
    'Do not map LocalServiceRequest directly to VIONA Request Engine without mapping contract',
    'Do not add payment/booking/SOS/wallet/live AI behavior in Pack9',
  ],
  nonGoals: [
    'No API in Pack9',
    'No DB in Pack9',
    'No Prisma migration in Pack9',
    'No persistence adapter in Pack9',
    'No request writes in Pack9',
    'No Admin Debug data-source change in Pack9',
    'No founder/architect sign-off flip in Pack9',
    'No payment in Pack9',
    'No booking in Pack9',
    'No SOS dispatch in Pack9',
    'No wallet in Pack9',
    'No live AI in Pack9',
    'No merchant execution in Pack9',
  ],
} as const satisfies VionaRequestSotSignoffPhasePromotionReadiness;

export function getVionaRequestSotSignoffPhasePromotionReadiness(): VionaRequestSotSignoffPhasePromotionReadiness {
  return VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS;
}

export function getVionaRequestPhasePromotionStage(
  stageId: VionaRequestPhasePromotionStageId
): (typeof VIONA_REQUEST_PHASE_PROMOTION_STAGES)[number] | undefined {
  return VIONA_REQUEST_PHASE_PROMOTION_STAGES.find((stage) => stage.id === stageId);
}

export function isVionaRequestSotSignoffPromotionBlocked(): boolean {
  const readiness = VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS;
  if (readiness.productionLiveOpsActive) return true;
  if (readiness.persistenceApiActive) return true;
  if (readiness.prismaSchemaActive) return true;
  if (readiness.requestMutationActive) return true;
  if (readiness.readOnlyApiPhasePromoted) return true;
  if (readiness.sourceOfTruthDecisionSignedOff) return false;
  return true;
}
