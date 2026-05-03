import {
  OVERAGE_PLATFORM_FEES,
  PRICING_AUTHORITY,
  PRICING_BASELINE_CURRENCY,
} from '../../config/pricingConfig';

export type PackageName = 'Starter' | 'Basic' | 'Standard' | 'Pro' | 'Power' | 'Enterprise';

export type RevenueSnapshot = {
  b2bDisplayMajorUsd: number;
  b2bLedgerMajorUsd: number;
  b2cDisplayMajorUsd: number;
  b2cLedgerMajorUsd: number;
};

export type CostSnapshot = {
  paymentGatewayFeeMajorUsd: number;
  appleFeeMajorUsd: number;
  serverAndOpenAiMajorUsd: number;
  intermediaryCommissionMajorUsd: number;
};

export type TrafficSnapshot = {
  dau: number;
  wau: number;
  mau: number;
};

export type OverageAccount = {
  accountId: string;
  businessName: string;
  packageName: PackageName;
  quotaUsedPct: number;
  priorityFeeMajorUsd: number;
};

export type AffiliateLedgerEntry = {
  intermediaryId: string;
  intermediaryName: string;
  owedMajorUsd: number;
  status: 'pending' | 'approved';
};

export type AtRiskAccount = {
  accountId: string;
  businessName: string;
  inactiveDays: number;
  suggestedRescueCredits: number;
};

export type UserOpsRow = {
  userId: string;
  displayName: string;
  credits: number;
  supportQueueState: 'open' | 'pending' | 'resolved';
};

export type VipWhitelistRow = {
  userId: string;
  label: 'FREE' | 'AT-COST';
  commanderFamily: true;
};

export type MarketingCampaignDraft = {
  goal: string;
  generatedCopy: string;
};

export type RoiSnapshot = {
  adSpendMajorUsd: number;
  promoRedemptions: number;
  revenueFromPromoMajorUsd: number;
};

export type AiArbitrageSnapshot = {
  voiceAiCostPerUnitMajorUsd: number;
  textTranslationCostPerUnitMajorUsd: number;
  marginPct: number;
};

export type GlobalPackage = {
  packageName: PackageName;
  displayPriceMajorUsd: number;
  ledgerPriceMajorUsd: number;
};

export type AdminDashboardDataset = {
  revenue: RevenueSnapshot;
  costs: CostSnapshot;
  traffic: TrafficSnapshot;
  packages: GlobalPackage[];
  overageAccounts: OverageAccount[];
  affiliateLedger: AffiliateLedgerEntry[];
  atRiskAccounts: AtRiskAccount[];
  userOps: UserOpsRow[];
  vipWhitelist: VipWhitelistRow[];
  roi: RoiSnapshot;
  aiArbitrage: AiArbitrageSnapshot;
  commissions: {
    intermediaryRate: number;
    directReferralRate: number;
    passivePartnerRate: number;
    passivePlatformRate: number;
  };
};

export function computeNetProfitMajorUsd(revenue: RevenueSnapshot, costs: CostSnapshot): number {
  const gross = revenue.b2bLedgerMajorUsd + revenue.b2cLedgerMajorUsd;
  const outflow =
    costs.paymentGatewayFeeMajorUsd +
    costs.appleFeeMajorUsd +
    costs.serverAndOpenAiMajorUsd +
    costs.intermediaryCommissionMajorUsd;
  return gross - outflow;
}

/** @deprecated Use `computeNetProfitMajorUsd` */
export function computeNetProfitEur(revenue: RevenueSnapshot, costs: CostSnapshot): number {
  return computeNetProfitMajorUsd(revenue, costs);
}

export function generateAdCopy(goal: string): string {
  const normalized = goal.trim() || 'Tăng đơn mới trong 24h';
  return `Kết Nối Global AI Ads: ${normalized}. Ưu đãi có hạn, đặt lịch ngay để nhận quyền lợi độc quyền cho cộng đồng kiều bào.`;
}

