/**
 * GLOBAL_V1 — **canonical repo entry** for the **live** B2C wallet pack pricing spine.
 *
 * **Three layers (exported here; only layer 1 drives money today):**
 * 1. **Runtime spine** — `GLOBAL_WALLET_PACKAGES`, USD×tier math, local fiat labels via `Pricing.ts`; checkout / wallet behavior stays here.
 * 2. **Doctrine semantics** — re-exports from `commercialFlagshipMapping.ts` (public offers, backbone map, read-only selectors). No impact on amounts or payment flow unless a future phase wires entitlement explicitly.
 * 3. **B2C entitlement surface (read-only hints)** — `commercialEntitlementSurface.ts`: readiness / package visibility metadata for `ai_support` · `ai_document` · `call_help` only; **not** server entitlement.
 *
 * **Live today (charge + on-screen amounts for Wallet / Tiện ích / Quốc gia preview):**
 * - Rows: `GLOBAL_WALLET_PACKAGES` (six IDs: starter → enterprise).
 * - List math: USD baseline `usdT2` × `TIER_PRICE_MULTIPLIER[tier]` where `tier` comes from `countryPacks` / `pricingTierForUsageDebits`.
 * - Local fiat string: **secondary** illustrative layer via `usdToLocalDisplayAmount` (static rates in `Pricing.ts`) — **not** the commercial master anchor.
 *
 * **Not live for wallet checkout:** Band A/B/C integer tables in `src/config/monetization/data.ts` (`B2C_PACK_LIST_PRICE_BY_BAND`, CZK major units) — migration target only; see `docs/COMMERCIAL_SPINE_LIVE.md` and `docs/PHASE_2B_MONETIZATION_CHECKOUT_DECISION.md`.
 *
 * Do not import wallet list pricing from `monetization/data` for checkout until Phase 2B exit criteria are met.
 */

export const LIVE_B2C_WALLET_PACK_SPINE_ID = 'usd_tier_country_pack_to_local_label' as const;

/** Future single spine (band tables + unified consumer) — **not** active for wallet amounts. */
export const MIGRATION_BAND_TABLE_SPINE_ID = 'band_czk_integer_tables_monetization_module' as const;

export type { WalletPackageId } from './globalWalletPackages';
export { GLOBAL_WALLET_PACKAGES, TIER_PRICE_MULTIPLIER, usdListPriceForPackageAtTier } from './globalWalletPackages';

export type { WalletPackagePlan, WalletPriceCard } from './Pricing';
export {
  formatMoneyByCurrency,
  getComboPricesByCountry,
  getLocalPriceMeta,
  getMarketTierByCountry,
  getPricingByCountry,
  getWalletPackagePricesByCountry,
} from './Pricing';

// --- Doctrine semantic layer (read-only; does not change wallet math or checkout) ---

import { ALL_PACKAGE_TIERS, B2B_COMMERCIAL_TIERS, STANDARD_PLUS_TIERS, listOfferDefinitions } from './commercialFlagshipMapping';

/** Five public offers (doctrine §4); frozen snapshot at load — definitions live in `commercialFlagshipMapping.ts`. */
export const COMMERCIAL_FLAGSHIP_OFFERS = listOfferDefinitions();

/** Package tier lists for doctrine positioning (same IDs as wallet rows; not an entitlement matrix). */
export const COMMERCIAL_PACKAGE_METADATA = {
  allTierIds: ALL_PACKAGE_TIERS,
  b2bPositioningTierIds: B2B_COMMERCIAL_TIERS,
  /** Doctrine §6 — AI Teacher offer semantic from Standard upward (not Starter/Basic in mapping). */
  standardPlusTierIds: STANDARD_PLUS_TIERS,
} as const;

export type {
  BackboneServiceKey,
  BackboneServiceMapping,
  CommercialOfferDefinition,
  CommercialSurfaceRef,
  FlagshipDomain,
  InternalMeterKey,
  PackageTierKey,
  ProductionRolloutStatus,
  ProductionStatus,
  PublicOfferKey,
} from './commercialFlagshipMapping';

export {
  ALL_PACKAGE_TIERS,
  BACKBONE_SERVICE_KEYS,
  BACKBONE_SERVICE_MAPPINGS,
  B2B_COMMERCIAL_TIERS,
  INTERNAL_METER_KEYS,
  PUBLIC_OFFER_KEYS,
  STANDARD_PLUS_TIERS,
  getBackboneMapping,
  getOfferByBackboneService,
  getOfferDefinition,
  getOfferDefinition as getCommercialOfferConfig,
  getOffersForPackage,
  getPrimaryOfferByBackboneService,
  listBackboneMappingsForOffer,
  listOfferDefinitions,
} from './commercialFlagshipMapping';

export type {
  B2CPublicOfferKey,
  CommercialOfferAvailability,
  CommercialReadinessState,
  CommercialSurfaceAccess,
  PackageAccessRule,
} from './commercialEntitlementSurface';

export {
  B2C_COMMERCIAL_ENTITLEMENT_SURFACE,
  B2C_COMMERCIAL_OFFER_KEYS,
  getB2COfferAccess,
  getB2COffersForPackage,
  isOfferVisibleForPackage,
  packageRulesForOffer,
} from './commercialEntitlementSurface';
