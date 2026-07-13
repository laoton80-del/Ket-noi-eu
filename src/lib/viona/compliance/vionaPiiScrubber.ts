/**
 * Pack33 — Region-Aware PII Scrubber (see docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md §3).
 *
 * Pure, synchronous, regex/internal-logic only — **no network call, no external API, no DB
 * access**. Exists to mask PII (phone numbers, emails, card-PAN-shaped numbers) inside VIONA's own
 * audit ledger (`VionaRequestAuditEvent.message`/`.payloadJson`) before it is written.
 *
 * SEPARATION OF CONCERNS (hard boundary, see plan §3.5): this module is wired **only** into the
 * audit-ledger write path (`vionaExecutionAuditWriteService.ts`). It must never be imported by, or
 * applied to, the outbound payload of a real-provider adapter (`vionaTwilioTestRealProviderAdapter.ts`
 * or any future provider adapter) — Twilio genuinely needs the real phone number to route an SMS.
 * Scrubbing that payload would silently break the feature. `scripts/test-viona-pack33-global-compliance.ts`
 * asserts this boundary by source-scanning the real-provider adapter directory for any import of
 * this module.
 *
 * Region-awareness: the rule table (not the call sites) is what varies by jurisdiction. Missing or
 * unknown region information always resolves to `'default'` — the strictest baseline — never to
 * "skip scrubbing" (fail-safe by design, see §3.2 of the plan).
 */

export type VionaPiiScrubRegion = 'eu_gdpr' | 'us_ccpa' | 'br_lgpd' | 'jp_appi' | 'default';

export type VionaPiiScrubRule = Readonly<{
  name: string;
  pattern: RegExp;
  replacement: string;
  appliesToRegions: readonly VionaPiiScrubRegion[] | 'all';
}>;

export type VionaPiiScrubInput = Readonly<{
  countryCode?: string | null;
  text: string;
}>;

export type VionaPiiScrubResult = Readonly<{
  scrubbedText: string;
  matchedRuleNames: readonly string[];
}>;

/**
 * ISO 3166-1 alpha-2 codes mapped to a `VionaPiiScrubRegion`. Deliberately conservative and
 * non-exhaustive at this stage (plan §5: legal review of exact coverage is a prerequisite gate for
 * production use of any specific region's parameters — this lookup table is the code-level
 * mechanism, not a legally-reviewed final list). Adding a country is a one-line, additive change.
 */
const EU_GDPR_COUNTRY_CODES: readonly string[] = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT',
  'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
  // EEA (GDPR-equivalent), kept in the same bucket for simplicity at this design stage.
  'IS', 'LI', 'NO',
];

const US_CCPA_COUNTRY_CODES: readonly string[] = ['US'];
const BR_LGPD_COUNTRY_CODES: readonly string[] = ['BR'];
const JP_APPI_COUNTRY_CODES: readonly string[] = ['JP'];

/** Pure. Unknown/missing/malformed input always resolves to `'default'` (the strictest baseline). */
export function resolveVionaPiiScrubRegion(countryCode: string | null | undefined): VionaPiiScrubRegion {
  const normalized = countryCode?.trim().toUpperCase() ?? '';
  if (normalized.length === 0) return 'default';
  if (EU_GDPR_COUNTRY_CODES.includes(normalized)) return 'eu_gdpr';
  if (US_CCPA_COUNTRY_CODES.includes(normalized)) return 'us_ccpa';
  if (BR_LGPD_COUNTRY_CODES.includes(normalized)) return 'br_lgpd';
  if (JP_APPI_COUNTRY_CODES.includes(normalized)) return 'jp_appi';
  return 'default';
}

