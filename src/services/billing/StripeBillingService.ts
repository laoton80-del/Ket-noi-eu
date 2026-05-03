/**
 * **Pillar 2 — Financial pipeline (settlement hook).**
 *
 * V7 marketplace checkout — **Stripe Connect destination charge** math wired to {@link computeV7DualSplitFeesMinor}
 * on **every** `buildV7ConnectMarketplaceCheckoutPlan` / PaymentIntent materialization path.
 * **Merchant platform:** 5% (500 bps) default, 1% wholesale tier-3. **Tourist trust:** 5–7% (500–700 bps), clamped.
 * All amounts are **integer minor units** (Euro cents) for PaymentIntent / `application_fee_amount` — see {@link GLOBAL_SETTLEMENT_CURRENCY}.
 *
 * **Booking holds:** `createBookingAuthorizationPaymentIntentParams` adds `capture_method: 'manual'` so funds are **authorized**
 * then **captured** via {@link captureBookingFunds} (full amount on COMPLETED, **penalty-only** on NO_SHOW; remainder released).
 *
 * **Flow:** Tourist pays `serviceGross + trustFee`. Platform retains `trustFee + merchantPlatformFee` via
 * `application_fee_amount`. Connected account receives `amount - application_fee_amount` = `serviceGross - merchantPlatformFee`.
 *
 * Production: pass the returned fields to `stripe.paymentIntents.create` (Connect) or your API that mirrors it.
 */

import {
  assertEurMinorUnits,
  assertLedgerPayloadUsesEur,
  GLOBAL_SETTLEMENT_CURRENCY,
  ledgerCurrencyMetadata,
  STRIPE_LEDGER_CURRENCY_CODE,
} from '../../constants/V7FinancialRules';
import {
  computeV7DualSplitFeesMinor,
  majorToMinorUnits,
  minorUnitsToMajor,
  V7_MERCHANT_PLATFORM_FEE_BPS,
  V7_WHOLESALE_MERCHANT_FEE_BPS,
  type SettlementCurrency,
  type V7DualSplitFeeMinor,
} from '../api/StripeBillingService';

export {
  computeV7DualSplitFeesMinor,
  majorToMinorUnits,
  minorUnitsToMajor,
  estimateStripeProcessingFeeMinor,
  V7_MERCHANT_PLATFORM_FEE_BPS,
  V7_WHOLESALE_MERCHANT_FEE_BPS,
  V7_TOURIST_TRUST_FEE_BPS_MIN,
  V7_TOURIST_TRUST_FEE_BPS_MAX,
  type SettlementCurrency,
  type V7DualSplitFeeMinor,
} from '../api/StripeBillingService';

export {
  assertEurMinorUnits,
  assertLedgerPayloadUsesEur,
  GLOBAL_SETTLEMENT_CURRENCY,
} from '../../constants/V7FinancialRules';

/** Default trust fee mid-band (6%) when caller does not specify — within 5–7% CEO policy. */
export const V7_DEFAULT_TOURIST_TRUST_BPS = 600 as const;

/**
 * Pre-contracted **no-show / late-cancel** capture (EUR **minor**), ≤ authorized booking total.
 * Tune per merchant policy server-side; client ships a safe default for hold metadata.
 */
export const V7_DEFAULT_NO_SHOW_PENALTY_MINOR_EUR = 2_500 as const;

export type BookingCompletionCaptureStatus = 'COMPLETED' | 'NO_SHOW';

export type BookingCaptureInstruction = Readonly<{
  intentId: string;
  /** Pass to `stripe.paymentIntents.capture` as `amount` / amount_to_capture (EUR minor). */
  captureAmountMinorEur: number;
  /** When true, cancel uncaptured balance after partial capture (no-show penalty path). */
  cancelRemainingAuthorization: boolean;
  status: BookingCompletionCaptureStatus;
}>;

export function resolveV7MerchantPlatformFeeBps(isWholesaleTier3: boolean): number {
  return isWholesaleTier3 ? V7_WHOLESALE_MERCHANT_FEE_BPS : V7_MERCHANT_PLATFORM_FEE_BPS;
}

