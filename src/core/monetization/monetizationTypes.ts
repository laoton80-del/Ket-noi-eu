/**
 * Foundation types for VIONA monetization & Zero-Loss Engine.
 * Config-only — no runtime billing or DB.
 */

/** Base settlement / display currency for commercial spine (EUR). */
export type CurrencyCode = 'EUR';

export type BillingInterval = 'monthly' | 'annual' | 'one_time';

export type PlanStatus = 'draft' | 'active' | 'deprecated';

/** Composite revenue model streams (Zero-Loss doc). */
export type RevenueStream =
  | 'consumer_subscription'
  | 'ai_credits'
  | 'b2b_saas'
  | 'ai_receptionist_minutes'
  | 'booking_fee'
  | 'travel_commission'
  | 'academy_subscription'
  | 'broker_qr_performance'
  | 'merchant_visibility_boost'
  | 'setup_onboarding_fee';

/** Metered usage dimensions for cost allocation and caps. */
export type UsageMetric =
  | 'ai_receptionist_minutes'
  | 'llm_tokens'
  | 'voice_streaming_minutes'
  | 'vision_scans'
  | 'sms_count'
  | 'booking_count'
  | 'storage_bytes'
  | 'server_compute_units';

/** How hard caps are expressed for a plan or feature. */
export type HardCapPolicy =
  | {
      kind: 'absolute';
      /** Hard limit in the unit implied by context (e.g. minutes/month). */
      limit: number;
    }
  | {
      kind: 'multiplier_of_included';
      /** e.g. 2 = 2× included bundle before pause. */
      multiplier: number;
    };

/** Overage billing or block after included bundle. */
export type OveragePolicy =
  | { kind: 'blocked' }
  | {
      kind: 'per_unit';
      /** Minor units (cents) per one usage unit (e.g. per minute). */
      centsPerUnitEur: number;
      usageMetric: UsageMetric;
    };

/** Minimum economics guardrails for a plan or SKU. */
export interface MarginGuard {
  /** Floor on gross margin % after allocated variable COGS (target, not enforced here). */
  minimumGrossMarginPercent: number;
  /** Optional minimum monthly platform fee in EUR cents. */
  minimumMonthlyFeeFloorCentsEur: number | null;
  /** Human-readable guard notes for CFO review. */
  notes?: string;
}

/** When to auto-pause expensive surfaces (config only). */
export interface AutoPausePolicy {
  pauseWhenHardCapReached: boolean;
  pauseWhenDailyCapReached: boolean;
  /** If set, pause when rolling margin estimate drops below this percent. */
  pauseWhenMarginBelowPercent: number | null;
}

/** Canonical monetization plan shape (B2C or B2B can specialize by id). */
export interface MonetizationPlan {
  id: string;
  name: string;
  status: PlanStatus;
  currency: CurrencyCode;
  billingInterval: BillingInterval;
  revenueStreams: readonly RevenueStream[];
  primaryUsageMetrics: readonly UsageMetric[];
  hardCap: HardCapPolicy;
  overage: OveragePolicy;
  marginGuard: MarginGuard;
  autoPause: AutoPausePolicy;
  ledgerEnabled: boolean;
  monitoringEnabled: boolean;
}
