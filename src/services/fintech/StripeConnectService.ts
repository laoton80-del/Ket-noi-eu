/**
 * Mock Stripe Connect B2B2C rail — KYC onboarding + **dynamic** acquirer pass-through + 1% KNG net margin.
 *
 * **Guardrails:** No flat `2.5% + $0.30`. Platform recovery = **estimated Stripe processing**
 * (by payment rail) + **1% of gross** (`KNG_NET_MARGIN_BPS`) so KNG never absorbs acquirer drift.
 */

import { PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import { formatCurrency } from '../../utils/currencyFormatter';
import {
  buildV7ConnectMarketplaceCheckoutPlan,
  summarizeV7PlanMajor,
  type V7ConnectMarketplaceCheckoutPlan,
} from '../billing/StripeBillingService';
import {
  computeDynamicPlatformRecovery,
  minorUnitsToMajor,
  type StripePaymentRail,
} from '../api/StripeBillingService';

export interface OnboardB2BMerchantResult {
  readonly status: 'mock_redirect';
  readonly merchantId: string;
  readonly stripeOnboardingUrl: string;
  readonly messageVi: string;
}

export interface MarketplaceTransactionSettlement {
  readonly ok: true;
  readonly b2cUserId: string;
  readonly b2bMerchantId: string;
  readonly totalAmountMajorUsd: number;
  readonly stripePaymentRail: StripePaymentRail;
  /** Estimated Stripe acquirer + scheme cost (major USD) on **tourist total charge**. */
  readonly stripeProcessingFeeMajorUsd: number;
  /** Mandatory 1% of gross — KNG net margin on volume (major USD) on charged amount. */
  readonly kngNetMarginMajorUsd: number;
  readonly b2bTotalFeesMajorUsd: number;
  readonly merchantNetMajorUsd: number;
  readonly messageVi: string;
  /** V7 dual split — wired to `computeV7DualSplitFeesMinor` via {@link buildV7ConnectMarketplaceCheckoutPlan}. */
  readonly v7CheckoutPlan: V7ConnectMarketplaceCheckoutPlan;
  /** Stripe PI fields (minor units) — `application_fee_amount` routes platform policy fees to KNG. */
  readonly paymentIntentAmountMinor: number;
  readonly paymentIntentApplicationFeeMinor: number;
}

export type ProcessMarketplaceTransactionResult =
  | MarketplaceTransactionSettlement
  | {
      readonly ok: false;
      readonly code: 'invalid_amount';
      readonly messageVi: string;
    };

export type ProcessMarketplaceTransactionOptions = Readonly<{
  /** Defaults to `default_card` in mock; production maps from `payment_method_details`. */
  stripeRail?: StripePaymentRail;
  /** Trust & AI Shield band (500–700 bps). Defaults to billing service mid-band (6%). */
  touristTrustBps?: number;
  /** Tier 3 Wholesale merchant — 1% platform cut on service gross instead of 5%. */
  isWholesaleTier3?: boolean;
}>;

export class StripeConnectService {
  /**
   * Simulates Account Links / Stripe-hosted onboarding for a connected B2B merchant.
   */
  onboardB2BMerchant(merchantId: string): OnboardB2BMerchantResult {
    const id = merchantId.trim();
    const safeId = id.length > 0 ? id : 'unknown-merchant';
    return {
      status: 'mock_redirect',
      merchantId: safeId,
      stripeOnboardingUrl: `https://connect.stripe.com/setup/e/mock/${encodeURIComponent(safeId)}`,
      messageVi: `Stripe Connect: đã mở phiên KYC / onboarding cho merchant "${safeId}" (mock).`,
    };
  }

  /**
   * Applies **V7 dual split-fee** (tourist trust + merchant platform) on service gross, then estimates
   * Stripe + 1% KNG recovery on the **total charged to tourist** (`buildV7ConnectMarketplaceCheckoutPlan`).
   */
  processMarketplaceTransaction(
    b2cUserId: string,
    b2bMerchantId: string,
    totalAmountMajorUsd: number,
    options?: ProcessMarketplaceTransactionOptions
  ): ProcessMarketplaceTransactionResult {
    const uid = b2cUserId.trim();
    const mid = b2bMerchantId.trim();
    if (!Number.isFinite(totalAmountMajorUsd) || totalAmountMajorUsd <= 0) {
      return {
        ok: false,
        code: 'invalid_amount',
        messageVi: 'Số tiền giao dịch không hợp lệ.',
      };
    }
    const rail = options?.stripeRail ?? 'default_card';
    const wholesale = options?.isWholesaleTier3 === true;

    const v7 = buildV7ConnectMarketplaceCheckoutPlan({
      grossServiceAmountMajor: totalAmountMajorUsd,
      settlementCurrency: 'EUR',
      touristTrustBps: options?.touristTrustBps,
      isWholesaleTier3: wholesale,
    });

    if (!v7.ok) {
      return { ok: false, code: 'invalid_amount', messageVi: 'Số tiền giao dịch không hợp lệ.' };
    }

    const { plan } = v7;
    const sum = summarizeV7PlanMajor(plan);

    const recovery = computeDynamicPlatformRecovery({
      grossAmountMajor: sum.totalCharge,
      currency: 'EUR',
      rail,
    });
    const stripeMajor = minorUnitsToMajor(recovery.stripeProcessingFeeMinor);
    const kngMarginMajor = minorUnitsToMajor(recovery.kngNetMarginMinor);
    const b2bTotalFeesMajorUsd = Math.min(
      sum.totalCharge,
      Math.round((stripeMajor + kngMarginMajor) * 10_000) / 10_000
    );

    const merchantNetMajorUsd = Math.round(sum.merchantNet * 10_000) / 10_000;
    const merchantSharePct =
      totalAmountMajorUsd > 0 ? ((merchantNetMajorUsd / totalAmountMajorUsd) * 100).toFixed(1) : '0.0';
    const stripeLabel = formatCurrency(stripeMajor, PRICING_BASELINE_CURRENCY);
    const kngLabel = formatCurrency(kngMarginMajor, PRICING_BASELINE_CURRENCY);
    const netLabel = formatCurrency(merchantNetMajorUsd, PRICING_BASELINE_CURRENCY);
    const trustLabel = formatCurrency(sum.touristTrust, PRICING_BASELINE_CURRENCY);
    const merchFeeLabel = formatCurrency(sum.merchantPlatform, PRICING_BASELINE_CURRENCY);
    const totalChargeLabel = formatCurrency(sum.totalCharge, PRICING_BASELINE_CURRENCY);
    const wholesaleNote = wholesale ? ' (Wholesale 1% merchant fee)' : '';
    const messageVi =
      `Giao dịch V7: Khách trả ${totalChargeLabel} (gồm Trust & AI ${trustLabel}). ` +
      `Phí nền tảng merchant ${merchFeeLabel}${wholesaleNote}. ` +
      `Connect application_fee = trust + merchant fee (minor). ` +
      `Chủ tiệm nhận ~${merchantSharePct}% gốc dịch vụ (${netLabel}). ` +
      `Ước tính Stripe+VIONA 1% trên tổng quẹt: ${stripeLabel} + ${kngLabel} (mock).`;

    return {
      ok: true,
      b2cUserId: uid || 'anonymous-b2c',
      b2bMerchantId: mid || 'unknown-b2b',
      totalAmountMajorUsd,
      stripePaymentRail: rail,
      stripeProcessingFeeMajorUsd: stripeMajor,
      kngNetMarginMajorUsd: kngMarginMajor,
      b2bTotalFeesMajorUsd,
      merchantNetMajorUsd,
      messageVi,
      v7CheckoutPlan: plan,
      paymentIntentAmountMinor: plan.totalChargedToCustomerMinor,
      paymentIntentApplicationFeeMinor: plan.applicationFeeAmountMinor,
    };
  }
}

/** Shared mock instance for B2B surfaces (replace with DI + real Stripe SDK in production). */
export const stripeConnectService = new StripeConnectService();
