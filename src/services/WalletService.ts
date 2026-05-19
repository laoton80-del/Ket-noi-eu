/**
 * @server-only — Prisma / Node.js. Do not import from Expo screens; use from API routes,
 * Cloud Functions, or scripts. Client apps should keep using `services/fintech/WalletService.ts`
 * (HTTP/Supabase bridge) and `viGlobalWalletApi.ts` for the ViGlobal REST API.
 *
 * ## VIG / EUR monetary policy (system-wide)
 *
 * **VIG is strictly pegged 1:1 to EUR** in this service layer: amounts are stored and transferred as VIG
 * with that semantic contract. **Do not** add manual FX conversion tables (CZK/USD/etc.) here — all fiat
 * rails and FX risk must be delegated to **Stripe** (or another PSP) at top-up / payout boundaries only.
 */

import {
  Prisma,
  PrismaClient,
  Role,
  TourismBookingStatus,
  TourismSettlementMode,
  TxStatus,
  TxType,
} from '@prisma/client';

import { getTourismSettlementMode } from '../config/tourismSettlementMode';
import { evaluateTourismHeldBookingCancelEligibility } from './tourism/tourismHeldBookingCancelEligibility';
import { evaluateTourismHeldBookingConfirmEligibility } from './tourism/tourismHeldBookingConfirmEligibility';
import { getPrisma } from '../lib/prisma';

import { estimateKngNetPlatformVigAfterAcquirer } from './api/StripeBillingService';

const VIG_EPSILON = 1e-6;
const MIN_P2P_TRANSFER_VIG = 1.0;

export type WalletServiceErrorCode =
  | 'invalid_input'
  | 'invalid_amount'
  | 'self_transfer_not_allowed'
  | 'wallet_not_found'
  | 'insufficient_funds'
  | 'concurrency_conflict';

export class WalletServiceError extends Error {
  readonly code: WalletServiceErrorCode;

  constructor(code: WalletServiceErrorCode, message: string) {
    super(message);
    this.name = 'WalletServiceError';
    this.code = code;
  }
}

function assertPositiveFiniteVig(amount: number, label: string): void {
  if (!Number.isFinite(amount) || amount <= VIG_EPSILON) {
    throw new WalletServiceError('invalid_amount', `${label} must be a finite number > 0`);
  }
}

function roundVig(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

/**
 * Idempotent wallet bootstrap after `User` insert. Safe to call on every login if guarded by unique `userId`.
 */
export async function createWalletForUser(
  userId: string,
  db: Prisma.TransactionClient | PrismaClient = getPrisma()
): Promise<Readonly<{ walletId: string; created: boolean }>> {
  const trimmed = userId.trim();
  if (trimmed.length === 0) {
    throw new WalletServiceError('invalid_input', 'userId is required');
  }

  const existing = await db.wallet.findUnique({ where: { userId: trimmed } });
  if (existing) {
    return { walletId: existing.id, created: false };
  }

  try {
    const created = await db.wallet.create({
      data: { userId: trimmed, balanceVIG: 0, lockedBalanceVIG: 0 },
    });
    return { walletId: created.id, created: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const w = await db.wallet.findUnique({ where: { userId: trimmed } });
      if (w) return { walletId: w.id, created: false };
    }
    throw e;
  }
}

export type TransferVIGInput = Readonly<{
  fromUserId: string;
  toUserId: string;
  /** Gross amount credited to receiver (VIG). */
  amountVIG: number;
  /**
   * Platform fee (VIG) paid by sender on top of `amountVIG` (sender debited `amountVIG + feeVIG`).
   * Defaults to 0 — set from policy (e.g. 2.5%) at the API layer.
   */
  feeVIG?: number;
}>;

export type TransferVIGOutput = Readonly<{
  senderWalletId: string;
  receiverWalletId: string;
  amountVIG: number;
  feeVIG: number;
  senderTransactionId: string;
  receiverTransactionId: string;
}>;

/**
 * Atomic P2P: conditional debit on sender, credit receiver, dual ledger rows (per-wallet `walletId`).
 * Uses `Serializable` isolation to reduce lost-update races on `balanceVIG`.
 */
export async function transferVIG(input: TransferVIGInput): Promise<TransferVIGOutput> {
  const fromUserId = input.fromUserId.trim();
  const toUserId = input.toUserId.trim();
  const amountVIG = roundVig(input.amountVIG);
  const feeVIG = roundVig(input.feeVIG ?? 0);

  assertPositiveFiniteVig(amountVIG, 'amountVIG');
  if (amountVIG + VIG_EPSILON < MIN_P2P_TRANSFER_VIG) {
    throw new WalletServiceError('invalid_amount', 'Minimum transfer is 1.0 VIO Credits');
  }
  if (feeVIG < 0 || !Number.isFinite(feeVIG)) {
    throw new WalletServiceError('invalid_amount', 'feeVIG must be a finite number >= 0');
  }

  if (fromUserId === toUserId) {
    throw new WalletServiceError('self_transfer_not_allowed', 'Sender and receiver must differ');
  }

  const totalDebit = roundVig(amountVIG + feeVIG);
  assertPositiveFiniteVig(totalDebit, 'totalDebit');

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        const [senderWallet, receiverWallet] = await Promise.all([
          tx.wallet.findUnique({ where: { userId: fromUserId } }),
          tx.wallet.findUnique({ where: { userId: toUserId } }),
        ]);

        if (!senderWallet || !receiverWallet) {
          throw new WalletServiceError('wallet_not_found', 'Both parties must have an existing wallet row');
        }

        const senderDecrement = await tx.wallet.updateMany({
          where: {
            id: senderWallet.id,
            balanceVIG: { gte: totalDebit },
          },
          data: {
            balanceVIG: { decrement: totalDebit },
          },
        });

        if (senderDecrement.count !== 1) {
          throw new WalletServiceError('insufficient_funds', 'Sender balance is insufficient for amount + fee');
        }

        await tx.wallet.update({
          where: { id: receiverWallet.id },
          data: { balanceVIG: { increment: amountVIG } },
        });

        const [senderLeg, receiverLeg] = await Promise.all([
          tx.transaction.create({
            data: {
              walletId: senderWallet.id,
              senderId: fromUserId,
              receiverId: toUserId,
              amountVIG,
              feeAmount: feeVIG,
              type: TxType.P2P,
              status: TxStatus.SUCCESS,
            },
          }),
          tx.transaction.create({
            data: {
              walletId: receiverWallet.id,
              senderId: fromUserId,
              receiverId: toUserId,
              amountVIG,
              feeAmount: 0,
              type: TxType.P2P,
              status: TxStatus.SUCCESS,
            },
          }),
        ]);

        return {
          senderWalletId: senderWallet.id,
          receiverWalletId: receiverWallet.id,
          amountVIG,
          feeVIG,
          senderTransactionId: senderLeg.id,
          receiverTransactionId: receiverLeg.id,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new WalletServiceError(
        'concurrency_conflict',
        'Transfer aborted due to a serialization conflict; safe to retry.'
      );
    }
    throw e;
  }
}

export type WalletBalanceRow = Readonly<{
  walletId: string;
  /** Spendable VIG (EUR-pegged 1:1). */
  balanceVIG: number;
  /** VIG held in booking locks (not spendable). */
  lockedBalanceVIG: number;
}>;

export async function getWalletBalanceByUserId(
  userId: string,
  db: PrismaClient = getPrisma()
): Promise<WalletBalanceRow | null> {
  const trimmed = userId.trim();
  if (trimmed.length === 0) return null;
  const w = await db.wallet.findUnique({ where: { userId: trimmed } });
  if (!w) return null;
  return { walletId: w.id, balanceVIG: w.balanceVIG, lockedBalanceVIG: w.lockedBalanceVIG };
}

export type QrMerchantPaymentInput = Readonly<{
  payerUserId: string;
  merchantUserId: string;
  grossAmountVIG: number;
  /** Commission rate 10–15 inclusive; default 12. */
  feePercent?: number;
}>;

