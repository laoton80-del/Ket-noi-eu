import type { VionaRequestUniverse } from './vionaRequestTypes';

/**
 * Server-side auth roles for VIONA Request Engine persistence reads.
 * OPERATOR is a planned ops role — not yet in Prisma Role enum or ServerUserRole.
 */
export type VionaRequestPersistenceServerRole = 'ADMIN' | 'OPERATOR';

/**
 * Prisma/client roles that exist today. Reference for mapping policy only.
 */
export type VionaRequestExistingPrismaRole =
  | 'B2C'
  | 'B2B'
  | 'B2B_EU'
  | 'B2B_VN'
  | 'ADMIN'
  | 'BROKER';

export type VionaRequestOperatorRolePolicy = Readonly<{
  operatorRoleResolved: false;
  prismaRoleExists: false;
  interimPolicy: string;
  serverEnforcementRequired: true;
  clientServerRoleGuardInsufficient: true;
}>;

export const VIONA_REQUEST_OPERATOR_ROLE_POLICY: VionaRequestOperatorRolePolicy = {
  operatorRoleResolved: false,
  prismaRoleExists: false,
  interimPolicy:
    'Until OPERATOR is added to Prisma Role and server middleware, treat OPERATOR reads as ADMIN-equivalent with auditRead logging and runbook sign-off. Do not invent client-only OPERATOR bypass.',
  serverEnforcementRequired: true,
  clientServerRoleGuardInsufficient: true,
};

export type VionaRequestTenantScopeKind =
  | 'globalOps'
  | 'requesterOwned'
  | 'merchantBusinessOwned'
  | 'partnerAssigned'
  | 'none';

export type VionaRequestAccessAction =
  | 'listRequests'
  | 'getRequestById'
  | 'listAuditEvents'
  | 'proposeStatusTransition'
  | 'appendAuditEvent';

export type VionaRequestRoleTenantAccessRule = Readonly<{
  actorRole: VionaRequestPersistenceServerRole | VionaRequestExistingPrismaRole | 'requester';
  tenantScope: VionaRequestTenantScopeKind;
  allowedUniverses: readonly VionaRequestUniverse[] | 'allWithFilter';
  allowedActions: readonly VionaRequestAccessAction[];
  requiresAuditRead: boolean;
  requiresHumanConfirmationForWrites: boolean;
  blockedUntilGate: readonly string[];
  note: string;
}>;

