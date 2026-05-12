import type { AutomationLevelKey } from './automationLevel';

export const COMMERCIAL_MARKETS = ['EU', 'US', 'CA', 'GLOBAL'] as const;

export type CommercialMarket = (typeof COMMERCIAL_MARKETS)[number];

export const MARKET_CAPABILITY_MODES = [
  'GLOBAL_LITE',
  'MAIN_MARKET_LOCKED',
  'MAIN_MARKET_PILOT',
  'MAIN_MARKET_COMMERCIAL_READY',
] as const;

export type MarketCapabilityMode = (typeof MARKET_CAPABILITY_MODES)[number];

export const SAFE_READINESS_LABELS = [
  'demo',
  'preview',
  'pilot',
  'internal',
  'global_lite',
  'commercial_ready',
  'production_ready',
] as const;

export type SafeReadinessLabel = (typeof SAFE_READINESS_LABELS)[number];

export type MarketCapabilityDefinition = Readonly<{
  market: CommercialMarket;
  automationLevelKey: AutomationLevelKey;
  mode: MarketCapabilityMode;
  safeReadinessLabel: SafeReadinessLabel;
  mainMarketCommercialLaunchAllowed: boolean;
}>;