export type QrMerchantPaymentOutput = Readonly<{
  grossVIG: number;
  platformFeeVIG: number;
  vendorNetVIG: number;
  feePercentApplied: number;
  payerTransactionId: string;
  merchantTransactionId: string;
  treasuryTransactionId: string;
}>;

export type QrMerchantPaymentErrorCode =
  | 'invalid_input'
  | 'invalid_amount'
  | 'merchant_not_found'
  | 'merchant_not_eligible'
  | 'treasury_not_configured'
  | 'treasury_wallet_missing'
  | 'wallet_not_found'
  | 'insufficient_funds'
  | 'concurrency_conflict';

export class QrMerchantPaymentError extends Error {
  readonly code: QrMerchantPaymentErrorCode;

  constructor(code: QrMerchantPaymentErrorCode, message: string) {
    super(message);
    this.name = 'QrMerchantPaymentError';
    this.code = code;
  }
}

const QR_MERCHANT_DEFAULT_FEE_PCT = 12;
const QR_MERCHANT_MIN_FEE_PCT = 10;
const QR_MERCHANT_MAX_FEE_PCT = 15;

/**
 * Atomic tourist → VN merchant QR settlement: gross debited from payer, platform % to treasury, net to vendor.
 * **Vendor must be `Role.B2B_VN` and `isKYCVerified`.** Uses `VIGLOBAL_TREASURY_USER_ID` for the fee leg.
 */
export async function executeQrMerchantVigPayment(input: QrMerchantPaymentInput): Promise<QrMerchantPaymentOutput> {
  const payerUserId = input.payerUserId.trim();
  const merchantUserId = input.merchantUserId.trim();
  const gross = roundVig(input.grossAmountVIG);
  assertPositiveFiniteVig(gross, 'grossAmountVIG');
  if (gross + VIG_EPSILON < MIN_P2P_TRANSFER_VIG) {
    throw new QrMerchantPaymentError('invalid_amount', 'Minimum QR payment is 1.0 VIO Credits');
  }
  if (payerUserId === merchantUserId) {
    throw new QrMerchantPaymentError('invalid_input', 'Payer and merchant must differ');
  }

  let feePct = input.feePercent ?? QR_MERCHANT_DEFAULT_FEE_PCT;
  if (!Number.isFinite(feePct)) feePct = QR_MERCHANT_DEFAULT_FEE_PCT;
  feePct = Math.min(QR_MERCHANT_MAX_FEE_PCT, Math.max(QR_MERCHANT_MIN_FEE_PCT, feePct));

  const platformFeeVIG = roundVig((gross * feePct) / 100);
  const vendorNetVIG = roundVig(gross - platformFeeVIG);
  if (vendorNetVIG <= VIG_EPSILON) {
    throw new QrMerchantPaymentError('invalid_amount', 'Commission rate leaves no vendor payout');
  }

  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';
  if (!treasuryUserId) {
    throw new QrMerchantPaymentError('treasury_not_configured', 'VIGLOBAL_TREASURY_USER_ID is not configured');
  }
  if (treasuryUserId === payerUserId || treasuryUserId === merchantUserId) {
    throw new QrMerchantPaymentError('invalid_input', 'Treasury user must be distinct from payer and merchant');
  }

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        const merchantUser = await tx.user.findUnique({ where: { id: merchantUserId } });
        if (!merchantUser) {
          throw new QrMerchantPaymentError('merchant_not_found', 'Merchant user not found');
        }
        if (merchantUser.role !== Role.B2B_VN) {
          throw new QrMerchantPaymentError('merchant_not_eligible', 'Merchant is not a Vietnam B2B vendor');
        }
        if (!merchantUser.isKYCVerified) {
          throw new QrMerchantPaymentError(
            'merchant_not_eligible',
            'Merchant must complete KYC before receiving QR payments'
          );
        }

        const [payerWallet, merchantWallet, treasuryWallet] = await Promise.all([
          tx.wallet.findUnique({ where: { userId: payerUserId } }),
          tx.wallet.findUnique({ where: { userId: merchantUserId } }),
          tx.wallet.findUnique({ where: { userId: treasuryUserId } }),
        ]);

        if (!payerWallet || !merchantWallet) {
          throw new QrMerchantPaymentError('wallet_not_found', 'Payer or merchant wallet not found');
        }
        if (!treasuryWallet) {
          throw new QrMerchantPaymentError('treasury_wallet_missing', 'Treasury user has no wallet row');
        }

        const payerDec = await tx.wallet.updateMany({
          where: { id: payerWallet.id, balanceVIG: { gte: gross } },
          data: { balanceVIG: { decrement: gross } },
        });
        if (payerDec.count !== 1) {
          throw new QrMerchantPaymentError('insufficient_funds', 'Insufficient VIO Credits balance for this payment');
        }

        await tx.wallet.update({
          where: { id: treasuryWallet.id },
          data: { balanceVIG: { increment: platformFeeVIG } },
        });
        await tx.wallet.update({
          where: { id: merchantWallet.id },
          data: { balanceVIG: { increment: vendorNetVIG } },
        });

        const [payerLeg, merchantLeg, treasuryLeg] = await Promise.all([
          tx.transaction.create({
            data: {
              walletId: payerWallet.id,
              senderId: payerUserId,
              receiverId: merchantUserId,
              amountVIG: gross,
              feeAmount: platformFeeVIG,
              type: TxType.QR_MERCHANT,
              status: TxStatus.SUCCESS,
            },
          }),
          tx.transaction.create({
            data: {
              walletId: merchantWallet.id,
              senderId: payerUserId,
              receiverId: merchantUserId,
              amountVIG: vendorNetVIG,
              feeAmount: 0,
              type: TxType.QR_MERCHANT,
              status: TxStatus.SUCCESS,
            },
          }),
          tx.transaction.create({
            data: {
              walletId: treasuryWallet.id,
              senderId: payerUserId,
              receiverId: treasuryUserId,
              amountVIG: platformFeeVIG,
              feeAmount: 0,
              type: TxType.PLATFORM_FEE,
              status: TxStatus.SUCCESS,
            },
          }),
        ]);

        return {
          grossVIG: gross,
          platformFeeVIG,
          vendorNetVIG,
          feePercentApplied: feePct,
          payerTransactionId: payerLeg.id,
          merchantTransactionId: merchantLeg.id,
          treasuryTransactionId: treasuryLeg.id,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new QrMerchantPaymentError(
        'concurrency_conflict',
        'QR payment aborted due to serialization conflict; safe to retry.'
      );
    }
    if (e instanceof QrMerchantPaymentError) throw e;
    throw e;
  }
}

/** ViGlobal commission on listed tourism base (provider-side). */
const TOURISM_PROVIDER_COMMISSION_RATE = 0.05;

/**
 * Trust & AI Shield fee band on the tourist (default 6%; clamp 5–7%).
 * Override with `TOURISM_TOURIST_FEE_RATE` (e.g. `0.065`).
 */
export function resolveTouristTrustFeeRate(): number {
  const raw = process.env.TOURISM_TOURIST_FEE_RATE?.trim();
  const fallback = 0.06;
  if (!raw || raw.length === 0) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(0.07, Math.max(0.05, n));
}

export type TourismDualSplitAmounts = Readonly<{
  /** List base before split fees: `unitPrice × guestCount × nights`. */
  basePriceVIG: number;
  providerFeeVIG: number;
  touristFeeVIG: number;
  netProviderEarningsVIG: number;
  /** Tourist wallet debit = base + tourist fee. */
  totalPaidVIG: number;
}>;

/**
 * Dual split-fee math (4 dp). Invariant: `totalPaidVIG === netProviderEarningsVIG + providerFeeVIG + touristFeeVIG`.
 */
