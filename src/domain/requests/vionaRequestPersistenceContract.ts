import type { VionaRequestAuditEventRecord } from './vionaRequestAuditEventTypes';
import type { VionaRequestRecord, VionaRequestStatus } from './vionaRequestTypes';

/**
 * Operator/admin read scope for future persistence reads. Contract only — no implementation.
 */
export type VionaRequestPersistenceReadScope = Readonly<{
  actorUserId: string;
  serverRole: 'ADMIN' | 'OPERATOR';
  universeFilter: readonly string[] | null;
  tenantScope: 'globalOps' | 'none';
}>;

/**
 * Future source-of-truth options. Not chosen in Pack7.
 */
export type VionaRequestPersistenceSourceOfTruth =
  | 'undecided'
  | 'dedicatedVionaRequestStore'
  | 'mappedFromLocalServiceRequest'
  | 'hybridWithMappingContract';

export type VionaRequestPersistenceReadiness = Readonly<{
  sourceOfTruth: VionaRequestPersistenceSourceOfTruth;
  persistenceApiActive: false;
  prismaSchemaActive: false;
  auditLogActive: false;
  requestMutationActive: false;
  adminDebugUsesFixturesOnly: true;
}>;

export const VIONA_REQUEST_PERSISTENCE_READINESS: VionaRequestPersistenceReadiness = {
  sourceOfTruth: 'undecided',
  persistenceApiActive: false,
  prismaSchemaActive: false,
  auditLogActive: false,
  requestMutationActive: false,
  adminDebugUsesFixturesOnly: true,
} as const;

export type VionaRequestListFilter = Readonly<{
  statuses?: readonly VionaRequestStatus[];
  requiresHumanConfirmation?: boolean;
  limit: number;
  cursor?: string | null;
}>;

/**
 * Future read repository contract. Method signatures only — no implementation, no Prisma, no fetch.
 */
export type VionaRequestRepositoryContract = Readonly<{
  /**
   * Future-only: list requests for operator/admin preview.
   * Requires auth/role gate, source-of-truth approval, and audit read logging when live.
   */
  listRequestsForOperatorPreview(
    scope: VionaRequestPersistenceReadScope,
    filter: VionaRequestListFilter
  ): Promise<readonly VionaRequestRecord[]>;

  /**
   * Future-only: fetch one request by id for read-only detail preview.
   * Requires auth/role gate and audit read logging when live.
   */
  getRequestById(
    scope: VionaRequestPersistenceReadScope,
    requestId: string
  ): Promise<VionaRequestRecord | null>;
}>;

/**
 * Future audit repository contract. Append-only writes require idempotency and human confirmation
 * for protected actions. Audit log is not ledger truth.
 */
export type VionaRequestAuditRepositoryContract = Readonly<{
  /**
   * Future-only: read append-only audit events for a request.
   * Requires auth/role gate when live.
   */
  listAuditEventsForRequest(
    scope: VionaRequestPersistenceReadScope,
    requestId: string
  ): Promise<readonly VionaRequestAuditEventRecord[]>;

  /**
   * Future-only: append an immutable audit event before or with any status write.
   * Requires auth/role gate, idempotency key, ops readiness, and human confirmation
   * when containsProtectedAction is true. Must not mutate ledger or payment state.
   */
  appendAuditEvent(
    scope: VionaRequestPersistenceReadScope,
    event: Omit<VionaRequestAuditEventRecord, 'id' | 'createdAt'>
  ): Promise<VionaRequestAuditEventRecord>;
}>;
