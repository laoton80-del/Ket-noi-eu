import type { TelephonyPilotReadinessDefinition, TelephonyPilotReadinessId } from './telephonyPilotTypes';
import { TELEPHONY_PILOT_REGISTRY } from './telephonyPilotRegistry';

export type {
  TelephonyCallMode,
  TelephonyConsentRequirement,
  TelephonyPilotReadinessDefinition,
  TelephonyPilotReadinessId,
  TelephonyPilotStatus,
  TelephonyProvider,
} from './telephonyPilotTypes';

export { TELEPHONY_PILOT_REGISTRY } from './telephonyPilotRegistry';

export function getTelephonyPilotReadiness(id: TelephonyPilotReadinessId): TelephonyPilotReadinessDefinition {
  return TELEPHONY_PILOT_REGISTRY[id];
}

export function getAllTelephonyPilotReadiness(): readonly TelephonyPilotReadinessDefinition[] {
  return Object.freeze(Object.values(TELEPHONY_PILOT_REGISTRY));
}

export function isTelephonyProductionReady(id: TelephonyPilotReadinessId): boolean {
  return TELEPHONY_PILOT_REGISTRY[id].productionReady === true;
}

/** True when outbound production calling is blocked for this lane (expected for all registry rows today). */
export function isProductionCallModeBlocked(id: TelephonyPilotReadinessId): boolean {
  return TELEPHONY_PILOT_REGISTRY[id].blockedModes.includes('productionOutbound');
}
