import { computeSplitFeeBreakdown } from '../api/SplitFeeService';
import {
  computeDynamicPlatformRecovery,
  minorUnitsToMajor,
} from '../api/StripeBillingService';

const FIXER_SETTLEMENT_CURRENCY = 'eur' as const;

function roundMajorEur(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export type FixerPayoutBreakdown = Readonly<{
  baseAmountEur: number;
  customerFeeEur: number;
  totalChargeToCustomerEur: number;
  providerFeeEur: number;
  totalPlatformRevenueEur: number;
  stripeFeeEstimateEur: number;
  netPayoutToFixerEur: number;
  /** Total platform fee = max(10% of base, €2), split 50/50. */
  totalPlatformFeeEur: number;
  fixerCustomerFeePercent: number;
  fixerProviderFeePercent: number;
  stripeFeeEstimatePercent: number;
}>;

export type FixerPayoutInvalid = Readonly<{
  ok: false;
  code: 'invalid_amount';
}>;

export type CalculateSplitPaymentResult = Readonly<{ ok: true; breakdown: FixerPayoutBreakdown }> | FixerPayoutInvalid;

/**
 * Split-fee model: **max(10% of transaction, €2 floor)** total platform fee, split **50/50**
 * between customer surcharge and fixer deduction (`SplitFeeService`).
 */
export function calculateSplitPayment(baseAmountEur: number): CalculateSplitPaymentResult {
  if (!Number.isFinite(baseAmountEur) || baseAmountEur <= 0) {
    return { ok: false, code: 'invalid_amount' };
  }
  const split = computeSplitFeeBreakdown({
    transactionAmountMajor: baseAmountEur,
    currency: 'EUR',
  });
  const baseMinor = split.transactionAmountMinor;
  const customerFeeEur = split.customerSurchargeMinor / 100;
  const providerFeeEur = split.fixerDeductionMinor / 100;
  const totalPlatformFeeEur = split.totalPlatformFeeMinor / 100;
  const totalChargeToCustomerEur = roundMajorEur(baseAmountEur + customerFeeEur);
  const netPayoutToFixerEur = roundMajorEur(baseAmountEur - providerFeeEur);
  const totalPlatformRevenueEur = roundMajorEur(customerFeeEur + providerFeeEur);

  const recovery = computeDynamicPlatformRecovery({
    grossAmountMajor: totalChargeToCustomerEur,
    currency: 'EUR',
    rail: 'eu_card_consumer',
  });
  const stripeFeeEstimateEur = minorUnitsToMajor(
    recovery.stripeProcessingFeeMinor + recovery.kngNetMarginMinor
  );
  const stripeFeeEstimatePercent =
    totalChargeToCustomerEur > 0 ? (stripeFeeEstimateEur / totalChargeToCustomerEur) * 100 : 0;

  return {
    ok: true,
    breakdown: {
      baseAmountEur: roundMajorEur(baseAmountEur),
      customerFeeEur,
      totalChargeToCustomerEur,
      providerFeeEur,
      totalPlatformRevenueEur,
      stripeFeeEstimateEur,
      netPayoutToFixerEur,
      totalPlatformFeeEur,
      fixerCustomerFeePercent:
        baseMinor > 0 ? (split.customerSurchargeMinor / baseMinor) * 100 : 0,
      fixerProviderFeePercent:
        baseMinor > 0 ? (split.fixerDeductionMinor / baseMinor) * 100 : 0,
      stripeFeeEstimatePercent,
    },
  };
}

/**
 * Stripe Connect **destination charge** shape: customer pays `amount`;
 * platform retains `application_fee_amount` (= total split-fee platform pool);
 * remainder routes to connected account per Stripe rules.
 *
 * Amounts in **minor units** (cent) for EUR PaymentIntent fields.
 */
export type StripeConnectFixerDestinationChargePlan = Readonly<{
  currency: typeof FIXER_SETTLEMENT_CURRENCY;
  amountChargeToCustomerCents: number;
  applicationFeeAmountCents: number;
  connectedAccountId: string;
  /** Same as breakdown — for `metadata` / reconciliation. */
  breakdown: FixerPayoutBreakdown;
}>;

export type PrepareFixerDestinationChargeResult =
  | Readonly<{ ok: true; plan: StripeConnectFixerDestinationChargePlan }>
  | FixerPayoutInvalid
  | Readonly<{ ok: false; code: 'missing_connected_account' }>;

function eurToCents(eur: number): number {
  return Math.max(0, Math.round(eur * 100));
}

/**
 * Prepares PI fields for `payment_intent` with `transfer_data.destination` + `application_fee_amount`
 * (platform keeps commission on the platform account).
 */
export function prepareStripeConnectFixerDestinationCharge(params: Readonly<{
  baseAmountEur: number;
  connectedStripeAccountId: string;
}>): PrepareFixerDestinationChargeResult {
  const accountId = params.connectedStripeAccountId.trim();
  if (accountId.length === 0) {
    return { ok: false, code: 'missing_connected_account' };
  }
  const payout = calculateSplitPayment(params.baseAmountEur);
  if (!payout.ok) {
    return payout;
  }
  const { breakdown } = payout;
  return {
    ok: true,
    plan: {
      currency: FIXER_SETTLEMENT_CURRENCY,
      amountChargeToCustomerCents: eurToCents(breakdown.totalChargeToCustomerEur),
      applicationFeeAmountCents: eurToCents(breakdown.totalPlatformRevenueEur),
      connectedAccountId: accountId,
      breakdown,
    },
  };
}
