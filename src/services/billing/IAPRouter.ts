/**
 * Smart billing router — **Apple App Store 3.2.1 / 3.1.1** alignment.
 * - **Physical / real-world services** → in-app Stripe (Connect) per policy for “goods and services outside the app”.
 * - **Digital SaaS / consumable credits (VIG, tiers)** → **out-of-app** Stripe Customer Portal / web checkout to avoid IAP commission,
 *   or **hide purchase** during App Store review when `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` is set.
 *
 * Server-side PaymentIntents should mirror these routes; client chooses UX + entry surface.
 *
 * @see Stripe marketplace math — `StripeBillingService` (Connect destination charges for physical flows).
 */

import type { SubscriptionPlan } from '../../context/authTypes';

export type BillingItemType = 'PHYSICAL_SERVICE' | 'DIGITAL_SAAS';

export type BillingGatewayKind =
  | 'stripe_in_app_physical'
  | 'external_stripe_portal'
  | 'purchase_surface_hidden_review';

export type BillingGatewayDecision = Readonly<{
  gateway: BillingGatewayKind;
  /** Human-readable rationale for logs / support. */
  reason: string;
  /** When `external_stripe_portal` — open in WebView / external browser (never as IAP). */
  stripeCustomerPortalUrl: string | null;
  /** When true, do not render primary purchase CTAs (review-safe shell). */
  hideDigitalPurchaseButton: boolean;
}>;

function readPortalUrl(): string | null {
  const u = process.env.EXPO_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL?.trim() ?? '';
  return u.length > 0 ? u : null;
}

/** CEO / release manager toggles during App Review to avoid accidental IAP rejection on digital goods. */
export function isAppStoreReviewMode(): boolean {
  const v = process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE?.trim().toLowerCase() ?? '';
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Routes checkout UX by **item class** (not by user country).
 * Physical nail/salon bookings → Stripe in-app; digital VIG / Power tier → web portal or hidden CTA.
 */
export function determineBillingGateway(itemType: BillingItemType): BillingGatewayDecision {
  if (itemType === 'PHYSICAL_SERVICE') {
    return {
      gateway: 'stripe_in_app_physical',
      reason:
        'Real-world services (salon, booking, hospitality) — Stripe Connect / PaymentIntents in-app per marketplace rules.',
      stripeCustomerPortalUrl: null,
      hideDigitalPurchaseButton: false,
    };
  }

  const review = isAppStoreReviewMode();
  const portal = readPortalUrl();

  if (review) {
    return {
      gateway: 'purchase_surface_hidden_review',
      reason:
        'Digital SaaS / token top-up: suppress in-app purchase entry during App Store review; use TestFlight notes + web for reviewers.',
      stripeCustomerPortalUrl: portal,
      hideDigitalPurchaseButton: true,
    };
  }

  return {
    gateway: 'external_stripe_portal',
    reason:
      'Digital goods / subscriptions — direct user to Stripe Customer Portal or hosted checkout **outside** the app binary to avoid 30% IAP on those items.',
    stripeCustomerPortalUrl: portal,
    hideDigitalPurchaseButton: false,
  };
}

/** Helper: map wallet top-up / tier flows to {@link determineBillingGateway}. */
export function billingGatewayForPlanPurchase(_plan: SubscriptionPlan, kind: 'physical_booking' | 'digital_credit'): BillingGatewayDecision {
  return determineBillingGateway(kind === 'physical_booking' ? 'PHYSICAL_SERVICE' : 'DIGITAL_SAAS');
}
