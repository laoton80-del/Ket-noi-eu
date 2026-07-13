/**
 * Pack34 — B2B Merchant Gateway: per-merchant AI Persona type + fail-safe resolution.
 *
 * See docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md §7. `MerchantProfile.aiPersona` is
 * stored as a nullable, untyped `Json?` column — `resolveMerchantAiPersona()` is the single,
 * pure gate every future caller uses to turn that raw, untrusted value into a safe, typed
 * `VionaMerchantAiPersona`, mirroring Pack33's `resolveVionaPiiScrubRegion()` fail-safe shape
 * exactly: a missing, inactive, or malformed value always resolves to the documented default
 * persona below — never "no persona," never a thrown error.
 *
 * IMPORTANT — safety boundary (see plan §7.2): `systemPromptAddendum` is designed to be
 * strictly additive/appended to the existing, unmodified `vionaIntentRouter.ts` classification
 * prompt. This module does not itself wire that concatenation (out of scope for this increment —
 * no dispatcher call site is modified by Pack34); it only defines and safely resolves the typed
 * value a future call site would append.
 */

export type VionaMerchantAiPersonaTone = 'formal' | 'friendly' | 'concise' | 'warm';

const VIONA_MERCHANT_AI_PERSONA_TONES: readonly VionaMerchantAiPersonaTone[] = [
  'formal',
  'friendly',
  'concise',
  'warm',
];

export type VionaMerchantAiPersona = Readonly<{
  systemPromptAddendum: string;
  /** Reuses `CountryDefaultLanguage`'s existing value set conceptually — stored as a plain
   * string here (not that exact union type) so a merchant profile can never fail to resolve
   * because of a future locale added to one list and not the other. */
  preferredLocale: string;
  tone: VionaMerchantAiPersonaTone;
}>;

export const VIONA_MERCHANT_AI_PERSONA_DEFAULT: VionaMerchantAiPersona = Object.freeze({
  systemPromptAddendum: '',
  preferredLocale: 'en',
  tone: 'friendly',
});

function isVionaMerchantAiPersonaTone(value: unknown): value is VionaMerchantAiPersonaTone {
  return typeof value === 'string' && (VIONA_MERCHANT_AI_PERSONA_TONES as readonly string[]).includes(value);
}

/**
 * Structural validation only — pure, synchronous, never throws. Returns `null` for anything that
 * is not a well-formed persona object, so the caller can fall back to the documented default.
 */
export function parseVionaMerchantAiPersona(rawValue: unknown): VionaMerchantAiPersona | null {
  if (rawValue === null || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return null;
  }
  const candidate = rawValue as Record<string, unknown>;

  const systemPromptAddendum = candidate.systemPromptAddendum;
  const preferredLocale = candidate.preferredLocale;
  const tone = candidate.tone;

  if (typeof systemPromptAddendum !== 'string') return null;
  if (typeof preferredLocale !== 'string' || preferredLocale.trim().length === 0) return null;
  if (!isVionaMerchantAiPersonaTone(tone)) return null;

  return {
    systemPromptAddendum,
    preferredLocale: preferredLocale.trim(),
    tone,
  };
}

export type VionaMerchantAiPersonaSource = Readonly<{
  aiPersona: unknown;
  isActive: boolean;
}> | null;

/**
 * Pure. Fail-safe: `null` input, an inactive profile, or a malformed `aiPersona` value all
 * resolve to `VIONA_MERCHANT_AI_PERSONA_DEFAULT` — never throws, never returns `null`/`undefined`.
 */
export function resolveMerchantAiPersona(merchantProfile: VionaMerchantAiPersonaSource): VionaMerchantAiPersona {
  if (merchantProfile === null || !merchantProfile.isActive) {
    return VIONA_MERCHANT_AI_PERSONA_DEFAULT;
  }
  const parsed = parseVionaMerchantAiPersona(merchantProfile.aiPersona);
  return parsed ?? VIONA_MERCHANT_AI_PERSONA_DEFAULT;
}
