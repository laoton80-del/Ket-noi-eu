import {
  BizType,
  BrokerEscrowKind,
  Prisma,
  Role,
  TxStatus,
  TxType,
  UserTier,
} from '@prisma/client';

import { B2B_POWER_TIER_EUR } from '../../config/pricingConfig';
import { GLOBAL_MAX_LIST_ITEMS } from '../../constants/globalPerformance';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { getPrisma } from '../../lib/prisma';
import { createEscrowPendingCredit, maybeCreateLeadershipEscrowForMaster } from './brokerEmpireEscrow';
import { createWalletForUser } from '../WalletService';

function roundMoney(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** ViGlobal net-revenue share paid to field brokers (e.g. 15%). */
export const BROKER_NET_REVENUE_SHARE_RATE = 0.15 as const;

function clampUnitRatio(n: number): number {
  return Math.min(0.99, Math.max(0, n));
}

/**
 * Direct COGS on AI / telecom wallet debits (upstream LLM + carrier). Remainder = KNG net before broker share.
 * Env `KNG_AI_TELECOM_COGS_RATIO` in `[0, 0.99]`, default `0.55`.
 */
export function resolveAiTelecomCogsRatio(): number {
  const raw = process.env.KNG_AI_TELECOM_COGS_RATIO?.trim();
  if (!raw || raw.length === 0) return 0.55;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0.55;
  return clampUnitRatio(n);
}

export type PaygAiBrokerCreditResult = Readonly<
  { ok: true; creditedVIG: number } | { ok: false; reason: string }
>;

/**
 * **Condition A (PAYG):** 15% of estimated **KNG net** on an AI/telecom wallet debit, for merchants with a broker.
 * **Power SaaS merchants** skip this path (Condition B — subscription renewal only).
 */
export async function tryCreditBrokerPaygShareFromAiUsage(input: Readonly<{
  merchantOwnerUserId: string;
  billedVig: number;
  correlationKey: string;
}>): Promise<PaygAiBrokerCreditResult> {
  if (!getFeatureFlags().brokerQrEnabled) {
    return { ok: false, reason: 'feature_disabled' };
  }

  const uid = input.merchantOwnerUserId.trim();
  const key = input.correlationKey.trim();
  if (uid.length === 0 || key.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }
  const billed = roundMoney(input.billedVig);
  if (!Number.isFinite(billed) || billed <= 0) {
    return { ok: false, reason: 'invalid_amount' };
  }

  const prisma = getPrisma();
  const idempotencyKey = `broker_ai_${key}`;

  const existingEscrow = await prisma.brokerCommissionEscrow.findUnique({
    where: { idempotencyKey },
    select: { id: true, amountVIG: true },
  });
  if (existingEscrow) {
    return { ok: true, creditedVIG: existingEscrow.amountVIG };
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { tier: true, role: true },
  });
  if (!user) return { ok: false, reason: 'user_not_found' };
  if (user.tier === UserTier.POWER) {
    return { ok: false, reason: 'power_tier_subscription_broker_path' };
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: uid, brokerId: { not: null } },
    select: { brokerId: true, id: true },
  });
  const brokerUserId = business?.brokerId?.trim() ?? '';
  if (brokerUserId.length === 0) {
    return { ok: false, reason: 'no_broker' };
  }

  const broker = await prisma.user.findUnique({
    where: { id: brokerUserId },
    select: { role: true },
  });
  if (broker?.role !== Role.BROKER) {
    return { ok: false, reason: 'invalid_broker' };
  }

  const cogs = resolveAiTelecomCogsRatio();
  const kngNet = roundMoney(billed * (1 - cogs));
  const brokerCut = roundMoney(kngNet * BROKER_NET_REVENUE_SHARE_RATE);
  if (brokerCut <= 1e-6) {
    return { ok: false, reason: 'zero_broker_cut' };
  }

  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';
  if (!treasuryUserId) {
    return { ok: false, reason: 'treasury_not_configured' };
  }
  if (treasuryUserId === brokerUserId) {
    return { ok: false, reason: 'treasury_broker_conflict' };
  }

  try {
    const out = await prisma.$transaction(
      async (tx) => {
        const dup = await tx.brokerCommissionEscrow.findUnique({ where: { idempotencyKey } });
        if (dup) {
          return { credited: dup.amountVIG };
        }

        const escOut = await createEscrowPendingCredit(tx, {
          beneficiaryUserId: brokerUserId,
          amountVIG: brokerCut,
          kind: BrokerEscrowKind.PAYG_AI_NET_SHARE,
          idempotencyKey,
          underlyingKngNetVig: kngNet,
          merchantBusinessId: business?.id ?? null,
        });
        if (!escOut.ok) {
          return { credited: 0, failReason: escOut.reason };
        }
        if (!escOut.created) {
          const row = await tx.brokerCommissionEscrow.findUnique({ where: { idempotencyKey } });
          return { credited: row?.amountVIG ?? 0 };
        }

        await maybeCreateLeadershipEscrowForMaster(tx, {
          subBrokerUserId: brokerUserId,
          kngNetVig: kngNet,
          baseIdempotencyKey: idempotencyKey,
          merchantBusinessId: business?.id ?? null,
        });

        return { credited: brokerCut };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
    if ('failReason' in out && typeof out.failReason === 'string') {
      return { ok: false, reason: out.failReason };
    }
    return { ok: true, creditedVIG: out.credited };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { ok: true, creditedVIG: 0 };
    }
    const msg = e instanceof Error ? e.message : 'error';
    return { ok: false, reason: msg };
  }
}