export function computeTourismDualSplitAmounts(
  unitPriceVIG: number,
  guestCount: number,
  nights: number,
  touristTrustFeeRate: number = resolveTouristTrustFeeRate()
): TourismDualSplitAmounts {
  const unit = roundVig(unitPriceVIG);
  const basePriceVIG = roundVig(unit * Math.max(0, guestCount) * Math.max(1, nights));
  const providerFeeVIG = roundVig(basePriceVIG * TOURISM_PROVIDER_COMMISSION_RATE);
  const touristFeeVIG = roundVig(basePriceVIG * touristTrustFeeRate);
  const netProviderEarningsVIG = roundVig(basePriceVIG - providerFeeVIG);
  const totalPaidVIG = roundVig(basePriceVIG + touristFeeVIG);
  const checksum = roundVig(netProviderEarningsVIG + providerFeeVIG + touristFeeVIG);
  if (Math.abs(checksum - totalPaidVIG) > VIG_EPSILON) {
    throw new WalletServiceError(
      'invalid_amount',
      `Tourism dual-split invariant failed: ${checksum} vs ${totalPaidVIG}`
    );
  }
  return {
    basePriceVIG,
    providerFeeVIG,
    touristFeeVIG,
    netProviderEarningsVIG,
    totalPaidVIG,
  };
}

export type TourismBookingSettlementInput = Readonly<{
  touristUserId: string;
  businessId: string;
  serviceId: string;
  startDate: Date;
  endDate: Date;
  guestCount: number;
  /** Locked EUR→VND spot at booking (VIG ≡ EUR) for VietQR / cash reconciliation. */
  fxLock?: Readonly<{ eurVndRate: number; lockedAt: Date }>;
}>;

export type TourismBookingSettlementErrorCode =
  | 'invalid_input'
  | 'business_not_found'
  | 'service_not_found'
  | 'service_business_mismatch'
  | 'wallet_not_found'
  | 'insufficient_funds'
  | 'self_booking_forbidden'
  | 'treasury_not_configured'
  | 'treasury_wallet_missing'
  | 'concurrency_conflict';

export class TourismBookingSettlementError extends Error {
  readonly code: TourismBookingSettlementErrorCode;

  constructor(code: TourismBookingSettlementErrorCode, message: string) {
    super(message);
    this.name = 'TourismBookingSettlementError';
    this.code = code;
  }
}

const MS_PER_DAY_TOURISM = 86_400_000;

/** Ledger sentinel: tourism hold moved from spendable into `lockedBalanceVIG`. */
const TOURISM_BOOKING_LOCK_PARTY = 'ViGlobalTourismBookingLock';

function tourismStayNights(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / MS_PER_DAY_TOURISM));
}

/**
 * Atomic inbound tourism settlement:
 * 1. Debit tourist `totalPaidVIG` (base + tourist fee).
 * 2. Credit provider `netProviderEarningsVIG`.
 * 3. Credit ViGlobal master treasury `providerFeeVIG + touristFeeVIG`.
 *
 * Ledger: tourist leg uses `BOOKING` with `amountVIG = base`, `feeAmount = touristFeeVIG`;
 * provider leg `BOOKING`; treasury leg `PLATFORM_FEE` for combined platform share.
 */
export async function processTourismBookingSettlement(
  input: TourismBookingSettlementInput
): Promise<
  Readonly<{
    id: string;
    userId: string;
    businessId: string;
    serviceId: string;
    startDate: Date;
    endDate: Date;
    guestCount: number;
    status: TourismBookingStatus;
    providerFeeVIG: number;
    touristFeeVIG: number;
    totalPaidVIG: number;
    netProviderEarningsVIG: number;
  }>
> {
  const touristUserId = input.touristUserId.trim();
  const businessId = input.businessId.trim();
  const serviceId = input.serviceId.trim();
  if (
    touristUserId.length === 0 ||
    businessId.length === 0 ||
    serviceId.length === 0 ||
    !Number.isInteger(input.guestCount) ||
    input.guestCount < 1 ||
    input.guestCount > 50
  ) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid tourism settlement payload');
  }
  if (!(input.startDate instanceof Date) || Number.isNaN(input.startDate.getTime())) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid startDate');
  }
  if (!(input.endDate instanceof Date) || Number.isNaN(input.endDate.getTime())) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid endDate');
  }
  if (input.endDate.getTime() <= input.startDate.getTime()) {
    throw new TourismBookingSettlementError('invalid_input', 'endDate must be after startDate');
  }

  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';
  if (!treasuryUserId) {
    throw new TourismBookingSettlementError(
      'treasury_not_configured',
      'VIGLOBAL_TREASURY_USER_ID is not configured'
    );
  }
  if (treasuryUserId === touristUserId) {
    throw new TourismBookingSettlementError('invalid_input', 'Treasury user must differ from tourist');
  }

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        const business = await tx.business.findUnique({ where: { id: businessId } });
        if (!business) {
          throw new TourismBookingSettlementError('business_not_found', 'Business not found');
        }

        const providerUserId = business.ownerId;
        if (touristUserId === providerUserId) {
          throw new TourismBookingSettlementError(
            'self_booking_forbidden',
            'Self-booking is not allowed'
          );
        }
        if (treasuryUserId === providerUserId) {
          throw new TourismBookingSettlementError('invalid_input', 'Treasury user must differ from provider');
        }

        const service = await tx.tourismService.findFirst({
          where: { id: serviceId, businessId },
        });
        if (!service) {
          const orphan = await tx.tourismService.findUnique({ where: { id: serviceId } });
          if (!orphan) {
            throw new TourismBookingSettlementError('service_not_found', 'Tourism service not found');
          }
          throw new TourismBookingSettlementError(
            'service_business_mismatch',
            'Service does not belong to this business'
          );
        }

        const unitPrice = Number.isFinite(service.priceVIG) ? service.priceVIG : 0;
        const nights = tourismStayNights(input.startDate, input.endDate);
        const amounts = computeTourismDualSplitAmounts(unitPrice, input.guestCount, nights);

        const {
          basePriceVIG,
          providerFeeVIG,
          touristFeeVIG,
          netProviderEarningsVIG,
          totalPaidVIG,
        } = amounts;

        const masterRevenueVIG = roundVig(providerFeeVIG + touristFeeVIG);

        let lockedEurVndRate: number | undefined;
        let fxLockedAt: Date | undefined;
        let offRampVndHint: number | undefined;
        const fxIn = input.fxLock;
        if (
          fxIn &&
          Number.isFinite(fxIn.eurVndRate) &&
          fxIn.eurVndRate > 0 &&
          fxIn.lockedAt instanceof Date &&
          !Number.isNaN(fxIn.lockedAt.getTime())
        ) {
          lockedEurVndRate = fxIn.eurVndRate;
          fxLockedAt = fxIn.lockedAt;
          offRampVndHint = Math.round(totalPaidVIG * fxIn.eurVndRate);
        }

        const [touristWallet, providerWallet, treasuryWallet] = await Promise.all([
          tx.wallet.findUnique({ where: { userId: touristUserId } }),
          tx.wallet.findUnique({ where: { userId: providerUserId } }),
          tx.wallet.findUnique({ where: { userId: treasuryUserId } }),
        ]);

        if (!touristWallet || !providerWallet) {
          throw new TourismBookingSettlementError(
            'wallet_not_found',
            'Tourist or provider wallet not found'
          );
        }
        if (!treasuryWallet) {
          throw new TourismBookingSettlementError(
            'treasury_wallet_missing',
            'Treasury user has no wallet row'
          );
        }

        if (totalPaidVIG > VIG_EPSILON) {
          const dec = await tx.wallet.updateMany({
            where: {
              id: touristWallet.id,
              balanceVIG: { gte: totalPaidVIG },
            },
            data: { balanceVIG: { decrement: totalPaidVIG } },
          });
          if (dec.count !== 1) {
            throw new TourismBookingSettlementError(
              'insufficient_funds',
              'Insufficient spendable VIG for tourism booking total'
            );
          }
        }

        if (netProviderEarningsVIG > VIG_EPSILON) {
          await tx.wallet.update({
            where: { id: providerWallet.id },
            data: { balanceVIG: { increment: netProviderEarningsVIG } },
          });
        }

        if (masterRevenueVIG > VIG_EPSILON) {
          await tx.wallet.update({
            where: { id: treasuryWallet.id },
            data: { balanceVIG: { increment: masterRevenueVIG } },
          });
        }

        if (totalPaidVIG > VIG_EPSILON) {
          await tx.transaction.create({
            data: {
              walletId: touristWallet.id,
              senderId: touristUserId,
              receiverId: providerUserId,
              amountVIG: basePriceVIG,
              feeAmount: touristFeeVIG,
              type: TxType.BOOKING,
              status: TxStatus.SUCCESS,
            },
          });
        }

        if (netProviderEarningsVIG > VIG_EPSILON) {
          await tx.transaction.create({
            data: {
              walletId: providerWallet.id,
              senderId: touristUserId,
              receiverId: providerUserId,
              amountVIG: netProviderEarningsVIG,
              feeAmount: 0,
              type: TxType.BOOKING,
              status: TxStatus.SUCCESS,
            },
          });
        }

        if (masterRevenueVIG > VIG_EPSILON) {
          await tx.transaction.create({
            data: {
              walletId: treasuryWallet.id,
              senderId: touristUserId,
              receiverId: treasuryUserId,
              amountVIG: masterRevenueVIG,
              feeAmount: 0,
              type: TxType.PLATFORM_FEE,
              status: TxStatus.SUCCESS,
            },
          });
        }

        const providerSettledAt = fxLockedAt ?? new Date();
        const row = await tx.tourismBooking.create({
          data: {
            userId: touristUserId,
            businessId,
            serviceId,
            startDate: input.startDate,
            endDate: input.endDate,
            guestCount: input.guestCount,
            status: TourismBookingStatus.PENDING,
            providerFeeVIG,
            touristFeeVIG,
            totalPaidVIG,
            netProviderEarningsVIG,
            lockedEurVndRate,
            fxLockedAt,
            offRampVndHint,
            createdAt: providerSettledAt,
            providerSettledAt,
            settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
          },
        });

        return {
          id: row.id,
          userId: row.userId,
          businessId: row.businessId,
          serviceId: row.serviceId,
          startDate: row.startDate,
          endDate: row.endDate,
          guestCount: row.guestCount,
          status: row.status,
          providerFeeVIG: row.providerFeeVIG,
          touristFeeVIG: row.touristFeeVIG,
          totalPaidVIG: row.totalPaidVIG,
          netProviderEarningsVIG: row.netProviderEarningsVIG,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
  } catch (e) {
    if (e instanceof TourismBookingSettlementError) throw e;
    if (e instanceof WalletServiceError && e.code === 'invalid_amount') {
      throw new TourismBookingSettlementError('invalid_input', e.message);
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new TourismBookingSettlementError(
        'concurrency_conflict',
        'Tourism settlement aborted due to serialization conflict; retry.'
      );
    }
    throw e;
  }
}

