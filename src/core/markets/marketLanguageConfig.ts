import type { MarketCode, MarketLanguageDefinition, SmartTrioLocale } from '../i18n/smartTrioTypes';

const VI_EN_CS: readonly SmartTrioLocale[] = ['vi', 'en', 'cs'];
const VI_EN_DE: readonly SmartTrioLocale[] = ['vi', 'en', 'de'];
const VI_EN: readonly SmartTrioLocale[] = ['vi', 'en'];
const VI_EN_FR: readonly SmartTrioLocale[] = ['vi', 'en', 'fr'];
const VI_EN_JA: readonly SmartTrioLocale[] = ['vi', 'en', 'ja'];
const VI_EN_KO: readonly SmartTrioLocale[] = ['vi', 'en', 'ko'];

/**
 * Static Smart Trio matrix — Vietnamese always available; English is bridge; native completes the trio.
 */
export const MARKET_LANGUAGE_CONFIG: Readonly<Record<MarketCode, MarketLanguageDefinition>> = {
  CZ: {
    marketCode: 'CZ',
    countryCode: 'CZ',
    nativeLocale: 'cs',
    supportedLocales: VI_EN_CS,
    fallbackLocale: 'en',
    defaultCustomerLocale: 'cs',
    defaultMerchantLocale: 'vi',
    displayNameKey: 'smartTrio.market.cz',
    nativeLanguageLabelKey: 'smartTrio.language.cs',
  },
  DE: {
    marketCode: 'DE',
    countryCode: 'DE',
    nativeLocale: 'de',
    supportedLocales: VI_EN_DE,
    fallbackLocale: 'en',
    defaultCustomerLocale: 'de',
    defaultMerchantLocale: 'vi',
    displayNameKey: 'smartTrio.market.de',
    nativeLanguageLabelKey: 'smartTrio.language.de',
  },
  VN: {
    marketCode: 'VN',
    countryCode: 'VN',
    nativeLocale: 'vi',
    supportedLocales: VI_EN,
    fallbackLocale: 'en',
    defaultCustomerLocale: 'vi',
    defaultMerchantLocale: 'vi',
    displayNameKey: 'smartTrio.market.vn',
    nativeLanguageLabelKey: 'smartTrio.language.vi',
  },
  US: {
    marketCode: 'US',
    countryCode: 'US',
    nativeLocale: 'en',
    supportedLocales: VI_EN,
    fallbackLocale: 'en',
    defaultCustomerLocale: 'en',
    defaultMerchantLocale: 'vi',
    displayNameKey: 'smartTrio.market.us',
    nativeLanguageLabelKey: 'smartTrio.language.en',
  },
  FR: {
    marketCode: 'FR',
    countryCode: 'FR',
    nativeLocale: 'fr',
    supportedLocales: VI_EN_FR,
    fallbackLocale: 'en',
    defaultCustomerLocale: 'fr',
    defaultMerchantLocale: 'vi',
    displayNameKey: 'smartTrio.market.fr',
    nativeLanguageLabelKey: 'smartTrio.language.fr',
  },
  JP: {
    marketCode: 'JP',
    countryCode: 'JP',
    nativeLocale: 'ja',
    supportedLocales: VI_EN_JA,
    fallbackLocale: 'en',
    defaultCustomerLocale: 'ja',
    defaultMerchantLocale: 'vi',
    displayNameKey: 'smartTrio.market.jp',
    nativeLanguageLabelKey: 'smartTrio.language.ja',
  },
  KR: {
    marketCode: 'KR',
    countryCode: 'KR',
    nativeLocale: 'ko',
    supportedLocales: VI_EN_KO,
    fallbackLocale: 'en',
    defaultCustomerLocale: 'ko',
    defaultMerchantLocale: 'vi',
    displayNameKey: 'smartTrio.market.kr',
    nativeLanguageLabelKey: 'smartTrio.language.ko',
  },
  GLOBAL: {
    marketCode: 'GLOBAL',
    countryCode: 'ZZ',
    nativeLocale: 'en',
    supportedLocales: VI_EN,
    fallbackLocale: 'en',
    defaultCustomerLocale: 'en',
    defaultMerchantLocale: 'vi',
    displayNameKey: 'smartTrio.market.global',
    nativeLanguageLabelKey: 'smartTrio.language.en',
  },
};

export function getMarketLanguageConfig(marketCode: MarketCode): MarketLanguageDefinition {
  return MARKET_LANGUAGE_CONFIG[marketCode];
}
