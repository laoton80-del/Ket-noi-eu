import { createContext, useContext } from 'react';

export type Rec2ConnectivityTruth = true | false | null;

export type Rec2ConnectivityState = Readonly<{
  isConnected: Rec2ConnectivityTruth;
  isInternetReachable: Rec2ConnectivityTruth;
}>;

export type Rec2OfflineHomeRenderMode =
  | 'loading'
  | 'maintenance'
  | 'online-app'
  | 'local-offline-home'
  | 'offline-blocked';

export type Rec2OfflineHomeContentState = 'default' | 'loading' | 'offline' | 'gated';

export type Rec2OfflineHomePolicyInput = Readonly<{
  rec2HomeEnabled: boolean;
  connectivity: Rec2ConnectivityState;
  isHydrating: boolean;
  hasAuthenticatedUser: boolean;
  hasB2BWorkspaceAccess: boolean;
  isB2CMode: boolean;
  localeReady: boolean;
  fontAssetsReady: boolean;
  intentGateReady: boolean;
  opsReady: boolean;
  remoteOpsReady: boolean;
  operationalKillSwitch: boolean;
  operationalReadOnlyMode: boolean;
  disabledFeatures: readonly string[];
}>;

export type Rec2OfflineHomePolicy = Readonly<{
  renderMode: Rec2OfflineHomeRenderMode;
  localOnlyGuestHome: boolean;
  remoteInitializersAllowed: boolean;
  remoteNavigationAllowed: boolean;
  rootLinkingAllowed: boolean;
  contentState: Rec2OfflineHomeContentState;
  fontAssetsReady: boolean;
  connectivity: Rec2ConnectivityState;
  operationalReadOnlyMode: boolean;
  disabledFeatures: readonly string[];
}>;

export type Rec2OfflineHomeRuntimeBoundary = Rec2OfflineHomePolicy;

export const Rec2OfflineHomeBoundaryContext =
  createContext<Rec2OfflineHomeRuntimeBoundary | null>(null);

export function useRec2OfflineHomeBoundary(): Rec2OfflineHomeRuntimeBoundary {
  const value = useContext(Rec2OfflineHomeBoundaryContext);
  if (!value) {
    throw new Error('useRec2OfflineHomeBoundary must be used inside AppRoot');
  }
  return value;
}

export function canRunRec2RemoteInitializers(
  input: Pick<
    Rec2OfflineHomePolicyInput,
    | 'connectivity'
    | 'isHydrating'
    | 'remoteOpsReady'
    | 'operationalKillSwitch'
    | 'operationalReadOnlyMode'
  >
): boolean {
  return canResolveRec2RemoteOpsConfig(input) && input.remoteOpsReady;
}

export function canResolveRec2RemoteOpsConfig(
  input: Pick<
    Rec2OfflineHomePolicyInput,
    | 'connectivity'
    | 'isHydrating'
    | 'operationalKillSwitch'
    | 'operationalReadOnlyMode'
  >
): boolean {
  return (
    input.connectivity.isConnected === true &&
    input.connectivity.isInternetReachable === true &&
    !input.isHydrating &&
    !input.operationalKillSwitch &&
    !input.operationalReadOnlyMode
  );
}

export type Rec2OpsConfigSource = 'env_only' | 'remote_cached' | 'remote_fresh';

/** Only a genuinely fresh remote resolution establishes remote ops readiness. */
export function isRec2RemoteOpsResolutionReady(source: Rec2OpsConfigSource): boolean {
  return source === 'remote_fresh';
}

/**
 * Connectivity grants only remote readiness. It never grants identity,
 * permission, or operational authority, and an unknown value is not online.
 */
export function resolveRec2OfflineHomePolicy(
  input: Rec2OfflineHomePolicyInput
): Rec2OfflineHomePolicy {
  const remoteInitializersAllowed = canRunRec2RemoteInitializers(input);
  const remoteNetworkReady =
    input.connectivity.isConnected === true &&
    input.connectivity.isInternetReachable === true;
  const explicitlyOffline =
    input.connectivity.isConnected === false ||
    input.connectivity.isInternetReachable === false;
  const localCoreReadinessComplete =
    !input.isHydrating &&
    input.localeReady &&
    input.intentGateReady &&
    input.opsReady;
  const localGuestHomeEligible =
    input.rec2HomeEnabled &&
    !input.hasAuthenticatedUser &&
    !input.hasB2BWorkspaceAccess &&
    input.isB2CMode;

  let renderMode: Rec2OfflineHomeRenderMode;
  if (input.opsReady && input.operationalKillSwitch) {
    renderMode = 'maintenance';
  } else if (!localCoreReadinessComplete) {
    renderMode = 'loading';
  } else if (explicitlyOffline && localGuestHomeEligible) {
    // A disconnected RC2 guest may render with the platform font fallback.
    // The real font readiness value remains false and online/privileged paths
    // retain the ordinary font gate below.
    renderMode = 'local-offline-home';
  } else if (!input.fontAssetsReady) {
    renderMode = 'loading';
  } else if (
    remoteNetworkReady &&
    input.remoteOpsReady &&
    !input.operationalReadOnlyMode
  ) {
    renderMode = 'online-app';
  } else if (localGuestHomeEligible) {
    renderMode = 'local-offline-home';
  } else {
    renderMode = 'offline-blocked';
  }

  const localOnlyGuestHome = renderMode === 'local-offline-home';
  const onlineApp = renderMode === 'online-app';
  return {
    renderMode,
    localOnlyGuestHome,
    remoteInitializersAllowed,
    remoteNavigationAllowed: onlineApp,
    rootLinkingAllowed: onlineApp,
    contentState: localOnlyGuestHome
      ? explicitlyOffline
        ? 'offline'
        : input.operationalReadOnlyMode
          ? 'gated'
          : 'loading'
      : 'default',
    fontAssetsReady: input.fontAssetsReady,
    connectivity: { ...input.connectivity },
    operationalReadOnlyMode: input.operationalReadOnlyMode,
    // No AppRoot feature-name mapping exists. Preserve exact downstream truth
    // without substring, prefix, or semantic guessing.
    disabledFeatures: input.disabledFeatures.slice(),
  };
}

