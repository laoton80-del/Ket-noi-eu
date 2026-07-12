/**
 * Pack31 — Dev/test-only mock payment adapter (never wired to any real HTTP route or Stripe call).
 *
 * VIO Credits debits/holds/refunds for a VionaRequest execution are internal ledger movements
 * against the existing `Wallet`/`Transaction` tables — they never call Stripe (see
 * docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md §6). The one legitimate dev/test gap this
 * module closes: a developer or CI test needs a wallet with a non-zero `balanceVIG` (legacy field
 * name, §0.1) to exercise the hold flow, without a real Stripe test-mode checkout per test run.
 *
 * `simulateVioCreditsMockTopUp()` writes directly to `Wallet.balanceVIG` + one `Transaction`
 * (`TOPUP`) row, tagged with a `mock_topup_` idempotency-key prefix so it can never be mistaken for
 * a real Stripe-verified top-up (`creditWalletFromStripePaymentSucceeded`) in a ledger audit.
 *
 * Hard-blocked outside dev/test: throws immediately unless `NODE_ENV !== 'production'` **and** the
 * explicit opt-in env var `PACK31_MOCK_PAYMENT_ADAPTER_ENABLED=true` is set — mirroring
 * `isRealProviderExecutionEnabled()`'s production-hard-block discipline (Pack30D-4), applied here
 * to a convenience path rather than a real one.
 */

import { PrismaClient, TxStatus, TxType } from '@prisma/client';

import { getPrisma } from '../../prisma';

export const VIONA_MOCK_PAYMENT_ADAPTER_SAFETY = {
  providerCalled: false,
  stripeCalled: false,
  realMoneyMoved: false,
  devTestOnly: true,
} as const;

export type VionaMockPaymentTopUpInput = Readonly<{ userId: string; amountVIO: number }>;

export type VionaMockPaymentTopUpFailureReason = 'not_allowed' | 'wallet_not_found' | 'invalid_amount';

export type VionaMockPaymentTopUpResult =
  | Readonly<{ ok: true; newBalanceVIO: number }>
  | Readonly<{ ok: false; reason: VionaMockPaymentTopUpFailureReason }>;

export type VionaMockPaymentAdapterPrismaClient = Pick<PrismaClient, 'wallet' | 'transaction' | '$transaction'>;

export type VionaMockPaymentAdapterDeps = Readonly<{
  prismaClient?: VionaMockPaymentAdapterPrismaClient;
  env?: Readonly<Record<string, string | undefined>>;
}>;

/**
 * Returns whether the mock top-up adapter is allowed to run at all — pure, synchronous, no DB
 * access. Mirrors `isRealProviderExecutionEnabled()`'s production hard-block, in the opposite
 * direction (this flag gates a convenience/dev path, never a real one).
 */
export function isVionaMockPaymentAdapterEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (env.NODE_ENV === 'production') return false;
  return env.PACK31_MOCK_PAYMENT_ADAPTER_ENABLED === 'true';
}

/**
 * Simulates a successful Stripe top-up webhook for dev/test use only. Throws (never silently
 * no-ops) if called outside the explicit dev/test opt-in — a caller can never accidentally rely on
 * this in production because the check happens before any DB access.
 */
export async function simulateVioCreditsMockTopUp(
  input: VionaMockPaymentTopUpInput,
  deps: VionaMockPaymentAdapterDeps = {},
): Promise<VionaMockPaymentTopUpResult> {
  const env = deps.env ?? process.env;
  if (!isVionaMockPaymentAdapterEnabled(env)) {
    throw new Error(
      'simulateVioCreditsMockTopUp is hard-blocked: requires NODE_ENV != production AND PACK31_MOCK_PAYMENT_ADAPTER_ENABLED=true.',
    );
  }

  const amountVIO = Math.round(input.amountVIO * 10_000) / 10_000;
  if (!Number.isFinite(amountVIO) || amountVIO <= 0) {
    return { ok: false, reason: 'invalid_amount' };
  }

  const prismaClient = deps.prismaClient ?? (getPrisma() as unknown as VionaMockPaymentAdapterPrismaClient);
  const idempotencyKey = `mock_topup_${input.userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return prismaClient.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
    if (!wallet) {
      return { ok: false as const, reason: 'wallet_not_found' as const };
    }

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balanceVIG: { increment: amountVIO } },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        senderId: 'Pack31MockPaymentAdapter',
        receiverId: input.userId,
        amountVIG: amountVIO,
        feeAmount: 0,
        type: TxType.TOPUP,
        status: TxStatus.SUCCESS,
        idempotencyKey,
      },
    });

    return { ok: true as const, newBalanceVIO: updated.balanceVIG };
  });
}