export type V7ConnectMarketplaceCheckoutPlan = Readonly<{
  settlementCurrency: SettlementCurrency;
  /** Service list price (what merchant earns before their platform cut). */
  grossServiceMinor: number;
  dualSplit: V7DualSplitFeeMinor;
  /** Trust & AI Shield — added to tourist’s card charge. */
  touristTrustFeeMinor: number;
  /** Platform take from merchant’s side of service gross. */
  merchantPlatformFeeMinor: number;
  /** `payment_intent.amount` — tourist total. */
  totalChargedToCustomerMinor: number;
  /**
   * `payment_intent.application_fee_amount` — KNG platform aggregate on Connect destination charges.
   * Equals tourist trust + merchant platform policy fees (minor units).
   */
  applicationFeeAmountMinor: number;
  /** Net to connected account before Stripe card processing: `grossService - merchantPlatform`. */
  merchantNetTransferMinor: number;
  metadata: Readonly<Record<string, string>>;
}>;

export type BuildV7ConnectCheckoutInput = Readonly<{
  /** Major units (e.g. 100.00 USD) — converted to minor with bankers’ rounding. */
  grossServiceAmountMajor: number;
  settlementCurrency: SettlementCurrency;
  /** 500–700 per CEO; defaults to {@link V7_DEFAULT_TOURIST_TRUST_BPS}. */
  touristTrustBps?: number;
  /** When true, merchant platform fee uses 1% wholesale instead of 5%. */
  isWholesaleTier3: boolean;
}>;

export type BuildV7ConnectCheckoutResult =
  | Readonly<{ ok: true; plan: V7ConnectMarketplaceCheckoutPlan }>
  | Readonly<{ ok: false; code: 'invalid_amount' }>;

/**
 * Core revenue engine: derives PI fields from V7 dual split-fee policy.
 */
export function buildV7ConnectMarketplaceCheckoutPlan(input: BuildV7ConnectCheckoutInput): BuildV7ConnectCheckoutResult {
  const grossMinor = majorToMinorUnits(input.grossServiceAmountMajor);
  if (!Number.isInteger(grossMinor) || grossMinor <= 0) {
    return { ok: false, code: 'invalid_amount' };
  }

  const trustBps = input.touristTrustBps ?? V7_DEFAULT_TOURIST_TRUST_BPS;
  const merchantBps = resolveV7MerchantPlatformFeeBps(input.isWholesaleTier3);

  const dualSplit = computeV7DualSplitFeesMinor({
    grossAmountMinor: grossMinor,
    touristTrustBps: trustBps,
    merchantPlatformFeeBps: merchantBps,
  });

  const totalChargedToCustomerMinor = dualSplit.grossAmountMinor + dualSplit.touristTrustFeeMinor;
  const applicationFeeAmountMinor = dualSplit.touristTrustFeeMinor + dualSplit.merchantPlatformFeeMinor;
  const merchantNetTransferMinor = dualSplit.grossAmountMinor - dualSplit.merchantPlatformFeeMinor;

  if (totalChargedToCustomerMinor - applicationFeeAmountMinor !== merchantNetTransferMinor) {
    throw new Error('v7_checkout: invariant failed — amount - application_fee must equal merchant net transfer');
  }

  const plan: V7ConnectMarketplaceCheckoutPlan = {
    settlementCurrency: input.settlementCurrency,
    grossServiceMinor: dualSplit.grossAmountMinor,
    dualSplit,
    touristTrustFeeMinor: dualSplit.touristTrustFeeMinor,
    merchantPlatformFeeMinor: dualSplit.merchantPlatformFeeMinor,
    totalChargedToCustomerMinor,
    applicationFeeAmountMinor,
    merchantNetTransferMinor,
    metadata: {
      v7_gross_service_minor: String(dualSplit.grossAmountMinor),
      v7_tourist_trust_minor: String(dualSplit.touristTrustFeeMinor),
      v7_merchant_platform_minor: String(dualSplit.merchantPlatformFeeMinor),
      v7_trust_bps_applied: String(trustBps),
      v7_merchant_bps_applied: String(merchantBps),
      v7_wholesale_tier3: input.isWholesaleTier3 ? '1' : '0',
    },
  };

  return { ok: true, plan };
}

