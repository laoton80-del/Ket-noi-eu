// =============================================================================
// CEO Hybrid Monetization — USD-major ledger anchors (single source for B2C + core B2B).
// Display currency is resolved per user region (`globalLocalization.resolveCurrencyForRegion`).
//
// Matrix audit: CREDIT_EXCHANGE_RATE_USD (1 VIG Token = 0.01 USD ref), Leona per-call + aiLeonaPerMinCredits,
// Interpreter per-min VIG Token, AI Teacher premium USD + fair-use minutes + overage VIG Token/min, Minh Khang legal VIG Token,
// B2B PAYG/PRO/POWER (0 / 49 / 139), Voice AI telecom hybrid,
// Stripe B2B2C mark-up (% + fixed micro-txn cover), SMS overage,
// REGION_MULTIPLIERS + GEO_PRICING_BASELINE_REGION.
// =============================================================================

/** Ledger baseline ISO 4217 for tier math & CFO exports (global anchor). */
export const PRICING_BASELINE_CURRENCY = 'USD' as const;

// B2C Constants (USD-major unless noted as VIG Token integers)
/** 1 VIG Token = 0.01 USD (reference rate; settlement FX may vary by acquirer region). */
export const CREDIT_EXCHANGE_RATE_USD = 0.01;
export const B2C_LEONA_CALL_COST_XU = 50;
export const B2C_DAILY_CHECK_IN_BONUS_XU = 1;
export const B2C_LIVE_INTERPRETER_PER_MIN_XU = 50;
export const B2C_AI_TEACHER_PREMIUM_USD = 12.99;
export const B2C_VAULT_PRO_USD = 1.99;

// B2B Constants (USD-major SaaS list anchors)
export const B2B_PAY_PER_BOOKING_USD = 0.5;
export const B2B_PRO_TIER_USD = 49;
export const B2B_ADDITIONAL_BRANCH_USD = 29;
export const B2B_POWER_TIER_USD = 139;
export const B2B_POS_CASH_REGISTER_MONTHLY_USD = 19;
export const B2B_SPONSORED_LISTING_PER_DAY_USD = 5.0;

/** --- Deprecated EUR-named aliases (same numeric USD-major anchors; historical imports). --- */
export const CREDIT_EXCHANGE_RATE_EUR = CREDIT_EXCHANGE_RATE_USD;
export const B2C_AI_TEACHER_PREMIUM_EUR = B2C_AI_TEACHER_PREMIUM_USD;
export const B2C_VAULT_PRO_EUR = B2C_VAULT_PRO_USD;
export const B2B_PAY_PER_BOOKING_EUR = B2B_PAY_PER_BOOKING_USD;
export const B2B_PRO_TIER_EUR = B2B_PRO_TIER_USD;
export const B2B_ADDITIONAL_BRANCH_EUR = B2B_ADDITIONAL_BRANCH_USD;
export const B2B_POWER_TIER_EUR = B2B_POWER_TIER_USD;
export const B2B_POS_CASH_REGISTER_MONTHLY_EUR = B2B_POS_CASH_REGISTER_MONTHLY_USD;
export const B2B_SPONSORED_LISTING_PER_DAY_EUR = B2B_SPONSORED_LISTING_PER_DAY_USD;

export const REGION_MULTIPLIERS = {
  US: 1.0,
  AU: 1.05,
  JP: 1.15,
  VN: 0.65,
  GB: 1.1,
  CH: 1.5,
  DE: 1.2,
  CZ: 1.0,
  PL: 0.8,
} as const;

export type GeoPricingRegionCode = keyof typeof REGION_MULTIPLIERS;

/** Neo anchor for multiplier disclosure (global rollout baseline). */
export const GEO_PRICING_BASELINE_REGION: GeoPricingRegionCode = 'US';

export type PackageName = 'Starter' | 'Basic' | 'Standard' | 'Pro' | 'Power' | 'Enterprise';

