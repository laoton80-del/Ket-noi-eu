export const vionaRequestPersistenceAuditPhaseIds = [
  'fixtureOnlyAdminDebugPreview',
  'persistenceAuditReadinessContract',
  'persistenceSourceOfTruthApproved',
  'persistenceApiReadOnlyCandidate',
  'persistenceMutationBlocked',
] as const;

export type VionaRequestPersistenceAuditPhaseId =
  (typeof vionaRequestPersistenceAuditPhaseIds)[number];

export const vionaRequestPersistenceAuditFutureGateIds = [
  'sourceOfTruthDecisionRequired',
  'authSessionSourceOfTruthRequired',
  'adminOperatorReadScopeRequired',
  'merchantTenantIsolationRequiredBeforePartnerViews',
  'appendOnlyAuditLogRequiredBeforeMutation',
  'immutableStatusTransitionLogRequiredBeforeStatusWrites',
  'idempotencyRequiredBeforeWrites',
  'humanConfirmationRequiredBeforeProtectedActions',
  'runbookOwnerRequiredBeforeOps',
  'paymentReadinessRequiredBeforePaymentCapture',
  'bookingReadinessRequiredBeforeBookingConfirmation',
  'sosLegalOpsReadinessRequiredBeforeEmergencyAction',
  'walletReadinessRequiredBeforeWalletMutation',
  'autonomousProtectedAiActionProhibited',
] as const;

export type VionaRequestPersistenceAuditFutureGateId =
  (typeof vionaRequestPersistenceAuditFutureGateIds)[number];

export type VionaRequestPersistenceAuditPhase = Readonly<{
  id: VionaRequestPersistenceAuditPhaseId;
  label: string;
  active: boolean;
  summary: string;
  requiredBeforePromotion: readonly string[];
  forbiddenPromotions: readonly string[];
}>;

export type VionaRequestPersistenceAuditReadiness = Readonly<{
  pack: 'pack7';
  masterBaselineCommit: '8f47574';
  masterBaselinePr: '#61';
  currentPhaseId: VionaRequestPersistenceAuditPhaseId;
  fixtureOnlyAdminDebugPreview: boolean;
  persistenceAuditReadinessContract: boolean;
  persistenceApiActive: boolean;
  prismaSchemaActive: boolean;
  auditLogActive: boolean;
  requestMutationActive: boolean;
  productionLiveOpsActive: boolean;
  futureGates: readonly VionaRequestPersistenceAuditFutureGateId[];
  requiredSafeCopy: readonly string[];
  forbiddenPromotions: readonly string[];
  nonGoals: readonly string[];
  localAuditReferenceOnlyNote: string;
}>;

export const VIONA_REQUEST_PERSISTENCE_AUDIT_PHASES = [
  {
    id: 'fixtureOnlyAdminDebugPreview',
    label: 'Fixture-only Admin Debug preview',
    active: true,
    summary:
      'Pack6 Admin Debug operator inbox preview uses Pack2 fixtures only. No API, DB, or persistence reads.',
    requiredBeforePromotion: [
      'Pack7 persistence/audit readiness contract documented',
      'Pure domain audit/persistence contracts defined',
      'No Admin Debug data-source change',
    ],
    forbiddenPromotions: [
      'Must not wire Admin Debug preview to REST or Prisma',
      'Must not use LocalOpsAudit API as VIONA operator inbox source',
    ],
  },
  {
    id: 'persistenceAuditReadinessContract',
    label: 'Persistence and audit readiness contract',
    active: true,
    summary:
      'Pack7 documents future source-of-truth, audit, role/tenant, and human-confirmation gates without backend activation.',
    requiredBeforePromotion: [
      'Source-of-truth decision documented',
      'Auth/session SoT documented',
      'Append-only audit log requirements documented',
      'Local-to-VIONA mapping contract deferred to future pack',
    ],
    forbiddenPromotions: [
      'Must not add API routes in Pack7',
      'Must not add DB schema or migrations in Pack7',
      'Must not add request mutation in Pack7',
    ],
  },
  {
    id: 'persistenceSourceOfTruthApproved',
    label: 'Persistence source-of-truth approved',
    active: false,
    summary: 'Future: cross-universe VIONA Request Engine SoT chosen and signed off.',
    requiredBeforePromotion: [
      'Source-of-truth architecture approved',
      'LocalServiceRequest mapping contract approved if converging',
      'Tenant/merchant ownership model approved',
    ],
    forbiddenPromotions: [
      'Must not map LocalServiceRequest directly without mapping contract',
      'Must not treat Local Prisma models as VIONA Request Engine SoT by default',
    ],
  },
  {
    id: 'persistenceApiReadOnlyCandidate',
    label: 'Persistence API read-only candidate',
    active: false,
    summary: 'Future: read-only persistence/API for operator preview after audit read gates pass.',
    requiredBeforePromotion: [
      'Auth/session source-of-truth implemented',
      'Admin/operator read scope enforced',
      'Audit log for reads documented and implemented',
    ],
    forbiddenPromotions: [
      'Must not enable status writes before audit log',
      'Must not enable merchant execution',
    ],
  },
  {
    id: 'persistenceMutationBlocked',
    label: 'Persistence mutation blocked',
    active: false,
    summary: 'Future status writes remain blocked until audit, idempotency, and human confirmation gates pass.',
    requiredBeforePromotion: [
      'Append-only audit log live',
      'Immutable status transition tracking live',
      'Idempotency for writes live',
      'Human confirmation records for protected actions',
      'Operator runbook and owner signoff',
    ],
    forbiddenPromotions: [
      'Must not bypass human confirmation for protected actions',
      'Must not treat audit log as ledger or payment truth',
      'Must not enable autonomous protected AI action',
    ],
  },
] as const satisfies readonly VionaRequestPersistenceAuditPhase[];

