import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  advanceRec2OfflineSession,
  canRunRec2RemoteInitializers,
  canResolveRec2RemoteOpsConfig,
  claimRec2RemoteInitializerOnce,
  isRec2RemoteOpsResolutionReady,
  isRec2ActionAllowed,
  resolveRec2LocalOpsConfig,
  resolveRec2OfflineHomePolicy,
  resolveRec2SessionRootLinking,
  type Rec2LocalAction,
  type Rec2OfflineHomePolicy,
} from '../src/app/bootstrap/rec2OfflineHomePolicy';
import { resolveHomeRendererSelection } from '../src/navigation/homePresentationTarget';

let passed = 0;

function check(name: string, condition: boolean): void {
  assert.equal(condition, true, name);
  passed += 1;
}

const readyGuest = {
  rec2HomeEnabled: true,
  connectivity: {
    isConnected: false as const,
    isInternetReachable: false as const,
  },
  isHydrating: false,
  hasAuthenticatedUser: false,
  hasB2BWorkspaceAccess: false,
  isB2CMode: true,
  localeReady: true,
  fontAssetsReady: true,
  intentGateReady: true,
  opsReady: true,
  remoteOpsReady: false,
  operationalKillSwitch: false,
  operationalReadOnlyMode: false,
  disabledFeatures: [] as readonly string[],
};

const localOffline = resolveRec2OfflineHomePolicy(readyGuest);
check(
  'RC2 guest with completed local readiness mounts the local-only Home while offline',
  localOffline.renderMode === 'local-offline-home' &&
    localOffline.localOnlyGuestHome &&
    localOffline.contentState === 'offline'
);
check(
  'offline truth never grants remote initializers or protected navigation',
  !localOffline.remoteInitializersAllowed &&
    !localOffline.remoteNavigationAllowed &&
    !localOffline.rootLinkingAllowed
);

const offlineFontFallback = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  fontAssetsReady: false,
});
check(
  'an actually offline RC2 guest uses local font fallback without forging font readiness',
  offlineFontFallback.renderMode === 'local-offline-home' &&
    offlineFontFallback.contentState === 'offline' &&
    !offlineFontFallback.fontAssetsReady &&
    !offlineFontFallback.remoteInitializersAllowed
);

const onlineFontPending = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  connectivity: { isConnected: true, isInternetReachable: true },
  remoteOpsReady: true,
  fontAssetsReady: false,
});
check(
  'the ordinary online app retains the font readiness gate',
  onlineFontPending.renderMode === 'loading' &&
    !onlineFontPending.localOnlyGuestHome &&
    !onlineFontPending.fontAssetsReady
);

const authenticatedFontPending = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  hasAuthenticatedUser: true,
  fontAssetsReady: false,
});
check(
  'font fallback does not widen the exception to an authenticated offline session',
  authenticatedFontPending.renderMode === 'loading' &&
    !authenticatedFontPending.localOnlyGuestHome
);

const hydrating = resolveRec2OfflineHomePolicy({ ...readyGuest, isHydrating: true });
check(
  'auth hydration must complete before local Home can render',
  hydrating.renderMode === 'loading' && !hydrating.localOnlyGuestHome
);

const securityBlocked = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  operationalKillSwitch: true,
});
check(
  'operational kill switch wins over the offline guest exception',
  securityBlocked.renderMode === 'maintenance' &&
    !securityBlocked.localOnlyGuestHome &&
    !securityBlocked.remoteInitializersAllowed
);

const flagOff = resolveRec2OfflineHomePolicy({ ...readyGuest, rec2HomeEnabled: false });
check(
  'feature flag OFF preserves the legacy offline block instead of mounting RC2',
  flagOff.renderMode === 'offline-blocked' && resolveHomeRendererSelection(false) === 'reconstruction'
);

const authenticated = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  hasAuthenticatedUser: true,
});
const b2b = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  hasB2BWorkspaceAccess: true,
});
const b2bMode = resolveRec2OfflineHomePolicy({ ...readyGuest, isB2CMode: false });
check(
  'authenticated, B2B-authorized, and non-B2C states receive no guest exception',
  [authenticated, b2b, b2bMode].every(
    (policy) => policy.renderMode === 'offline-blocked' && !policy.localOnlyGuestHome
  )
);

const transportWithoutInternet = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  connectivity: { isConnected: true, isInternetReachable: false },
});
check(
  'connected transport without Internet reachability stays local and denies remote authority',
  transportWithoutInternet.renderMode === 'local-offline-home' &&
    transportWithoutInternet.contentState === 'offline' &&
    !transportWithoutInternet.remoteInitializersAllowed &&
    !transportWithoutInternet.remoteNavigationAllowed
);

