export const AUTOMATION_LEVEL_KEYS = [
  'L0_MANUAL_FOUNDATION',
  'L1_ASSISTED_WORKFLOWS',
  'L2_GUIDED_AUTOMATION',
  'L3_SUPERVISED_AUTOPILOT',
  'L4_CONTROLLED_BUSINESS_AUTOPILOT',
  'L5_PRODUCTION_AI_BUSINESS_AUTOPILOT',
] as const;

export type AutomationLevelKey = (typeof AUTOMATION_LEVEL_KEYS)[number];

export type AutomationLevelDefinition = Readonly<{
  level: number;
  key: AutomationLevelKey;
  label: string;
  shortDescription: string;
  commercialReadiness: boolean;
  mainMarketLaunchEligible: boolean;
}>;
