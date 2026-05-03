/**
 * Broker Empire: 7-day escrow clearance, activation bounty, master-broker leadership (2% of KNG net).
 * Treasury → broker **locked** VIG on accrual; **spendable** only after release passes Stripe + fraud gates.
 */

import {
  BookStatus,
  BrokerEscrowKind,
  BrokerEscrowStatus,
  PayStatus,
  Prisma,
  Role,
  TxStatus,
  TxType,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { createWalletForUser } from '../WalletService';
import { fetchPaymentIntentEscrowGate } from './stripePaymentIntentEscrowGate';

export const BROKER_ESCROW_CLEARANCE_DAYS = 7 as const;
export const ACTIVATION_BOUNTY_VIG = 500 as const;
/** Leadership bonus = `underlyingKngNetVig * LEADERSHIP_RATE_OF_KNG_NET` (2% of KNG net on the event). */
export const LEADERSHIP_RATE_OF_KNG_NET = 0.02 as const;

function roundMoney(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

function clearanceDateUtc(from: Date): Date {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + BROKER_ESCROW_CLEARANCE_DAYS);
  return d;
}

function normalizeFingerprint(raw: string | null | undefined): string {
  const t = raw?.trim() ?? '';
  return t.length > 0 ? t : 'UNKNOWN';
}

export function syntheticWalletFingerprintForBooker(bookerUserId: string): string {
  const id = bookerUserId.trim();
  return id.length > 0 ? `VIG_BOOKER:${id}` : 'VIG_BOOKER:UNKNOWN';
}

export function resolveActivationMinDistinctFingerprints(): number {
  const raw = process.env.BROKER_ACTIVATION_MIN_DISTINCT_FINGERPRINTS?.trim();
  if (!raw || raw.length === 0) return 2;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 2;
  return Math.min(5, Math.floor(n));
}

function strictStripeEscrowGate(): boolean {
  return process.env.BROKER_ESCROW_STRICT_STRIPE?.trim() === '1';
}

export type EscrowPendingCreditInput = Readonly<{
  beneficiaryUserId: string;
  amountVIG: number;
  kind: BrokerEscrowKind;
  idempotencyKey: string;
  stripePaymentIntentId?: string | null;
  paymentMethodFingerprint?: string | null;
  underlyingKngNetVig?: number | null;
  merchantBusinessId?: string | null;
  sourceBookingId?: string | null;
}>;

export type EscrowCreditResult = Readonly<
  { ok: true; created: boolean; escrowId: string } | { ok: false; reason: string }
>;

/**
 * Moves VIG from treasury → broker **locked**; creates PENDING ledger + escrow row (idempotent).
 * Does **not** throw for treasury shortfall — returns `{ ok: false }` so booking flows are never rolled back.
 */
export async function createEscrowPendingCredit(
  tx: Prisma.TransactionClient,
  input: EscrowPendingCreditInput
): Promise<EscrowCreditResult> {
  const beneficiaryUserId = input.beneficiaryUserId.trim();
  const idempotencyKey = input.idempotencyKey.trim();
  if (beneficiaryUserId.length === 0 || idempotencyKey.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }
  const amount = roundMoney(input.amountVIG);
  if (!Number.isFinite(amount) || amount <= 1e-6) {
    return { ok: false, reason: 'invalid_amount' };
  }

  const existing = await tx.brokerCommissionEscrow.findUnique({
    where: { idempotencyKey },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, created: false, escrowId: existing.id };
  }

  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';
  if (!treasuryUserId.length || treasuryUserId === beneficiaryUserId) {
    return { ok: false, reason: 'treasury_not_configured' };
  }

  const treasuryWallet = await tx.wallet.findUnique({ where: { userId: treasuryUserId } });
  if (!treasuryWallet) {
    return { ok: false, reason: 'treasury_wallet_missing' };
  }

  await createWalletForUser(beneficiaryUserId, tx);
  let brokerWallet = await tx.wallet.findUnique({ where: { userId: beneficiaryUserId } });
  if (!brokerWallet) {
    return { ok: false, reason: 'broker_wallet_missing' };
  }

  const dec = await tx.wallet.updateMany({
    where: { id: treasuryWallet.id, balanceVIG: { gte: amount } },
    data: { balanceVIG: { decrement: amount } },
  });
  if (dec.count !== 1) {
    return { ok: false, reason: 'insufficient_treasury' };
  }

  brokerWallet = await tx.wallet.update({
    where: { id: brokerWallet.id },
    data: { lockedBalanceVIG: { increment: amount } },
  });

  const now = new Date();
  const pend = await tx.transaction.create({
    data: {
      walletId: brokerWallet.id,
      senderId: treasuryUserId,
      receiverId: beneficiaryUserId,
      amountVIG: amount,
      feeAmount: 0,
      type: TxType.BROKER_COMMISSION,
      status: TxStatus.PENDING,
    },
  });

  const esc = await tx.brokerCommissionEscrow.create({
    data: {
      beneficiaryUserId,
      amountVIG: amount,
      kind: input.kind,
      status: BrokerEscrowStatus.PENDING_CLEARANCE,
      clearAt: clearanceDateUtc(now),
      idempotencyKey,
      stripePaymentIntentId: input.stripePaymentIntentId?.trim() || null,
      paymentMethodFingerprint: input.paymentMethodFingerprint?.trim() || null,
      underlyingKngNetVig: input.underlyingKngNetVig != null ? roundMoney(input.underlyingKngNetVig) : null,
      merchantBusinessId: input.merchantBusinessId?.trim() || null,
      sourceBookingId: input.sourceBookingId?.trim() || null,
      pendingTransactionId: pend.id,
    },
  });

  return { ok: true, created: true, escrowId: esc.id };
}

/**
 * After sub-broker escrow accrual: pay master **2% of KNG net** into escrow (same clearance rules).
 */
export async function maybeCreateLeadershipEscrowForMaster(
  tx: Prisma.TransactionClient,
  input: Readonly<{
    subBrokerUserId: string;
    kngNetVig: number;
    baseIdempotencyKey: string;
    stripePaymentIntentId?: string | null;
    paymentMethodFingerprint?: string | null;
    merchantBusinessId?: string | null;
  }>
): Promise<void> {
  const subId = input.subBrokerUserId.trim();
  if (subId.length === 0) return;
  const kng = roundMoney(input.kngNetVig);
  if (kng <= 1e-6) return;

  const sub = await tx.user.findUnique({
    where: { id: subId },
    select: { masterBrokerId: true, role: true },
  });
  const masterId = sub?.masterBrokerId?.trim() ?? '';
  if (masterId.length === 0) return;

  const master = await tx.user.findUnique({
    where: { id: masterId },
    select: { role: true },
  });
  if (master?.role !== Role.BROKER) return;

  const lead = roundMoney(kng * LEADERSHIP_RATE_OF_KNG_NET);
  if (lead <= 1e-6) return;

  const idem = `${input.baseIdempotencyKey.trim()}_leadership`;
  await createEscrowPendingCredit(tx, {
    beneficiaryUserId: masterId,
    amountVIG: lead,
    kind: BrokerEscrowKind.LEADERSHIP_BONUS,
    idempotencyKey: idem,
    stripePaymentIntentId: input.stripePaymentIntentId,
    paymentMethodFingerprint: input.paymentMethodFingerprint,
    underlyingKngNetVig: kng,
    merchantBusinessId: input.merchantBusinessId,
  });
}

/**
 * Runs **after** QR booking commit — never rolls back a successful B2B settlement.
 */
export async function finalizeBrokerQrProgramAfterBookingCommit(bookingId: string): Promise<void> {
  const id = bookingId.trim();
  if (id.length === 0) return;

  await getPrisma().$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        select: {
          id: true,
          businessId: true,
          status: true,
          paymentStatus: true,
          refundedAt: true,
        },
      });
      if (!booking) return;
      if (booking.status !== BookStatus.COMPLETED || booking.paymentStatus !== PayStatus.FULL_PAID) return;
      if (booking.refundedAt) return;

      const businessId = booking.businessId;
      const biz = await tx.business.findUnique({
        where: { id: businessId },
        select: { brokerId: true },
      });
      const brokerUserId = biz?.brokerId?.trim() ?? '';
      if (brokerUserId.length === 0) return;

      const broker = await tx.user.findUnique({
        where: { id: brokerUserId },
        select: { role: true },
      });
      if (broker?.role !== Role.BROKER) return;

      const validCount = await tx.booking.count({
        where: {
          businessId,
          status: BookStatus.COMPLETED,
          paymentStatus: PayStatus.FULL_PAID,
          refundedAt: null,
        },
      });

      let st = await tx.merchantBrokerActivation.findUnique({ where: { businessId } });
      if (st?.bountyAwarded) return;
      if (validCount < 5) return;

      const recent = await tx.booking.findMany({
        where: {
          businessId,
          status: BookStatus.COMPLETED,
          paymentStatus: PayStatus.FULL_PAID,
          refundedAt: null,
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: { paymentMethodFingerprint: true },
      });
      if (recent.length < 5) return;

      const distinct = new Set(recent.map((r) => normalizeFingerprint(r.paymentMethodFingerprint)));
      const minDistinct = resolveActivationMinDistinctFingerprints();
      if (distinct.size < minDistinct) {
        await tx.merchantBrokerActivation.upsert({
          where: { businessId },
          create: { businessId, bountyAwarded: true },
          update: { bountyAwarded: true },
        });
        return;
      }

      const idem = `activation_bounty_${businessId}`;
      const out = await createEscrowPendingCredit(tx, {
        beneficiaryUserId: brokerUserId,
        amountVIG: ACTIVATION_BOUNTY_VIG,
        kind: BrokerEscrowKind.ACTIVATION_BOUNTY,
        idempotencyKey: idem,
        merchantBusinessId: businessId,
        sourceBookingId: booking.id,
      });

      if (!out.ok) {
        return;
      }

      if (out.created) {
        await tx.merchantBrokerActivation.upsert({
          where: { businessId },
          create: { businessId, bountyAwarded: true, activationBountyEscrowId: out.escrowId },
          update: { bountyAwarded: true, activationBountyEscrowId: out.escrowId },
        });
        await maybeCreateLeadershipEscrowForMaster(tx, {
          subBrokerUserId: brokerUserId,
          kngNetVig: ACTIVATION_BOUNTY_VIG,
          baseIdempotencyKey: idem,
          merchantBusinessId: businessId,
        });
      } else {
        st = await tx.merchantBrokerActivation.findUnique({ where: { businessId } });
        if (!st?.bountyAwarded) {
          await tx.merchantBrokerActivation.upsert({
            where: { businessId },
            create: { businessId, bountyAwarded: true, activationBountyEscrowId: out.escrowId },
            update: { bountyAwarded: true, activationBountyEscrowId: out.escrowId },
          });
        }
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 20_000,
    }
  );
}

