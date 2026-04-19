import { OUTBOUND_CALL_CREDITS_BY_TIER } from '../config/countryPacks/pricingByTier';

/**
 * Baseline outbound Leona debit in Credits (T1 anchor) for LifeOS / legal CTAs and autonomy cost hints.
 * Country-aware quotes still use `calculateCallCreditPrice` where `userCountry` is known.
 */
export const LIFEOS_LEGAL_LEONA_CREDITS = OUTBOUND_CALL_CREDITS_BY_TIER.T1;
