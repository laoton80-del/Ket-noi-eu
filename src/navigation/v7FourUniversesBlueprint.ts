/**
 * V7 OMNIVERSE — Four consumer hubs (B2C bottom tabs).
 * Route **keys** stay stable (`routes.ts` / linking); labels match CEO “Universe” naming.
 *
 * B2B / Broker / Admin use **separate** tab decks — see `MAIN_TAB` in `routes.ts`.
 */
import { MAIN_TAB } from './routes';

export const V7_B2C_HUB_ROUTE = MAIN_TAB.B2C.home;
export const V7_B2C_LOCAL_ROUTE = MAIN_TAB.B2C.local;
export const V7_B2C_TRAVEL_ROUTE = MAIN_TAB.B2C.travel;
export const V7_B2C_ACADEMY_ROUTE = MAIN_TAB.B2C.ai;

/** Tab bar titles — `TabAi` route hosts Leona / Lễ tân AI shell today; aura = `HUB_ACADEMY`. */
export const V7_B2C_TAB_LABELS = {
  [MAIN_TAB.B2C.home]: 'Hub',
  [MAIN_TAB.B2C.local]: 'Local',
  [MAIN_TAB.B2C.travel]: 'Travel',
  [MAIN_TAB.B2C.ai]: 'Academy',
} as const;