type TourismBookingCheckoutResult = Readonly<{
  id: string;
  userId: string;
  businessId: string;
  serviceId: string;
  startDate: Date;
  endDate: Date;
  guestCount: number;
  status: TourismBookingStatus;
  providerFeeVIG: number;
  touristFeeVIG: number;
  totalPaidVIG: number;
  netProviderEarningsVIG: number;
}>;

function mapTourismBookingRow(row: {
  id: string;
  userId: string;
  businessId: string;
  serviceId: string;
  startDate: Date;
  endDate: Date;
  guestCount: number;
  status: TourismBookingStatus;
  providerFeeVIG: number;
  touristFeeVIG: number;
  totalPaidVIG: number;
  netProviderEarningsVIG: number;
}): TourismBookingCheckoutResult {
  return {
    id: row.id,
    userId: row.userId,
    businessId: row.businessId,
    serviceId: row.serviceId,
    startDate: row.startDate,
    endDate: row.endDate,
    guestCount: row.guestCount,
    status: row.status,
    providerFeeVIG: row.providerFeeVIG,
    touristFeeVIG: row.touristFeeVIG,
    totalPaidVIG: row.totalPaidVIG,
    netProviderEarningsVIG: row.netProviderEarningsVIG,
  };
}

/**
 * Hold-only tourism checkout: move `totalPaidVIG` from spendable to locked; no provider/treasury payout.
 */
export async function processTourismBookingHold(
  input: TourismBookingSettlementInput
): Promise<TourismBookingCheckoutResult> {
  const touristUserId = input.touristUserId.trim();
  const businessId = input.businessId.trim();
  const serviceId = input.serviceId.trim();
  if (
    touristUserId.length === 0 ||
    businessId.length === 0 ||
    serviceId.length === 0 ||
    !Number.isInteger(input.guestCount) ||
    input.guestCount < 1 ||
    input.guestCount > 50
  ) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid tourism settlement payload');
  }
  if (!(input.startDate instanceof Date) || Number.isNaN(input.startDate.getTime())) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid startDate');
  }
  if (!(input.endDate instanceof Date) || Number.isNaN(input.endDate.getTime())) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid endDate');
  }
  if (input.endDate.getTime() <= input.startDate.getTime()) {
    throw new TourismBookingSettlementError('invalid_input', 'endDate must be after startDate');
  }

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        const business = await tx.business.findUnique({ where: { id: businessId } });
        if (!business) {
          throw new TourismBookingSettlementError('business_not_found', 'Business not found');
        }

        const providerUserId = business.ownerId;
        if (touristUserId === providerUserId) {
          throw new TourismBookingSettlementError(
            'self_booking_forbidden',
            'Self-booking is not allowed'
          );
        }

        const service = await tx.tourismService.findFirst({
          where: { id: serviceId, businessId },
        });
        if (!service) {
          const orphan = await tx.tourismService.findUnique({ where: { id: serviceId } });
          if (!orphan) {
            throw new TourismBookingSettlementError('service_not_found', 'Tourism service not found');
          }
          throw new TourismBookingSettlementError(
            'service_business_mismatch',
            'Service does not belong to this business'
          );
        }

        const unitPrice = Number.isFinite(service.priceVIG) ? service.priceVIG : 0;
        const nights = tourismStayNights(input.startDate, input.endDate);
        const amounts = computeTourismDualSplitAmounts(unitPrice, input.guestCount, nights);

        const { providerFeeVIG, touristFeeVIG, netProviderEarningsVIG, totalPaidVIG } = amounts;

        let lockedEurVndRate: number | undefined;
        let fxLockedAt: Date | undefined;
        let offRampVndHint: number | undefined;
        const fxIn = input.fxLock;
        if (
          fxIn &&
          Number.isFinite(fxIn.eurVndRate) &&
          fxIn.eurVndRate > 0 &&
          fxIn.lockedAt instanceof Date &&
          !Number.isNaN(fxIn.lockedAt.getTime())
        ) {
          lockedEurVndRate = fxIn.eurVndRate;
          fxLockedAt = fxIn.lockedAt;
          offRampVndHint = Math.round(totalPaidVIG * fxIn.eurVndRate);
        }

        const holdAt = fxLockedAt ?? new Date();

        const touristWallet = await tx.wallet.findUnique({ where: { userId: touristUserId } });
        if (!touristWallet) {
          throw new TourismBookingSettlementError('wallet_not_found', 'Tourist wallet not found');
        }

        if (totalPaidVIG > VIG_EPSILON) {
          const lock = await tx.wallet.updateMany({
            where: {
              id: touristWallet.id,
              balanceVIG: { gte: totalPaidVIG },
            },
            data: {
              balanceVIG: { decrement: totalPaidVIG },
              lockedBalanceVIG: { increment: totalPaidVIG },
            },
          });
          if (lock.count !== 1) {
            throw new TourismBookingSettlementError(
              'insufficient_funds',
              'Insufficient spendable VIG for tourism booking hold'
            );
          }

          await tx.transaction.create({
            data: {
              walletId: touristWallet.id,
              senderId: touristUserId,
              receiverId: TOURISM_BOOKING_LOCK_PARTY,
              amountVIG: totalPaidVIG,
              feeAmount: 0,
              type: TxType.BOOKING_LOCK,
              status: TxStatus.SUCCESS,
            },
          });
        }

        const row = await tx.tourismBooking.create({
          data: {
            userId: touristUserId,
            businessId,
            serviceId,
            startDate: input.startDate,
            endDate: input.endDate,
            guestCount: input.guestCount,
            status: TourismBookingStatus.PENDING,
            providerFeeVIG,
            touristFeeVIG,
            totalPaidVIG,
            netProviderEarningsVIG,
            lockedEurVndRate,
            fxLockedAt,
            offRampVndHint,
            createdAt: holdAt,
            providerSettledAt: null,
            confirmedAt: null,
            settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
          },
        });

        return mapTourismBookingRow(row);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
  } catch (e) {
    if (e instanceof TourismBookingSettlementError) throw e;
    if (e instanceof WalletServiceError && e.code === 'invalid_amount') {
      throw new TourismBookingSettlementError('invalid_input', e.message);
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new TourismBookingSettlementError(
        'concurrency_conflict',
        'Tourism hold aborted due to serialization conflict; retry.'
      );
    }
    throw e;
  }
}

