/**
 * Canonical VIONA brand config — display strings elsewhere may still use legacy names until migrated.
 */

function readAppUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_APP_URL?.trim();
  if (fromEnv != null && fromEnv.length > 0) {
    return fromEnv;
  }
  return 'https://vionaio.com';
}

export const brandConfig = {
  name: 'VIONA',
  displayName: 'VIONA',
  tagline: 'Connect. Survive. Thrive.',
  domain: 'vionaio.com',
  appUrl: readAppUrl(),
  /** Former product names — do not use as primary customer-facing brand. */
  legacyNames: ['ViGlobal', 'Kết Nối Global', 'KNG'] as const,
} as const;

export type BrandConfig = typeof brandConfig;