export const VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS = {
  pack: 'pack7',
  masterBaselineCommit: '8f47574',
  masterBaselinePr: '#61',
  currentPhaseId: 'persistenceAuditReadinessContract',
  fixtureOnlyAdminDebugPreview: true,
  persistenceAuditReadinessContract: true,
  persistenceApiActive: false,
  prismaSchemaActive: false,
  auditLogActive: false,
  requestMutationActive: false,
  productionLiveOpsActive: false,
  futureGates: [
    'sourceOfTruthDecisionRequired',
    'authSessionSourceOfTruthRequired',
    'adminOperatorReadScopeRequired',
    'merchantTenantIsolationRequiredBeforePartnerViews',
    'appendOnlyAuditLogRequiredBeforeMutation',
    'immutableStatusTransitionLogRequiredBeforeStatusWrites',
    'idempotencyRequiredBeforeWrites',
    'humanConfirmationRequiredBeforeProtectedActions',
    'runbookOwnerRequiredBeforeOps',
    'paymentReadinessRequiredBeforePaymentCapture',
    'bookingReadinessRequiredBeforeBookingConfirmation',
    'sosLegalOpsReadinessRequiredBeforeEmergencyAction',
    'walletReadinessRequiredBeforeWalletMutation',
    'autonomousProtectedAiActionProhibited',
  ],
  requiredSafeCopy: [
    'Persistence and audit readiness contract',
    'Fixture-only Admin Debug preview remains unchanged',
    'API and persistence are future gates',
    'No database schema or migration in this pack',
    'No payment captured',
    'Not booking confirmed',
    'No SOS dispatch',
    'No live merchant execution',
    'Human confirmation required before any future protected action',
    'Audit log is not a ledger',
  ],
  forbiddenPromotions: [
    'Do not map LocalServiceRequest directly to VIONA Request Engine without mapping contract',
    'Do not use LocalOpsAudit API as VIONA operator inbox source',
    'Do not wire Admin Debug preview to REST/Prisma in Pack7',
    'Do not add API routes in Pack7',
    'Do not add DB schema/migrations in Pack7',
    'Do not add request mutation in Pack7',
    'Do not add merchant execution in Pack7',
    'Do not add payment/booking/SOS/wallet/live AI behavior in Pack7',
  ],
  nonGoals: [
    'No API in Pack7',
    'No DB in Pack7',
    'No Prisma migration in Pack7',
    'No request writes in Pack7',
    'No Admin Debug data-source change in Pack7',
    'No payment in Pack7',
    'No booking in Pack7',
    'No SOS dispatch in Pack7',
    'No wallet in Pack7',
    'No live AI in Pack7',
    'No merchant execution in Pack7',
  ],
  localAuditReferenceOnlyNote:
    'LocalServiceRequest and LocalServiceRequestAuditEvent are reference models only; VIONA Request Engine source-of-truth is not chosen yet.',
} as const satisfies VionaRequestPersistenceAuditReadiness;

export function getVionaRequestPersistenceAuditReadiness(): VionaRequestPersistenceAuditReadiness {
  return VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS;
}

export function getVionaRequestPersistenceAuditPhase(
  phaseId: VionaRequestPersistenceAuditPhaseId
): VionaRequestPersistenceAuditPhase | undefined {
  return VIONA_REQUEST_PERSISTENCE_AUDIT_PHASES.find((phase) => phase.id === phaseId);
}

export function hasVionaRequestPersistenceAuditFutureGate(
  gateId: VionaRequestPersistenceAuditFutureGateId
): boolean {
  return VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS.futureGates.includes(gateId);
}

export function isVionaRequestPersistencePromotionBlocked(): boolean {
  const readiness = VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS;
  if (readiness.productionLiveOpsActive) return true;
  if (readiness.persistenceApiActive) return true;
  if (readiness.prismaSchemaActive) return true;
  if (readiness.auditLogActive && readiness.requestMutationActive) return true;
  if (readiness.requestMutationActive) return true;
  return !readiness.persistenceAuditReadinessContract;
}