export type Rec2LocalAction =
  | 'language'
  | 'viona-panel'
  | 'sos-guidance'
  | 'account'
  | 'local'
  | 'travel'
  | 'academy'
  | 'business'
  | 'protected-route';

const OFFLINE_LOCAL_ACTIONS: ReadonlySet<Rec2LocalAction> = new Set([
  'language',
  'viona-panel',
  'sos-guidance',
]);

export function isRec2ActionAllowed(
  boundary: Rec2OfflineHomeRuntimeBoundary,
  action: Rec2LocalAction
): boolean {
  if (boundary.remoteNavigationAllowed) return true;
  return boundary.localOnlyGuestHome && OFFLINE_LOCAL_ACTIONS.has(action);
}

/** Claims a remote initializer at most once for this mounted app session. */
export function claimRec2RemoteInitializerOnce(
  started: Set<string>,
  key: string,
  allowed: boolean
): boolean {
  if (!allowed || started.has(key)) return false;
  started.add(key);
  return true;
}

export type Rec2OfflineSessionState = Readonly<{
  localOnlyObserved: boolean;
}>;

/**
 * Once a local-only session has rejected startup linking, reconnect does not
 * replay a previously supplied initial URL. A fresh app session may link again.
 */
export function advanceRec2OfflineSession(
  previous: Rec2OfflineSessionState,
  policy: Rec2OfflineHomePolicy
): Rec2OfflineSessionState {
  return {
    localOnlyObserved: previous.localOnlyObserved || policy.localOnlyGuestHome,
  };
}

export function resolveRec2SessionRootLinking(
  session: Rec2OfflineSessionState,
  policy: Rec2OfflineHomePolicy
): boolean {
  return policy.rootLinkingAllowed && !session.localOnlyObserved;
}

export const REC2_OPS_CONFIG_CACHE_KEY = 'kn_ops_remote_config_v1';

export type Rec2LocalOpsConfig = Readonly<{
  killSwitch: boolean;
  readOnlyMode: boolean;
  disabledFeatures: string[];
  source: 'env_only' | 'remote_cached';
  fetchedAt: null;
}>;

type Rec2LocalOpsConfigInput = Readonly<{
  envKillSwitch?: string;
  envReadOnlyMode?: string;
  envDisabledFeatures?: string;
  cached: unknown;
}>;

function envFlag(value: string | undefined): boolean {
  return value?.trim() === '1';
}

function envList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves only environment and already-cached safety policy. It performs no
 * network access and does not manufacture a fresh remote-config timestamp.
 */
export function resolveRec2LocalOpsConfig(
  input: Rec2LocalOpsConfigInput
): Rec2LocalOpsConfig {
  const base: Rec2LocalOpsConfig = {
    killSwitch: envFlag(input.envKillSwitch),
    readOnlyMode: envFlag(input.envReadOnlyMode),
    disabledFeatures: envList(input.envDisabledFeatures),
    source: 'env_only',
    fetchedAt: null,
  };
  if (!isRecord(input.cached)) return base;

  const hasRecognizedField =
    typeof input.cached.killSwitch === 'boolean' ||
    typeof input.cached.readOnlyMode === 'boolean' ||
    Array.isArray(input.cached.disabledFeatures);
  if (!hasRecognizedField) return base;

  return {
    killSwitch:
      typeof input.cached.killSwitch === 'boolean'
        ? input.cached.killSwitch
        : base.killSwitch,
    readOnlyMode:
      typeof input.cached.readOnlyMode === 'boolean'
        ? input.cached.readOnlyMode
        : base.readOnlyMode,
    disabledFeatures: Array.isArray(input.cached.disabledFeatures)
      ? input.cached.disabledFeatures.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0
        )
      : base.disabledFeatures,
    source: 'remote_cached',
    fetchedAt: null,
  };
}
