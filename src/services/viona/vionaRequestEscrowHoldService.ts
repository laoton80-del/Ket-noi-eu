/**
 * Pack31 — VIO Credits escrow hold/settle/refund for a VionaRequest real-provider execution
 * attempt (mirrors `debitSpendableVigForAiGateway`'s exact atomicity/idempotency contract — see
 * docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md §5).
 *
 * Structural Zero-Loss gate: `holdVionaRequestExecutionCost()` is the **only** function in this
 * repo that increments `Wallet.lockedBalanceVIG` for a VionaRequest execution, and it must return
 * `ok: true` before the caller (`vionaExecutionPlanRouteService.ts`) is permitted to invoke
 * `executeVionaTwilioTestPocReal()` (or any future real-provider `executeReal()`). Fail-closed: any
 * ambiguous/errored hold attempt is treated as "hold did not happen", never "assume it succeeded".
 *
 * Every new type/variable name in this file uses "VIO" (VIO Credits) — the one, narrow exception
 * is the literal Prisma field names on the existing, unrenamed `Wallet`/`Transaction` models
 * (`balanceVIG`/`lockedBalanceVIG`/`amountVIG`), which this file reaches only through
 * `mapLegacyWalletRowToVioBalance()` (`vionaWalletVioBalanceAdapter.ts`) for reads, and via the
 * unavoidable literal Prisma `data: { balanceVIG: ... }` keys for writes (the DB boundary itself —
 * not a new "Vig-named" variable). See docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md §0.1.
 *
 * Never calls Stripe, Twilio, or any other network/provider API. Never touches
 * `VionaRequest.status`. Never adds a new HTTP route (service-layer only, matching Pack30D-4).
 */

import { Prisma, PrismaClient, TxStatus, TxType, VionaRequestEscrowHoldStatus } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { appendVionaExecutionAuditEvent } from './vionaExecutionAuditWriteService';
import { mapLegacyWalletRowToVioBalance } from './vionaWalletVioBalanceAdapter';

/** Non-user, ledger-only sentinel receiverId/senderId — mirrors `VI_GLOBAL_PLATFORM_AI_LEDGER`. */
export const VIONA_REQUEST_EXECUTION_PLATFORM_LEDGER = 'VionaRequestExecutionPlatformLedger' as const;

const VIO_EPSILON = 1e-6;

function roundVio(amount: number): number {
  return Math.round(amount * 10_000) / 10_000;
}

/** Minimal Prisma surface this service depends on — enables dependency injection in unit tests. */
export type VionaEscrowHoldPrismaClient = Pick<
  PrismaClient,
  'wallet' | 'transaction' | 'vionaRequestEscrowHold' | '$transaction'
>;

export type HoldVionaRequestExecutionCostInput = Readonly<{
  requestId: string;
  actionId: string;
  userId: string;
  estimatedAmountVIO: number;
  idempotencyKey: string;
  auditActorRoleLabel?: string | null;
}>;

export type HoldVionaRequestExecutionCostFailureReason =
  | 'invalid_amount'
  | 'wallet_not_found'
  | 'insufficient_funds'
  | 'concurrency_conflict';

export type HoldVionaRequestExecutionCostResult =
  | Readonly<{ ok: true; holdId: string; heldAmountVIO: number; deduplicated: boolean }>
  | Readonly<{ ok: false; reason: HoldVionaRequestExecutionCostFailureReason }>;

export type VionaRequestEscrowHoldServiceDeps = Readonly<{
  prismaClient?: VionaEscrowHoldPrismaClient;
  auditWriter?: typeof appendVionaExecutionAuditEvent;
}>;

/**
 * Holds `estimatedAmountVIO` for a VionaRequest execution attempt: atomically moves it from
 * `Wallet.balanceVIG` into `Wallet.lockedBalanceVIG` (legacy field names, §0.1), writes exactly one
 * `Transaction` row (`ESCROW_LOCK`), and one `VionaRequestEscrowHold` row (`HELD`). Idempotent: a
 * retry with the same `idempotencyKey` returns the existing hold instead of double-holding. Fails
 * closed with `insufficient_funds` (never a negative balance) via the same conditional-`updateMany`
 * pattern as `debitSpendableVigForAiGateway`.
 */
