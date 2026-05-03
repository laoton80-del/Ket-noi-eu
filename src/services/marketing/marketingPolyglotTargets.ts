/** Predefined seed markets for ViGlobal polyglot Facebook group seeding (manual paste). */
export type MarketingPolyglotTarget = Readonly<{
  readonly lang: string;
  readonly audience: string;
}>;

/** VN · US/EN · Korea · Germany — aligned with CEO brief. */
export const DEFAULT_MARKETING_POLYGLOT_TARGETS: readonly MarketingPolyglotTarget[] = [
  { lang: 'vi', audience: 'Vietnam domestic & Vietnamese diaspora' },
  { lang: 'en', audience: 'US & English-speaking inbound tourists' },
  { lang: 'ko', audience: 'Korea — travelers interested in Vietnam' },
  { lang: 'de', audience: 'Germany — Vietnamese community & EU corridor' },
] as const;
