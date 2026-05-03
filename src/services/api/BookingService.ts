import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { BookStatus, PayStatus, Prisma, TxStatus, TxType } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { finalizeBrokerQrProgramAfterBookingCommit, syntheticWalletFingerprintForBooker } from './brokerEmpireEscrow';
import { recordCharityAccrualForSettlement } from './LedgerService';
import { createWalletForUser } from '../WalletService';

/** Ledger sentinel: VIG moved from spendable balance into booking lock (`lockedBalanceVIG`). */
const BOOKING_LOCK_PARTY = 'ViGlobalBookingLock';
/** Ledger sentinel: no-show / cancel penalty pool split to B2B + treasury. */
const PENALTY_SPLIT_PARTY = 'ViGlobalCancellationPenalty';

const PLATFORM_COMMISSION_RATE = 0.1;
const CANCEL_PENALTY_RATE = 0.2;
const VIG_EPSILON = 1e-6;

export type CreateBookingInput = Readonly<{
  userId: string;
  businessId: string;
  serviceId: string;
  timeSlot: Date;
}>;

export type CreateBookingFailure =
  | 'invalid_input'
  | 'business_not_found'
  | 'service_not_found'
  | 'service_business_mismatch'
  | 'wallet_not_found'
  | 'insufficient_preauth'
  | 'self_booking_forbidden'
  | 'concurrency_conflict';

export type CreateBookingResult =
  | Readonly<{
      ok: true;
      booking: Readonly<{
        id: string;
        userId: string;
        businessId: string;
        serviceId: string;
        timeSlot: string;
        status: BookStatus;
        paymentStatus: PayStatus;
        lockedAmountVIG: number;
      }>;
      /** Issued when full-price lock is taken; required for POST /api/bookings/complete-via-qr. */
      qrCompletionToken?: string;
    }>
  | Readonly<{ ok: false; reason: CreateBookingFailure }>;

class BookingTxnAbort extends Error {
  readonly reason: CreateBookingFailure;

  constructor(reason: CreateBookingFailure) {
    super(reason);
    this.name = 'BookingTxnAbort';
    this.reason = reason;
  }
}