/**
 * Resolves **how much** to capture on a manual-capture booking PI (server must call Stripe SDK with secret key).
 * **COMPLETED** → capture full authorized EUR minor amount.
 * **NO_SHOW** → capture **only** the penalty; platform never eats the full service price for empty seats.
 */
export function captureBookingFunds(
  intentId: string,
  status: BookingCompletionCaptureStatus,
  ctx: Readonly<{
    authorizedTotalMinorEur: number;
    noShowPenaltyMinorEur: number;
  }>
): BookingCaptureInstruction {
  const id = intentId.trim();
  if (id.length === 0) {
    throw new Error('captureBookingFunds: intentId required');
  }
  assertEurMinorUnits(ctx.authorizedTotalMinorEur, 'authorizedTotalMinorEur');
  assertEurMinorUnits(ctx.noShowPenaltyMinorEur, 'noShowPenaltyMinorEur');
  if (ctx.noShowPenaltyMinorEur > ctx.authorizedTotalMinorEur) {
    throw new Error('captureBookingFunds: no-show penalty cannot exceed authorized total');
  }
  if (status === 'COMPLETED') {
    return {
      intentId: id,
      captureAmountMinorEur: ctx.authorizedTotalMinorEur,
      cancelRemainingAuthorization: false,
      status,
    };
  }
  return {
    intentId: id,
    captureAmountMinorEur: ctx.noShowPenaltyMinorEur,
    cancelRemainingAuthorization: ctx.noShowPenaltyMinorEur < ctx.authorizedTotalMinorEur,
    status,
  };
}

/**
 * Drop-in shape for `stripe.paymentIntents.create` on a **Connect destination charge** (immediate capture when not using booking hold).
 * `amount` / `application_fee_amount` are **EUR** minor units (cents). **KNG ledger: EUR only.**
 */
/**
 * **Settlement hook:** `plan` must originate from {@link buildV7ConnectMarketplaceCheckoutPlan} so dual-split fees
 * were computed via {@link computeV7DualSplitFeesMinor} (never hand-roll `amount` / `application_fee_amount`).
 */
export function createPaymentIntentParamsFromV7Plan(
  plan: V7ConnectMarketplaceCheckoutPlan,
  connectedStripeAccountId: string
): Readonly<{
  amount: number;
  application_fee_amount: number;
  currency: typeof STRIPE_LEDGER_CURRENCY_CODE;
  metadata: Readonly<Record<string, string>>;
  /** Documented for Connect — map to your server’s `transfer_data.destination` / `on_behalf_of` pattern. */
  connectDestinationAccountId: string;
}> {
  assertLedgerPayloadUsesEur(plan.settlementCurrency, 'createPaymentIntentParamsFromV7Plan');
  const destination = connectedStripeAccountId.trim();
  return {
    amount: plan.totalChargedToCustomerMinor,
    application_fee_amount: plan.applicationFeeAmountMinor,
    currency: STRIPE_LEDGER_CURRENCY_CODE,
    metadata: { ...plan.metadata, ...ledgerCurrencyMetadata() },
    connectDestinationAccountId: destination,
  };
}

/**
 * **Booking pre-authorization** — `capture_method: 'manual'` so settlement follows attendance / no-show policy via {@link captureBookingFunds}.
 */