/**
 * Preview-only tourism row — pricing snapshot without wallet mutation.
 */
export async function processTourismBookingPreview(
  input: TourismBookingSettlementInput
): Promise<TourismBookingCheckoutResult> {
  const touristUserId = input.touristUserId.trim();
  const businessId = input.businessId.trim();
  const serviceId = input.serviceId.trim();
  if (
    touristUserId.length === 0 ||
    businessId.length === 0 ||
    serviceId.length === 0 ||
    !Number.isInteger(input.guestCount) ||
    input.guestCount < 1 ||
    input.guestCount > 50
  ) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid tourism settlement payload');
  }
  if (!(input.startDate instanceof Date) || Number.isNaN(input.startDate.getTime())) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid startDate');
  }
  if (!(input.endDate instanceof Date) || Number.isNaN(input.endDate.getTime())) {
    throw new TourismBookingSettlementError('invalid_input', 'Invalid endDate');
  }
  if (input.endDate.getTime() <= input.startDate.getTime()) {
    throw new TourismBookingSettlementError('invalid_input', 'endDate must be after startDate');
  }

  try {
    return await getPrisma().$transaction(async (tx) => {
      const business = await tx.business.findUnique({ where: { id: businessId } });
      if (!business) {
        throw new TourismBookingSettlementError('business_not_found', 'Business not found');
      }
      if (touristUserId === business.ownerId) {
        throw new TourismBookingSettlementError('self_booking_forbidden', 'Self-booking is not allowed');
      }

      const service = await tx.tourismService.findFirst({
        where: { id: serviceId, businessId },
      });
      if (!service) {
        const orphan = await tx.tourismService.findUnique({ where: { id: serviceId } });
        if (!orphan) {
          throw new TourismBookingSettlementError('service_not_found', 'Tourism service not found');
        }
        throw new TourismBookingSettlementError(
          'service_business_mismatch',
          'Service does not belong to this business'
        );
      }

      const unitPrice = Number.isFinite(service.priceVIG) ? service.priceVIG : 0;
      const nights = tourismStayNights(input.startDate, input.endDate);
      const amounts = computeTourismDualSplitAmounts(unitPrice, input.guestCount, nights);
      const { providerFeeVIG, touristFeeVIG, netProviderEarningsVIG, totalPaidVIG } = amounts;

      let lockedEurVndRate: number | undefined;
      let fxLockedAt: Date | undefined;
      let offRampVndHint: number | undefined;
      const fxIn = input.fxLock;
      if (
        fxIn &&
        Number.isFinite(fxIn.eurVndRate) &&
        fxIn.eurVndRate > 0 &&
        fxIn.lockedAt instanceof Date &&
        !Number.isNaN(fxIn.lockedAt.getTime())
      ) {
        lockedEurVndRate = fxIn.eurVndRate;
        fxLockedAt = fxIn.lockedAt;
        offRampVndHint = Math.round(totalPaidVIG * fxIn.eurVndRate);
      }

      const previewAt = fxLockedAt ?? new Date();
      const row = await tx.tourismBooking.create({
        data: {
          userId: touristUserId,
          businessId,
          serviceId,
          startDate: input.startDate,
          endDate: input.endDate,
          guestCount: input.guestCount,
          status: TourismBookingStatus.PENDING,
          providerFeeVIG,
          touristFeeVIG,
          totalPaidVIG,
          netProviderEarningsVIG,
          lockedEurVndRate,
          fxLockedAt,
          offRampVndHint,
          createdAt: previewAt,
          providerSettledAt: null,
          confirmedAt: null,
          settlementMode: TourismSettlementMode.PREVIEW_ONLY,
        },
      });

      return mapTourismBookingRow(row);
    });
  } catch (e) {
    if (e instanceof TourismBookingSettlementError) throw e;
    if (e instanceof WalletServiceError && e.code === 'invalid_amount') {
      throw new TourismBookingSettlementError('invalid_input', e.message);
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new TourismBookingSettlementError(
        'concurrency_conflict',
        'Tourism preview booking aborted due to serialization conflict; retry.'
      );
    }
    throw e;
  }
}

/**
 * Routes tourism checkout by `TOURISM_SETTLEMENT_MODE` (default: legacy_settle_on_book; hold is opt-in).
 */
export async function processTourismBookingCheckout(
  input: TourismBookingSettlementInput
): Promise<TourismBookingCheckoutResult> {
  const mode = getTourismSettlementMode();
  if (mode === 'legacy_settle_on_book') {
    return processTourismBookingSettlement(input);
  }
  if (mode === 'preview_only') {
    return processTourismBookingPreview(input);
  }
  return processTourismBookingHold(input);
}

export type TourismBookingConfirmErrorCode =
  | 'invalid_input'
  | 'booking_not_found'
  | 'forbidden'
  | 'invalid_settlement_mode'
  | 'invalid_status'
  | 'not_held'
  | 'inconsistent_state'
  | 'wallet_not_found'
  | 'treasury_not_configured'
  | 'treasury_wallet_missing'
  | 'insufficient_locked_funds'
  | 'concurrency_conflict';

export class TourismBookingConfirmError extends Error {
  readonly code: TourismBookingConfirmErrorCode;

  constructor(code: TourismBookingConfirmErrorCode, message: string) {
    super(message);
    this.name = 'TourismBookingConfirmError';
    this.code = code;
  }
}

export type ConfirmTourismHeldBookingAsMerchantInput = Readonly<{
  bookingId: string;
  merchantUserId: string;
}>;

export type ConfirmTourismHeldBookingAsMerchantResult = Readonly<{
  bookingId: string;
  status: TourismBookingStatus;
  providerSettledAt: Date;
  confirmedAt: Date;
  settlementMode: TourismSettlementMode;
  idempotent?: boolean;
}>;

/**
 * Merchant ACK: settle held VIO Credits to provider/treasury for `HOLD_ON_SUBMIT` bookings only.
 */
