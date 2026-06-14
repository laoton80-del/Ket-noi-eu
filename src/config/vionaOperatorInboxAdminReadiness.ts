export const vionaOperatorInboxAdminMaturityLabels = [
  'referenceLabOnly',
  'adminDebugPreviewCandidate',
  'adminDebugPreviewReady',
  'productionBlocked',
] as const;

export type VionaOperatorInboxAdminMaturityLabel =
  (typeof vionaOperatorInboxAdminMaturityLabels)[number];

export const vionaOperatorInboxAdminSafetyFlags = [
  'requiresFeatureFlag',
  'requiresAdminRoleGate',
  'requiresOperatorRunbook',
  'requiresAuditLogBeforeMutation',
  'requiresPersistenceApiBeforeRealData',
  'requiresHumanConfirmationBeforeProtectedAction',
  'requiresMerchantOpsReadinessBeforePartnerExecution',
  'requiresPaymentReadinessBeforeMoneyMovement',
  'requiresSosLegalOpsReadinessBeforeEmergencyAction',
  'prohibitsAutonomousAiAction',
] as const;

export type VionaOperatorInboxAdminSafetyFlag =
  (typeof vionaOperatorInboxAdminSafetyFlags)[number];

export type VionaOperatorInboxAdminRoutePhase = Readonly<{
  id: string;
  label: string;
  maturity: VionaOperatorInboxAdminMaturityLabel;
  active: boolean;
  summary: string;
  requiredBeforePromotion: readonly string[];
  forbiddenPromotions: readonly string[];
}>;

export type VionaOperatorInboxAdminReadiness = Readonly<{
  pack: 'pack6';
  masterBaselineCommit: 'baa15b9';
  masterBaselinePr: '#60';
  currentMaturity: VionaOperatorInboxAdminMaturityLabel;
  currentPhaseId: string;
  referenceLabPreviewMerged: boolean;
  adminRouteActive: boolean;
  adminDebugPreviewRouteActive: boolean;
  persistenceAuditReadinessContractActive: boolean;
  /** Pack8 pointer — SoT/auth/tenant mapping contract; Admin Debug stays fixture-only. */
  sourceOfTruthMappingContractActive: boolean;
  adminDebugUsesFixturesOnly: boolean;
  productionLiveOpsActive: boolean;
  nextSafeTarget: string;
  appTsxRouteDeferred: boolean;
  persistenceApiActive: boolean;
  mutationsBlocked: boolean;
  safetyFlags: readonly VionaOperatorInboxAdminSafetyFlag[];
  requiredSafeCopy: readonly string[];
  forbiddenMerchantRouteTargets: readonly string[];
  nonGoals: readonly string[];
  futurePack6Recommendation: string;
}>;

export const VIONA_OPERATOR_INBOX_ADMIN_ROUTE_PHASES = [
  {
    id: 'referenceLabPreviewMerged',
    label: 'ReferenceLab operator preview merged',
    maturity: 'referenceLabOnly',
    active: false,
    summary:
      'Pack4 merged on master. Operator queue preview is ReferenceLab-only behind master and per-lab gates.',
    requiredBeforePromotion: [
      'Pack5 readiness contract documented',
      'Operator preview reviewed with safety copy',
      'No live admin route registration',
    ],
    forbiddenPromotions: [
      'Must not promote directly from ReferenceLab to live merchant execution',
      'Must not promote directly to payment, booking, SOS, wallet, or live AI',
      'Must not use LocalMerchantRequestInbox or TourismMerchantInbox as VIONA request-engine route',
    ],
  },
  {
    id: 'adminDebugPreviewCandidate',
    label: 'Admin Debug read-only preview candidate',
    maturity: 'adminDebugPreviewCandidate',
    active: true,
    summary:
      'Pack6 adds Admin Debug read-only operator route behind admin debug + dedicated preview flag + ADMIN role guard. Still no mutations.',
    requiredBeforePromotion: [
      'Dedicated feature flag required',
      'Admin role gate required',
      'Operator runbook required',
      'Read-only mode enforced',
      'Audit log plan documented before any mutation path',
    ],
    forbiddenPromotions: [
      'Must not wire live merchant execution',
      'Must not wire payment, booking, SOS dispatch, wallet mutation, or live AI action',
      'Must not skip human confirmation for protected actions',
    ],
  },
  {
    id: 'adminDebugPreviewReady',
    label: 'Admin Debug read-only preview ready',
    maturity: 'adminDebugPreviewReady',
    active: false,
    summary:
      'Admin Debug operator preview may render fixture or read-only API data after persistence gates pass.',
    requiredBeforePromotion: [
      'Request persistence/API source-of-truth approved',
      'Audit log for reads and transitions',
      'Human confirmation required before any future protected action',
      'Merchant ops readiness required before partner execution',
      'Payment readiness required before money movement',
      'SOS legal/ops readiness required before emergency-related action',
    ],
    forbiddenPromotions: [
      'Do not promote directly from admin preview to production live ops',
      'Do not enable autonomous protected action',
    ],
  },
  {
    id: 'productionLiveOps',
    label: 'Production live operator ops',
    maturity: 'productionBlocked',
    active: false,
    summary: 'Production/live operator execution remains blocked until all readiness gates pass.',
    requiredBeforePromotion: [
      'All Pack5 safety flags satisfied with evidence',
      'Owner signoff for ops, trust, payments, SOS, and AI safety',
      'Runbook and incident loop verified',
    ],
    forbiddenPromotions: [
      'Do not bypass audit log',
      'Do not bypass human confirmation for protected actions',
      'Do not claim payment captured, booking confirmed, or SOS dispatch without verified systems',
    ],
  },
] as const satisfies readonly VionaOperatorInboxAdminRoutePhase[];

