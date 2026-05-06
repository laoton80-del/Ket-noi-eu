import type { AutoPausePolicy, MarginGuard } from './monetizationTypes';

export type MerchantPlanId =
  | 'FREE_DEMO'
  | 'STARTER'
  | 'AI_INTAKE'
  | 'POWER'
  | 'PRO'
  | 'ENTERPRISE';

/** B2B AI Receptionist automation depth (draft taxonomy). */
export type MerchantAutomationLevel =
  | 'none'
  | 'demo_voice_only'
  | 'listing_and_basic_booking'
  | 'ai_intake_merchant_confirm'
  | 'auto_booking_by_policy'
  | 'inventory_bill_payment_automation'
  | 'enterprise_custom';

export interface MerchantAiReceptionistPlanDraft {
  id: MerchantPlanId;
  name: string;
  status: 'draft';
  /** SaaS seat in EUR cents/month; null = CPQ / custom (Enterprise). */
  monthlyPriceCentsEur: number | null;
  /** Included AI receptionist minutes per billing month (0 if not minute-based). */
  includedAiMinutes: number;
  /** Max demo voice sessions for FREE_DEMO before hard stop. */
  includedDemoCalls: number | null;
  /** EUR cents per minute beyond included; null = overage not sold (blocked). */
  overagePerMinuteCentsEur: number | null;
  /** Absolute ceiling minutes (or demo cap) per period before pause. */
  hardCapMinutes: number;
  automationLevel: MerchantAutomationLevel;
  features: readonly string[];
  marginGuard: MarginGuard;
  autoPausePolicy: AutoPausePolicy;
  /** CFO must stamp commercial numbers before activation. */
  requiresCfoApproval: boolean;
  /** If false, no production booking commits (demo / lead capture only). */
  allowsProductionBooking: boolean;
}

const draftPause: AutoPausePolicy = {
  pauseWhenHardCapReached: true,
  pauseWhenDailyCapReached: true,
  pauseWhenMarginBelowPercent: 8,
};

const demoMargin: MarginGuard = {
  minimumGrossMarginPercent: 35,
  minimumMonthlyFeeFloorCentsEur: 0,
  notes: 'Demo pool funded by platform marketing budget; cap strictly.',
};

const starterMargin: MarginGuard = {
  minimumGrossMarginPercent: 40,
  minimumMonthlyFeeFloorCentsEur: 0,
  notes: 'Router locked to small + cache-heavy path.',
};

export const MERCHANT_AI_RECEPTIONIST_PLANS: Readonly<
  Record<MerchantPlanId, MerchantAiReceptionistPlanDraft>
> = {
  FREE_DEMO: {
    id: 'FREE_DEMO',
    name: 'Free Demo',
    status: 'draft',
    monthlyPriceCentsEur: 0,
    includedAiMinutes: 0,
    includedDemoCalls: 3,
    overagePerMinuteCentsEur: null,
    hardCapMinutes: 0,
    automationLevel: 'demo_voice_only',
    features: [
      'SINGLE_LOCATION',
      'NO_PRODUCTION_BOOKING',
      'DEMO_VOICE_ONLY',
      'WATERMARK_RECEIPT_IF_PRINT',
    ],
    marginGuard: demoMargin,
    autoPausePolicy: draftPause,
    requiresCfoApproval: true,
    allowsProductionBooking: false,
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    status: 'draft',
    monthlyPriceCentsEur: null,
    includedAiMinutes: 200,
    includedDemoCalls: null,
    overagePerMinuteCentsEur: null,
    hardCapMinutes: 400,
    automationLevel: 'listing_and_basic_booking',
    features: ['BUSINESS_HOURS', 'BASIC_LISTING', 'FAQ_CACHE', 'HUMAN_FALLBACK'],
    marginGuard: starterMargin,
    autoPausePolicy: draftPause,
    requiresCfoApproval: true,
    allowsProductionBooking: true,
  },
  AI_INTAKE: {
    id: 'AI_INTAKE',
    name: 'AI Intake',
    status: 'draft',
    monthlyPriceCentsEur: null,
    includedAiMinutes: 600,
    includedDemoCalls: null,
    overagePerMinuteCentsEur: null,
    hardCapMinutes: 2400,
    automationLevel: 'ai_intake_merchant_confirm',
    features: ['BOOKING_HOLD_TOOLS', 'NO_AUTO_CAPTURE_DEFAULT', 'PREMIUM_ROUTE_QUOTA'],
    marginGuard: {
      minimumGrossMarginPercent: 38,
      minimumMonthlyFeeFloorCentsEur: null,
      notes: 'Separate premium model minute budget line (CFO).',
    },
    autoPausePolicy: draftPause,
    requiresCfoApproval: true,
    allowsProductionBooking: true,
  },
  POWER: {
    id: 'POWER',
    name: 'Power',
    status: 'draft',
    monthlyPriceCentsEur: null,
    includedAiMinutes: 1500,
    includedDemoCalls: null,
    overagePerMinuteCentsEur: null,
    hardCapMinutes: 6000,
    automationLevel: 'auto_booking_by_policy',
    features: ['AUTO_BOOKING_POST_POLICY', 'INVENTORY_RESERVE', 'PRINT_QUEUE_HOOK'],
    marginGuard: {
      minimumGrossMarginPercent: 42,
      minimumMonthlyFeeFloorCentsEur: null,
      notes: 'Dual split-fee on bookings; AI COGS allocation per merchant.',
    },
    autoPausePolicy: draftPause,
    requiresCfoApproval: true,
    allowsProductionBooking: true,
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    status: 'draft',
    monthlyPriceCentsEur: null,
    includedAiMinutes: 4000,
    includedDemoCalls: null,
    overagePerMinuteCentsEur: null,
    hardCapMinutes: 20000,
    automationLevel: 'inventory_bill_payment_automation',
    features: ['MULTI_LOCATION', 'SLA', 'PRIORITY_MODEL_ROUTE', 'ANALYTICS'],
    marginGuard: {
      minimumGrossMarginPercent: 45,
      minimumMonthlyFeeFloorCentsEur: null,
      notes: 'Anti negative margin: floor fee if usage collapses (CFO).',
    },
    autoPausePolicy: {
      ...draftPause,
      pauseWhenMarginBelowPercent: 10,
    },
    requiresCfoApproval: true,
    allowsProductionBooking: true,
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    status: 'draft',
    monthlyPriceCentsEur: null,
    includedAiMinutes: 10000,
    includedDemoCalls: null,
    overagePerMinuteCentsEur: null,
    hardCapMinutes: 50000,
    automationLevel: 'enterprise_custom',
    features: ['CPQ', 'DEDICATED_SUPPORT', 'CUSTOM_POLICY_PACK'],
    marginGuard: {
      minimumGrossMarginPercent: 48,
      minimumMonthlyFeeFloorCentsEur: null,
      notes: 'Annual true-up; chargeback reserve terms (legal/finance).',
    },
    autoPausePolicy: draftPause,
    requiresCfoApproval: true,
    allowsProductionBooking: true,
  },
} as const;