export async function confirmTourismHeldBookingAsMerchant(
  input: ConfirmTourismHeldBookingAsMerchantInput
): Promise<ConfirmTourismHeldBookingAsMerchantResult> {
  const bookingId = input.bookingId.trim();
  const merchantUserId = input.merchantUserId.trim();
  if (bookingId.length === 0 || merchantUserId.length === 0) {
    throw new TourismBookingConfirmError('invalid_input', 'bookingId and merchantUserId are required');
  }

  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';
  if (!treasuryUserId) {
    throw new TourismBookingConfirmError(
      'treasury_not_configured',
      'VIGLOBAL_TREASURY_USER_ID is not configured'
    );
  }

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        const booking = await tx.tourismBooking.findUnique({
          where: { id: bookingId },
          include: {
            business: { select: { ownerId: true } },
          },
        });

        if (!booking) {
          throw new TourismBookingConfirmError('booking_not_found', 'Tourism booking not found');
        }

        if (booking.business.ownerId !== merchantUserId) {
          throw new TourismBookingConfirmError(
            'forbidden',
            'Only the business owner can confirm this booking'
          );
        }

        const eligibility = evaluateTourismHeldBookingConfirmEligibility(booking);
        if (eligibility.kind === 'idempotent') {
          return {
            bookingId: booking.id,
            status: booking.status,
            providerSettledAt: booking.providerSettledAt!,
            confirmedAt: booking.confirmedAt ?? booking.providerSettledAt!,
            settlementMode: booking.settlementMode,
            idempotent: true,
          };
        }
        if (eligibility.kind === 'reject') {
          const codeMap: Record<
            typeof eligibility.code,
            TourismBookingConfirmErrorCode
          > = {
            invalid_settlement_mode: 'invalid_settlement_mode',
            invalid_status: 'invalid_status',
            not_held: 'not_held',
            inconsistent_state: 'inconsistent_state',
          };
          throw new TourismBookingConfirmError(codeMap[eligibility.code], eligibility.message);
        }

        const touristUserId = booking.userId;
        const providerUserId = booking.business.ownerId;
        const {
          totalPaidVIG,
          touristFeeVIG,
          providerFeeVIG,
          netProviderEarningsVIG,
        } = booking;

        const masterRevenueVIG = roundVig(providerFeeVIG + touristFeeVIG);
        const basePriceVIG = roundVig(totalPaidVIG - touristFeeVIG);

        const [touristWallet, providerWallet, treasuryWallet] = await Promise.all([
          tx.wallet.findUnique({ where: { userId: touristUserId } }),
          tx.wallet.findUnique({ where: { userId: providerUserId } }),
          tx.wallet.findUnique({ where: { userId: treasuryUserId } }),
        ]);

        if (!touristWallet || !providerWallet) {
          throw new TourismBookingConfirmError(
            'wallet_not_found',
            'Tourist or provider wallet not found'
          );
        }
        if (!treasuryWallet) {
          throw new TourismBookingConfirmError(
            'treasury_wallet_missing',
            'Treasury user has no wallet row'
          );
        }

        if (totalPaidVIG > VIG_EPSILON) {
          const lockHold = await tx.transaction.findFirst({
            where: {
              walletId: touristWallet.id,
              type: TxType.BOOKING_LOCK,
              senderId: touristUserId,
              receiverId: TOURISM_BOOKING_LOCK_PARTY,
              amountVIG: { gte: totalPaidVIG - VIG_EPSILON, lte: totalPaidVIG + VIG_EPSILON },
            },
            select: { id: true },
          });
          if (!lockHold) {
            throw new TourismBookingConfirmError(
              'not_held',
              'No BOOKING_LOCK hold transaction found for this booking'
            );
          }

          const lockDec = await tx.wallet.updateMany({
            where: {
              id: touristWallet.id,
              lockedBalanceVIG: { gte: totalPaidVIG },
            },
            data: { lockedBalanceVIG: { decrement: totalPaidVIG } },
          });
          if (lockDec.count !== 1) {
            throw new TourismBookingConfirmError(
              'insufficient_locked_funds',
              'Insufficient locked VIG to settle held tourism booking'
            );
          }
        }

        if (netProviderEarningsVIG > VIG_EPSILON) {
          await tx.wallet.update({
            where: { id: providerWallet.id },
            data: { balanceVIG: { increment: netProviderEarningsVIG } },
          });
        }

        if (masterRevenueVIG > VIG_EPSILON) {
          await tx.wallet.update({
            where: { id: treasuryWallet.id },
            data: { balanceVIG: { increment: masterRevenueVIG } },
          });
        }

        if (totalPaidVIG > VIG_EPSILON) {
          await tx.transaction.create({
            data: {
              walletId: touristWallet.id,
              senderId: touristUserId,
              receiverId: providerUserId,
              amountVIG: basePriceVIG,
              feeAmount: touristFeeVIG,
              type: TxType.BOOKING,
              status: TxStatus.SUCCESS,
            },
          });
        }

        if (netProviderEarningsVIG > VIG_EPSILON) {
          await tx.transaction.create({
            data: {
              walletId: providerWallet.id,
              senderId: touristUserId,
              receiverId: providerUserId,
              amountVIG: netProviderEarningsVIG,
              feeAmount: 0,
              type: TxType.BOOKING,
              status: TxStatus.SUCCESS,
            },
          });
        }

        if (masterRevenueVIG > VIG_EPSILON) {
          await tx.transaction.create({
            data: {
              walletId: treasuryWallet.id,
              senderId: touristUserId,
              receiverId: treasuryUserId,
              amountVIG: masterRevenueVIG,
              feeAmount: 0,
              type: TxType.PLATFORM_FEE,
              status: TxStatus.SUCCESS,
            },
          });
        }

        const settledAt = new Date();
        const updated = await tx.tourismBooking.updateMany({
          where: {
            id: bookingId,
            settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
            status: TourismBookingStatus.PENDING,
            providerSettledAt: null,
          },
          data: {
            status: TourismBookingStatus.CONFIRMED,
            confirmedAt: settledAt,
            providerSettledAt: settledAt,
            settlementMode: TourismSettlementMode.SETTLE_ON_CONFIRM,
          },
        });

        if (updated.count !== 1) {
          const again = await tx.tourismBooking.findUnique({ where: { id: bookingId } });
          if (again?.providerSettledAt != null) {
            return {
              bookingId: again.id,
              status: again.status,
              providerSettledAt: again.providerSettledAt,
              confirmedAt: again.confirmedAt ?? again.providerSettledAt,
              settlementMode: again.settlementMode,
              idempotent: true,
            };
          }
          throw new TourismBookingConfirmError(
            'concurrency_conflict',
            'Confirm settlement aborted; booking state changed concurrently'
          );
        }

        return {
          bookingId,
          status: TourismBookingStatus.CONFIRMED,
          providerSettledAt: settledAt,
          confirmedAt: settledAt,
          settlementMode: TourismSettlementMode.SETTLE_ON_CONFIRM,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
  } catch (e) {
    if (e instanceof TourismBookingConfirmError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new TourismBookingConfirmError(
        'concurrency_conflict',
        'Confirm settlement aborted due to serialization conflict; retry.'
      );
    }
    throw e;
  }
}

export type TourismBookingCancelErrorCode =
  | 'invalid_input'
  | 'booking_not_found'
  | 'forbidden'
  | 'invalid_settlement_mode'
  | 'invalid_status'
  | 'not_held'
  | 'inconsistent_state'
  | 'wallet_not_found'
  | 'insufficient_locked_funds'
  | 'concurrency_conflict';

export class TourismBookingCancelError extends Error {
  readonly code: TourismBookingCancelErrorCode;

  constructor(code: TourismBookingCancelErrorCode, message: string) {
    super(message);
    this.name = 'TourismBookingCancelError';
    this.code = code;
  }
}

export type CancelTourismHeldBookingInput = Readonly<{
  bookingId: string;
  actorUserId: string;
  /** Optional; defaults to PROVIDER_REJECTED (merchant) or USER_CANCEL (tourist). */
  cancelReason?: string;
}>;

export type CancelTourismHeldBookingResult = Readonly<{
  bookingId: string;
  status: TourismBookingStatus;
  cancelledAt: Date;
  cancelReason: string;
  idempotent?: boolean;
}>;