function roundMoney(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function platformFeeFromGross(priceVIG: number): number {
  if (priceVIG <= VIG_EPSILON) return 0;
  return roundMoney(priceVIG * PLATFORM_COMMISSION_RATE);
}

function sha256HexUtf8(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

function timingSafeTokenMatch(storedHex: string | null, plain: string): boolean {
  if (!storedHex || plain.length === 0) return false;
  if (storedHex.length !== 64) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(storedHex, 'hex');
  } catch {
    return false;
  }
  if (expected.length !== 32) return false;
  const actual = createHash('sha256').update(plain, 'utf8').digest();
  try {
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/**
 * Atomic booking: 100% list-price pre-auth — `balanceVIG` → `lockedBalanceVIG` (Serializable).
 * Issues QR token hash when lock > 0. Anti–wash-trade: booker cannot equal business owner.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const userId = input.userId.trim();
  const businessId = input.businessId.trim();
  const serviceId = input.serviceId.trim();
  if (userId.length === 0 || businessId.length === 0 || serviceId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!(input.timeSlot instanceof Date) || Number.isNaN(input.timeSlot.getTime())) {
    return { ok: false, reason: 'invalid_input' };
  }

  try {
    const { row, qrCompletionToken } = await getPrisma().$transaction(
      async (tx) => {
        const business = await tx.business.findUnique({ where: { id: businessId } });
        if (!business) {
          throw new BookingTxnAbort('business_not_found');
        }

        if (userId === business.ownerId) {
          throw new BookingTxnAbort('self_booking_forbidden');
        }

        const service = await tx.service.findFirst({
          where: { id: serviceId, businessId },
        });
        if (!service) {
          const orphan = await tx.service.findUnique({ where: { id: serviceId } });
          if (!orphan) {
            throw new BookingTxnAbort('service_not_found');
          }
          throw new BookingTxnAbort('service_business_mismatch');
        }

        const priceVIG = Number.isFinite(service.priceVIG) ? service.priceVIG : 0;
        const lockedAmountVIG = roundMoney(priceVIG);

        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          throw new BookingTxnAbort('wallet_not_found');
        }

        let qrToken: string | undefined;
        let completionQrTokenHash: string | null = null;

        if (lockedAmountVIG > VIG_EPSILON) {
          qrToken = randomBytes(32).toString('base64url');
          completionQrTokenHash = sha256HexUtf8(qrToken);

          const dec = await tx.wallet.updateMany({
            where: {
              id: wallet.id,
              balanceVIG: { gte: lockedAmountVIG },
            },
            data: {
              balanceVIG: { decrement: lockedAmountVIG },
              lockedBalanceVIG: { increment: lockedAmountVIG },
            },
          });
          if (dec.count !== 1) {
            throw new BookingTxnAbort('insufficient_preauth');
          }

          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              senderId: userId,
              receiverId: BOOKING_LOCK_PARTY,
              amountVIG: lockedAmountVIG,
              feeAmount: 0,
              type: TxType.BOOKING_LOCK,
              status: TxStatus.SUCCESS,
            },
          });
        }

        const row = await tx.booking.create({
          data: {
            userId,
            businessId,
            serviceId,
            timeSlot: input.timeSlot,
            status: BookStatus.PENDING,
            paymentStatus: lockedAmountVIG > VIG_EPSILON ? PayStatus.DEPOSIT_PAID : PayStatus.UNPAID,
            lockedAmountVIG,
            completionQrTokenHash,
          },
        });

        return { row, qrCompletionToken: qrToken };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      }
    );

    return {
      ok: true,
      booking: {
        id: row.id,
        userId: row.userId,
        businessId: row.businessId,
        serviceId: row.serviceId,
        timeSlot: row.timeSlot.toISOString(), // GLOBAL STANDARD: ISO 8601 UTC string to the frontend
        status: row.status,
        paymentStatus: row.paymentStatus,
        lockedAmountVIG: row.lockedAmountVIG,
      },
      ...(qrCompletionToken ? { qrCompletionToken } : {}),
    };
  } catch (e) {
    if (e instanceof BookingTxnAbort) {
      return { ok: false, reason: e.reason };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      return { ok: false, reason: 'concurrency_conflict' };
    }
    throw e;
  }
}

export type CompleteBookingViaQrInput = Readonly<{
  authUserId: string;
  bookingId: string;
  qrCodeToken: string;
  /** Optional Stripe PI for escrow chargeback verification on release. */
  stripePaymentIntentId?: string;
  /** Card fingerprint or omit to use synthetic `VIG_BOOKER:<bookerId>` for wallet QR. */
  paymentMethodFingerprint?: string;
}>;

export type CompleteBookingViaQrFailure =
  | 'invalid_input'
  | 'booking_not_found'
  | 'forbidden'
  | 'invalid_token'
  | 'already_completed'
  | 'no_qr_handshake'
  | 'self_booking_forbidden'
  | 'wallet_not_found'
  | 'insufficient_locked_funds'
  | 'insufficient_merchant_funds'
  | 'treasury_not_configured'
  | 'concurrency_conflict';

export type CompleteBookingViaQrResult =
  | Readonly<{
      ok: true;
      bookingId: string;
      releasedFromLockVIG: number;
      paidFromBookerVIG: number;
      platformFeeVIG: number;
      merchantNetVIG: number;
    }>
  | Readonly<{ ok: false; reason: CompleteBookingViaQrFailure }>;

class CompleteQrTxnAbort extends Error {
  readonly reason: CompleteBookingViaQrFailure;

  constructor(reason: CompleteBookingViaQrFailure) {
    super(reason);
    this.name = 'CompleteQrTxnAbort';
    this.reason = reason;
  }
}

/**
 * QR completion (atomic): release full lock from B2C `lockedBalanceVIG`, pay B2B gross, then 10% platform fee
 * from B2B to treasury. Treasury: `VIGLOBAL_TREASURY_USER_ID` when `platformFeeVIG > 0`.
 */
export async function completeBookingViaQr(
  input: CompleteBookingViaQrInput
): Promise<CompleteBookingViaQrResult> {
  const authUserId = input.authUserId.trim();
  const bookingId = input.bookingId.trim();
  const qrCodeToken = input.qrCodeToken.trim();
  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';

  if (authUserId.length === 0 || bookingId.length === 0 || qrCodeToken.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  try {
    const out = await getPrisma().$transaction(
      async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { business: true, service: true },
        });

        if (!booking) {
          throw new CompleteQrTxnAbort('booking_not_found');
        }

        const bookerId = booking.userId;
        const ownerId = booking.business.ownerId;

        if (bookerId === ownerId) {
          throw new CompleteQrTxnAbort('self_booking_forbidden');
        }

        if (authUserId !== bookerId && authUserId !== ownerId) {
          throw new CompleteQrTxnAbort('forbidden');
        }

        if (booking.status === BookStatus.COMPLETED || booking.status === BookStatus.CANCELLED) {
          throw new CompleteQrTxnAbort('already_completed');
        }

        if (!booking.completionQrTokenHash) {
          throw new CompleteQrTxnAbort('no_qr_handshake');
        }

        if (!timingSafeTokenMatch(booking.completionQrTokenHash, qrCodeToken)) {
          throw new CompleteQrTxnAbort('invalid_token');
        }

        const payAmount = roundMoney(booking.lockedAmountVIG);
        const platformFeeVIG = platformFeeFromGross(payAmount);

        const fpRaw = input.paymentMethodFingerprint?.trim() ?? '';
        const paymentFingerprint =
          fpRaw.length > 0 ? fpRaw : syntheticWalletFingerprintForBooker(bookerId);
        const stripePi = input.stripePaymentIntentId?.trim() ?? '';

        if (payAmount > VIG_EPSILON) {
          await createWalletForUser(bookerId, tx);
          await createWalletForUser(ownerId, tx);

          const bookerWallet = await tx.wallet.findUnique({ where: { userId: bookerId } });
          const merchantWallet = await tx.wallet.findUnique({ where: { userId: ownerId } });

          if (!bookerWallet || !merchantWallet) {
            throw new CompleteQrTxnAbort('wallet_not_found');
          }

          const lockDec = await tx.wallet.updateMany({
            where: {
              id: bookerWallet.id,
              lockedBalanceVIG: { gte: payAmount },
            },
            data: { lockedBalanceVIG: { decrement: payAmount } },
          });
          if (lockDec.count !== 1) {
            throw new CompleteQrTxnAbort('insufficient_locked_funds');
          }

          await tx.transaction.create({
            data: {
              walletId: bookerWallet.id,
              senderId: bookerId,
              receiverId: ownerId,
              amountVIG: payAmount,
              feeAmount: 0,
              type: TxType.BOOKING,
              status: TxStatus.SUCCESS,
            },
          });

          await tx.wallet.update({
            where: { id: merchantWallet.id },
            data: { balanceVIG: { increment: payAmount } },
          });

          await tx.transaction.create({
            data: {
              walletId: merchantWallet.id,
              senderId: bookerId,
              receiverId: ownerId,
              amountVIG: payAmount,
              feeAmount: 0,
              type: TxType.BOOKING,
              status: TxStatus.SUCCESS,
            },
          });

          if (platformFeeVIG > VIG_EPSILON) {
            if (treasuryUserId.length === 0) {
              throw new CompleteQrTxnAbort('treasury_not_configured');
            }
            await createWalletForUser(treasuryUserId, tx);
            const treasuryWallet = await tx.wallet.findUnique({ where: { userId: treasuryUserId } });
            if (!treasuryWallet) {
              throw new CompleteQrTxnAbort('wallet_not_found');
            }

            const feeDec = await tx.wallet.updateMany({
              where: {
                id: merchantWallet.id,
                balanceVIG: { gte: platformFeeVIG },
              },
              data: { balanceVIG: { decrement: platformFeeVIG } },
            });
            if (feeDec.count !== 1) {
              throw new CompleteQrTxnAbort('insufficient_merchant_funds');
            }

            await tx.wallet.update({
              where: { id: treasuryWallet.id },
              data: { balanceVIG: { increment: platformFeeVIG } },
            });

            await tx.transaction.create({
              data: {
                walletId: merchantWallet.id,
                senderId: ownerId,
                receiverId: treasuryUserId,
                amountVIG: platformFeeVIG,
                feeAmount: 0,
                type: TxType.PLATFORM_FEE,
                status: TxStatus.SUCCESS,
              },
            });

            await tx.transaction.create({
              data: {
                walletId: treasuryWallet.id,
                senderId: ownerId,
                receiverId: treasuryUserId,
                amountVIG: platformFeeVIG,
                feeAmount: 0,
                type: TxType.PLATFORM_FEE,
                status: TxStatus.SUCCESS,
              },
            });

            await recordCharityAccrualForSettlement(tx, {
              kngNetRevenueVig: platformFeeVIG,
              idempotencyKey: `charity_settle_qr_${booking.id}`,
              sourceKind: 'QR_PLATFORM_FEE',
            });
          }
        }

        const merchantNetVIG = roundMoney(payAmount - platformFeeVIG);

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookStatus.COMPLETED,
            paymentStatus: PayStatus.FULL_PAID,
            completionQrTokenHash: null,
            platformFeeVIG,
            completedAt: new Date(),
            paymentMethodFingerprint: paymentFingerprint,
            stripePaymentIntentId: stripePi.length > 0 ? stripePi : null,
          },
        });

        return {
          bookingId: booking.id,
          releasedFromLockVIG: payAmount,
          paidFromBookerVIG: payAmount,
          platformFeeVIG,
          merchantNetVIG,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      }
    );

    void finalizeBrokerQrProgramAfterBookingCommit(bookingId).catch((err: unknown) => {
      console.error('[BookingService] broker QR program post-commit failed', err);
    });

    return { ok: true, ...out };
  } catch (e) {
    if (e instanceof CompleteQrTxnAbort) {
      return { ok: false, reason: e.reason };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      return { ok: false, reason: 'concurrency_conflict' };
    }
    throw e;
  }
}