export async function holdVionaRequestExecutionCost(
  input: HoldVionaRequestExecutionCostInput,
  deps: VionaRequestEscrowHoldServiceDeps = {},
): Promise<HoldVionaRequestExecutionCostResult> {
  const prismaClient = deps.prismaClient ?? (getPrisma() as unknown as VionaEscrowHoldPrismaClient);
  const auditWriter = deps.auditWriter ?? appendVionaExecutionAuditEvent;
  const amountVIO = roundVio(input.estimatedAmountVIO);

  if (!Number.isFinite(amountVIO) || amountVIO <= VIO_EPSILON) {
    return { ok: false, reason: 'invalid_amount' };
  }

  let result: HoldVionaRequestExecutionCostResult;
  try {
    result = await prismaClient.$transaction(
      async (tx) => {
        const existingHold = await tx.vionaRequestEscrowHold.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existingHold) {
          return {
            ok: true as const,
            holdId: existingHold.id,
            heldAmountVIO: existingHold.heldAmountVIO,
            deduplicated: true,
          };
        }

        const walletRow = await tx.wallet.findUnique({ where: { userId: input.userId } });
        if (!walletRow) {
          return { ok: false as const, reason: 'wallet_not_found' as const };
        }
        const balance = mapLegacyWalletRowToVioBalance(walletRow);

        const decremented = await tx.wallet.updateMany({
          where: { id: balance.walletId, balanceVIG: { gte: amountVIO } },
          data: { balanceVIG: { decrement: amountVIO }, lockedBalanceVIG: { increment: amountVIO } },
        });
        if (decremented.count !== 1) {
          return { ok: false as const, reason: 'insufficient_funds' as const };
        }

        const holdLeg = await tx.transaction.create({
          data: {
            walletId: balance.walletId,
            senderId: input.userId,
            receiverId: VIONA_REQUEST_EXECUTION_PLATFORM_LEDGER,
            amountVIG: amountVIO,
            feeAmount: 0,
            type: TxType.ESCROW_LOCK,
            status: TxStatus.SUCCESS,
            idempotencyKey: input.idempotencyKey,
          },
        });

        const hold = await tx.vionaRequestEscrowHold.create({
          data: {
            requestId: input.requestId,
            actionId: input.actionId,
            userId: input.userId,
            estimatedAmountVIO: amountVIO,
            heldAmountVIO: amountVIO,
            status: VionaRequestEscrowHoldStatus.HELD,
            holdTransactionId: holdLeg.id,
            idempotencyKey: input.idempotencyKey,
          },
        });

        return { ok: true as const, holdId: hold.id, heldAmountVIO: amountVIO, deduplicated: false };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15_000 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2034' || error.code === 'P2002')
    ) {
      return { ok: false, reason: 'concurrency_conflict' };
    }
    throw error;
  }

  if (result.ok) {
    await auditWriter({
      requestId: input.requestId,
      eventType: 'escrowHoldPlaced',
      actorUserId: input.userId,
      actorRoleLabel: input.auditActorRoleLabel ?? null,
      message: `Pack31 escrow hold ${result.deduplicated ? '(idempotent replay)' : 'placed'} for VionaRequest execution.`,
      payloadJson: {
        actionId: input.actionId,
        holdId: result.holdId,
        heldAmountVIO: result.heldAmountVIO,
        deduplicated: result.deduplicated,
      },
    }).catch(() => undefined);
  }

  return result;
}

export type VionaRequestEscrowHoldResolvedStatus = 'SETTLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export type ResolveVionaRequestEscrowHoldFailureReason = 'hold_not_found' | 'settle_error';

export type ResolveVionaRequestEscrowHoldResult =
  | Readonly<{
      ok: true;
      status: VionaRequestEscrowHoldResolvedStatus;
      settledAmountVIO: number;
      refundedAmountVIO: number;
      deduplicated: boolean;
    }>
  | Readonly<{ ok: false; reason: ResolveVionaRequestEscrowHoldFailureReason }>;