const unknownInternetReachability = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  connectivity: { isConnected: true, isInternetReachable: null },
});
check(
  'unknown Internet reachability stays a truthful local loading surface and denies remote authority',
  unknownInternetReachability.renderMode === 'local-offline-home' &&
    unknownInternetReachability.contentState === 'loading' &&
    !unknownInternetReachability.remoteInitializersAllowed &&
    !unknownInternetReachability.remoteNavigationAllowed
);

const unknownConnectedPolicies = ([true, false, null] as const).map(
  (isInternetReachable) =>
    resolveRec2OfflineHomePolicy({
      ...readyGuest,
      connectivity: { isConnected: null, isInternetReachable },
    })
);
check(
  'unknown connected state never grants remote authority regardless of reachability truth',
  unknownConnectedPolicies.every(
    (policy) =>
      policy.localOnlyGuestHome &&
      policy.connectivity.isConnected === null &&
      !policy.remoteInitializersAllowed &&
      !policy.remoteNavigationAllowed &&
      !policy.rootLinkingAllowed
  )
);

const onlinePendingRemoteReadiness = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  connectivity: { isConnected: true, isInternetReachable: true },
});
check(
  'online transport alone keeps the guest on the local loading surface until remote security readiness',
  onlinePendingRemoteReadiness.renderMode === 'local-offline-home' &&
    onlinePendingRemoteReadiness.contentState === 'loading' &&
    !onlinePendingRemoteReadiness.remoteInitializersAllowed
);

const online = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  connectivity: { isConnected: true, isInternetReachable: true },
  remoteOpsReady: true,
});
check(
  'verified online truth restores the ordinary app path after security readiness',
  online.renderMode === 'online-app' &&
    online.remoteInitializersAllowed &&
    online.remoteNavigationAllowed
);

const safeLocalActions: readonly Rec2LocalAction[] = [
  'language',
  'viona-panel',
  'sos-guidance',
];
const remoteActions: readonly Rec2LocalAction[] = [
  'account',
  'local',
  'travel',
  'academy',
  'business',
  'protected-route',
];

check(
  'cache and environment config never establish remote ops readiness',
  !isRec2RemoteOpsResolutionReady('env_only') &&
    !isRec2RemoteOpsResolutionReady('remote_cached')
);
check(
  'only genuine fresh remote resolution establishes remote ops readiness',
  isRec2RemoteOpsResolutionReady('remote_fresh')
);

const readOnlyOnline = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  connectivity: { isConnected: true, isInternetReachable: true },
  remoteOpsReady: true,
  operationalReadOnlyMode: true,
});
check(
  'read-only mode keeps eligible local-safe Home visible while denying every R1 remote action',
  readOnlyOnline.renderMode === 'local-offline-home' &&
    readOnlyOnline.localOnlyGuestHome &&
    readOnlyOnline.contentState === 'gated' &&
    !readOnlyOnline.remoteInitializersAllowed &&
    !readOnlyOnline.remoteNavigationAllowed &&
    !readOnlyOnline.rootLinkingAllowed &&
    safeLocalActions.every((action) => isRec2ActionAllowed(readOnlyOnline, action)) &&
    remoteActions.every((action) => !isRec2ActionAllowed(readOnlyOnline, action))
);

const unmappedDisabledFeature = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  connectivity: { isConnected: true, isInternetReachable: true },
  remoteOpsReady: true,
  disabledFeatures: ['ai_proxy'],
});
check(
  'unmapped disabled-feature truth is preserved without a guessed global AppRoot mapping',
  unmappedDisabledFeature.renderMode === online.renderMode &&
    unmappedDisabledFeature.remoteInitializersAllowed === online.remoteInitializersAllowed &&
    JSON.stringify(unmappedDisabledFeature.disabledFeatures) === JSON.stringify(['ai_proxy'])
);
check(
  'read-only and kill-switch denials cannot be bypassed by otherwise valid remote readiness',
  !canRunRec2RemoteInitializers({
    connectivity: { isConnected: true, isInternetReachable: true },
    isHydrating: false,
    remoteOpsReady: true,
    operationalKillSwitch: false,
    operationalReadOnlyMode: true,
  }) &&
    !canRunRec2RemoteInitializers({
      connectivity: { isConnected: true, isInternetReachable: true },
      isHydrating: false,
      remoteOpsReady: true,
      operationalKillSwitch: true,
      operationalReadOnlyMode: false,
    })
);
check(
  'local read-only or kill-switch config prevents even the remote ops-config initializer',
  !canResolveRec2RemoteOpsConfig({
    connectivity: { isConnected: true, isInternetReachable: true },
    isHydrating: false,
    operationalKillSwitch: false,
    operationalReadOnlyMode: true,
  }) &&
    !canResolveRec2RemoteOpsConfig({
      connectivity: { isConnected: true, isInternetReachable: true },
      isHydrating: false,
      operationalKillSwitch: true,
      operationalReadOnlyMode: false,
    })
);