export type CancelBookingInput = Readonly<{
  authUserId: string;
  bookingId: string;
}>;

export type CancelBookingFailure =
  | 'invalid_input'
  | 'booking_not_found'
  | 'forbidden'
  | 'self_booking_forbidden'
  | 'already_completed'
  | 'wallet_not_found'
  | 'insufficient_locked_funds'
  | 'treasury_not_configured'
  | 'concurrency_conflict';

export type CancelBookingResult =
  | Readonly<{
      ok: true;
      bookingId: string;
      refundedToBookerVIG: number;
      penaltyToMerchantVIG: number;
      penaltyToTreasuryVIG: number;
    }>
  | Readonly<{ ok: false; reason: CancelBookingFailure }>;

class CancelTxnAbort extends Error {
  readonly reason: CancelBookingFailure;

  constructor(reason: CancelBookingFailure) {
    super(reason);
    this.name = 'CancelTxnAbort';
    this.reason = reason;
  }
}

/**
 * Cancel / no-show (atomic): release booking lock; 20% penalty split 50/50 B2B + treasury; 80% refund to B2C spendable balance.
 */
export async function cancelBooking(input: CancelBookingInput): Promise<CancelBookingResult> {
  const authUserId = input.authUserId.trim();
  const bookingId = input.bookingId.trim();
  const treasuryUserId = process.env.VIGLOBAL_TREASURY_USER_ID?.trim() ?? '';

  if (authUserId.length === 0 || bookingId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  try {
    const out = await getPrisma().$transaction(
      async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { business: true },
        });

        if (!booking) {
          throw new CancelTxnAbort('booking_not_found');
        }

        const bookerId = booking.userId;
        const ownerId = booking.business.ownerId;

        if (bookerId === ownerId) {
          throw new CancelTxnAbort('self_booking_forbidden');
        }

        if (authUserId !== bookerId && authUserId !== ownerId) {
          throw new CancelTxnAbort('forbidden');
        }

        if (booking.status === BookStatus.COMPLETED || booking.status === BookStatus.CANCELLED) {
          throw new CancelTxnAbort('already_completed');
        }

        const L = roundMoney(booking.lockedAmountVIG);
        let refundedToBookerVIG = 0;
        let penaltyToMerchantVIG = 0;
        let penaltyToTreasuryVIG = 0;

        if (L > VIG_EPSILON) {
          const bookerWallet = await tx.wallet.findUnique({ where: { userId: bookerId } });
          if (!bookerWallet) {
            throw new CancelTxnAbort('wallet_not_found');
          }

          const penaltyTotal = roundMoney(L * CANCEL_PENALTY_RATE);
          penaltyToMerchantVIG = roundMoney(penaltyTotal / 2);
          penaltyToTreasuryVIG = roundMoney(penaltyTotal - penaltyToMerchantVIG);
          refundedToBookerVIG = roundMoney(L - penaltyTotal);

          const lockDec = await tx.wallet.updateMany({
            where: {
              id: bookerWallet.id,
              lockedBalanceVIG: { gte: L },
            },
            data: {
              lockedBalanceVIG: { decrement: L },
              balanceVIG: { increment: refundedToBookerVIG },
            },
          });
          if (lockDec.count !== 1) {
            throw new CancelTxnAbort('insufficient_locked_funds');
          }

          await tx.transaction.create({
            data: {
              walletId: bookerWallet.id,
              senderId: BOOKING_LOCK_PARTY,
              receiverId: bookerId,
              amountVIG: refundedToBookerVIG,
              feeAmount: 0,
              type: TxType.ESCROW_REFUND,
              status: TxStatus.SUCCESS,
            },
          });

          if (penaltyToMerchantVIG > VIG_EPSILON) {
            await createWalletForUser(ownerId, tx);
            const merchantWallet = await tx.wallet.findUnique({ where: { userId: ownerId } });
            if (!merchantWallet) {
              throw new CancelTxnAbort('wallet_not_found');
            }

            await tx.wallet.update({
              where: { id: merchantWallet.id },
              data: { balanceVIG: { increment: penaltyToMerchantVIG } },
            });

            await tx.transaction.create({
              data: {
                walletId: merchantWallet.id,
                senderId: PENALTY_SPLIT_PARTY,
                receiverId: ownerId,
                amountVIG: penaltyToMerchantVIG,
                feeAmount: 0,
                type: TxType.PENALTY_FEE,
                status: TxStatus.SUCCESS,
              },
            });
          }

          if (penaltyToTreasuryVIG > VIG_EPSILON) {
            if (treasuryUserId.length === 0) {
              throw new CancelTxnAbort('treasury_not_configured');
            }
            await createWalletForUser(treasuryUserId, tx);
            const treasuryWallet = await tx.wallet.findUnique({ where: { userId: treasuryUserId } });
            if (!treasuryWallet) {
              throw new CancelTxnAbort('wallet_not_found');
            }

            await tx.wallet.update({
              where: { id: treasuryWallet.id },
              data: { balanceVIG: { increment: penaltyToTreasuryVIG } },
            });

            await tx.transaction.create({
              data: {
                walletId: treasuryWallet.id,
                senderId: PENALTY_SPLIT_PARTY,
                receiverId: treasuryUserId,
                amountVIG: penaltyToTreasuryVIG,
                feeAmount: 0,
                type: TxType.PLATFORM_FEE,
                status: TxStatus.SUCCESS,
              },
            });
          }
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookStatus.CANCELLED,
            paymentStatus: PayStatus.UNPAID,
            lockedAmountVIG: 0,
          },
        });

        return {
          bookingId: booking.id,
          refundedToBookerVIG,
          penaltyToMerchantVIG,
          penaltyToTreasuryVIG,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      }
    );

    return { ok: true, ...out };
  } catch (e) {
    if (e instanceof CancelTxnAbort) {
      return { ok: false, reason: e.reason };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      return { ok: false, reason: 'concurrency_conflict' };
    }
    throw e;
  }
}
