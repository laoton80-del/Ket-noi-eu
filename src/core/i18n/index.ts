/**
 * Smart Trio i18n foundation (typed locale matrix + resolver).
 * Does not replace `src/i18n/index.ts` runtime bootstrap — import from here for new wiring.
 */

export type {
  MarketCode,
  MarketLanguageDefinition,
  ResolveSmartTrioLocaleInput,
  ResolvedSmartTrioLocale,
  SmartTrioLocale,
  SmartTrioLocaleContext,
  SmartTrioResolutionReason,
  UserLanguageRole,
} from './smartTrioTypes';

export {
  MARKET_LANGUAGE_CONFIG,
  SMART_TRIO_EXAMPLE_FIXTURES,
  getMarketLanguageConfig,
  getSupportedLocalesForMarket,
  isSmartTrioLocaleSupported,
  normalizeLocaleCode,
} from './smartTrioConfig';

export { resolveSmartTrioLocale } from './resolveSmartTrioLocale';
