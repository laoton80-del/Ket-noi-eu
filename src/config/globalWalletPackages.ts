import type { PricingTierId } from './countryPacks/types';

/**
 * Global wallet top-up families (Kết Nối Global pricing architecture).
 * **Import path for live spine:** prefer `src/config/commercialSpine.ts` (re-exports this module + pricing entrypoints).
 * Canonical list prices are USD at **T2**; other tiers apply `TIER_PRICE_MULTIPLIER`.
 * Fiat shown in-app is localized via `Pricing.usdToLocalDisplayAmount` (**illustrative** local label; **USD list × tier** is the in-app pricing spine — not CZK-first public anchor; see GLOBAL_V1 commercial docs).
 * Tier selection for wallet/call debits ultimately flows from `countryPacks` — rebuild `functions/lib` after pack changes.
 */
export type WalletPackageId =
  | 'starter'
  | 'basic'
  | 'standard'
  | 'pro'
  | 'power'
  | 'enterprise';

export type GlobalWalletPackageRow = {
  id: WalletPackageId;
  /** Primary pilot UI label (Vietnamese). */
  nameVi: string;
  /** Credits granted on successful top-up; `null` = custom / sales-led. */
  credits: number | null;
  /** Canonical package price in USD before tier multiplier (T2 baseline). */
  usdT2: number;
  giftVi: string;
  purchasable: boolean;
};

/** Tier multipliers on USD list price (T2 = 1.00). T4 defaults to T3 until per-market overrides exist. */
export const TIER_PRICE_MULTIPLIER: Record<PricingTierId, number> = {
  T1: 0.85,
  T2: 1.0,
  T3: 1.25,
  T4: 1.25,
};

export const GLOBAL_WALLET_PACKAGES: GlobalWalletPackageRow[] = [
  {
    id: 'starter',
    nameVi: 'Starter · Nhập môn',
    credits: 100,
    usdT2: 10,
    giftVi: '100 Credits — gói nhập môn',
    purchasable: true,
  },
  {
    id: 'basic',
    nameVi: 'Basic · Tiêu chuẩn nhẹ',
    credits: 230,
    usdT2: 20,
    giftVi: '230 Credits',
    purchasable: true,
  },
  {
    id: 'standard',
    nameVi: 'Standard · Phổ biến',
    credits: 650,
    usdT2: 50,
    giftVi: '650 Credits',
    purchasable: true,
  },
  {
    id: 'pro',
    nameVi: 'Pro · Dùng thường xuyên',
    credits: 1400,
    usdT2: 100,
    giftVi: '1.400 Credits',
    purchasable: true,
  },
  {
    id: 'power',
    nameVi: 'Power · Nhu cầu cao',
    credits: 3000,
    usdT2: 200,
    giftVi: '3.000 Credits',
    purchasable: true,
  },
  {
    id: 'enterprise',
    nameVi: 'Enterprise · Theo hợp đồng',
    credits: null,
    usdT2: 1000,
    giftVi: 'Tùy chỉnh theo hợp đồng — liên hệ kinh doanh',
    purchasable: false,
  },
];

export function usdListPriceForPackageAtTier(pkg: GlobalWalletPackageRow, tier: PricingTierId): number {
  const mult = TIER_PRICE_MULTIPLIER[tier];
  const v = pkg.usdT2 * mult;
  return Math.round(v * 100) / 100;
}
