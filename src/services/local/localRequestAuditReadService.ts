import {
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
  LocalWalletMode,
  LocalWalletPhase,
  Role,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

export const LOCAL_REQUEST_AUDIT_READ_SAFETY = {
  readOnly: true,
  noWalletAction: true,
  noPaymentCaptured: true,
} as const;

export type LocalRequestAuditEventReadDto = Readonly<{
  id: string;
  eventType: LocalServiceRequestAuditEventType;
  actorType: LocalServiceRequestAuditActorType;
  actorUserId: string | null;
  businessId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  safeMessage: string | null;
  noWalletAction: boolean;
  walletModeSnapshot: LocalWalletMode | null;
  walletPhaseSnapshot: LocalWalletPhase | null;
  requestOnlyNoChargeSnapshot: boolean;
  runId: string | null;
  createdAt: string;
}>;

export type LocalRequestAuditReadResponse = Readonly<{
  requestId: string;
  events: readonly LocalRequestAuditEventReadDto[];
  safety: typeof LOCAL_REQUEST_AUDIT_READ_SAFETY;
}>;

export type ReadLocalRequestAuditEventsInput = Readonly<{
  adminUserId: string;
  requestId: string;
}>;

export type ReadLocalRequestAuditEventsFailure =
  | 'invalid_input'
  | 'forbidden'
  | 'request_not_found';

export type ReadLocalRequestAuditEventsResult =
  | Readonly<{ ok: true; data: LocalRequestAuditReadResponse }>
  | Readonly<{ ok: false; reason: ReadLocalRequestAuditEventsFailure }>;

function toIso(d: Date): string {
  return d.toISOString();
}

function mapAuditRow(row: {
  id: string;
  eventType: LocalServiceRequestAuditEventType;
  actorType: LocalServiceRequestAuditActorType;
  actorUserId: string | null;
  businessId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  safeMessage: string | null;
  noWalletAction: boolean;
  walletModeSnapshot: LocalWalletMode | null;
  walletPhaseSnapshot: LocalWalletPhase | null;
  requestOnlyNoChargeSnapshot: boolean;
  runId: string | null;
  createdAt: Date;
}): LocalRequestAuditEventReadDto {
  return {
    id: row.id,
    eventType: row.eventType,
    actorType: row.actorType,
    actorUserId: row.actorUserId,
    businessId: row.businessId,
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    reason: row.reason,
    safeMessage: row.safeMessage,
    noWalletAction: row.noWalletAction,
    walletModeSnapshot: row.walletModeSnapshot,
    walletPhaseSnapshot: row.walletPhaseSnapshot,
    requestOnlyNoChargeSnapshot: row.requestOnlyNoChargeSnapshot,
    runId: row.runId,
    createdAt: toIso(row.createdAt),
  };
}

/**
 * Ops/admin read-only audit trail for one LocalServiceRequest (no mutations).
 */
export async function readLocalRequestAuditEventsForOps(
  input: ReadLocalRequestAuditEventsInput
): Promise<ReadLocalRequestAuditEventsResult> {
  const adminUserId = input.adminUserId.trim();
  const requestId = input.requestId.trim();

  if (adminUserId.length === 0 || requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const prisma = getPrisma();

  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { role: true },
  });

  if (!admin || admin.role !== Role.ADMIN) {
    return { ok: false, reason: 'forbidden' };
  }

  const request = await prisma.localServiceRequest.findUnique({
    where: { id: requestId },
    select: { id: true },
  });

  if (!request) {
    return { ok: false, reason: 'request_not_found' };
  }

  const rows = await prisma.localServiceRequestAuditEvent.findMany({
    where: { requestId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      eventType: true,
      actorType: true,
      actorUserId: true,
      businessId: true,
      fromStatus: true,
      toStatus: true,
      reason: true,
      safeMessage: true,
      noWalletAction: true,
      walletModeSnapshot: true,
      walletPhaseSnapshot: true,
      requestOnlyNoChargeSnapshot: true,
      runId: true,
      createdAt: true,
    },
  });

  return {
    ok: true,
    data: {
      requestId,
      events: rows.map(mapAuditRow),
      safety: LOCAL_REQUEST_AUDIT_READ_SAFETY,
    },
  };
}
