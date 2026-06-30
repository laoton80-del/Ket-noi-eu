import {
  VIONA_ACTION_READINESS_DISABLED,
  VIONA_PACK26B_UNKNOWN_ACTION_SUMMARY,
  type VionaActionCapabilitySummary,
  type VionaActionReadiness,
  type VionaActionRegistryEntry,
  type VionaActionUniverse,
} from './vionaActionCapabilityTypes';
import { VIONA_ACTION_REGISTRY, VIONA_ACTION_REGISTRY_BY_ID } from './vionaActionRegistry';

function gateIsBlocked(gate: VionaActionRegistryEntry['legalGate']): boolean {
  return gate === 'blocked' || gate === 'required';
}

function toCapabilitySummary(entry: VionaActionRegistryEntry): VionaActionCapabilitySummary {
  return {
    actionId: entry.actionId,
    known: true,
    universe: entry.universe,
    actionFamily: entry.actionFamily,
    defaultReadiness: entry.defaultReadiness,
    executionEnabled: false,
    uiAffordanceAllowed: false,
    disabledReason: entry.disabledReason,
    legalBlocked: gateIsBlocked(entry.legalGate),
    paymentBlocked: gateIsBlocked(entry.paymentGate),
    opsBlocked: gateIsBlocked(entry.opsGate),
    sosBlocked: gateIsBlocked(entry.sosGate),
  };
}

/** All registry entries — read-only. */
export function getAllVionaActionRegistryEntries(): readonly VionaActionRegistryEntry[] {
  return VIONA_ACTION_REGISTRY;
}

/** Lookup by actionId; returns undefined when unknown. */
export function getVionaActionRegistryEntry(
  actionId: string,
): VionaActionRegistryEntry | undefined {
  return VIONA_ACTION_REGISTRY_BY_ID[actionId];
}

/** Safe capability summary — never throws; unknown actions return disabled summary. */
export function getVionaActionCapabilitySummary(actionId: string): VionaActionCapabilitySummary {
  const entry = getVionaActionRegistryEntry(actionId);
  if (!entry) {
    return { ...VIONA_PACK26B_UNKNOWN_ACTION_SUMMARY, actionId };
  }
  return toCapabilitySummary(entry);
}

export function isVionaActionKnown(actionId: string): boolean {
  return getVionaActionRegistryEntry(actionId) !== undefined;
}

/** Pack26B: always false — registry layer does not enable execution. */
export function isVionaActionExecutableInPack26B(_actionId: string): boolean {
  return false;
}

/** Pack26B: always false — UI affordances not authorized in this pack. */
export function isVionaActionUiAffordanceAllowedInPack26B(_actionId: string): boolean {
  return false;
}

export function getVionaActionsByUniverse(
  universe: VionaActionUniverse,
): readonly VionaActionRegistryEntry[] {
  return VIONA_ACTION_REGISTRY.filter((entry) => entry.universe === universe);
}

export function getVionaActionsByReadiness(
  readiness: VionaActionReadiness,
): readonly VionaActionRegistryEntry[] {
  return VIONA_ACTION_REGISTRY.filter((entry) => entry.defaultReadiness === readiness);
}

export function getVionaUnknownActionReadiness(): VionaActionReadiness {
  return VIONA_ACTION_READINESS_DISABLED;
}
