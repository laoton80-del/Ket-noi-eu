/** Provider-side cost buckets for tracking & alerts (config only). */
export type SupportedProviderCostMetric =
  | 'openaiTokens'
  | 'geminiTokens'
  | 'twilioVoiceSeconds'
  | 'smsCount'
  | 'visionScans'
  | 'serverCompute'
  | 'storage';

export interface CostFirewallConfig {
  maxCallDurationSeconds: number;
  maxDailyAiMinutesPerMerchant: number;
  maxMonthlyAiMinutesPerMerchant: number;
  maxVisionScansPerUserPerDay: number;
  maxPremiumModelCallsPerDay: number;
  minimumGrossMarginPercent: number;
  autoPauseWhenMarginBelowPercent: number;
  providerCostAlertThresholdCentsEur: number;
  supportedCostMetrics: readonly SupportedProviderCostMetric[];
}

export const SUPPORTED_COST_METRICS: readonly SupportedProviderCostMetric[] = [
  'openaiTokens',
  'geminiTokens',
  'twilioVoiceSeconds',
  'smsCount',
  'visionScans',
  'serverCompute',
  'storage',
] as const;

/** Default thresholds — not enforced at runtime until wired. */
export const DEFAULT_COST_FIREWALL_CONFIG: CostFirewallConfig = {
  maxCallDurationSeconds: 3600,
  maxDailyAiMinutesPerMerchant: 240,
  maxMonthlyAiMinutesPerMerchant: 8000,
  maxVisionScansPerUserPerDay: 25,
  maxPremiumModelCallsPerDay: 40,
  minimumGrossMarginPercent: 35,
  autoPauseWhenMarginBelowPercent: 8,
  /** Alert when rolling daily estimated provider COGS exceeds this (EUR cents). */
  providerCostAlertThresholdCentsEur: 50_000,
  supportedCostMetrics: SUPPORTED_COST_METRICS,
} as const;