export async function getAdminDashboardDataset(): Promise<AdminDashboardDataset> {
  const tiers = PRICING_AUTHORITY.tiers;
  const commissions = PRICING_AUTHORITY.commissionRates;
  const passiveSplit = PRICING_AUTHORITY.passiveIncomeSplit;
  const aiCosts = PRICING_AUTHORITY.aiArbitrageCosts;
  const basePriorityFeeMajorUsd = OVERAGE_PLATFORM_FEES.BASE_PRIORITY_FEE_MAJOR;

  const b2bLedgerMajorUsd = 41250;
  const b2cLedgerMajorUsd = 18240;
  const paymentGatewayFeeMajorUsd = (b2bLedgerMajorUsd + b2cLedgerMajorUsd) * 0.03;
  const appleFeeMajorUsd = b2cLedgerMajorUsd * 0.3;

  return {
    revenue: {
      b2bDisplayMajorUsd: 43600,
      b2bLedgerMajorUsd,
      b2cDisplayMajorUsd: 19480,
      b2cLedgerMajorUsd,
    },
    costs: {
      paymentGatewayFeeMajorUsd,
      appleFeeMajorUsd,
      serverAndOpenAiMajorUsd: 6210,
      intermediaryCommissionMajorUsd: 5340,
    },
    traffic: {
      dau: 4821,
      wau: 17320,
      mau: 48890,
    },
    packages: [
      {
        packageName: 'Starter',
        displayPriceMajorUsd: tiers.Starter.displayPriceMajor,
        ledgerPriceMajorUsd: tiers.Starter.ledgerPriceMajor,
      },
      {
        packageName: 'Basic',
        displayPriceMajorUsd: tiers.Basic.displayPriceMajor,
        ledgerPriceMajorUsd: tiers.Basic.ledgerPriceMajor,
      },
      {
        packageName: 'Standard',
        displayPriceMajorUsd: tiers.Standard.displayPriceMajor,
        ledgerPriceMajorUsd: tiers.Standard.ledgerPriceMajor,
      },
      {
        packageName: 'Pro',
        displayPriceMajorUsd: tiers.Pro.displayPriceMajor,
        ledgerPriceMajorUsd: tiers.Pro.ledgerPriceMajor,
      },
      {
        packageName: 'Power',
        displayPriceMajorUsd: tiers.Power.displayPriceMajor,
        ledgerPriceMajorUsd: tiers.Power.ledgerPriceMajor,
      },
      {
        packageName: 'Enterprise',
        displayPriceMajorUsd: tiers.Enterprise.displayPriceMajor,
        ledgerPriceMajorUsd: tiers.Enterprise.ledgerPriceMajor,
      },
    ],
    overageAccounts: [
      {
        accountId: 'b2b_201',
        businessName: 'Salon Praha Prime',
        packageName: 'Pro',
        quotaUsedPct: 133,
        priorityFeeMajorUsd: basePriorityFeeMajorUsd * 18,
      },
      {
        accountId: 'b2b_774',
        businessName: 'Global Nails Berlin',
        packageName: 'Power',
        quotaUsedPct: 147,
        priorityFeeMajorUsd: basePriorityFeeMajorUsd * 26,
      },
    ],
    affiliateLedger: [
      { intermediaryId: 'int_01', intermediaryName: 'Agent Nguyen EU', owedMajorUsd: 2480, status: 'pending' },
      { intermediaryId: 'int_02', intermediaryName: 'Partner Linh Hub', owedMajorUsd: 1320, status: 'approved' },
    ],
    atRiskAccounts: [
      { accountId: 'risk_01', businessName: 'Blue Orchid CZ', inactiveDays: 11, suggestedRescueCredits: 300 },
      { accountId: 'risk_02', businessName: 'Golden Lotus DE', inactiveDays: 9, suggestedRescueCredits: 250 },
    ],
    userOps: [
      { userId: 'u_1001', displayName: 'Tran Minh Khang', credits: 920, supportQueueState: 'open' },
      { userId: 'u_5501', displayName: 'Le Thi Hoa', credits: 120, supportQueueState: 'pending' },
      { userId: 'u_8802', displayName: 'Pham Gia Bao', credits: 1410, supportQueueState: 'resolved' },
    ],
    vipWhitelist: [
      { userId: 'vip_01', label: 'FREE', commanderFamily: true },
      { userId: 'vip_02', label: 'AT-COST', commanderFamily: true },
    ],
    roi: {
      adSpendMajorUsd: 8400,
      promoRedemptions: 523,
      revenueFromPromoMajorUsd: 29700,
    },
    aiArbitrage: {
      voiceAiCostPerUnitMajorUsd: aiCosts.voiceAiCostMajor,
      textTranslationCostPerUnitMajorUsd: aiCosts.textTranslationCostMajor,
      marginPct: 52.4,
    },
    commissions: {
      intermediaryRate: commissions.intermediary,
      directReferralRate: commissions.directReferral,
      passivePartnerRate: passiveSplit.partner,
      passivePlatformRate: passiveSplit.platform,
    },
  };
}

export async function launchGlobalFlashSale(active: boolean): Promise<{ ok: true; active: boolean; expiresInHours: number }> {
  return { ok: true, active, expiresInHours: active ? 24 : 0 };
}

export async function approvePayout(intermediaryId: string): Promise<{ ok: true; intermediaryId: string }> {
  return { ok: true, intermediaryId };
}

export async function launchCampaign(goal: string): Promise<{ ok: true; campaignId: string; copy: string }> {
  return {
    ok: true,
    campaignId: `cmp_${Date.now()}`,
    copy: generateAdCopy(goal),
  };
}

export async function sendRescueCredits(accountId: string, credits: number): Promise<{ ok: true; accountId: string; credits: number }> {
  return { ok: true, accountId, credits };
}

export async function adjustUserCredits(userId: string, deltaCredits: number): Promise<{ ok: true; userId: string; deltaCredits: number }> {
  return { ok: true, userId, deltaCredits };
}

export const adminPricingContext = {
  baselineCurrency: PRICING_BASELINE_CURRENCY,
  b2cAiTeacherMajorUsd: PRICING_AUTHORITY.b2cCredits.aiTeacherPremiumMajorUsd,
  b2cLeonaCallCostMajorUsd:
    PRICING_AUTHORITY.b2cCredits.leonaCallCredits * PRICING_AUTHORITY.b2cCredits.creditExchangeRateUsd,
  b2cCreditToMajorUsd: PRICING_AUTHORITY.b2cCredits.creditExchangeRateUsd,
  /** @deprecated */
  b2cAiTeacherEur: PRICING_AUTHORITY.b2cCredits.aiTeacherPremiumMajorUsd,
  /** @deprecated */
  b2cLeonaCallCostEur:
    PRICING_AUTHORITY.b2cCredits.leonaCallCredits * PRICING_AUTHORITY.b2cCredits.creditExchangeRateUsd,
  /** @deprecated */
  b2cCreditToEur: PRICING_AUTHORITY.b2cCredits.creditExchangeRateUsd,
} as const;
