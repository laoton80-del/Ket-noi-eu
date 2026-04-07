import { TIER_PRICE_MULTIPLIER } from './globalWalletPackages';

export type AssistantIdentity = {
  code: 'LEONA' | 'LOAN';
  displayName: string;
  scope: 'ngoai' | 'noi';
  voice: string;
  role: string;
  stealthMode: boolean;
  pronoun: 'Bạn';
};

/**
 * Marketing subscription anchors (illustrative). Live usage debits follow `countryPacks` + `pricingByTier`.
 * Canonical currency: USD (T2 baseline × global tier multiplier).
 */
export type PricingTier = {
  id: 'T1' | 'T2' | 'T3' | 'T4';
  name: string;
  regions: string;
  monthlyUsd: number;
  yearlyUsd: number;
};

const SUBSCRIPTION_MONTHLY_USD_T2 = 19.99;

function subscriptionUsdForTier(tier: keyof typeof TIER_PRICE_MULTIPLIER): { monthlyUsd: number; yearlyUsd: number } {
  const mult = TIER_PRICE_MULTIPLIER[tier];
  const monthlyUsd = Math.round(SUBSCRIPTION_MONTHLY_USD_T2 * mult * 100) / 100;
  /** Illustrative annual (≈10× monthly). */
  const yearlyUsd = Math.round(SUBSCRIPTION_MONTHLY_USD_T2 * mult * 10 * 100) / 100;
  return { monthlyUsd, yearlyUsd };
}

/**
 * Brand spine: **Kết Nối Global** (master) + EU launch lane context.
 * Screens should use `name` for headers; use `launchSubtitle` where launch context helps users.
 */
export const APP_BRAND = {
  masterName: 'Kết Nối Global',
  launchProductName: 'EU Launch Lane',
  /** Primary header on most surfaces */
  name: 'Kết Nối Global',
  /** Secondary line under brand (launch-lane context only) */
  launchSubtitle: 'Launch lane: EU',
  /** Stripe / wallet sheet merchant display name */
  paymentsDisplayName: 'Kết Nối Global',
  visualStyle: 'Neo-Indochine & Glassmorphism',
  icon: '🌳✨',
  iconLabel: 'Cây Bồ Đề vàng 3D',
  supportEmail: 'support@ketnoiglobal.com',
  legal: {
    privacyUrl: 'https://ketnoiglobal.com/privacy',
    termsUrl: 'https://ketnoiglobal.com/terms',
  },
} as const;

/** Assistant roster for prompts / persona wiring. */
export const ASSISTANTS_ROSTER: AssistantIdentity[] = [
  {
    code: 'LEONA',
    displayName: 'Leona Nguyen',
    scope: 'ngoai',
    voice: 'Native Pro',
    role: 'Đối ngoại, trợ lý gọi điện',
    stealthMode: false,
    pronoun: 'Bạn',
  },
  {
    code: 'LOAN',
    displayName: 'Minh Khang',
    scope: 'noi',
    voice: 'Giọng tổng hợp (nam/nữ theo cài đặt)',
    role: 'Đối nội, CSKH trong app',
    stealthMode: false,
    pronoun: 'Bạn',
  },
];

const T1 = subscriptionUsdForTier('T1');
const T2 = subscriptionUsdForTier('T2');
const T3 = subscriptionUsdForTier('T3');
const T4 = subscriptionUsdForTier('T4');

/** Subscription/marketing tier cards (USD anchors). Wallet combo families live in `globalWalletPackages.ts`. */
export const PRICING_MARKET_TIERS_USD: PricingTier[] = [
  {
    id: 'T1',
    name: 'T1 · Central Europe (pilot anchor)',
    regions: 'CZ, SK, PL',
    monthlyUsd: T1.monthlyUsd,
    yearlyUsd: T1.yearlyUsd,
  },
  {
    id: 'T2',
    name: 'T2 · Western EU & UK (base)',
    regions: 'DE, FR, SK, UK, CH, …',
    monthlyUsd: T2.monthlyUsd,
    yearlyUsd: T2.yearlyUsd,
  },
  {
    id: 'T3',
    name: 'T3 · Extended',
    regions: 'Higher-cost markets',
    monthlyUsd: T3.monthlyUsd,
    yearlyUsd: T3.yearlyUsd,
  },
  {
    id: 'T4',
    name: 'T4 · Premium / custom',
    regions: 'Contract pricing',
    monthlyUsd: T4.monthlyUsd,
    yearlyUsd: T4.yearlyUsd,
  },
];

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

/** @deprecated Legacy display helper; prefer `formatUsd` for global-facing copy. */
export function formatCzk(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} CZK`;
}
