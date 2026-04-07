import { COUNTRY_PACKS, DEFAULT_COUNTRY_PACK, GLOBAL_UNLISTED_COUNTRY_PACK } from './packs';
import type { CountryPack, LegalScenario, PricingTierId } from './types';
import type { PackCurrencyCode } from './types';

export type { CountryPack, CountryDefaultLanguage, HolidayPackId, LegalScenario, PricingTierId } from './types';

export { COUNTRY_PACKS, DEFAULT_COUNTRY_PACK, GLOBAL_UNLISTED_COUNTRY_PACK } from './packs';
export * from './pricingByTier';

export type NormalizedCountryCode = string;

export function normalizeCountryCodeOrSentinel(countryCode?: string): NormalizedCountryCode {
  const trimmed = countryCode?.trim() ?? '';
  if (!trimmed) return 'ZZ';
  const normalized = trimmed.toUpperCase();
  return normalized.length === 2 ? normalized : 'ZZ';
}

export type CommercialCountryContext = {
  /** Normalized incoming code (ISO2 or ZZ sentinel). */
  countryCode: NormalizedCountryCode;
  /** Country-pack truth for locale/pricing/currency behavior. */
  pricingPack: CountryPack;
  /** Display currency must always come from pack. */
  displayCurrency: PackCurrencyCode;
  /** Stripe-safe merchant country code (valid ISO2, no sentinel). */
  merchantCountryCode: string;
};

export function stripeSafeMerchantCountryCodeFromPack(pack: CountryPack): string {
  const normalized = pack.countryCode.toUpperCase();
  if (normalized === 'UK') return 'GB';
  if (normalized === 'ZZ') return 'GB';
  return normalized;
}

/**
 * D8 — Canonical commercial context for monetized / runtime-sensitive code paths:
 * **`normalizeCountryCodeOrSentinel`** → here; **`pricingPack`** via **`resolveCountryPack`** only; use returned
 * **displayCurrency** and **merchantCountryCode** (no parallel ad hoc country defaults).
 */
export function resolveCommercialCountryContext(countryCode?: string): CommercialCountryContext {
  const normalized = normalizeCountryCodeOrSentinel(countryCode);
  const pricingPack = resolveCountryPack(normalized);
  return {
    countryCode: normalized,
    pricingPack,
    displayCurrency: pricingPack.currencyCode,
    merchantCountryCode: stripeSafeMerchantCountryCodeFromPack(pricingPack),
  };
}

/**
 * Empty/missing country → `GLOBAL_UNLISTED_COUNTRY_PACK` (G3: neutral global fallback — EUR, T2; avoids implying CZ).
 * Unknown 2-letter ISO not in `COUNTRY_PACKS` → same unlisted pack — not Czech-by-accident.
 * `DEFAULT_COUNTRY_PACK` remains the explicit **CZ** row for callers that need the Czech pack by code.
 */
export function resolveCountryPack(countryCode?: string): CountryPack {
  const normalized = normalizeCountryCodeOrSentinel(countryCode);
  if (normalized === 'ZZ') {
    return GLOBAL_UNLISTED_COUNTRY_PACK;
  }
  return COUNTRY_PACKS[normalized] ?? GLOBAL_UNLISTED_COUNTRY_PACK;
}

/**
 * Tier used for **usage debits** (Leona / Le Tan / bundled wallet quotes).
 * Mirrors `resolveCountryPack`: empty → `GLOBAL_UNLISTED_COUNTRY_PACK` tier (T2); invalid ISO → unlisted;
 * unknown 2-letter → unlisted; known pack → pack tier.
 */
export function pricingTierForUsageDebits(countryCode?: string): PricingTierId {
  const trimmed = countryCode?.trim() ?? '';
  if (!trimmed) {
    return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
  }
  const normalized = trimmed.toUpperCase();
  if (normalized.length !== 2) {
    return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
  }
  const row = COUNTRY_PACKS[normalized];
  if (row) return row.pricingTier;
  return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
}

/** System prompt prefix for Vault camera OCR (global-ready jurisdiction). */
export function vaultDataExtractorPrimarySystemPrompt(countryCode?: string): string {
  const hint = resolveCountryPack(countryCode).legalFlowConfig.documentJurisdictionHint;
  return [
    'Bạn là chuyên gia trích xuất dữ liệu (Data Extractor).',
    hint,
    'Hãy đọc bức ảnh giấy tờ tùy thân này và trả về ĐÚNG định dạng JSON với 2 trường: documentType (loại giấy tờ: Hộ chiếu, Thẻ cư trú, Bằng lái xe...) và expiryDate (ngày hết hạn theo định dạng DD/MM/YYYY). Nếu không thấy ngày hết hạn, trả về null. Không giải thích thêm.',
  ].join(' ');
}

export function vaultDataExtractorSecondarySystemPrompt(countryCode?: string): string {
  const hint = resolveCountryPack(countryCode).legalFlowConfig.documentJurisdictionHint;
  return `${hint} Bạn chỉ làm nhiệm vụ OCR ngày hết hạn trên giấy tờ. Trả JSON đúng dạng {"expiryDate":"DD/MM/YYYY"} hoặc {"expiryDate":null} nếu không chắc chắn. Không thêm bất kỳ trường nào khác.`;
}

/** Legacy JSON-schema vision path (AiEye / pipeline) — jurisdiction from pack, not hardcoded EU. */
export function documentLegalVisionSystemPrompt(countryCode?: string): string {
  const hint = resolveCountryPack(countryCode).legalFlowConfig.documentJurisdictionHint;
  return `Bạn là chuyên gia hỗ trợ đọc giấy tờ. ${hint} Hãy phân tích ảnh. BẮT BUỘC trả về JSON gồm: { 'type': 'Visa' | 'Passport' | 'Contract', 'expiry_date': 'YYYY-MM-DD', 'holder_name': 'string', 'action_required': 'Lời khuyên ngắn gọn' }.`;
}

export function buildLocaleAiContext(input: {
  countryCode?: string;
  serviceContext: 'call' | 'interpreter' | 'vault' | 'lifeos' | 'emergency' | 'learning';
  emergencyMode?: boolean;
  /** Active interpreter or legal scenario when known. */
  activeScenario?: LegalScenario;
}): string {
  const pack = resolveCountryPack(input.countryCode);
  return [
    `[COUNTRY_PACK] country=${pack.countryCode}`,
    `region=${pack.regionCode}`,
    `locale=${pack.locale}`,
    `currency=${pack.currencyCode}`,
    `defaultLanguage=${pack.defaultLanguage}`,
    `pricingTier=${pack.pricingTier}`,
    `holidayPack=${pack.holidayPack}`,
    `legalDefault=${pack.legalFlowConfig.defaultScenario}`,
    `visaRenewal=${pack.legalFlowConfig.visaRenewalEnabled ? 'on' : 'off'}`,
    `serviceContext=${input.serviceContext}`,
    `emergencyMode=${input.emergencyMode === true ? 'true' : 'false'}`,
    input.activeScenario ? `activeScenario=${input.activeScenario}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
