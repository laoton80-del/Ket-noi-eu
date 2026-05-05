import type { AutoPausePolicy, MarginGuard, RevenueStream } from './monetizationTypes';

/**
 * Input for gating **production** monetized features against Zero-Loss rules.
 * Callers supply booleans/limits from plan + ops config — no I/O here.
 */
export interface ZeroLossPolicyInput {
  revenueSource: RevenueStream | null;
  costCap: {
    /** If true, feature is never allowed in production (unlimited AI forbidden). */
    unlimitedAi: boolean;
    /** Bounded AI minutes envelope per billing month (or platform default cap). */
    maxAiMinutesPerMonth: number;
  };
  marginGuard: MarginGuard | null;
  monitoring: { enabled: boolean };
  ledger: { enabled: boolean };
  autoPause: AutoPausePolicy | null;
}

function hasAutoPauseRule(policy: AutoPausePolicy): boolean {
  if (policy.pauseWhenHardCapReached) return true;
  if (policy.pauseWhenDailyCapReached) return true;
  return (
    policy.pauseWhenMarginBelowPercent != null &&
    Number.isFinite(policy.pauseWhenMarginBelowPercent) &&
    policy.pauseWhenMarginBelowPercent > 0
  );
}

/**
 * Returns true only when all Zero-Loss invariants are satisfied for production.
 */
export function isProductionFeatureAllowed(input: ZeroLossPolicyInput): boolean {
  if (input.revenueSource == null) return false;
  if (input.costCap.unlimitedAi) return false;
  if (!Number.isFinite(input.costCap.maxAiMinutesPerMonth) || input.costCap.maxAiMinutesPerMonth <= 0) {
    return false;
  }
  if (input.marginGuard == null) return false;
  if (
    !Number.isFinite(input.marginGuard.minimumGrossMarginPercent) ||
    input.marginGuard.minimumGrossMarginPercent <= 0
  ) {
    return false;
  }
  if (!input.monitoring.enabled) return false;
  if (!input.ledger.enabled) return false;
  if (input.autoPause == null) return false;
  if (!hasAutoPauseRule(input.autoPause)) return false;
  return true;
}

/** Inputs for evaluating whether usage should trigger a pause (pure function). */
export interface CostFirewallEvaluationInput {
  currentGrossMarginPercent: number;
  autoPauseWhenMarginBelowPercent: number | null;
  hardCapMinutesUsed: number;
  hardCapMinutesLimit: number;
  dailyMinutesUsed: number;
  dailyMinutesLimit: number;
}

/**
 * Returns true if any configured threshold is crossed (caller enforces side effects).
 */
export function shouldAutoPause(input: CostFirewallEvaluationInput): boolean {
  if (
    Number.isFinite(input.hardCapMinutesLimit) &&
    input.hardCapMinutesLimit > 0 &&
    input.hardCapMinutesUsed >= input.hardCapMinutesLimit
  ) {
    return true;
  }
  if (
    Number.isFinite(input.dailyMinutesLimit) &&
    input.dailyMinutesLimit > 0 &&
    input.dailyMinutesUsed >= input.dailyMinutesLimit
  ) {
    return true;
  }
  if (
    input.autoPauseWhenMarginBelowPercent != null &&
    Number.isFinite(input.autoPauseWhenMarginBelowPercent) &&
    Number.isFinite(input.currentGrossMarginPercent) &&
    input.currentGrossMarginPercent < input.autoPauseWhenMarginBelowPercent
  ) {
    return true;
  }
  return false;
}

/**
 * Minimum wholesale overage price (cents) given estimated provider COGS and margin multiplier.
 * multiplier must be >= 1; rounds up to whole cents.
 */
export function calculateMinimumOveragePrice(providerCostCents: number, multiplier: number): number {
  if (!Number.isFinite(providerCostCents) || providerCostCents < 0) return 0;
  if (!Number.isFinite(multiplier) || multiplier < 1) return Math.ceil(providerCostCents);
  return Math.ceil(providerCostCents * multiplier);
}