export type TierPrice = {
  /** List price in USD-major units (checkout UI converts via region FX policy). */
  displayPriceMajor: number;
  ledgerPriceMajor: number;
  /** Twilio / SMS envelope included in SaaS tier (overage billed at `extraSmsFeeMajor`). */
  includedSmsPerMonth: number;
  includedAiReceptionistChats: number;
  includedAiVoiceMinutes: number;
};

export type TierPricingMap = Record<PackageName, TierPrice>;

export type AiArbitrageCosts = {
  voiceAiCostMajor: number;
  textTranslationCostMajor: number;
};

export type CommissionRates = {
  intermediary: number;
  directReferral: number;
};

export type PassiveIncomeSplit = {
  partner: number;
  platform: number;
};

export type OverageAndPlatformFees = {
  basePriorityFeeMajor: number;
  flashSaleBroadcastMajor: number;
  additionalBranchMajor: number;
  posCashRegisterIntegrationMonthlyMajor: number;
  sponsoredListingPerDayMajor: number;
  b2bTransactionFeePercent: number;
  /** Flat major-unit fee per successful charge (acquirer varies by region). */
  b2bTransactionFixedFeeMajor: number;
  extraSmsFeeMajor: number;
  aiReceptionistOverageFeeMajor: number;
  b2bVoiceAiOveragePerMinMajor: number;
};

export type VoiceAiTelecomConfig = {
  virtualNumberLeasePerMonthMajor: number;
  payAsYouGoVoiceMinMajor: number;
  powerTierIncludedMinutes: number;
  powerTierOverageMinMajor: number;
  wholesaleCommissionPercent: number;
};

export type B2CCreditsConfig = {
  creditExchangeRateUsd: number;
  leonaCallCredits: number;
  referralBonus: number;
  liveInterpreterPerMinCredits: number;
  aiLeonaPerMinCredits: number;
  aiTeacherIncludedMinutesPerMonth: number;
  aiTeacherOveragePerMinCredits: number;
  aiTeacherPremiumMajorUsd: number;
  minhKhangLiveInterpreterPerMinCredits: number;
  minhKhangDocumentAnalysisCredits: number;
  travelPackageSubMajorUsd: number;
  vaultProMajorUsd: number;
  globalVipMonthlyMajorUsd: number;
  learningUnlockCredits: number;
  listingPinFromCreditsPerDay: number;
  avatarFrameCredits: number;
  passportBadgeCreditsPerYear: number;
  dailyCheckInBonus: number;
};

export type PricingAuthorityConfig = {
  tiers: TierPricingMap;
  aiArbitrageCosts: AiArbitrageCosts;
  commissionRates: CommissionRates;
  passiveIncomeSplit: PassiveIncomeSplit;
  overageAndPlatformFees: OverageAndPlatformFees;
  b2cCredits: B2CCreditsConfig;
  voiceAiTelecom: VoiceAiTelecomConfig;
  /** Local Fixer customer-facing service fee % added on top of base service amount. */
  fixerCustomerFeePercent: number;
  /** Local Fixer provider fee % deducted from fixer's base service amount. */
  fixerProviderFeePercent: number;
  /**
   * Illustrative blended Stripe + scheme cost as % of gross (CFO / receipt disclosure only;
   * not subtracted from fixer net in `LocalFixerService.calculateSplitPayment` v1 formula).
   */
  localFixerStripeFeeEstimatePercent: number;
};

