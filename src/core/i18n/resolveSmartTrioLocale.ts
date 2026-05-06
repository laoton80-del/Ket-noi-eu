import { getMarketLanguageConfig } from '../markets/marketLanguageConfig';
import {
  getSupportedLocalesForMarket,
  normalizeLocaleCode,
} from './smartTrioConfig';
import type {
  MarketCode,
  ResolveSmartTrioLocaleInput,
  ResolvedSmartTrioLocale,
  SmartTrioLocale,
  SmartTrioResolutionReason,
  UserLanguageRole,
} from './smartTrioTypes';

function pickFirstSupported(
  supported: readonly SmartTrioLocale[],
  candidates: readonly (SmartTrioLocale | null)[]
): SmartTrioLocale | null {
  for (const c of candidates) {
    if (c && supported.includes(c)) return c;
  }
  return null;
}

function resolveMerchantLeg(
  role: UserLanguageRole | undefined,
  preferredMerchantLocale: string | undefined,
  supported: readonly SmartTrioLocale[],
  fallbackLocale: SmartTrioLocale,
  defaultMerchantLocale: SmartTrioLocale
): SmartTrioLocale {
  if (role === 'merchant') {
    if (supported.includes('vi')) return 'vi';
    return fallbackLocale;
  }
  const pref = normalizeLocaleCode(preferredMerchantLocale);
  if (pref && supported.includes(pref)) return pref;
  if (supported.includes(defaultMerchantLocale)) return defaultMerchantLocale;
  return fallbackLocale;
}

function resolveCustomerLeg(
  role: UserLanguageRole | undefined,
  userSelected: string | undefined,
  device: string | undefined,
  supported: readonly SmartTrioLocale[],
  fallbackLocale: SmartTrioLocale,
  defaultCustomerLocale: SmartTrioLocale
): SmartTrioLocale {
  if (role === 'admin') {
    const adminPick = pickFirstSupported(supported, [
      normalizeLocaleCode(userSelected),
      normalizeLocaleCode(device),
      'en',
      fallbackLocale,
    ]);
    return adminPick ?? fallbackLocale;
  }
  const coalesced = pickFirstSupported(supported, [
    normalizeLocaleCode(userSelected),
    normalizeLocaleCode(device),
    defaultCustomerLocale,
    'en',
    'vi',
    fallbackLocale,
  ]);
  return coalesced ?? fallbackLocale;
}

function resolveAppLocale(
  role: UserLanguageRole | undefined,
  userSelected: string | undefined,
  device: string | undefined,
  supported: readonly SmartTrioLocale[],
  fallbackLocale: SmartTrioLocale,
  defaultCustomerLocale: SmartTrioLocale
): { appLocale: SmartTrioLocale; reason: SmartTrioResolutionReason } {
  if (role === 'admin') {
    const nu = normalizeLocaleCode(userSelected);
    if (nu && supported.includes(nu)) {
      return { appLocale: nu, reason: 'user_selected_supported' };
    }
    const nd = normalizeLocaleCode(device);
    if (nd && supported.includes(nd)) {
      return { appLocale: nd, reason: 'device_locale_supported' };
    }
    if (supported.includes('en')) {
      return { appLocale: 'en', reason: 'admin_english_bridge' };
    }
    return { appLocale: fallbackLocale, reason: 'unsupported_locale_fallback' };
  }

  if (role === 'merchant') {
    const merchantApp = pickFirstSupported(supported, [
      normalizeLocaleCode(userSelected),
      normalizeLocaleCode(device),
      'vi',
      'en',
      fallbackLocale,
    ]);
    if (merchantApp) {
      const nu = normalizeLocaleCode(userSelected);
      if (nu && merchantApp === nu) return { appLocale: merchantApp, reason: 'user_selected_supported' };
      const nd = normalizeLocaleCode(device);
      if (nd && merchantApp === nd) return { appLocale: merchantApp, reason: 'device_locale_supported' };
      if (merchantApp === 'vi') return { appLocale: 'vi', reason: 'merchant_default_vietnamese' };
      return { appLocale: merchantApp, reason: 'unsupported_locale_fallback' };
    }
    return { appLocale: fallbackLocale, reason: 'unsupported_locale_fallback' };
  }

  const nu = normalizeLocaleCode(userSelected);
  if (nu && supported.includes(nu)) {
    return { appLocale: nu, reason: 'user_selected_supported' };
  }
  const nd = normalizeLocaleCode(device);
  if (nd && supported.includes(nd)) {
    return { appLocale: nd, reason: 'device_locale_supported' };
  }

  if (supported.includes(defaultCustomerLocale)) {
    return { appLocale: defaultCustomerLocale, reason: 'customer_default_native' };
  }
  if (supported.includes(fallbackLocale)) {
    return { appLocale: fallbackLocale, reason: 'unsupported_locale_fallback' };
  }
  return { appLocale: 'en', reason: 'unsupported_locale_fallback' };
}

/**
 * Pure resolver for Smart Trio locale legs — does not read i18n singleton or device APIs.
 */
export function resolveSmartTrioLocale(input: ResolveSmartTrioLocaleInput): ResolvedSmartTrioLocale {
  const marketKey: MarketCode = input.marketCode ?? 'GLOBAL';
  const config = getMarketLanguageConfig(marketKey);
  const supportedLocales = config.supportedLocales;
  const fallbackLocale = input.fallbackLocale
    ? normalizeLocaleCode(input.fallbackLocale) ?? config.fallbackLocale
    : config.fallbackLocale;
  const safeFallback: SmartTrioLocale = supportedLocales.includes(fallbackLocale)
    ? fallbackLocale
    : config.fallbackLocale;

  const role = input.userRole ?? 'unknown';

  const merchantLocale = resolveMerchantLeg(
    role,
    input.preferredMerchantLocale,
    supportedLocales,
    safeFallback,
    config.defaultMerchantLocale
  );

  const customerLocale = resolveCustomerLeg(
    role,
    input.userSelectedLocale,
    input.deviceLocale,
    supportedLocales,
    safeFallback,
    config.defaultCustomerLocale
  );

  const { appLocale, reason } = resolveAppLocale(
    role,
    input.userSelectedLocale,
    input.deviceLocale,
    supportedLocales,
    safeFallback,
    config.defaultCustomerLocale
  );

  const finalReason: SmartTrioResolutionReason =
    input.marketCode === undefined &&
    role !== 'admin' &&
    reason === 'unsupported_locale_fallback'
      ? 'global_market_fallback'
      : reason;

  return {
    appLocale,
    nativeLocale: config.nativeLocale,
    supportedLocales: getSupportedLocalesForMarket(marketKey),
    fallbackLocale: safeFallback,
    customerLocale,
    merchantLocale,
    reason: finalReason,
  };
}
