import type { CountryPack } from './types';

/** EU/EEA-style universal emergency (single number); per-country packs can override later. */
const EU_EMERGENCY = { primaryNumber: '112', fallbackNumbers: ['112'] };

const EU_DOC_HINT =
  'Giấy tờ liên quan định cư, visa và lao động tại EU/khu vực châu Âu; ưu tiên trích xuất ngày hết hạn chính xác.';

export const COUNTRY_PACKS: Record<string, CountryPack> = {
  CZ: {
    countryCode: 'CZ',
    regionCode: 'EU-CENTRAL',
    locale: 'cs-CZ',
    pricingTier: 'T1',
    currencyCode: 'CZK',
    emergencyConfig: EU_EMERGENCY,
    holidayPack: 'eu',
    defaultLanguage: 'cs',
    legalFlowConfig: {
      defaultScenario: 'government',
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT,
    },
  },
  SK: {
    countryCode: 'SK',
    regionCode: 'EU-CENTRAL',
    locale: 'sk-SK',
    pricingTier: 'T1',
    currencyCode: 'EUR',
    emergencyConfig: EU_EMERGENCY,
    holidayPack: 'eu',
    defaultLanguage: 'sk',
    legalFlowConfig: {
      defaultScenario: 'government',
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT,
    },
  },
  PL: {
    countryCode: 'PL',
    regionCode: 'EU-CENTRAL',
    locale: 'pl-PL',
    pricingTier: 'T1',
    currencyCode: 'PLN',
    emergencyConfig: EU_EMERGENCY,
    holidayPack: 'eu',
    defaultLanguage: 'pl',
    legalFlowConfig: {
      defaultScenario: 'government',
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT,
    },
  },
  DE: {
    countryCode: 'DE',
    regionCode: 'EU-WEST',
    locale: 'de-DE',
    pricingTier: 'T2',
    currencyCode: 'EUR',
    emergencyConfig: EU_EMERGENCY,
    holidayPack: 'eu',
    defaultLanguage: 'de',
    legalFlowConfig: {
      defaultScenario: 'government',
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT,
    },
  },
  FR: {
    countryCode: 'FR',
    regionCode: 'EU-WEST',
    locale: 'fr-FR',
    pricingTier: 'T2',
    currencyCode: 'EUR',
    emergencyConfig: EU_EMERGENCY,
    holidayPack: 'eu',
    defaultLanguage: 'fr',
    legalFlowConfig: {
      defaultScenario: 'government',
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT,
    },
  },
  UK: {
    countryCode: 'UK',
    regionCode: 'EU-WEST',
    locale: 'en-GB',
    pricingTier: 'T2',
    currencyCode: 'GBP',
    emergencyConfig: EU_EMERGENCY,
    holidayPack: 'eu',
    defaultLanguage: 'en',
    legalFlowConfig: {
      defaultScenario: 'government',
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT,
    },
  },
  GB: {
    countryCode: 'GB',
    regionCode: 'EU-WEST',
    locale: 'en-GB',
    pricingTier: 'T2',
    currencyCode: 'GBP',
    emergencyConfig: EU_EMERGENCY,
    holidayPack: 'eu',
    defaultLanguage: 'en',
    legalFlowConfig: {
      defaultScenario: 'government',
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT,
    },
  },
  CH: {
    countryCode: 'CH',
    regionCode: 'EU-WEST',
    locale: 'de-CH',
    pricingTier: 'T2',
    currencyCode: 'CHF',
    emergencyConfig: EU_EMERGENCY,
    holidayPack: 'eu',
    defaultLanguage: 'de',
    legalFlowConfig: {
      defaultScenario: 'government',
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT,
    },
  },
  VN: {
    countryCode: 'VN',
    regionCode: 'SEA',
    locale: 'vi-VN',
    pricingTier: 'T2',
    currencyCode: 'EUR',
    emergencyConfig: { primaryNumber: '115', fallbackNumbers: ['113', '114'] },
    holidayPack: 'vn',
    defaultLanguage: 'vi',
    legalFlowConfig: {
      defaultScenario: 'general',
      visaRenewalEnabled: false,
      documentJurisdictionHint: 'Giấy tờ Việt Nam hoặc giấy tờ hộ chiếu/visa liên quan nhập cảnh VN.',
    },
  },
};

/**
 * Explicit **Czech Republic** pack (selectable / known ISO `CZ`).
 * Empty profile no longer maps here (G3) — see `resolveCountryPack` → `GLOBAL_UNLISTED_COUNTRY_PACK` when country unknown.
 */
export const DEFAULT_COUNTRY_PACK: CountryPack = {
  countryCode: 'CZ',
  regionCode: 'EU-CENTRAL',
  locale: 'en-GB',
  pricingTier: 'T1',
  currencyCode: 'CZK',
  emergencyConfig: EU_EMERGENCY,
  holidayPack: 'eu',
  defaultLanguage: 'en',
  legalFlowConfig: {
    defaultScenario: 'government',
    visaRenewalEnabled: true,
    documentJurisdictionHint: EU_DOC_HINT,
  },
};

/**
 * When profile has a **valid 2-letter ISO not in `COUNTRY_PACKS`**, use this instead of CZ-shaped default
 * so pricing/currency UI does not look “Czech by accident”. Aligns with `pricingTierForUsageDebits` → T2 for unknown.
 * `countryCode: 'ZZ'` is a sentinel (not a real selectable country in UI).
 */
export const GLOBAL_UNLISTED_COUNTRY_PACK: CountryPack = {
  countryCode: 'ZZ',
  regionCode: 'GLOBAL-UNLISTED',
  locale: 'en-GB',
  pricingTier: 'T2',
  currencyCode: 'EUR',
  emergencyConfig: EU_EMERGENCY,
  holidayPack: 'global',
  defaultLanguage: 'en',
  legalFlowConfig: {
    defaultScenario: 'general',
    visaRenewalEnabled: false,
    documentJurisdictionHint:
      'Giấy tờ có thể đa quốc gia; trích xuất ngày hết hạn chính xác, không giả định một khu vực pháp lý duy nhất.',
  },
};