export const PRICING_AUTHORITY: PricingAuthorityConfig = {
  tiers: {
    Starter: {
      displayPriceMajor: 0,
      ledgerPriceMajor: 0,
      includedSmsPerMonth: 0,
      includedAiReceptionistChats: 0,
      includedAiVoiceMinutes: 0,
    },
    Basic: {
      displayPriceMajor: B2B_PAY_PER_BOOKING_USD,
      ledgerPriceMajor: B2B_PAY_PER_BOOKING_USD,
      includedSmsPerMonth: 0,
      includedAiReceptionistChats: 0,
      includedAiVoiceMinutes: 0,
    },
    Standard: {
      displayPriceMajor: 19,
      ledgerPriceMajor: 17.5,
      includedSmsPerMonth: 0,
      includedAiReceptionistChats: 0,
      includedAiVoiceMinutes: 0,
    },
    Pro: {
      displayPriceMajor: B2B_PRO_TIER_USD,
      ledgerPriceMajor: B2B_PRO_TIER_USD,
      includedSmsPerMonth: 20,
      includedAiReceptionistChats: 500,
      includedAiVoiceMinutes: 30,
    },
    Power: {
      displayPriceMajor: B2B_POWER_TIER_USD,
      ledgerPriceMajor: 130,
      includedSmsPerMonth: 100,
      includedAiReceptionistChats: 2000,
      includedAiVoiceMinutes: 200,
    },
    Enterprise: {
      displayPriceMajor: 299,
      ledgerPriceMajor: 285,
      includedSmsPerMonth: 150,
      includedAiReceptionistChats: 5000,
      includedAiVoiceMinutes: 800,
    },
  },
  aiArbitrageCosts: {
    voiceAiCostMajor: 0.085,
    textTranslationCostMajor: 0.012,
  },
  commissionRates: {
    intermediary: 0.15,
    directReferral: 0.1,
  },
  passiveIncomeSplit: {
    partner: 0.7,
    platform: 0.3,
  },
  overageAndPlatformFees: {
    basePriorityFeeMajor: 5.0,
    flashSaleBroadcastMajor: 10.0,
    additionalBranchMajor: B2B_ADDITIONAL_BRANCH_USD,
    posCashRegisterIntegrationMonthlyMajor: B2B_POS_CASH_REGISTER_MONTHLY_USD,
    sponsoredListingPerDayMajor: B2B_SPONSORED_LISTING_PER_DAY_USD,
    b2bTransactionFeePercent: 2.5,
    b2bTransactionFixedFeeMajor: 0.3,
    extraSmsFeeMajor: 0.15,
    aiReceptionistOverageFeeMajor: 0.05,
    b2bVoiceAiOveragePerMinMajor: 0.5,
  },
  b2cCredits: {
    creditExchangeRateUsd: CREDIT_EXCHANGE_RATE_USD,
    leonaCallCredits: B2C_LEONA_CALL_COST_XU,
    referralBonus: 50,
    liveInterpreterPerMinCredits: B2C_LIVE_INTERPRETER_PER_MIN_XU,
    aiLeonaPerMinCredits: 200,
    aiTeacherIncludedMinutesPerMonth: 600,
    aiTeacherOveragePerMinCredits: 100,
    aiTeacherPremiumMajorUsd: B2C_AI_TEACHER_PREMIUM_USD,
    minhKhangLiveInterpreterPerMinCredits: 500,
    minhKhangDocumentAnalysisCredits: 300,
    travelPackageSubMajorUsd: 19.99,
    vaultProMajorUsd: B2C_VAULT_PRO_USD,
    globalVipMonthlyMajorUsd: 4.99,
    learningUnlockCredits: 999,
    listingPinFromCreditsPerDay: 500,
    avatarFrameCredits: 200,
    passportBadgeCreditsPerYear: 500,
    dailyCheckInBonus: B2C_DAILY_CHECK_IN_BONUS_XU,
  },
  voiceAiTelecom: {
    virtualNumberLeasePerMonthMajor: 9.99,
    payAsYouGoVoiceMinMajor: 0.5,
    powerTierIncludedMinutes: 200,
    powerTierOverageMinMajor: 0.4,
    wholesaleCommissionPercent: 1.0,
  },
  /** Split-fee model: customer 5% + fixer 5% (total platform take 10% of base). */
  fixerCustomerFeePercent: 5.0,
  fixerProviderFeePercent: 5.0,
  localFixerStripeFeeEstimatePercent: 2.5,
};

/**
 * Baseline B2B SaaS pricing object (USD-major) before regional PPP adjustment.
 * Apply `REGION_MULTIPLIERS[code]` at checkout when geo-pricing is enabled.
 */
