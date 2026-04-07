export type PricingTierId = 'T1' | 'T2' | 'T3' | 'T4';

/** Display / settlement currency for wallet UI; aligns with `Pricing.CurrencyCode`. */
export type PackCurrencyCode = 'CZK' | 'PLN' | 'EUR' | 'GBP' | 'CHF';
export type HolidayPackId = 'eu' | 'vn' | 'global';
export type LegalScenario = 'doctor' | 'government' | 'work' | 'general' | 'travel';

/** UI + emergency phrase routing; extend as new locales ship. */
export type CountryDefaultLanguage = 'vi' | 'en' | 'cs' | 'de' | 'fr' | 'pl' | 'sk';

export type CountryPack = {
  countryCode: string;
  regionCode: string;
  locale: string;
  pricingTier: PricingTierId;
  /** Wallet / marketing display currency for this country pack. */
  currencyCode: PackCurrencyCode;
  emergencyConfig: {
    primaryNumber: string;
    fallbackNumbers: string[];
  };
  holidayPack: HolidayPackId;
  defaultLanguage: CountryDefaultLanguage;
  legalFlowConfig: {
    defaultScenario: LegalScenario;
    visaRenewalEnabled: boolean;
    /** Short phrase for vision / document AI (replaces hardcoded “EU-only” prompts). */
    documentJurisdictionHint: string;
  };
};