function normalizeTourismHeldCancelReason(
  inputReason: string | undefined,
  actorRole: 'merchant' | 'tourist'
): string {
  const trimmed = inputReason?.trim() ?? '';
  if (trimmed.length > 0) {
    return trimmed.slice(0, 200);
  }
  return actorRole === 'merchant' ? 'PROVIDER_REJECTED' : 'USER_CANCEL';
}

/**
 * Cancel a held tourism booking before merchant confirm: release locked VIO Credits to tourist spendable balance.
 *
 * **Actors:** business owner (reject) or booking tourist (self-cancel). Ops/admin cancel is not implemented here
 * (no established tourism ops route); use DB playbook until a dedicated ops endpoint exists.
 */
export async function cancelTourismHeldBooking(
  input: CancelTourismHeldBookingInput
): Promise<CancelTourismHeldBookingResult> {
  const bookingId = input.bookingId.trim();
  const actorUserId = input.actorUserId.trim();
  if (bookingId.length === 0 || actorUserId.length === 0) {
    throw new TourismBookingCancelError('invalid_input', 'bookingId and actorUserId are required');
  }

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        const booking = await tx.tourismBooking.findUnique({
          where: { id: bookingId },
          include: {
            business: { select: { ownerId: true } },
          },
        });

        if (!booking) {
          throw new TourismBookingCancelError('booking_not_found', 'Tourism booking not found');
        }

        const isMerchant = booking.business.ownerId === actorUserId;
        const isTourist = booking.userId === actorUserId;
        if (!isMerchant && !isTourist) {
          throw new TourismBookingCancelError(
            'forbidden',
            'Only the business owner or booking tourist can cancel this held booking'
          );
        }

        const actorRole: 'merchant' | 'tourist' = isMerchant ? 'merchant' : 'tourist';
        const cancelReason = normalizeTourismHeldCancelReason(input.cancelReason, actorRole);

        const eligibility = evaluateTourismHeldBookingCancelEligibility(booking);
        if (eligibility.kind === 'idempotent') {
          return {
            bookingId: booking.id,
            status: TourismBookingStatus.CANCELLED,
            cancelledAt: booking.cancelledAt ?? new Date(),
            cancelReason: booking.cancelReason ?? cancelReason,
            idempotent: true,
          };
        }
        if (eligibility.kind === 'reject') {
          const codeMap: Record<
            typeof eligibility.code,
            TourismBookingCancelErrorCode
          > = {
            invalid_settlement_mode: 'invalid_settlement_mode',
            invalid_status: 'invalid_status',
            not_held: 'not_held',
            inconsistent_state: 'inconsistent_state',
          };
          throw new TourismBookingCancelError(codeMap[eligibility.code], eligibility.message);
        }

        const touristUserId = booking.userId;
        const { totalPaidVIG } = booking;

        const touristWallet = await tx.wallet.findUnique({ where: { userId: touristUserId } });
        if (!touristWallet) {
          throw new TourismBookingCancelError('wallet_not_found', 'Tourist wallet not found');
        }

        if (totalPaidVIG > VIG_EPSILON) {
          const lockHold = await tx.transaction.findFirst({
            where: {
              walletId: touristWallet.id,
              type: TxType.BOOKING_LOCK,
              senderId: touristUserId,
              receiverId: TOURISM_BOOKING_LOCK_PARTY,
              amountVIG: { gte: totalPaidVIG - VIG_EPSILON, lte: totalPaidVIG + VIG_EPSILON },
            },
            select: { id: true },
          });
          if (!lockHold) {
            throw new TourismBookingCancelError(
              'not_held',
              'No BOOKING_LOCK hold transaction found for this booking'
            );
          }

          const lockDec = await tx.wallet.updateMany({
            where: {
              id: touristWallet.id,
              lockedBalanceVIG: { gte: totalPaidVIG },
            },
            data: {
              lockedBalanceVIG: { decrement: totalPaidVIG },
              balanceVIG: { increment: totalPaidVIG },
            },
          });
          if (lockDec.count !== 1) {
            throw new TourismBookingCancelError(
              'insufficient_locked_funds',
              'Insufficient locked VIG to release held tourism booking'
            );
          }

          await tx.transaction.create({
            data: {
              walletId: touristWallet.id,
              senderId: TOURISM_BOOKING_LOCK_PARTY,
              receiverId: touristUserId,
              amountVIG: totalPaidVIG,
              feeAmount: 0,
              type: TxType.ESCROW_REFUND,
              status: TxStatus.SUCCESS,
            },
          });
        }

        const cancelledAt = new Date();
        const updated = await tx.tourismBooking.updateMany({
          where: {
            id: bookingId,
            settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
            status: TourismBookingStatus.PENDING,
            providerSettledAt: null,
          },
          data: {
            status: TourismBookingStatus.CANCELLED,
            cancelledAt,
            cancelReason,
          },
        });

        if (updated.count !== 1) {
          const again = await tx.tourismBooking.findUnique({ where: { id: bookingId } });
          if (again?.status === TourismBookingStatus.CANCELLED) {
            return {
              bookingId: again.id,
              status: TourismBookingStatus.CANCELLED,
              cancelledAt: again.cancelledAt ?? cancelledAt,
              cancelReason: again.cancelReason ?? cancelReason,
              idempotent: true,
            };
          }
          throw new TourismBookingCancelError(
            'concurrency_conflict',
            'Cancel release aborted; booking state changed concurrently'
          );
        }

        return {
          bookingId,
          status: TourismBookingStatus.CANCELLED,
          cancelledAt,
          cancelReason,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
  } catch (e) {
    if (e instanceof TourismBookingCancelError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new TourismBookingCancelError(
        'concurrency_conflict',
        'Cancel release aborted due to serialization conflict; retry.'
      );
    }
    throw e;
  }
}

/**
 * Legacy helper — **inbound tourism no longer pays brokers from the fee pool** (net-revenue-share model:
 * PAYG → AI/telecom; Power SaaS → subscription renewal). Retained for reporting / env compatibility only.
 */
export function resolveBrokerPlatformFeeShare(): number {
  const raw = process.env.BROKER_PLATFORM_FEE_SHARE?.trim();
  const fallback = 0.12;
  if (!raw || raw.length === 0) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(0.5, Math.max(0, n));
}

export type TourismBookingCompletionErrorCode =
  | 'invalid_input'
  | 'booking_not_found'
  | 'forbidden'
  | 'invalid_status'
  | 'treasury_not_configured'
  | 'treasury_wallet_missing'
  | 'insufficient_treasury'
  | 'broker_wallet_missing'
  | 'concurrency_conflict';

export class TourismBookingCompletionError extends Error {
  readonly code: TourismBookingCompletionErrorCode;

  constructor(code: TourismBookingCompletionErrorCode, message: string) {
    super(message);
    this.name = 'TourismBookingCompletionError';
    this.code = code;
  }
}

export type CompleteTourismBookingAsMerchantInput = Readonly<{
  bookingId: string;
  merchantUserId: string;
}>;

export type CompleteTourismBookingAsMerchantResult = Readonly<{
  bookingId: string;
  status: TourismBookingStatus;
  brokerCommissionVIG: number;
  /** True when the booking was already COMPLETED (no duplicate broker payout). */
  idempotent?: boolean;
}>;

/**
 * Merchant marks an inbound tourism booking fulfilled → `COMPLETED`.
 * Persists **gross vs net** platform economics; broker payouts use `BrokerService` net-revenue paths (not tourism GMV).
 */
