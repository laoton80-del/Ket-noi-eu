import type { FeatureFlags } from '../feature-flags/featureFlags';
import { getMiniAppDefinition, isMiniAppId } from './miniAppRegistry';
import type {
  MiniAppDefinition,
  MiniAppId,
  MiniAppRole,
  ResolveMiniAppEntryInput,
  ResolveMiniAppEntryResult,
} from './miniAppTypes';

/** Map shell `ActiveRole` to resolver vocabulary without importing the store (avoids cycles). */
export function activeRoleToMiniAppRole(
  role: 'B2C' | 'B2B' | 'BROKER' | 'ADMIN'
): MiniAppRole {
  switch (role) {
    case 'B2C':
      return 'b2c';
    case 'B2B':
      return 'merchant';
    case 'BROKER':
      return 'broker';
    case 'ADMIN':
      return 'admin';
  }
}

function roleAllows(def: MiniAppDefinition, userRole: MiniAppRole): boolean {
  if (def.requiredRoles.length === 0) return true;
  return def.requiredRoles.includes(userRole);
}

/**
 * B2B AI Receptionist demo/pilot surfaces stay aligned with `getFeatureFlags` semantics:
 * demo default ON; pilot is an additional env gate (see `featureFlags.ts`).
 */
function passesFeatureFlagGate(id: MiniAppId, def: MiniAppDefinition, flags: FeatureFlags): boolean {
  if (id === 'b2bAiReceptionist') {
    return flags.b2bAiReceptionistDemoEnabled || flags.b2bAiReceptionistPilotEnabled;
  }
  if (def.featureFlag === undefined) return true;
  return flags[def.featureFlag];
}

/**
 * Typed resolver for mini-app entry: **never** returns a silent fallback to Hub/Home.
 * Callers must render gate / demo / frozen / error UI based on `type`.
 */
export function resolveMiniAppEntry(input: ResolveMiniAppEntryInput): ResolveMiniAppEntryResult {
  const { miniAppId, userRole, enabledFeatureFlags, currentMarket: _reservedMarket } = input;
  void _reservedMarket;

  if (!isMiniAppId(miniAppId)) {
    return { type: 'showError', messageKey: 'miniapps.error.unknownId' };
  }

  const def = getMiniAppDefinition(miniAppId);
  if (!def) {
    return { type: 'showError', messageKey: 'miniapps.error.unknownId' };
  }

  if (def.status === 'frozen') {
    return { type: 'showFrozen', miniAppId: def.id, reason: 'miniapps.frozen.default' };
  }

  if (def.status === 'comingSoon') {
    return { type: 'showComingSoon', miniAppId: def.id };
  }

  if (def.readiness === 'notReady') {
    return { type: 'showGate', miniAppId: def.id, reason: 'readiness' };
  }

  if (!roleAllows(def, userRole)) {
    return { type: 'showGate', miniAppId: def.id, reason: 'role' };
  }

  if (!passesFeatureFlagGate(def.id, def, enabledFeatureFlags)) {
    return { type: 'showGate', miniAppId: def.id, reason: 'featureFlag' };
  }

  void input.currentMarket;

  if (def.status === 'demo') {
    return { type: 'showDemoNotice', route: def.route, miniAppId: def.id };
  }

  return { type: 'navigate', route: def.route, miniAppId: def.id };
}
