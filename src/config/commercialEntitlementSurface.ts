/**
 * B2C commercial entitlement **surface** (read-only readiness metadata).
 *
 * Single source of offer fields: `commercialFlagshipMapping.getOfferDefinition`.
 * This module adds UI/service-oriented hints only — **no** server entitlement, **no** wallet debit, **no** gating.
 *
 * Out of scope here: `ai_teacher`, `business_ops`, backbone `flight_assistant` (future B2C extension — see mapping).
 *
 * TODO(entitlement-phase): replace `requiresCredits` hints with server-backed policy + meter joins.
 */

import {
  ALL_PACKAGE_TIERS,
  getOfferDefinition,
  type CommercialSurfaceRef,
  type PackageTierKey,
  type ProductionRolloutStatus,
  type PublicOfferKey,
} from './commercialFlagshipMapping';

/** Readiness from repo evidence (mirrors mapping `productionStatus`). */
export type CommercialReadinessState = ProductionRolloutStatus;

/** Coarse availability hint for UI / orchestration — not billing truth. */
export type CommercialOfferAvailability = 'available' | 'pilot_limited' | 'planned';

export const B2C_COMMERCIAL_OFFER_KEYS = ['ai_support', 'ai_document', 'call_help'] as const;

export type B2CPublicOfferKey = (typeof B2C_COMMERCIAL_OFFER_KEYS)[number];

/** Per-tier qualitative access (mapping narrative; not live entitlement). */
export type PackageAccessRule = {
  tier: PackageTierKey;
  included: boolean;
  addOn: boolean;
};

/** One row of B2C offer readiness / surface anchors. */
export type CommercialSurfaceAccess = {
  offerKey: B2CPublicOfferKey;
  availability: CommercialOfferAvailability;
  productionStatus: CommercialReadinessState;
  /** Tiers where offer may appear in product narrative (union of included + add-on lists from mapping). */
  eligiblePackages: readonly PackageTierKey[];
  /**
   * Whether **typical paid-meter paths** exist for this offer in the product today.
   * Qualitative: Call Help debits credits; Document scan/AI paths are metered; AI Support mixes free-controlled (e.g. SOS) and paid paths — do not use as hard gate.
   */
  requiresCredits: boolean;
  supportsAddOn: boolean;
  surfaceRefs: readonly CommercialSurfaceRef[];
  notes: string;
  guardrails: string;
};

function uniqueSortedTiers(tiers: readonly PackageTierKey[]): readonly PackageTierKey[] {
  return [...new Set(tiers)].sort((a, b) => ALL_PACKAGE_TIERS.indexOf(a) - ALL_PACKAGE_TIERS.indexOf(b));
}

function toAvailability(status: CommercialReadinessState): CommercialOfferAvailability {
  if (status === 'active') return 'available';
  if (status === 'pilot') return 'pilot_limited';
  return 'planned';
}

function requiresCreditsHint(key: B2CPublicOfferKey): boolean {
  if (key === 'call_help') return true;
  if (key === 'ai_document') return true;
  return false;
}

function buildSurfaceRow(key: B2CPublicOfferKey): CommercialSurfaceAccess {
  const def = getOfferDefinition(key as PublicOfferKey);
  if (def.domain !== 'b2c') {
    throw new Error(`commercialEntitlementSurface: expected B2C domain for ${key}`);
  }
  const eligible = uniqueSortedTiers([...def.includedFromPackages, ...def.addOnEligible]);
  return {
    offerKey: key,
    availability: toAvailability(def.productionStatus),
    productionStatus: def.productionStatus,
    eligiblePackages: eligible,
    requiresCredits: requiresCreditsHint(key),
    supportsAddOn: def.addOnEligible.length > 0,
    surfaceRefs: def.relatedSurfaces,
    notes: def.notes,
    guardrails: def.guardrails,
  };
}

/** Frozen B2C offer readiness table (derived from mapping at module load). */
export const B2C_COMMERCIAL_ENTITLEMENT_SURFACE: Record<B2CPublicOfferKey, CommercialSurfaceAccess> = {
  ai_support: buildSurfaceRow('ai_support'),
  ai_document: buildSurfaceRow('ai_document'),
  call_help: buildSurfaceRow('call_help'),
};

export function getB2COfferAccess(offer: B2CPublicOfferKey): CommercialSurfaceAccess {
  return B2C_COMMERCIAL_ENTITLEMENT_SURFACE[offer];
}

export function isOfferVisibleForPackage(offer: B2CPublicOfferKey, tier: PackageTierKey): boolean {
  return getB2COfferAccess(offer).eligiblePackages.includes(tier);
}

export function getB2COffersForPackage(tier: PackageTierKey): B2CPublicOfferKey[] {
  return B2C_COMMERCIAL_OFFER_KEYS.filter((k) => isOfferVisibleForPackage(k, tier));
}

export function packageRulesForOffer(offer: B2CPublicOfferKey): readonly PackageAccessRule[] {
  const def = getOfferDefinition(offer as PublicOfferKey);
  return ALL_PACKAGE_TIERS.map((tier) => ({
    tier,
    included: def.includedFromPackages.includes(tier),
    addOn: def.addOnEligible.includes(tier),
  }));
}