export async function completeTourismBookingAsMerchant(
  input: CompleteTourismBookingAsMerchantInput
): Promise<CompleteTourismBookingAsMerchantResult> {
  const bookingId = input.bookingId.trim();
  const merchantUserId = input.merchantUserId.trim();
  if (bookingId.length === 0 || merchantUserId.length === 0) {
    throw new TourismBookingCompletionError('invalid_input', 'bookingId and merchantUserId are required');
  }

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        const booking = await tx.tourismBooking.findUnique({
          where: { id: bookingId },
          include: {
            business: {
              select: {
                ownerId: true,
                brokerId: true,
              },
            },
          },
        });

        if (!booking) {
          throw new TourismBookingCompletionError('booking_not_found', 'Tourism booking not found');
        }

        if (booking.business.ownerId !== merchantUserId) {
          throw new TourismBookingCompletionError(
            'forbidden',
            'Only the business owner can complete this booking'
          );
        }

        if (booking.status === TourismBookingStatus.COMPLETED) {
          return {
            bookingId: booking.id,
            status: TourismBookingStatus.COMPLETED,
            brokerCommissionVIG: booking.brokerCommissionVIG,
            idempotent: true,
          };
        }

        if (
          booking.settlementMode === TourismSettlementMode.HOLD_ON_SUBMIT &&
          booking.providerSettledAt == null
        ) {
          throw new TourismBookingCompletionError(
            'invalid_status',
            'Held booking must be confirmed before completion'
          );
        }

        if (
          booking.status !== TourismBookingStatus.PENDING &&
          booking.status !== TourismBookingStatus.CONFIRMED
        ) {
          throw new TourismBookingCompletionError(
            'invalid_status',
            'Only PENDING or CONFIRMED bookings can be completed'
          );
        }

        const grossPlatformFeePoolVIG = roundVig(booking.providerFeeVIG + booking.touristFeeVIG);
        const kngNetPlatformRevenueVIG = roundVig(
          estimateKngNetPlatformVigAfterAcquirer(
            grossPlatformFeePoolVIG,
            booking.totalPaidVIG,
            'eu_card_consumer',
            'EUR'
          )
        );

        await tx.tourismBooking.update({
          where: { id: bookingId },
          data: {
            status: TourismBookingStatus.COMPLETED,
            grossPlatformFeePoolVIG,
            kngNetPlatformRevenueVIG,
            brokerCommissionVIG: 0,
            brokerCommissionPaidAt: null,
          },
        });

        return {
          bookingId,
          status: TourismBookingStatus.COMPLETED,
          brokerCommissionVIG: 0,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
  } catch (e) {
    if (e instanceof TourismBookingCompletionError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new TourismBookingCompletionError(
        'concurrency_conflict',
        'Completion aborted due to serialization conflict; retry.'
      );
    }
    throw e;
  }
}

/** Platform settlement party for AI inference debits (not a `User.id`). */
export const VI_GLOBAL_PLATFORM_AI_LEDGER = 'ViGlobalPlatformAI' as const;
const STRIPE_TOPUP_SENDER_ID = 'StripePaymentIntent' as const;

export type DebitAiGatewayInput = Readonly<{
  userId: string;
  amountVIG: number;
  idempotencyKey?: string;
}>;

export type DebitAiGatewayOutput = Readonly<{
  transactionId: string;
  balanceAfter: number;
  deduplicated: boolean;
}>;

/**
 * Atomic spendable-VIG debit for AI gateway usage — Serializable isolation, conditional decrement.
 */
export async function debitSpendableVigForAiGateway(input: DebitAiGatewayInput): Promise<DebitAiGatewayOutput> {
  const userId = input.userId.trim();
  const amount = roundVig(input.amountVIG);
  assertPositiveFiniteVig(amount, 'amountVIG');
  const keyRaw = input.idempotencyKey?.trim();
  const key = keyRaw && keyRaw.length > 0 ? keyRaw : undefined;

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        if (key) {
          const existing = await tx.transaction.findFirst({
            where: { idempotencyKey: key },
          });
          if (existing) {
            const w = await tx.wallet.findUnique({ where: { id: existing.walletId } });
            return {
              transactionId: existing.id,
              balanceAfter: w ? roundVig(w.balanceVIG) : 0,
              deduplicated: true,
            };
          }
        }

        const w0 = await tx.wallet.findUnique({ where: { userId } });
        if (!w0) {
          throw new WalletServiceError('wallet_not_found', 'Wallet not found');
        }

        const dec = await tx.wallet.updateMany({
          where: { id: w0.id, balanceVIG: { gte: amount } },
          data: { balanceVIG: { decrement: amount } },
        });
        if (dec.count !== 1) {
          throw new WalletServiceError('insufficient_funds', 'Insufficient VIO Credits for AI inference');
        }

        const w1 = await tx.wallet.findUnique({ where: { id: w0.id } });
        const balanceAfter = w1 ? roundVig(w1.balanceVIG) : 0;

        const leg = await tx.transaction.create({
          data: {
            walletId: w0.id,
            senderId: userId,
            receiverId: VI_GLOBAL_PLATFORM_AI_LEDGER,
            amountVIG: amount,
            feeAmount: 0,
            type: TxType.PLATFORM_FEE,
            status: TxStatus.SUCCESS,
            idempotencyKey: key ?? null,
          },
        });

        return { transactionId: leg.id, balanceAfter, deduplicated: false };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new WalletServiceError(
        'concurrency_conflict',
        'AI debit aborted due to a serialization conflict; safe to retry.'
      );
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new WalletServiceError('concurrency_conflict', 'Duplicate idempotency key during AI debit');
    }
    throw e;
  }
}

export type StripeTopUpCreditInput = Readonly<{
  stripeEventId: string;
  paymentIntentId: string;
  creditUserId: string;
  vigAmount: number;
  b2bSaasPlan?: 'BASIC' | 'ELITE';
}>;

export type StripeTopUpCreditOutput = Readonly<{
  applied: boolean;
  alreadyProcessed: boolean;
  walletTransactionId?: string;
  newBalanceVIG?: number;
}>;

/**
 * Credits VIG from a **verified** `payment_intent.succeeded` webhook — never from client UI alone.
 * Idempotent on `stripeEventId` and `stripe_pi_<paymentIntentId>` ledger key.
 */
export async function creditWalletFromStripePaymentSucceeded(
  input: StripeTopUpCreditInput
): Promise<StripeTopUpCreditOutput> {
  const vig = roundVig(input.vigAmount);
  assertPositiveFiniteVig(vig, 'vigAmount');
  const uid = input.creditUserId.trim();
  if (uid.length === 0) {
    throw new WalletServiceError('invalid_input', 'creditUserId is required');
  }
  const eventId = input.stripeEventId.trim();
  const pi = input.paymentIntentId.trim();
  if (eventId.length === 0 || pi.length === 0) {
    throw new WalletServiceError('invalid_input', 'stripeEventId and paymentIntentId are required');
  }

  const ledgerKey = `stripe_pi_${pi}`;

  try {
    return await getPrisma().$transaction(
      async (tx) => {
        await tx.processedStripeEvent.create({
          data: {
            stripeEventId: eventId,
            eventType: 'payment_intent.succeeded',
            paymentIntentId: pi,
          },
        });

        const wallet = await tx.wallet.findUnique({ where: { userId: uid } });
        if (!wallet) {
          throw new WalletServiceError('wallet_not_found', 'Cannot credit — wallet missing for user');
        }

        const w2 = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceVIG: { increment: vig } },
        });

        const leg = await tx.transaction.create({
          data: {
            walletId: wallet.id,
            senderId: STRIPE_TOPUP_SENDER_ID,
            receiverId: uid,
            amountVIG: vig,
            feeAmount: 0,
            type: TxType.TOPUP,
            status: TxStatus.SUCCESS,
            idempotencyKey: ledgerKey,
          },
        });

        if (input.b2bSaasPlan) {
          await tx.user.update({
            where: { id: uid },
            data: { subscriptionPlan: input.b2bSaasPlan },
          });
        }

        return {
          applied: true,
          alreadyProcessed: false,
          walletTransactionId: leg.id,
          newBalanceVIG: roundVig(w2.balanceVIG),
        } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20_000,
      }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { applied: false, alreadyProcessed: true };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new WalletServiceError(
        'concurrency_conflict',
        'Stripe credit aborted due to serialization conflict; safe to retry webhook.'
      );
    }
    throw e;
  }
}
