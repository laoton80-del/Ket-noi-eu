import type { AutomationLevelDefinition, AutomationLevelKey } from '../types/automationLevel';

export const MAIN_MARKET_COMMERCIAL_LAUNCH_LEVEL = 5 as const;

export const AUTOMATION_LEVEL_DEFINITIONS: Readonly<Record<AutomationLevelKey, AutomationLevelDefinition>> = {
  L0_MANUAL_FOUNDATION: {
    level: 0,
    key: 'L0_MANUAL_FOUNDATION',
    label: 'Manual foundation',
    shortDescription: 'Manual operations and configuration without governed automation.',
    commercialReadiness: false,
    mainMarketLaunchEligible: false,
  },
  L1_ASSISTED_WORKFLOWS: {
    level: 1,
    key: 'L1_ASSISTED_WORKFLOWS',
    label: 'Assisted workflows',
    shortDescription: 'AI-assisted intake and workflows with human or merchant mediation.',
    commercialReadiness: false,
    mainMarketLaunchEligible: false,
  },
  L2_GUIDED_AUTOMATION: {
    level: 2,
    key: 'L2_GUIDED_AUTOMATION',
    label: 'Guided automation',
    shortDescription: 'Structured automation proposals with review queues and labeled pilot posture.',
    commercialReadiness: false,
    mainMarketLaunchEligible: false,
  },
  L3_SUPERVISED_AUTOPILOT: {
    level: 3,
    key: 'L3_SUPERVISED_AUTOPILOT',
    label: 'Supervised autopilot',
    shortDescription: 'Rule-bound automation within merchant policy with supervision and fallback.',
    commercialReadiness: false,
    mainMarketLaunchEligible: false,
  },
  L4_CONTROLLED_BUSINESS_AUTOPILOT: {
    level: 4,
    key: 'L4_CONTROLLED_BUSINESS_AUTOPILOT',
    label: 'Controlled business autopilot',
    shortDescription: 'Governed transaction automation without main-market commercial launch eligibility.',
    commercialReadiness: false,
    mainMarketLaunchEligible: false,
  },
  L5_PRODUCTION_AI_BUSINESS_AUTOPILOT: {
    level: 5,
    key: 'L5_PRODUCTION_AI_BUSINESS_AUTOPILOT',
    label: 'Production AI business autopilot',
    shortDescription: 'Production-governed AI business autopilot eligible for main-market commercial launch.',
    commercialReadiness: true,
    mainMarketLaunchEligible: true,
  },
};

export function getAutomationLevelDefinition(levelKey: AutomationLevelKey): AutomationLevelDefinition {
  return AUTOMATION_LEVEL_DEFINITIONS[levelKey];
}

export function getAutomationLevelNumber(levelKey: AutomationLevelKey): number {
  return AUTOMATION_LEVEL_DEFINITIONS[levelKey].level;
}

export function isMainMarketLaunchEligibleLevel(levelKey: AutomationLevelKey): boolean {
  return AUTOMATION_LEVEL_DEFINITIONS[levelKey].mainMarketLaunchEligible;
}
