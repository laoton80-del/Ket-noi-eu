/**
 * @deprecated Import from `src/config/appBrand` — kept so older paths keep working during Global spine cleanup (G3).
 */
import { ASSISTANTS_ROSTER, PRICING_MARKET_TIERS_USD } from './appBrand';
export type { AssistantIdentity, PricingTier } from './appBrand';
export {
  APP_BRAND,
  ASSISTANTS_ROSTER,
  PRICING_MARKET_TIERS_USD,
  formatCzk,
  formatUsd,
} from './appBrand';

/** @deprecated Use `ASSISTANTS_ROSTER`. */
export const ASSISTANTS_CORE_V1 = ASSISTANTS_ROSTER;
/** @deprecated Use `PRICING_MARKET_TIERS_USD`. */
export const PRICING_GLOBAL_CORE_V1 = PRICING_MARKET_TIERS_USD;