const initializerClaims = new Set<string>();
let remoteInitializerInvocations = 0;
for (const policy of [localOffline, online, localOffline, online]) {
  if (
    claimRec2RemoteInitializerOnce(
      initializerClaims,
      'example-remote-initializer',
      policy.remoteInitializersAllowed
    )
  ) {
    remoteInitializerInvocations += 1;
  }
}
check(
  'offline startup invokes no remote initializer and reconnect does not replay it',
  remoteInitializerInvocations === 1 && initializerClaims.size === 1
);

let offlineSession = { localOnlyObserved: false };
offlineSession = advanceRec2OfflineSession(offlineSession, localOffline);
offlineSession = advanceRec2OfflineSession(offlineSession, online);
check(
  'a protected initial link rejected offline is not replayed after reconnect',
  offlineSession.localOnlyObserved && !resolveRec2SessionRootLinking(offlineSession, online)
);

check(
  'language, Viona panel, and SOS guidance remain locally available',
  safeLocalActions.every((action) => isRec2ActionAllowed(localOffline, action))
);
check(
  'every route with remote or protected effects is denied before its callback',
  remoteActions.every((action) => !isRec2ActionAllowed(localOffline, action))
);

let protectedRouteInvocations = 0;
const invokeIfAllowed = (
  policy: Rec2OfflineHomePolicy,
  action: Rec2LocalAction,
  effect: () => void
) => {
  if (!isRec2ActionAllowed(policy, action)) return 'blocked' as const;
  effect();
  return 'invoked' as const;
};
const protectedResult = invokeIfAllowed(localOffline, 'protected-route', () => {
  protectedRouteInvocations += 1;
});
check(
  'protected navigation is blocked before any effect is invoked',
  protectedResult === 'blocked' && protectedRouteInvocations === 0
);

let localGuidanceInvocations = 0;
const guidanceResult = invokeIfAllowed(localOffline, 'sos-guidance', () => {
  localGuidanceInvocations += 1;
});
check(
  'safe local guidance callback remains operational without claiming a real-world SOS action',
  guidanceResult === 'invoked' && localGuidanceInvocations === 1
);

const cachedSecurityPolicy = resolveRec2LocalOpsConfig({
  envKillSwitch: '0',
  envReadOnlyMode: '0',
  envDisabledFeatures: '',
  cached: {
    killSwitch: true,
    readOnlyMode: true,
    disabledFeatures: ['payments', 123, ''],
  },
});
check(
  'offline bootstrap honors cached security policy without inventing fresh remote truth',
  cachedSecurityPolicy.killSwitch &&
    cachedSecurityPolicy.readOnlyMode &&
    cachedSecurityPolicy.source === 'remote_cached' &&
    cachedSecurityPolicy.fetchedAt === null &&
    JSON.stringify(cachedSecurityPolicy.disabledFeatures) === JSON.stringify(['payments'])
);

const envSecurityPolicy = resolveRec2LocalOpsConfig({
  envKillSwitch: '1',
  envReadOnlyMode: '1',
  envDisabledFeatures: 'payments, provider ',
  cached: { unrelated: true },
});
check(
  'malformed cached policy cannot override environment safety controls',
  envSecurityPolicy.killSwitch &&
    envSecurityPolicy.readOnlyMode &&
    envSecurityPolicy.source === 'env_only' &&
    JSON.stringify(envSecurityPolicy.disabledFeatures) === JSON.stringify(['payments', 'provider'])
);

const appSource = readFileSync('App.tsx', 'utf8');
const startupSource = readFileSync(
  'src/app/bootstrap/useAppStartupOrchestration.ts',
  'utf8'
);
const mainTabSource = readFileSync('src/navigation/MainTabNavigator.tsx', 'utf8');
check(
  'connectivity never participates in the navigator identity key',
  appSource.includes("key={`root-${user?.phone ?? 'guest'}`}") &&
    !appSource.includes('key={`root-${connectivity')
);
check(
  'AppRoot no longer initializes monitoring or analytics at module load',
  !/^initMonitoringRadar\(\);/m.test(appSource) &&
    appSource.includes("'monitoring-radar'") &&
    appSource.includes("'product-analytics'")
);
check(
  'startup orchestration has a local cached-ops branch and an online-only remote-config claim',
  startupSource.includes('readLocalOpsConfig') &&
    startupSource.includes("'ops-config-remote'") &&
    startupSource.includes('canResolveRec2RemoteOpsConfig') &&
    startupSource.includes('isRec2RemoteOpsResolutionReady(cfg.source)') &&
    !startupSource.includes('setRemoteOpsReady(true)')
);
check(
  'pending protected redirects are discarded in local-only mode before reconnect',
  mainTabSource.includes('if (pendingRedirect) setPendingRedirect(null);') &&
    mainTabSource.includes('if (!offlineBoundary.remoteNavigationAllowed) return;')
);

console.log(`[test-viona-rec2-offline-home-boundary] ${passed} passed, 0 failed`);
