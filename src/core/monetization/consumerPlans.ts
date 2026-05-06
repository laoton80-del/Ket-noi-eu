import type { AutoPausePolicy, MarginGuard, RevenueStream } from './monetizationTypes';

export type ConsumerPlanId = 'FREE' | 'VIONA_PLUS' | 'TRAVEL_PACK' | 'ACADEMY_FAMILY' | 'AI_CREDITS';

export interface ConsumerUsageCaps {
  /** Prepaid or allowance AI credits (minor units — product to define). */
  includedAiCredits: number;
  maxAiVoiceMinutesPerMonth: number;
  maxPremiumModelCallsPerDay: number;
  maxVisionScansPerDay: number;
}

export interface ConsumerPlanDraft {
  id: ConsumerPlanId;
  name: string;
  status: 'draft';
  /** Monthly price in EUR cents; null for free or pack TBD. */
  monthlyPriceCentsEur: number | null;
  /** One-time pack price for AI_CREDITS / add-ons. */
  oneTimePackPriceCentsEur: number | null;
  includedCredits: number | null;
  usageCaps: ConsumerUsageCaps;
  allowedFeatures: readonly string[];
  revenueStreams: readonly RevenueStream[];
  marginGuard: MarginGuard;
  autoPausePolicy: AutoPausePolicy;
  requiresCfoApproval: boolean;
}

const consumerPause: AutoPausePolicy = {
  pauseWhenHardCapReached: true,
  pauseWhenDailyCapReached: true,
  pauseWhenMarginBelowPercent: null,
};

export const CONSUMER_PLANS: Readonly<Record<ConsumerPlanId, ConsumerPlanDraft>> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    status: 'draft',
    monthlyPriceCentsEur: 0,
    oneTimePackPriceCentsEur: null,
    includedCredits: 0,
    usageCaps: {
      includedAiCredits: 0,
      maxAiVoiceMinutesPerMonth: 30,
      maxPremiumModelCallsPerDay: 0,
      maxVisionScansPerDay: 0,
    },
    allowedFeatures: ['TRUST_LAYER_ESSENTIALS', 'STANDARD_BOOKING_FEES'],
    revenueStreams: ['booking_fee'],
    marginGuard: {
      minimumGrossMarginPercent: 30,
      minimumMonthlyFeeFloorCentsEur: 0,
      notes: 'Strict caps; upgrade prompt at ~80% usage (product).',
    },
    autoPausePolicy: consumerPause,
    requiresCfoApproval: false,
  },
  VIONA_PLUS: {
    id: 'VIONA_PLUS',
    name: 'VIONA Plus',
    status: 'draft',
    monthlyPriceCentsEur: null,
    oneTimePackPriceCentsEur: null,
    includedCredits: null,
    usageCaps: {
      includedAiCredits: 500,
      maxAiVoiceMinutesPerMonth: 300,
      maxPremiumModelCallsPerDay: 20,
      maxVisionScansPerDay: 10,
    },
    allowedFeatures: ['PRIORITY_SUPPORT', 'HIGHER_CAPS', 'BUNDLED_CREDITS'],
    revenueStreams: ['consumer_subscription', 'ai_credits'],
    marginGuard: {
      minimumGrossMarginPercent: 45,
      minimumMonthlyFeeFloorCentsEur: null,
      notes: 'CFO: fee vs reduced booking fee SKU.',
    },
    autoPausePolicy: consumerPause,
    requiresCfoApproval: true,
  },
  TRAVEL_PACK: {
    id: 'TRAVEL_PACK',
    name: 'Travel Pack',
    status: 'draft',
    monthlyPriceCentsEur: null,
    oneTimePackPriceCentsEur: null,
    includedCredits: null,
    usageCaps: {
      includedAiCredits: 200,
      maxAiVoiceMinutesPerMonth: 120,
      maxPremiumModelCallsPerDay: 15,
      maxVisionScansPerDay: 5,
    },
    allowedFeatures: ['TRAVEL_UNIVERSE_ADDON', 'CONCIERGE_CREDITS_TBD'],
    revenueStreams: ['consumer_subscription', 'travel_commission'],
    marginGuard: {
      minimumGrossMarginPercent: 40,
      minimumMonthlyFeeFloorCentsEur: null,
      notes: 'Bundle composition Chưa xác định — CFO.',
    },
    autoPausePolicy: consumerPause,
    requiresCfoApproval: true,
  },
  ACADEMY_FAMILY: {
    id: 'ACADEMY_FAMILY',
    name: 'Academy Family',
    status: 'draft',
    monthlyPriceCentsEur: null,
    oneTimePackPriceCentsEur: null,
    includedCredits: null,
    usageCaps: {
      includedAiCredits: 400,
      maxAiVoiceMinutesPerMonth: 180,
      maxPremiumModelCallsPerDay: 25,
      maxVisionScansPerDay: 8,
    },
    allowedFeatures: ['ACADEMY_HOUSEHOLD', 'OPTIONAL_CHILD_SEAT'],
    revenueStreams: ['academy_subscription'],
    marginGuard: {
      minimumGrossMarginPercent: 42,
      minimumMonthlyFeeFloorCentsEur: null,
      notes: 'Per-child add-on Chưa xác định.',
    },
    autoPausePolicy: consumerPause,
    requiresCfoApproval: true,
  },
  AI_CREDITS: {
    id: 'AI_CREDITS',
    name: 'AI Credits',
    status: 'draft',
    monthlyPriceCentsEur: null,
    oneTimePackPriceCentsEur: null,
    includedCredits: null,
    usageCaps: {
      includedAiCredits: 0,
      maxAiVoiceMinutesPerMonth: 0,
      maxPremiumModelCallsPerDay: 0,
      maxVisionScansPerDay: 0,
    },
    allowedFeatures: ['PREPAID_PACKS_ONLY', 'NO_UNLIMITED'],
    revenueStreams: ['ai_credits'],
    marginGuard: {
      minimumGrossMarginPercent: 50,
      minimumMonthlyFeeFloorCentsEur: 0,
      notes: 'Pack sizes and EUR pricing CFO.',
    },
    autoPausePolicy: consumerPause,
    requiresCfoApproval: true,
  },
} as const;
