import {
  AUTOMATION_LEVEL_DEFINITIONS,
  getAutomationLevelDefinition,
  getAutomationLevelNumber,
  MAIN_MARKET_COMMERCIAL_LAUNCH_LEVEL,
} from './automationLevelConfig';
import type { AutomationLevelKey } from '../types/automationLevel';
import type {
  CommercialMarket,
  MarketCapabilityDefinition,
  MarketCapabilityMode,
  SafeReadinessLabel,
} from '../types/marketCapability';

const MAIN_MARKET_CODES = new Set<CommercialMarket>(['EU', 'US', 'CA']);

const MARKET_ALIASES: Readonly<Record<string, CommercialMarket>> = {
  EU: 'EU',
  EUROPE: 'EU',
  US: 'US',
  USA: 'US',
  'UNITED STATES': 'US',
  CA: 'CA',
  CANADA: 'CA',
  GLOBAL: 'GLOBAL',
  WORLD: 'GLOBAL',
  OTHER: 'GLOBAL',
  ROW: 'GLOBAL',
};

export function normalizeCommercialMarket(regionOrMarket: string): CommercialMarket {
  const normalized = regionOrMarket.trim().toUpperCase();
  return MARKET_ALIASES[normalized] ?? 'GLOBAL';
}

export function isMainMarket(regionOrMarket: CommercialMarket | string): boolean {
  const market =
    typeof regionOrMarket === 'string' ? normalizeCommercialMarket(regionOrMarket) : regionOrMarket;
  return MAIN_MARKET_CODES.has(market);
}

export function isCommercialLaunchAllowed(
  market: CommercialMarket | string,
  automationLevel: AutomationLevelKey,
): boolean {
  const resolvedMarket =
    typeof market === 'string' ? normalizeCommercialMarket(market) : market;
  if (!isMainMarket(resolvedMarket)) {
    return false;
  }
  return getAutomationLevelDefinition(automationLevel).mainMarketLaunchEligible;
}

export function getMarketCapability(
  market: CommercialMarket | string,
  automationLevel: AutomationLevelKey,
): MarketCapabilityDefinition {
  const resolvedMarket =
    typeof market === 'string' ? normalizeCommercialMarket(market) : market;
  const levelDefinition = getAutomationLevelDefinition(automationLevel);

  if (!isMainMarket(resolvedMarket)) {
    return {
      market: resolvedMarket,
      automationLevelKey: automationLevel,
      mode: 'GLOBAL_LITE',
      safeReadinessLabel: 'global_lite',
      mainMarketCommercialLaunchAllowed: false,
    };
  }

  if (levelDefinition.mainMarketLaunchEligible) {
    return {
      market: resolvedMarket,
      automationLevelKey: automationLevel,
      mode: 'MAIN_MARKET_COMMERCIAL_READY',
      safeReadinessLabel: 'production_ready',
      mainMarketCommercialLaunchAllowed: true,
    };
  }

  const mode: MarketCapabilityMode =
    levelDefinition.level === 0 ? 'MAIN_MARKET_LOCKED' : 'MAIN_MARKET_PILOT';

  return {
    market: resolvedMarket,
    automationLevelKey: automationLevel,
    mode,
    safeReadinessLabel: getSafeReadinessLabel(mode),
    mainMarketCommercialLaunchAllowed: false,
  };
}

export function getSafeReadinessLabel(capability: MarketCapabilityMode): SafeReadinessLabel {
  switch (capability) {
    case 'GLOBAL_LITE':
      return 'global_lite';
    case 'MAIN_MARKET_LOCKED':
      return 'internal';
    case 'MAIN_MARKET_PILOT':
      return 'pilot';
    case 'MAIN_MARKET_COMMERCIAL_READY':
      return 'production_ready';
    default: {
      const exhaustive: never = capability;
      return exhaustive;
    }
  }
}

export function assertNoMainMarketCommercialBeforeL5(
  market: CommercialMarket | string,
  automationLevel: AutomationLevelKey,
): boolean {
  const resolvedMarket =
    typeof market === 'string' ? normalizeCommercialMarket(market) : market;
  if (!isMainMarket(resolvedMarket)) {
    return true;
  }
  return getAutomationLevelNumber(automationLevel) >= MAIN_MARKET_COMMERCIAL_LAUNCH_LEVEL;
}

export function listAutomationLevels(): readonly AutomationLevelKey[] {
  return Object.keys(AUTOMATION_LEVEL_DEFINITIONS) as AutomationLevelKey[];
}