export type B2bPowerBrokerPayoutResult = Readonly<
  { ok: true; creditedVIG: number } | { ok: false; reason: string }
>;

/**
 * **Condition B:** 15% of the Power SaaS list price on each renewal — triggered from verified Stripe metadata.
 * Metadata: `b2b_power_broker_payout=1`, `broker_user_id=<uuid>`.
 */
export async function tryCreditBrokerB2bPowerSubscriptionShare(input: Readonly<{
  stripeEventId: string;
  metadata: Readonly<Record<string, string>>;
}>): Promise<B2bPowerBrokerPayoutResult> {
  if (!getFeatureFlags().brokerQrEnabled) {
    return { ok: false, reason: 'feature_disabled' };
  }

  const eventId = input.stripeEventId.trim();
  if (eventId.length === 0) return { ok: false, reason: 'invalid_event' };

  const flag =
    input.metadata.b2b_power_broker_payout?.trim() ??
    input.metadata.b2bPowerBrokerPayout?.trim() ??
    '';
  if (flag !== '1' && flag.toLowerCase() !== 'true') {
    return { ok: false, reason: 'not_power_broker_payout' };
  }

  const brokerUserId =
    input.metadata.broker_user_id?.trim() ?? input.metadata.brokerUserId?.trim() ?? '';
  if (brokerUserId.length === 0) {
    return { ok: false, reason: 'missing_broker_user_id' };
  }

  const prisma = getPrisma();
  const idempotencyKey = `stripe_evt_${eventId}_b2b_power_broker`;

  const existingEscrow = await prisma.brokerCommissionEscrow.findUnique({
    where: { idempotencyKey },
    select: { amountVIG: true },
  });
  if (existingEscrow) {
    return { ok: true, creditedVIG: existingEscrow.amountVIG };
  }

  const broker = await prisma.user.findUnique({
    where: { id: brokerUserId },
    select: { role: true },
  });
  if (broker?.role !== Role.BROKER) {
    return { ok: false, reason: 'invalid_broker' };
  }

  const brokerCut = roundMoney(B2B_POWER_TIER_EUR * BROKER_NET_REVENUE_SHARE_RATE);
  if (brokerCut <= 1e-6) {
    return { ok: false, reason: 'zero_broker_cut' };
  }

  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';
  if (!treasuryUserId) {
    return { ok: false, reason: 'treasury_not_configured' };
  }
  if (treasuryUserId === brokerUserId) {
    return { ok: false, reason: 'treasury_broker_conflict' };
  }

  const pi =
    input.metadata.stripe_payment_intent_id?.trim() ??
    input.metadata.payment_intent_id?.trim() ??
    input.metadata.paymentIntentId?.trim() ??
    '';
  const fp =
    input.metadata.payment_method_fingerprint?.trim() ??
    input.metadata.pm_fingerprint?.trim() ??
    '';

  const kngNet = roundMoney(B2B_POWER_TIER_EUR);

  try {
    const credited = await prisma.$transaction(
      async (tx) => {
        const dup = await tx.brokerCommissionEscrow.findUnique({ where: { idempotencyKey } });
        if (dup) return { amount: dup.amountVIG };

        const escOut = await createEscrowPendingCredit(tx, {
          beneficiaryUserId: brokerUserId,
          amountVIG: brokerCut,
          kind: BrokerEscrowKind.B2B_POWER_SUBSCRIPTION,
          idempotencyKey,
          stripePaymentIntentId: pi.length > 0 ? pi : null,
          paymentMethodFingerprint: fp.length > 0 ? fp : null,
          underlyingKngNetVig: kngNet,
        });
        if (!escOut.ok) {
          return { amount: 0, failReason: escOut.reason };
        }
        if (!escOut.created) {
          const row = await tx.brokerCommissionEscrow.findUnique({ where: { idempotencyKey } });
          return { amount: row?.amountVIG ?? brokerCut };
        }

        await maybeCreateLeadershipEscrowForMaster(tx, {
          subBrokerUserId: brokerUserId,
          kngNetVig: kngNet,
          baseIdempotencyKey: idempotencyKey,
          stripePaymentIntentId: pi.length > 0 ? pi : null,
          paymentMethodFingerprint: fp.length > 0 ? fp : null,
        });

        return { amount: brokerCut };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
    if ('failReason' in credited && typeof credited.failReason === 'string') {
      return { ok: false, reason: credited.failReason };
    }
    return { ok: true, creditedVIG: credited.amount };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { ok: true, creditedVIG: 0 };
    }
    const msg = e instanceof Error ? e.message : 'error';
    return { ok: false, reason: msg };
  }
}

export {
  ACTIVATION_BOUNTY_VIG,
  BROKER_ESCROW_CLEARANCE_DAYS,
  LEADERSHIP_RATE_OF_KNG_NET,
  releaseEligibleBrokerEscrows,
  syntheticWalletFingerprintForBooker,
} from './brokerEmpireEscrow';

/** Universal link / web entry for `MerchantStorefront` deep routing (Mica QR payload). */
export function buildMicaMerchantQrUrl(businessId: string, businessName: string): string {
  const raw =
    process.env.VI_GLOBAL_PUBLIC_APP_BASE?.trim() ??
    process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim() ??
    'https://app.viglobal.io';
  const base = raw.replace(/\/+$/, '');
  const q = new URLSearchParams({
    merchantId: businessId,
    merchantName: businessName.trim().slice(0, 120),
  });
  return `${base}/MerchantStorefront?${q.toString()}`;
}

export type RegisterBrokerBusinessInput = Readonly<{
  brokerUserId: string;
  ownerUserId: string;
  name: string;
  category: BizType;
  locationLat: number;
  locationLng: number;
  description?: string;
}>;

export type RegisterBrokerBusinessResult = Readonly<{
  businessId: string;
  qrCodeUrl: string;
  brokerId: string;
  ownerId: string;
}>;

export class BrokerServiceError extends Error {
  readonly code: 'invalid_input' | 'forbidden' | 'owner_not_found' | 'owner_invalid_role';

  constructor(code: BrokerServiceError['code'], message: string) {
    super(message);
    this.name = 'BrokerServiceError';
    this.code = code;
  }
}

export async function registerBrokerMerchantBusiness(
  input: RegisterBrokerBusinessInput
): Promise<RegisterBrokerBusinessResult> {
  const brokerUserId = input.brokerUserId.trim();
  const ownerUserId = input.ownerUserId.trim();
  const name = input.name.trim();
  if (brokerUserId.length === 0 || ownerUserId.length === 0 || name.length === 0) {
    throw new BrokerServiceError('invalid_input', 'brokerUserId, ownerUserId, and name are required');
  }
  if (!Number.isFinite(input.locationLat) || !Number.isFinite(input.locationLng)) {
    throw new BrokerServiceError('invalid_input', 'locationLat and locationLng must be finite numbers');
  }

  const prisma = getPrisma();

  const [broker, owner] = await Promise.all([
    prisma.user.findUnique({ where: { id: brokerUserId }, select: { id: true, role: true } }),
    prisma.user.findUnique({ where: { id: ownerUserId }, select: { id: true, role: true } }),
  ]);

  if (!broker || broker.role !== Role.BROKER) {
    throw new BrokerServiceError('forbidden', 'Authenticated user is not a broker');
  }
  if (!owner) {
    throw new BrokerServiceError('owner_not_found', 'Merchant owner user not found');
  }
  if (
    owner.role !== Role.B2B &&
    owner.role !== Role.B2B_EU &&
    owner.role !== Role.B2B_VN
  ) {
    throw new BrokerServiceError(
      'owner_invalid_role',
      'Owner must have a B2B merchant role (B2B, B2B_EU, or B2B_VN)'
    );
  }

  const description = (input.description ?? '').trim();

  const row = await prisma.business.create({
    data: {
      ownerId: ownerUserId,
      brokerId: brokerUserId,
      name,
      category: input.category,
      locationLat: input.locationLat,
      locationLng: input.locationLng,
      description,
      qrCodeUrl: '',
    },
  });

  const qrCodeUrl = buildMicaMerchantQrUrl(row.id, row.name);

  const updated = await prisma.business.update({
    where: { id: row.id },
    data: { qrCodeUrl },
    select: { id: true, qrCodeUrl: true, brokerId: true, ownerId: true },
  });

  return {
    businessId: updated.id,
    qrCodeUrl: updated.qrCodeUrl ?? qrCodeUrl,
    brokerId: updated.brokerId ?? brokerUserId,
    ownerId: updated.ownerId,
  };
}

export type BrokerCommissionEntryDto = Readonly<{
  transactionId: string;
  amountVIG: number;
  createdAt: string;
}>;

export type BrokerCommissionsSummaryDto = Readonly<{
  totalEarnedVIG: number;
  recentCommissions: readonly BrokerCommissionEntryDto[];
}>;

export async function getBrokerCommissionsSummary(
  brokerUserId: string
): Promise<BrokerCommissionsSummaryDto> {
  const uid = brokerUserId.trim();
  if (uid.length === 0) {
    throw new BrokerServiceError('invalid_input', 'brokerUserId is required');
  }

  const prisma = getPrisma();

  let wallet = await prisma.wallet.findUnique({ where: { userId: uid } });
  if (!wallet) {
    await createWalletForUser(uid);
    wallet = await prisma.wallet.findUnique({ where: { userId: uid } });
  }
  if (!wallet) {
    return { totalEarnedVIG: 0, recentCommissions: [] };
  }

  const [agg, recent] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        walletId: wallet.id,
        type: TxType.BROKER_COMMISSION,
        status: TxStatus.SUCCESS,
      },
      _sum: { amountVIG: true },
    }),
    prisma.transaction.findMany({
      where: {
        walletId: wallet.id,
        type: TxType.BROKER_COMMISSION,
        status: TxStatus.SUCCESS,
      },
      orderBy: { createdAt: 'desc' },
      take: GLOBAL_MAX_LIST_ITEMS,
      select: { id: true, amountVIG: true, createdAt: true },
    }),
  ]);

  const totalEarnedVIG = roundMoney(agg._sum.amountVIG ?? 0);

  return {
    totalEarnedVIG,
    recentCommissions: recent.map((r) => ({
      transactionId: r.id,
      amountVIG: r.amountVIG,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