export const VIONA_REQUEST_ROLE_TENANT_ACCESS_MATRIX = [
  {
    actorRole: 'ADMIN',
    tenantScope: 'globalOps',
    allowedUniverses: 'allWithFilter',
    allowedActions: ['listRequests', 'getRequestById', 'listAuditEvents'],
    requiresAuditRead: true,
    requiresHumanConfirmationForWrites: true,
    blockedUntilGate: [
      'founderArchitectSignoffOnSourceOfTruth',
      'serverSideAuthSourceOfTruthRequired',
      'auditReadEventBeforeLiveOperatorReads',
      'universeFilterOnGlobalOpsReadsRequired',
    ],
    note: 'Global ops reads require universeFilter and superAdminMiddleware-equivalent server gate — not client-only ADMIN check.',
  },
  {
    actorRole: 'OPERATOR',
    tenantScope: 'globalOps',
    allowedUniverses: 'allWithFilter',
    allowedActions: ['listRequests', 'getRequestById', 'listAuditEvents'],
    requiresAuditRead: true,
    requiresHumanConfirmationForWrites: true,
    blockedUntilGate: ['adminOperatorRolePolicyRequired', 'operatorRoleResolved'],
    note: 'OPERATOR policy unresolved. Interim: same server gate as ADMIN with explicit auditRead until role exists in Prisma.',
  },
  {
    actorRole: 'B2B',
    tenantScope: 'merchantBusinessOwned',
    allowedUniverses: ['local', 'business'],
    allowedActions: ['listRequests', 'getRequestById'],
    requiresAuditRead: true,
    requiresHumanConfirmationForWrites: true,
    blockedUntilGate: [
      'merchantTenantIsolationRequired',
      'noLocalMerchantInboxReuse',
    ],
    note: 'Merchant scope via businessId IN owned businesses (Business.ownerId). Must not reuse LocalMerchantRequestInbox API as VIONA source.',
  },
  {
    actorRole: 'B2B_EU',
    tenantScope: 'merchantBusinessOwned',
    allowedUniverses: ['local', 'business'],
    allowedActions: ['listRequests', 'getRequestById'],
    requiresAuditRead: true,
    requiresHumanConfirmationForWrites: true,
    blockedUntilGate: ['merchantTenantIsolationRequired'],
    note: 'Same businessId isolation as B2B.',
  },
  {
    actorRole: 'B2B_VN',
    tenantScope: 'merchantBusinessOwned',
    allowedUniverses: ['local', 'business'],
    allowedActions: ['listRequests', 'getRequestById'],
    requiresAuditRead: true,
    requiresHumanConfirmationForWrites: true,
    blockedUntilGate: ['merchantTenantIsolationRequired'],
    note: 'Same businessId isolation as B2B.',
  },
  {
    actorRole: 'requester',
    tenantScope: 'requesterOwned',
    allowedUniverses: 'allWithFilter',
    allowedActions: ['listRequests', 'getRequestById', 'listAuditEvents'],
    requiresAuditRead: false,
    requiresHumanConfirmationForWrites: true,
    blockedUntilGate: ['requesterOwnershipRequired'],
    note: 'requesterUserId === authUserId. VionaRequestRecord lacks requesterUserId until persistence pack.',
  },
  {
    actorRole: 'B2C',
    tenantScope: 'requesterOwned',
    allowedUniverses: 'allWithFilter',
    allowedActions: ['listRequests', 'getRequestById'],
    requiresAuditRead: false,
    requiresHumanConfirmationForWrites: true,
    blockedUntilGate: ['requesterOwnershipRequired'],
    note: 'B2C maps to requester scope when acting on own requests.',
  },
  {
    actorRole: 'BROKER',
    tenantScope: 'none',
    allowedUniverses: [],
    allowedActions: [],
    requiresAuditRead: false,
    requiresHumanConfirmationForWrites: true,
    blockedUntilGate: ['partnerExplicitAssignmentRequired'],
    note: 'Broker has no default VIONA request inbox access. Partner views require explicit assignment.',
  },
] as const satisfies readonly VionaRequestRoleTenantAccessRule[];

export type VionaRequestCrossUniverseLeakRisk = Readonly<{
  id: string;
  risk: string;
  mitigation: string;
}>;

export const VIONA_REQUEST_CROSS_UNIVERSE_LEAK_RISKS = [
  {
    id: 'global-list-without-universe-filter',
    risk: 'Operator list without universeFilter exposes cross-universe and cross-merchant data.',
    mitigation: 'Require universeFilter on globalOps reads; default deny without filter.',
  },
  {
    id: 'local-wallet-leak',
    risk: 'Mapping LocalServiceRequest without stripping wallet fields leaks ledger context.',
    mitigation: 'Hybrid links are reference-only; never surface walletMode/walletPhase in VIONA reads.',
  },
  {
    id: 'merchant-inbox-api-reuse',
    risk: 'Reusing LocalMerchantRequestInbox or TourismMerchantInbox APIs pulls live mutation surfaces.',
    mitigation: 'Forbidden until dedicated VIONA repository with tenant matrix enforcement.',
  },
  {
    id: 'client-role-only-guard',
    risk: 'Pack6 Admin Debug uses client serverRole === ADMIN only.',
    mitigation: 'Persistence reads require server authMiddleware + role middleware + auditRead.',
  },
] as const satisfies readonly VionaRequestCrossUniverseLeakRisk[];