/**
 * Release cleared escrows after Stripe + policy checks; idempotent per escrow row.
 */
export async function releaseEligibleBrokerEscrows(input?: Readonly<{ limit?: number }>): Promise<
  Readonly<{
    released: number;
    cancelled: number;
    skipped: number;
  }>
> {
  const prisma = getPrisma();
  const limit = Math.min(20, Math.max(1, input?.limit ?? 20));
  const now = new Date();

  const rows = await prisma.brokerCommissionEscrow.findMany({
    where: {
      status: BrokerEscrowStatus.PENDING_CLEARANCE,
      clearAt: { lte: now },
    },
    take: limit,
    orderBy: { clearAt: 'asc' },
    select: { id: true },
  });

  let released = 0;
  let cancelled = 0;
  let skipped = 0;

  for (const esc of rows) {
    try {
      const outcome = await prisma.$transaction(
        async (tx) => {
          const cur = await tx.brokerCommissionEscrow.findUnique({
            where: { id: esc.id },
          });
          if (!cur || cur.status !== BrokerEscrowStatus.PENDING_CLEARANCE) {
            return 'skip' as const;
          }

          const pi = cur.stripePaymentIntentId?.trim() ?? '';
          if (pi.length > 0) {
            const gate = await fetchPaymentIntentEscrowGate(pi);
            if (!gate.ok) {
              if (strictStripeEscrowGate()) {
                await cancelEscrowInTx(tx, cur);
                return 'cancel' as const;
              }
              return 'skip' as const;
            }
            if (gate.refunded || gate.disputeOpen) {
              await cancelEscrowInTx(tx, cur);
              return 'cancel' as const;
            }
          }

          await releaseEscrowInTx(tx, cur);
          return 'release' as const;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 20_000,
        }
      );
      if (outcome === 'release') released += 1;
      else if (outcome === 'cancel') cancelled += 1;
      else skipped += 1;
    } catch {
      skipped += 1;
    }
  }

  return { released, cancelled, skipped };
}