export function createBookingAuthorizationPaymentIntentParams(
  plan: V7ConnectMarketplaceCheckoutPlan,
  connectedStripeAccountId: string,
  opts?: Readonly<{ noShowPenaltyMinorEur?: number }>
): Readonly<{
  amount: number;
  application_fee_amount: number;
  currency: typeof STRIPE_LEDGER_CURRENCY_CODE;
  capture_method: 'manual';
  metadata: Readonly<Record<string, string>>;
  connectDestinationAccountId: string;
}> {
  assertLedgerPayloadUsesEur(plan.settlementCurrency, 'createBookingAuthorizationPaymentIntentParams');
  const base = createPaymentIntentParamsFromV7Plan(plan, connectedStripeAccountId);
  const penalty = opts?.noShowPenaltyMinorEur ?? V7_DEFAULT_NO_SHOW_PENALTY_MINOR_EUR;
  assertEurMinorUnits(penalty, 'noShowPenaltyMinorEur');
  if (penalty > plan.totalChargedToCustomerMinor) {
    throw new Error('createBookingAuthorizationPaymentIntentParams: no-show penalty exceeds authorized total');
  }
  return {
    ...base,
    capture_method: 'manual',
    metadata: {
      ...base.metadata,
      v7_booking_hold: '1',
      v7_capture_method: 'manual',
      v7_no_show_penalty_minor_eur: String(penalty),
      v7_authorized_total_minor_eur: String(plan.totalChargedToCustomerMinor),
    },
  };
}

/** Human-readable majors for mock UI / logs (do not use for money movement). */
export function summarizeV7PlanMajor(plan: V7ConnectMarketplaceCheckoutPlan): Readonly<{
  grossService: number;
  touristTrust: number;
  merchantPlatform: number;
  totalCharge: number;
  applicationFee: number;
  merchantNet: number;
}> {
  return {
    grossService: minorUnitsToMajor(plan.grossServiceMinor),
    touristTrust: minorUnitsToMajor(plan.touristTrustFeeMinor),
    merchantPlatform: minorUnitsToMajor(plan.merchantPlatformFeeMinor),
    totalCharge: minorUnitsToMajor(plan.totalChargedToCustomerMinor),
    applicationFee: minorUnitsToMajor(plan.applicationFeeAmountMinor),
    merchantNet: minorUnitsToMajor(plan.merchantNetTransferMinor),
  };
}

// —— AML / KYC — Stripe Connect onboarding (merchants must verify before live money movement) ——

/** Mirrors DB column `is_kyc_verified` (set `true` after Stripe `account.updated` with charges enabled). */
export type MerchantConnectGateInput = Readonly<{
  merchantId: string;
  /** Connected Account id `acct_...` when created */
  stripeConnectAccountId?: string | null;
  isKycVerified: boolean;
}>;

export type ActivateMerchantAccountResult =
  | Readonly<{ ok: true; onboardingComplete: true }>
  | Readonly<{ ok: true; onboardingComplete: false; connectOnboardingUrl: string }>
  | Readonly<{ ok: false; code: 'INVALID_MERCHANT'; message: string }>;

/**
 * **Gate:** before accepting **real** card bookings, route merchant through **Stripe Connect Account Onboarding**
 * (identity + business registration). Until `is_kyc_verified` is true server-side, do not allocate AI Receptionist capacity.
 */
export function activateMerchantAccount(input: MerchantConnectGateInput): ActivateMerchantAccountResult {
  const mid = input.merchantId.trim();
  if (mid.length === 0) {
    return { ok: false, code: 'INVALID_MERCHANT', message: 'merchantId required' };
  }
  if (input.isKycVerified) {
    return { ok: true, onboardingComplete: true };
  }
  const acct = input.stripeConnectAccountId?.trim() ?? '';
  const base =
    process.env.EXPO_PUBLIC_STRIPE_CONNECT_ACCOUNT_ONBOARD_URL?.trim() ||
    'https://connect.stripe.com/setup/e/acct_placeholder';
  const connectOnboardingUrl = acct.length > 0 ? `${base}?acct=${encodeURIComponent(acct)}` : base;
  return { ok: true, onboardingComplete: false, connectOnboardingUrl };
}

/** Throws if merchant is not cleared for live rails — call before creating Connect destination charges. */
export function assertMerchantCanAcceptRealBookings(input: MerchantConnectGateInput): void {
  if (!input.isKycVerified) {
    throw new Error(
      'AML/KYC: merchant must complete Stripe Connect onboarding — persist is_kyc_verified=true after verification.'
    );
  }
}

/** Lễ tân AI / AI Receptionist allocation requires verified merchant (CEO compliance). */
export function canAllocateAiReceptionist(isKycVerified: boolean): boolean {
  return isKycVerified === true;
}