export const BASELINE_PRICING_GLOBAL = {
  currency: PRICING_BASELINE_CURRENCY,
  anchorCountryCode: 'US' as const,
  anchorLabel: 'Global baseline (USD ledger)',
  tiers: PRICING_AUTHORITY.tiers,
  additionalBranchMajor: PRICING_AUTHORITY.overageAndPlatformFees.additionalBranchMajor,
} as const;

export const B2B_ENTERPRISE_TIER_USD = PRICING_AUTHORITY.tiers.Enterprise.displayPriceMajor;
export const B2B_STANDARD_TIER_USD = PRICING_AUTHORITY.tiers.Standard.displayPriceMajor;
export const B2C_GLOBAL_VIP_MONTHLY_USD = PRICING_AUTHORITY.b2cCredits.globalVipMonthlyMajorUsd;
export const B2C_LEARNING_UNLOCK_CREDITS = PRICING_AUTHORITY.b2cCredits.learningUnlockCredits;
export const B2C_LISTING_PIN_FROM_CREDITS_PER_DAY = PRICING_AUTHORITY.b2cCredits.listingPinFromCreditsPerDay;
export const B2C_AVATAR_FRAME_CREDITS = PRICING_AUTHORITY.b2cCredits.avatarFrameCredits;
export const B2C_PASSPORT_BADGE_CREDITS_PER_YEAR = PRICING_AUTHORITY.b2cCredits.passportBadgeCreditsPerYear;

/** @deprecated Use `B2B_ENTERPRISE_TIER_USD` */
export const B2B_ENTERPRISE_TIER_EUR = B2B_ENTERPRISE_TIER_USD;
/** @deprecated Use `B2B_STANDARD_TIER_USD` */
export const B2B_STANDARD_TIER_EUR = B2B_STANDARD_TIER_USD;
/** @deprecated Use `B2C_GLOBAL_VIP_MONTHLY_USD` */
export const B2C_GLOBAL_VIP_MONTHLY_EUR = B2C_GLOBAL_VIP_MONTHLY_USD;

export const B2B_TIERS = {
  PAYG: PRICING_AUTHORITY.tiers.Starter.displayPriceMajor,
  PRO: B2B_PRO_TIER_USD,
  POWER: B2B_POWER_TIER_USD,
} as const;
export const B2B_PAY_AS_YOU_GO_MONTHLY_USD = B2B_TIERS.PAYG;
/** @deprecated Use `B2B_PAY_AS_YOU_GO_MONTHLY_USD` */
export const B2B_PAY_AS_YOU_GO_MONTHLY_EUR = B2B_PAY_AS_YOU_GO_MONTHLY_USD;

export const CREDIT_EXCHANGE_RATE = CREDIT_EXCHANGE_RATE_USD;
export const LEONA_CALL_COST_CREDITS = B2C_LEONA_CALL_COST_XU;
export const INTERPRETER_PER_MIN_CREDITS = B2C_LIVE_INTERPRETER_PER_MIN_XU;
export const AI_LEONA_PER_MIN_CREDITS = PRICING_AUTHORITY.b2cCredits.aiLeonaPerMinCredits;
export const LEONA_CALL_COST_VIG_TOKENS = LEONA_CALL_COST_CREDITS;
export const INTERPRETER_PER_MIN_VIG_TOKENS = INTERPRETER_PER_MIN_CREDITS;
export const AI_LEONA_PER_MIN_VIG_TOKENS = AI_LEONA_PER_MIN_CREDITS;
export const AI_TEACHER_PREMIUM_USD = B2C_AI_TEACHER_PREMIUM_USD;
export const VAULT_PRO_USD = B2C_VAULT_PRO_USD;
/** @deprecated Use `AI_TEACHER_PREMIUM_USD` */
export const AI_TEACHER_PREMIUM_EUR = AI_TEACHER_PREMIUM_USD;
/** @deprecated Use `VAULT_PRO_USD` */
export const VAULT_PRO_EUR = VAULT_PRO_USD;