async function releaseEscrowInTx(
  tx: Prisma.TransactionClient,
  esc: {
    id: string;
    beneficiaryUserId: string;
    amountVIG: number;
    pendingTransactionId: string | null;
  }
): Promise<void> {
  const amount = roundMoney(esc.amountVIG);
  const w = await tx.wallet.findUnique({ where: { userId: esc.beneficiaryUserId } });
  if (!w) throw new Error('wallet_missing');

  const dec = await tx.wallet.updateMany({
    where: { id: w.id, lockedBalanceVIG: { gte: amount } },
    data: {
      lockedBalanceVIG: { decrement: amount },
      balanceVIG: { increment: amount },
    },
  });
  if (dec.count !== 1) {
    throw new Error('locked_insufficient');
  }

  if (esc.pendingTransactionId) {
    await tx.transaction.update({
      where: { id: esc.pendingTransactionId },
      data: { status: TxStatus.SUCCESS },
    });
  }

  await tx.brokerCommissionEscrow.update({
    where: { id: esc.id },
    data: {
      status: BrokerEscrowStatus.RELEASED,
      releasedAt: new Date(),
    },
  });
}

async function cancelEscrowInTx(
  tx: Prisma.TransactionClient,
  esc: {
    id: string;
    beneficiaryUserId: string;
    amountVIG: number;
    pendingTransactionId: string | null;
  }
): Promise<void> {
  const amount = roundMoney(esc.amountVIG);
  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';
  if (!treasuryUserId.length) throw new Error('treasury_not_configured');

  const treasuryWallet = await tx.wallet.findUnique({ where: { userId: treasuryUserId } });
  const brokerWallet = await tx.wallet.findUnique({ where: { userId: esc.beneficiaryUserId } });
  if (!treasuryWallet || !brokerWallet) throw new Error('wallet_missing');

  const dec = await tx.wallet.updateMany({
    where: { id: brokerWallet.id, lockedBalanceVIG: { gte: amount } },
    data: { lockedBalanceVIG: { decrement: amount } },
  });
  if (dec.count !== 1) throw new Error('locked_insufficient');

  await tx.wallet.update({
    where: { id: treasuryWallet.id },
    data: { balanceVIG: { increment: amount } },
  });

  if (esc.pendingTransactionId) {
    await tx.transaction.update({
      where: { id: esc.pendingTransactionId },
      data: { status: TxStatus.FAILED },
    });
  }

  await tx.brokerCommissionEscrow.update({
    where: { id: esc.id },
    data: {
      status: BrokerEscrowStatus.CANCELLED_CHARGEBACK,
      releasedAt: new Date(),
    },
  });
}