/** Luhn checksum — reduces false positives for the card-PAN rule without any external lookup. */
function passesLuhnChecksum(digitsOnly: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digitsOnly.length - 1; i >= 0; i -= 1) {
    let digit = Number(digitsOnly[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return digitsOnly.length > 0 && sum % 10 === 0;
}

/**
 * Rule table. `'all'` rules apply to every region (the common baseline every jurisdiction in scope
 * treats as PII); region-scoped rules demonstrate that the *rule table*, not the call site, is what
 * varies by jurisdiction (plan §3.1).
 */
export const VIONA_PII_SCRUB_RULES: readonly VionaPiiScrubRule[] = [
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[REDACTED_EMAIL]',
    appliesToRegions: 'all',
  },
  {
    // Deliberately ordered BEFORE `e164_phone`: both rules match runs of digits, and a card PAN
    // (13-19 digits) fully overlaps the digit-count range `e164_phone` also matches (8-15 digits).
    // Running the card rule first means a real card number is masked as a whole before the phone
    // rule gets a chance to greedily consume a 15-digit prefix of it and leave a mismatched
    // remainder. `e164_phone` never re-matches an already-replaced `[REDACTED_CARD]` token (it
    // contains no digits), so this ordering never causes a missed phone match.
    name: 'card_pan',
    // Matches 13-19 digit sequences (optionally space/dash separated); Luhn-validated below via a
    // custom replacer so obviously-non-card numeric strings (e.g. long request IDs) are not masked.
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
    replacement: '[REDACTED_CARD]',
    appliesToRegions: 'all',
  },
  {
    name: 'e164_phone',
    // Loose E.164-shaped match: optional leading '+', 8-15 digits total. Intentionally simple —
    // this is a logging/audit-ledger safeguard, not a phone-number validator.
    pattern: /\+?[1-9]\d{7,14}\b/g,
    replacement: '[REDACTED_PHONE]',
    appliesToRegions: 'all',
  },
  {
    name: 'ssn_us',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[REDACTED_SSN]',
    appliesToRegions: ['us_ccpa', 'default'],
  },
] as const;

function applyRule(text: string, rule: VionaPiiScrubRule): { text: string; matched: boolean } {
  let matched = false;
  const replaced = text.replace(rule.pattern, (match: string) => {
    if (rule.name === 'card_pan') {
      const digitsOnly = match.replace(/[ -]/g, '');
      if (!passesLuhnChecksum(digitsOnly)) {
        return match; // not a plausible card number — leave untouched (avoids over-masking IDs)
      }
    }
    matched = true;
    return rule.replacement;
  });
  return { text: replaced, matched };
}

/**
 * Masks every PII rule applicable to the resolved region inside `text`. Pure, synchronous, no I/O.
 * Never throws — an empty/whitespace-only `text` returns unchanged with zero matches.
 */
export function scrubVionaPii(input: VionaPiiScrubInput): VionaPiiScrubResult {
  const region = resolveVionaPiiScrubRegion(input.countryCode);
  const matchedRuleNames: string[] = [];
  let scrubbedText = input.text;

  for (const rule of VIONA_PII_SCRUB_RULES) {
    const applies = rule.appliesToRegions === 'all' || rule.appliesToRegions.includes(region);
    if (!applies) continue;
    const { text, matched } = applyRule(scrubbedText, rule);
    scrubbedText = text;
    if (matched) matchedRuleNames.push(rule.name);
  }

  return { scrubbedText, matchedRuleNames };
}

/**
 * Recursively scrubs every string leaf inside an arbitrary JSON-like value (object/array/primitive),
 * preserving shape (keys, array order, non-string primitives untouched). Used to sanitize
 * `payloadJson` before it is persisted to `VionaRequestAuditEvent`. Pure, synchronous.
 */
export function scrubVionaPiiDeep(value: unknown, countryCode?: string | null): unknown {
  if (typeof value === 'string') {
    return scrubVionaPii({ countryCode, text: value }).scrubbedText;
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubVionaPiiDeep(item, countryCode));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = scrubVionaPiiDeep(val, countryCode);
    }
    return result;
  }
  return value;
}
