/**
 * Pack40DR3B — attempt-scoped escrow adapter for recovery reconciliation.
 *
 * Wraps Pack31 hold settle/refund services behind the Pack40DR2 recovery contract.
 * No provider calls. Injectable for local tests.
 */

import { VionaRequestEscrowHoldStatus } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import {
  buildVionaPack40D3EscrowIdempotencyKey,
  VIONA_PACK40D3_TWILIO_TEST_ESTIMATED_COST_VIO,
} from './vionaPack40D3EscrowCoordination';
import {
  refundVionaRequestExecutionHold,
  settleVionaRequestExecutionHold,
  type VionaEscrowHoldPrismaClient,
  type VionaRequestEscrowHoldServiceDeps,
} from './vionaRequestEscrowHoldService';
import type { VionaRecoveryEscrowAdapter } from './vionaRecoveryEscrowAdapterContract';

export type CreatePack40DR3RecoveryEscrowAdapterDeps = Readonly<{
  prismaClient?: VionaEscrowHoldPrismaClient;
  settleFn?: typeof settleVionaRequestExecutionHold;
  refundFn?: typeof refundVionaRequestExecutionHold;
  escrowServiceDeps?: VionaRequestEscrowHoldServiceDeps;
}>;

function mapHoldStatus(
  status: VionaRequestEscrowHoldStatus,
): 'HELD' | 'SETTLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED' {
  switch (status) {
    case VionaRequestEscrowHoldStatus.HELD:
      return 'HELD';
    case VionaRequestEscrowHoldStatus.SETTLED:
      return 'SETTLED';
    case VionaRequestEscrowHoldStatus.REFUNDED:
      return 'REFUNDED';
    case VionaRequestEscrowHoldStatus.PARTIALLY_REFUNDED:
      return 'PARTIALLY_REFUNDED';
    case VionaRequestEscrowHoldStatus.FAILED:
      return 'FAILED';
    default:
      return 'FAILED';
  }
}

export function createPack40DR3RecoveryEscrowAdapter(
  deps: CreatePack40DR3RecoveryEscrowAdapterDeps = {},
): VionaRecoveryEscrowAdapter {
  const prismaClient =
    deps.prismaClient ?? (getPrisma() as unknown as VionaEscrowHoldPrismaClient);
  const settleFn = deps.settleFn ?? settleVionaRequestExecutionHold;
  const refundFn = deps.refundFn ?? refundVionaRequestExecutionHold;
  const escrowServiceDeps: VionaRequestEscrowHoldServiceDeps = {
    prismaClient,
    ...deps.escrowServiceDeps,
  };

  return {
    async inspectExactHold(input) {
      const idempotencyKey = buildVionaPack40D3EscrowIdempotencyKey({
        requestId: input.requestId,
        executionAttemptId: input.executionAttemptId,
      });
      const hold = await prismaClient.vionaRequestEscrowHold.findUnique({
        where: { idempotencyKey },
      });
      if (hold == null) return null;
      return {
        holdId: hold.id,
        requestId: hold.requestId,
        idempotencyKey: hold.idempotencyKey,
        status: mapHoldStatus(hold.status),
        heldAmountVIO: hold.heldAmountVIO,
      };
    },

    async settleExactHoldIdempotently(input) {
      const result = await settleFn(
        {
          holdId: input.holdId,
          requestId: input.requestId,
          actualCostVIO: VIONA_PACK40D3_TWILIO_TEST_ESTIMATED_COST_VIO,
        },
        escrowServiceDeps,
      );
      if (!result.ok) {
        return { ok: false, status: 'HELD', deduplicated: false };
      }
      if (result.status === 'REFUNDED' || result.status === 'PARTIALLY_REFUNDED') {
        return { ok: false, status: result.status, deduplicated: result.deduplicated };
      }
      return {
        ok: true,
        status: 'SETTLED',
        deduplicated: result.deduplicated,
      };
    },

    async releaseOrRefundExactHoldIdempotently(input) {
      const result = await refundFn(
        { holdId: input.holdId, requestId: input.requestId },
        escrowServiceDeps,
      );
      if (!result.ok) {
        return { ok: false, status: 'HELD', deduplicated: false };
      }
      if (result.status === 'SETTLED' || result.status === 'PARTIALLY_REFUNDED') {
        return { ok: false, status: result.status, deduplicated: result.deduplicated };
      }
      return {
        ok: true,
        status: 'REFUNDED',
        deduplicated: result.deduplicated,
      };
    },
  };
}