export const COMMISSION_RATES = {
  INTERMEDIARY: PRICING_AUTHORITY.commissionRates.intermediary,
  DIRECT_REFERRAL: PRICING_AUTHORITY.commissionRates.directReferral,
} as const;
export const PASSIVE_INCOME_SPLIT = {
  PARTNER: PRICING_AUTHORITY.passiveIncomeSplit.partner,
  PLATFORM: PRICING_AUTHORITY.passiveIncomeSplit.platform,
} as const;

export const AI_ARBITRAGE_COSTS = {
  VOICE_AI_COST_MAJOR: PRICING_AUTHORITY.aiArbitrageCosts.voiceAiCostMajor,
  TEXT_TRANSLATION_COST_MAJOR: PRICING_AUTHORITY.aiArbitrageCosts.textTranslationCostMajor,
  /** @deprecated */
  VOICE_AI_COST_EUR: PRICING_AUTHORITY.aiArbitrageCosts.voiceAiCostMajor,
  /** @deprecated */
  TEXT_TRANSLATION_COST_EUR: PRICING_AUTHORITY.aiArbitrageCosts.textTranslationCostMajor,
} as const;

export const OVERAGE_PLATFORM_FEES = {
  BASE_PRIORITY_FEE_MAJOR: PRICING_AUTHORITY.overageAndPlatformFees.basePriorityFeeMajor,
  BASE_PRIORITY_FEE_EUR: PRICING_AUTHORITY.overageAndPlatformFees.basePriorityFeeMajor,
  B2B_TRANSACTION_FEE_PERCENT: PRICING_AUTHORITY.overageAndPlatformFees.b2bTransactionFeePercent,
  B2B_TRANSACTION_FIXED_FEE_MAJOR: PRICING_AUTHORITY.overageAndPlatformFees.b2bTransactionFixedFeeMajor,
  B2B_TRANSACTION_FIXED_FEE_EUR: PRICING_AUTHORITY.overageAndPlatformFees.b2bTransactionFixedFeeMajor,
  EXTRA_SMS_FEE_MAJOR: PRICING_AUTHORITY.overageAndPlatformFees.extraSmsFeeMajor,
  EXTRA_SMS_FEE_EUR: PRICING_AUTHORITY.overageAndPlatformFees.extraSmsFeeMajor,
  AI_RECEPTIONIST_OVERAGE_FEE_MAJOR: PRICING_AUTHORITY.overageAndPlatformFees.aiReceptionistOverageFeeMajor,
  AI_RECEPTIONIST_OVERAGE_FEE_EUR: PRICING_AUTHORITY.overageAndPlatformFees.aiReceptionistOverageFeeMajor,
  B2B_VOICE_AI_OVERAGE_PER_MIN_MAJOR: PRICING_AUTHORITY.overageAndPlatformFees.b2bVoiceAiOveragePerMinMajor,
  B2B_VOICE_AI_OVERAGE_PER_MIN_EUR: PRICING_AUTHORITY.overageAndPlatformFees.b2bVoiceAiOveragePerMinMajor,
} as const;

export const AI_TEACHER_INCLUDED_MINUTES_PER_MONTH = PRICING_AUTHORITY.b2cCredits.aiTeacherIncludedMinutesPerMonth;
export const AI_TEACHER_OVERAGE_PER_MIN_CREDITS = PRICING_AUTHORITY.b2cCredits.aiTeacherOveragePerMinCredits;
export const MINH_KHANG_LIVE_INTERPRETER_PER_MIN_CREDITS = PRICING_AUTHORITY.b2cCredits.minhKhangLiveInterpreterPerMinCredits;
export const MINH_KHANG_DOCUMENT_ANALYSIS_CREDITS = PRICING_AUTHORITY.b2cCredits.minhKhangDocumentAnalysisCredits;

export const B2C_TRAVEL_PACKAGE_SUB_USD = PRICING_AUTHORITY.b2cCredits.travelPackageSubMajorUsd;
/** @deprecated Use `B2C_TRAVEL_PACKAGE_SUB_USD` */
export const B2C_TRAVEL_PACKAGE_SUB_EUR = B2C_TRAVEL_PACKAGE_SUB_USD;

export const SUPER_APP_ENABLED = true;