export const VIONA_OPERATOR_INBOX_ADMIN_READINESS = {
  pack: 'pack6',
  masterBaselineCommit: 'baa15b9',
  masterBaselinePr: '#60',
  currentMaturity: 'adminDebugPreviewCandidate',
  currentPhaseId: 'adminDebugPreviewCandidate',
  referenceLabPreviewMerged: true,
  adminRouteActive: true,
  adminDebugPreviewRouteActive: true,
  persistenceAuditReadinessContractActive: true,
  sourceOfTruthMappingContractActive: true,
  adminDebugUsesFixturesOnly: true,
  productionLiveOpsActive: false,
  nextSafeTarget:
    'Source-of-truth/auth/tenant mapping contract (Pack8); Admin Debug remains fixture-only until SoT sign-off',
  appTsxRouteDeferred: false,
  persistenceApiActive: false,
  mutationsBlocked: true,
  safetyFlags: [
    'requiresFeatureFlag',
    'requiresAdminRoleGate',
    'requiresOperatorRunbook',
    'requiresAuditLogBeforeMutation',
    'requiresPersistenceApiBeforeRealData',
    'requiresHumanConfirmationBeforeProtectedAction',
    'requiresMerchantOpsReadinessBeforePartnerExecution',
    'requiresPaymentReadinessBeforeMoneyMovement',
    'requiresSosLegalOpsReadinessBeforeEmergencyAction',
    'prohibitsAutonomousAiAction',
  ],
  requiredSafeCopy: [
    'Admin Debug preview',
    'Read-only operator preview',
    'Fixture data only',
    'No payment captured',
    'Not booking confirmed',
    'No SOS dispatch',
    'No live merchant execution',
    'Human confirmation required before any future protected action',
    'API and persistence are future gates',
  ],
  forbiddenMerchantRouteTargets: ['LocalMerchantRequestInbox', 'TourismMerchantInbox'],
  nonGoals: [
    'No live admin operations in Pack6',
    'No API in Pack6',
    'No DB in Pack6',
    'No payment in Pack6',
    'No booking in Pack6',
    'No SOS dispatch in Pack6',
    'No wallet in Pack6',
    'No live AI in Pack6',
    'No merchant execution in Pack6',
    'No mutations in Pack6',
  ],
  futurePack6Recommendation:
    'Admin Debug read-only operator route is active behind flags; see Pack7 persistence/audit and Pack8 source-of-truth/auth/tenant mapping contracts for future persistence/API gates.',
} as const satisfies VionaOperatorInboxAdminReadiness;

export function getVionaOperatorInboxAdminReadiness(): VionaOperatorInboxAdminReadiness {
  return VIONA_OPERATOR_INBOX_ADMIN_READINESS;
}

export function getVionaOperatorInboxAdminRoutePhase(
  phaseId: string
): VionaOperatorInboxAdminRoutePhase | undefined {
  return VIONA_OPERATOR_INBOX_ADMIN_ROUTE_PHASES.find((phase) => phase.id === phaseId);
}

export function hasVionaOperatorInboxAdminSafetyFlag(
  flag: VionaOperatorInboxAdminSafetyFlag
): boolean {
  return VIONA_OPERATOR_INBOX_ADMIN_READINESS.safetyFlags.includes(flag);
}

export function isVionaOperatorInboxAdminRoutePromotionBlocked(): boolean {
  const readiness: VionaOperatorInboxAdminReadiness = VIONA_OPERATOR_INBOX_ADMIN_READINESS;
  if (readiness.productionLiveOpsActive) return true;
  if (readiness.currentMaturity === 'productionBlocked') return true;
  if (readiness.mutationsBlocked !== true) return true;
  if (readiness.persistenceApiActive) return true;
  return readiness.currentMaturity === 'referenceLabOnly';
}
