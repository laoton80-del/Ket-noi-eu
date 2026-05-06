/**
 * Smart Trio i18n — typed vocabulary for VIONA Core OS (Vietnamese + English + native market language).
 * See `docs/ai-context/VIONA_GLOBAL_COMPANION_OS_ARCHITECTURE.md` §5.
 */

/** Locales bundled for Smart Trio today (subset of `src/i18n/index.ts` resources). */
export type SmartTrioLocale = 'vi' | 'en' | 'cs' | 'de' | 'fr' | 'ja' | 'ko';

/** Commercial / residency market keys used for language matrix (not ISO country enum). */
export type MarketCode = 'CZ' | 'DE' | 'VN' | 'US' | 'FR' | 'JP' | 'KR' | 'GLOBAL';

/** Coarse role for default customer vs merchant language legs. */
export type UserLanguageRole = 'customer' | 'merchant' | 'broker' | 'admin' | 'unknown';

/** Optional ambient context (future wiring from profile / tenant / shell). */
export type SmartTrioLocaleContext = Readonly<{
  marketCode?: MarketCode;
  userRole?: UserLanguageRole;
}>;

/** Primary resolver outcome for app + customer + merchant language legs. */
export type ResolvedSmartTrioLocale = Readonly<{
  appLocale: SmartTrioLocale;
  /** Market “third leg” — local language for the selected market row. */
  nativeLocale: SmartTrioLocale;
  supportedLocales: readonly SmartTrioLocale[];
  fallbackLocale: SmartTrioLocale;
  customerLocale: SmartTrioLocale;
  merchantLocale: SmartTrioLocale;
  /** Dominant reason for {@link ResolvedSmartTrioLocale.appLocale} selection. */
  reason: SmartTrioResolutionReason;
}>;

export type SmartTrioResolutionReason =
  | 'user_selected_supported'
  | 'device_locale_supported'
  | 'merchant_default_vietnamese'
  | 'customer_default_native'
  | 'admin_english_bridge'
  | 'unsupported_locale_fallback'
  | 'global_market_fallback';

export type ResolveSmartTrioLocaleInput = Readonly<{
  userSelectedLocale?: string;
  deviceLocale?: string;
  marketCode?: MarketCode;
  userRole?: UserLanguageRole;
  preferredMerchantLocale?: string;
  fallbackLocale?: string;
}>;

/** Per-market Smart Trio configuration row (static data). */
export type MarketLanguageDefinition = Readonly<{
  marketCode: MarketCode;
  /** ISO 3166-1 alpha-2 (or ZZ for unknown / global). */
  countryCode: string;
  /** Native “third leg” locale for this market. */
  nativeLocale: SmartTrioLocale;
  supportedLocales: readonly SmartTrioLocale[];
  /** English bridge when a string is missing in vi/native. */
  fallbackLocale: SmartTrioLocale;
  defaultCustomerLocale: SmartTrioLocale;
  defaultMerchantLocale: SmartTrioLocale;
  /** i18n key for market display name (react-i18next). */
  displayNameKey: string;
  /** i18n key for native language human label. */
  nativeLanguageLabelKey: string;
}>;
