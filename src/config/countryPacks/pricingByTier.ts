import type { PricingTierId } from './types';

/**
 * Global pricing tier model (T1–T4).
 * These are internal debit anchors in platform Credits for usage accounting.
 * They are not user-facing package list prices.
 */
export const OUTBOUND_CALL_CREDITS_BY_TIER: Record<PricingTierId, number> = {
  T1: 99,
  T2: 199,
  T3: 249,
  T4: 349,
};

export const LETAN_BOOKING_CREDITS_BY_TIER: Record<PricingTierId, number> = {
  T1: 29,
  T2: 99,
  T3: 99,
  T4: 129,
};

/** Internal display/debit anchors converted to local currency for support-call estimate lines. */
export const INTERNAL_CALL_CZK_BY_TIER: Record<PricingTierId, number> = {
  T1: 29,
  T2: 99,
  T3: 129,
  T4: 169,
};

export const EXTERNAL_CALL_CZK_BY_TIER: Record<PricingTierId, number> = {
  T1: 99,
  T2: 199,
  T3: 249,
  T4: 349,
};
