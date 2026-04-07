import { pricingTierForUsageDebits, type PricingTierId } from '../../../config/countryPacks';
import { LETAN_BOOKING_CREDITS_BY_TIER } from '../../../config/countryPacks/pricingByTier';
import type { B2BPricingGroup } from '../../../domain/b2b';

/** Credits per successful inbound completion, keyed by global pricing tier (T1–T4). */
export function creditsPerSuccessfulInboundForTier(tier: PricingTierId): number {
  return LETAN_BOOKING_CREDITS_BY_TIER[tier];
}

/** Legacy B2B Firestore shape: group1 ≈ T1, group2 ≈ T2+ for debit amounts (29 vs 99). */
export function creditsPerSuccessfulInbound(group: B2BPricingGroup): number {
  return creditsPerSuccessfulInboundForTier(pricingGroupToTier(group));
}

export function mapCountryToPricingTier(countryCode: string): PricingTierId {
  return pricingTierForUsageDebits(countryCode);
}

/**
 * Maps host country to legacy `group1` | `group2` for stored tenant billing.
 * T1 → group1; T2–T4 → group2 (same numeric debits as pre–Phase 6 for non-T1 EU).
 */
export function mapCountryToPricingGroup(countryCode: string): B2BPricingGroup {
  const t = mapCountryToPricingTier(countryCode);
  return t === 'T1' ? 'group1' : 'group2';
}

function pricingGroupToTier(group: B2BPricingGroup): PricingTierId {
  return group === 'group1' ? 'T1' : 'T2';
}