async function resolveVionaRequestEscrowHold(
  holdId: string,
  actualCostVIORaw: number,
  prismaClient: VionaEscrowHoldPrismaClient,
): Promise<ResolveVionaRequestEscrowHoldResult> {
  return prismaClient.$transaction(
    async (tx) => {
      const hold = await tx.vionaRequestEscrowHold.findUnique({ where: { id: holdId } });
      if (!hold) {
        return { ok: false as const, reason: 'hold_not_found' as const };
      }

      if (hold.status !== VionaRequestEscrowHoldStatus.HELD) {
        return {
          ok: true as const,
          status: hold.status as VionaRequestEscrowHoldResolvedStatus,
          settledAmountVIO: hold.settledAmountVIO ?? 0,
          refundedAmountVIO: hold.refundedAmountVIO ?? 0,
          deduplicated: true,
        };
      }

      const actualCostVIO = roundVio(Math.min(Math.max(actualCostVIORaw, 0), hold.heldAmountVIO));
      const refundAmountVIO = roundVio(hold.heldAmountVIO - actualCostVIO);

      const walletRow = await tx.wallet.findUnique({ where: { userId: hold.userId } });
      if (!walletRow) {
        // Extremely unlikely (wallet existed at hold time) — never silently drop the resolution.
        return { ok: false as const, reason: 'hold_not_found' as const };
      }
      const balance = mapLegacyWalletRowToVioBalance(walletRow);

      await tx.wallet.update({
        where: { id: balance.walletId },
        data: { lockedBalanceVIG: { decrement: hold.heldAmountVIO } },
      });

      let settleTransactionId: string | null = null;
      let refundTransactionId: string | null = null;

      if (actualCostVIO > VIO_EPSILON) {
        const settleLeg = await tx.transaction.create({
          data: {
            walletId: balance.walletId,
            senderId: hold.userId,
            receiverId: VIONA_REQUEST_EXECUTION_PLATFORM_LEDGER,
            amountVIG: actualCostVIO,
            feeAmount: 0,
            type: TxType.VIONA_REQUEST_EXECUTION_SETTLED,
            status: TxStatus.SUCCESS,
            idempotencyKey: `${hold.idempotencyKey}-settle`,
          },
        });
        settleTransactionId = settleLeg.id;
      }

      if (refundAmountVIO > VIO_EPSILON) {
        await tx.wallet.update({
          where: { id: balance.walletId },
          data: { balanceVIG: { increment: refundAmountVIO } },
        });
        const refundLeg = await tx.transaction.create({
          data: {
            walletId: balance.walletId,
            senderId: VIONA_REQUEST_EXECUTION_PLATFORM_LEDGER,
            receiverId: hold.userId,
            amountVIG: refundAmountVIO,
            feeAmount: 0,
            type: TxType.ESCROW_REFUND,
            status: TxStatus.SUCCESS,
            idempotencyKey: `${hold.idempotencyKey}-refund`,
          },
        });
        refundTransactionId = refundLeg.id;
      }

      const status: VionaRequestEscrowHoldResolvedStatus =
        refundAmountVIO <= VIO_EPSILON
          ? 'SETTLED'
          : actualCostVIO <= VIO_EPSILON
            ? 'REFUNDED'
            : 'PARTIALLY_REFUNDED';

      await tx.vionaRequestEscrowHold.update({
        where: { id: hold.id },
        data: {
          settledAmountVIO: actualCostVIO,
          refundedAmountVIO: refundAmountVIO,
          status: VionaRequestEscrowHoldStatus[status],
          settleTransactionId,
          refundTransactionId,
          settledAt: new Date(),
        },
      });

      return {
        ok: true as const,
        status,
        settledAmountVIO: actualCostVIO,
        refundedAmountVIO: refundAmountVIO,
        deduplicated: false,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15_000 },
  );
}

export type SettleVionaRequestExecutionHoldInput = Readonly<{
  holdId: string;
  requestId: string;
  actualCostVIO: number;
  auditActorUserId?: string | null;
  auditActorRoleLabel?: string | null;
}>;

/**
 * Settles a hold once the real provider outcome is known: converts up to `actualCostVIO` of the
 * held amount into a real settle leg, and refunds the remainder (if any) back to `balanceVIG`
 * (legacy field name). Idempotent: resolving an already-resolved hold returns its stored result
 * rather than re-applying any `Wallet` mutation.
 */
export async function settleVionaRequestExecutionHold(
  input: SettleVionaRequestExecutionHoldInput,
  deps: VionaRequestEscrowHoldServiceDeps = {},
): Promise<ResolveVionaRequestEscrowHoldResult> {
  const prismaClient = deps.prismaClient ?? (getPrisma() as unknown as VionaEscrowHoldPrismaClient);
  const auditWriter = deps.auditWriter ?? appendVionaExecutionAuditEvent;

  const result = await resolveVionaRequestEscrowHold(input.holdId, input.actualCostVIO, prismaClient);

  if (result.ok) {
    const eventType = result.status === 'REFUNDED' ? 'escrowRefunded' : 'escrowSettled';
    await auditWriter({
      requestId: input.requestId,
      eventType,
      actorUserId: input.auditActorUserId ?? null,
      actorRoleLabel: input.auditActorRoleLabel ?? null,
      message: `Pack31 escrow hold resolved (${result.status}${result.deduplicated ? ', idempotent replay' : ''}).`,
      payloadJson: {
        holdId: input.holdId,
        status: result.status,
        settledAmountVIO: result.settledAmountVIO,
        refundedAmountVIO: result.refundedAmountVIO,
        deduplicated: result.deduplicated,
      },
    }).catch(() => undefined);
  }

  return result;
}

export type RefundVionaRequestExecutionHoldInput = Readonly<{
  holdId: string;
  requestId: string;
  auditActorUserId?: string | null;
  auditActorRoleLabel?: string | null;
}>;

/**
 * Full refund — used when the real provider call never incurred any cost (e.g. blocked by policy
 * or the operator flag before ever reaching the provider). Thin wrapper over
 * `settleVionaRequestExecutionHold()` with `actualCostVIO: 0`.
 */
export async function refundVionaRequestExecutionHold(
  input: RefundVionaRequestExecutionHoldInput,
  deps: VionaRequestEscrowHoldServiceDeps = {},
): Promise<ResolveVionaRequestEscrowHoldResult> {
  return settleVionaRequestExecutionHold(
    {
      holdId: input.holdId,
      requestId: input.requestId,
      actualCostVIO: 0,
      auditActorUserId: input.auditActorUserId,
      auditActorRoleLabel: input.auditActorRoleLabel,
    },
    deps,
  );
}
