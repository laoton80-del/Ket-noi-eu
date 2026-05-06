import type { AiCostFeatureId, AiCostGuardDefinition } from './aiCostTypes';
import { AI_COST_GUARD_REGISTRY } from './aiCostGuardRegistry';

export type {
  AiCostFeatureId,
  AiCostGuardDefinition,
  AiCostGuardStatus,
  AiCostProviderRisk,
  AiCostResetWindow,
  AiUsageUnit,
} from './aiCostTypes';

export { AI_COST_GUARD_REGISTRY } from './aiCostGuardRegistry';

export function getAiCostGuard(featureId: AiCostFeatureId): AiCostGuardDefinition {
  return AI_COST_GUARD_REGISTRY[featureId];
}

export function getAllAiCostGuards(): readonly AiCostGuardDefinition[] {
  return Object.freeze(Object.values(AI_COST_GUARD_REGISTRY));
}

export function isAiFeatureProductionReady(featureId: AiCostFeatureId): boolean {
  return AI_COST_GUARD_REGISTRY[featureId].productionReady === true;
}

export function shouldAutoPauseAiFeature(featureId: AiCostFeatureId): boolean {
  return AI_COST_GUARD_REGISTRY[featureId].autoPauseOnCap === true;
}
