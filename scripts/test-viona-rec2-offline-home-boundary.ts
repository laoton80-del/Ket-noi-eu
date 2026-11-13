import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
  REC2_PENDING_NATIVE_LINK_BUFFER_MAX_SIZE,
  advanceRec2OfflineSession,
  advanceRec2RootLinkingLifecycle,
  canRunRec2RemoteInitializers,
  canResolveRec2RemoteOpsConfig,
  claimRec2RemoteInitializerOnce,
  enqueueRec2PendingNativeLink,
  isRec2RemoteOpsResolutionReady,
  isRec2ActionAllowed,
  resolveRec2LocalOpsConfig,
  resolveRec2OfflineHomePolicy,
  resolveRec2SessionRootLinking,
  settleRec2PendingNativeLinks,
  type Rec2LocalAction,
  type Rec2OfflineHomePolicy,
  type Rec2OfflineSessionState,
  type Rec2RootLinkingLifecycleState,
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

const initialUnknownConnectivity = resolveRec2OfflineHomePolicy({
  ...readyGuest,
  connectivity: { isConnected: null, isInternetReachable: null },
});
check(
  'AppRoot initial unknown connectivity stays local without granting remote or linking authority',
  initialUnknownConnectivity.renderMode === 'local-offline-home' &&
    initialUnknownConnectivity.localOnlyGuestHome &&
    initialUnknownConnectivity.contentState === 'loading' &&
    !initialUnknownConnectivity.remoteNavigationAllowed &&
    !initialUnknownConnectivity.rootLinkingAllowed
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

const pendingStartupSession = (): Rec2OfflineSessionState => ({
  startupLinkingOutcome: 'pending',
});
const navigationWillMountForPolicy = (policy: Rec2OfflineHomePolicy): boolean =>
  policy.renderMode === 'online-app' || policy.renderMode === 'local-offline-home';
const advanceSession = (
  previous: Rec2OfflineSessionState,
  policy: Rec2OfflineHomePolicy,
  navigationWillMount = navigationWillMountForPolicy(policy)
): Rec2OfflineSessionState =>
  advanceRec2OfflineSession(previous, policy, { navigationWillMount });
const withSessionRootLinking = (
  session: Rec2OfflineSessionState,
  policy: Rec2OfflineHomePolicy
): Rec2OfflineHomePolicy => ({
  ...policy,
  rootLinkingAllowed: resolveRec2SessionRootLinking(session, policy),
});
type CommittedStartupLinkingState = Readonly<{
  session: Rec2OfflineSessionState;
  lifecycle: Rec2RootLinkingLifecycleState;
}>;
const projectStartupLinkingCandidate = (
  committed: CommittedStartupLinkingState,
  policy: Rec2OfflineHomePolicy,
  navigationWillMount = navigationWillMountForPolicy(policy)
) => {
  const session = advanceSession(committed.session, policy, navigationWillMount);
  const boundary = withSessionRootLinking(session, policy);
  const lifecycle = advanceRec2RootLinkingLifecycle(
    committed.lifecycle,
    session,
    boundary,
    navigationWillMount
  );
  return { session, boundary, lifecycle };
};

const initialCommittedStartup: CommittedStartupLinkingState = {
  session: pendingStartupSession(),
  lifecycle: INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
};
const abortedOfflineCandidate = projectStartupLinkingCandidate(
  initialCommittedStartup,
  localOffline,
  true
);
const onlineAfterAbortedOffline = projectStartupLinkingCandidate(
  initialCommittedStartup,
  online,
  true
);
check(
  'aborting an offline shell candidate cannot contaminate the next online startup projection',
  abortedOfflineCandidate.session.startupLinkingOutcome === 'rejected-offline' &&
    initialCommittedStartup.session.startupLinkingOutcome === 'pending' &&
    onlineAfterAbortedOffline.session.startupLinkingOutcome === 'authorized-online' &&
    onlineAfterAbortedOffline.boundary.rootLinkingAllowed &&
    onlineAfterAbortedOffline.lifecycle.initializationGeneration === 0
);

const committedOfflineStartup: CommittedStartupLinkingState = {
  session: abortedOfflineCandidate.session,
  lifecycle: abortedOfflineCandidate.lifecycle,
};
const onlineAfterCommittedOffline = projectStartupLinkingCandidate(
  committedOfflineStartup,
  online,
  true
);
check(
  'committed offline shell rejection remains terminal while reconnect restores live linking',
  committedOfflineStartup.session.startupLinkingOutcome === 'rejected-offline' &&
    onlineAfterCommittedOffline.session.startupLinkingOutcome === 'rejected-offline' &&
    onlineAfterCommittedOffline.boundary.rootLinkingAllowed &&
    onlineAfterCommittedOffline.lifecycle.initializationGeneration === 0
);

const remoteOpsPendingCandidate = projectStartupLinkingCandidate(
  initialCommittedStartup,
  onlinePendingRemoteReadiness,
  true
);
const committedRemoteOpsPending: CommittedStartupLinkingState = {
  session: remoteOpsPendingCandidate.session,
  lifecycle: remoteOpsPendingCandidate.lifecycle,
};
const abortedAuthorizedRemount = projectStartupLinkingCandidate(
  committedRemoteOpsPending,
  online,
  true
);
const retriedAuthorizedRemount = projectStartupLinkingCandidate(
  committedRemoteOpsPending,
  online,
  true
);
check(
  'aborted authorized remount leaves the committed generation unchanged and retries the same increment',
  committedRemoteOpsPending.session.startupLinkingOutcome === 'pending' &&
    committedRemoteOpsPending.lifecycle.pendingStartupLinkingInitialization &&
    committedRemoteOpsPending.lifecycle.initializationGeneration === 0 &&
    abortedAuthorizedRemount.session.startupLinkingOutcome === 'authorized-online' &&
    abortedAuthorizedRemount.lifecycle.initializationGeneration === 1 &&
    retriedAuthorizedRemount.lifecycle.initializationGeneration === 1
);

const committedAuthorizedRemount: CommittedStartupLinkingState = {
  session: abortedAuthorizedRemount.session,
  lifecycle: abortedAuthorizedRemount.lifecycle,
};
const stableAuthorizedRender = projectStartupLinkingCandidate(
  committedAuthorizedRemount,
  online,
  true
);
check(
  'committed authorized remount stays at one generation on subsequent renders',
  committedAuthorizedRemount.lifecycle.initializationGeneration === 1 &&
    stableAuthorizedRender.session.startupLinkingOutcome === 'authorized-online' &&
    stableAuthorizedRender.lifecycle.initializationGeneration === 1
);

const preMountOfflineCandidate = projectStartupLinkingCandidate(
  initialCommittedStartup,
  hydrating,
  false
);
const committedPreMountOffline: CommittedStartupLinkingState = {
  session: preMountOfflineCandidate.session,
  lifecycle: preMountOfflineCandidate.lifecycle,
};
const onlineAfterCommittedAppStateView = projectStartupLinkingCandidate(
  committedPreMountOffline,
  online,
  true
);
check(
  'committed pre-mount offline AppStateView preserves normal online first-mount linking',
  committedPreMountOffline.session.startupLinkingOutcome === 'pending' &&
    !committedPreMountOffline.lifecycle.navigationMounted &&
    onlineAfterCommittedAppStateView.session.startupLinkingOutcome === 'authorized-online' &&
    onlineAfterCommittedAppStateView.boundary.rootLinkingAllowed &&
    onlineAfterCommittedAppStateView.lifecycle.initializationGeneration === 0
);

const committedOnlineStartup: CommittedStartupLinkingState = {
  session: onlineAfterAbortedOffline.session,
  lifecycle: onlineAfterAbortedOffline.lifecycle,
};
const committedOnlineOutageCandidate = projectStartupLinkingCandidate(
  committedOnlineStartup,
  localOffline,
  true
);
const committedOnlineOutage: CommittedStartupLinkingState = {
  session: committedOnlineOutageCandidate.session,
  lifecycle: committedOnlineOutageCandidate.lifecycle,
};
const committedOnlineReconnect = projectStartupLinkingCandidate(
  committedOnlineOutage,
  online,
  true
);
check(
  'committed post-start outage and reconnect preserve authorization without generation growth',
  committedOnlineOutageCandidate.session.startupLinkingOutcome === 'authorized-online' &&
    !committedOnlineOutageCandidate.boundary.rootLinkingAllowed &&
    committedOnlineReconnect.session.startupLinkingOutcome === 'authorized-online' &&
    committedOnlineReconnect.boundary.rootLinkingAllowed &&
    committedOnlineReconnect.lifecycle.initializationGeneration === 0
);

type NativeLinkQueueOwner =
  | 'idle'
  | 'pending-buffer'
  | 'react-navigation'
  | 'rejected-offline';
type NativeLinkQueueHarness = {
  pendingLinks: readonly string[];
  deliveredLinks: string[];
  owner: NativeLinkQueueOwner;
  listenerActive: boolean;
};
const createNativeLinkQueueHarness = (native = true): NativeLinkQueueHarness => ({
  pendingLinks: [],
  deliveredLinks: [],
  owner: native ? 'pending-buffer' : 'idle',
  listenerActive: native,
});
const emitNativeLink = (harness: NativeLinkQueueHarness, url: string): void => {
  if (!harness.listenerActive) return;
  if (harness.owner === 'pending-buffer') {
    harness.pendingLinks = enqueueRec2PendingNativeLink(harness.pendingLinks, url);
  } else if (harness.owner === 'react-navigation') {
    harness.deliveredLinks.push(url);
  }
};
const commitNativeLinkOutcome = (
  harness: NativeLinkQueueHarness,
  outcome: Rec2OfflineSessionState['startupLinkingOutcome']
): void => {
  const settlement = settleRec2PendingNativeLinks(harness.pendingLinks, outcome);
  harness.pendingLinks = settlement.pendingLinks;
  if (outcome === 'authorized-online') {
    harness.owner = 'react-navigation';
    harness.listenerActive = true;
    harness.deliveredLinks.push(...settlement.linksToDeliver);
  } else if (outcome === 'rejected-offline') {
    harness.owner = 'rejected-offline';
    harness.listenerActive = false;
  }
};
const disableNativeLiveLinking = (harness: NativeLinkQueueHarness): void => {
  harness.owner = 'idle';
  harness.listenerActive = false;
};
const enableNativeLiveLinking = (harness: NativeLinkQueueHarness): void => {
  harness.owner = 'react-navigation';
  harness.listenerActive = true;
};

const pendingSingleEvent = createNativeLinkQueueHarness();
emitNativeLink(pendingSingleEvent, 'ketnoieu://travel/pending-one');
check(
  'pending native runtime URL waits without navigation and drains once after authorized commit',
  pendingSingleEvent.pendingLinks.length === 1 &&
    pendingSingleEvent.deliveredLinks.length === 0
);
commitNativeLinkOutcome(pendingSingleEvent, 'authorized-online');
check(
  'authorized commit delivers one pending native runtime URL exactly once and empties the queue',
  JSON.stringify(pendingSingleEvent.deliveredLinks) ===
    JSON.stringify(['ketnoieu://travel/pending-one']) &&
    pendingSingleEvent.pendingLinks.length === 0
);

const pendingMultipleEvents = createNativeLinkQueueHarness();
const orderedPendingLinks = [
  'ketnoieu://home',
  'ketnoieu://local',
  'ketnoieu://travel',
];
for (const url of orderedPendingLinks) emitNativeLink(pendingMultipleEvents, url);
commitNativeLinkOutcome(pendingMultipleEvents, 'authorized-online');
check(
  'multiple pending native runtime URLs drain exactly once in deterministic arrival order',
  JSON.stringify(pendingMultipleEvents.deliveredLinks) === JSON.stringify(orderedPendingLinks) &&
    pendingMultipleEvents.pendingLinks.length === 0
);

const boundedPendingEvents = createNativeLinkQueueHarness();
const overflowLinks = Array.from(
  { length: REC2_PENDING_NATIVE_LINK_BUFFER_MAX_SIZE + 3 },
  (_, index) => `ketnoieu://pending/${index + 1}`
);
for (const url of overflowLinks) emitNativeLink(boundedPendingEvents, url);
check(
  'pending native runtime URL buffer is bounded and deterministically drops the oldest entry',
  boundedPendingEvents.pendingLinks.length === REC2_PENDING_NATIVE_LINK_BUFFER_MAX_SIZE &&
    JSON.stringify(boundedPendingEvents.pendingLinks) ===
      JSON.stringify(overflowLinks.slice(-REC2_PENDING_NATIVE_LINK_BUFFER_MAX_SIZE))
);

const rejectedPendingEvent = createNativeLinkQueueHarness();
emitNativeLink(rejectedPendingEvent, 'ketnoieu://account/rejected-pending');
commitNativeLinkOutcome(rejectedPendingEvent, 'rejected-offline');
check(
  'committed rejected-offline startup clears pending runtime URLs without navigation',
  rejectedPendingEvent.pendingLinks.length === 0 &&
    rejectedPendingEvent.deliveredLinks.length === 0 &&
    rejectedPendingEvent.owner === 'rejected-offline' &&
    !rejectedPendingEvent.listenerActive
);

const abortedAuthorizationEvent = createNativeLinkQueueHarness();
emitNativeLink(abortedAuthorizationEvent, 'ketnoieu://academy/after-abort');
const projectedAuthorizationWithoutCommit = 'authorized-online';
check(
  'projecting authorization without commit neither drains nor delivers the pending native queue',
  projectedAuthorizationWithoutCommit === 'authorized-online' &&
    abortedAuthorizationEvent.owner === 'pending-buffer' &&
    abortedAuthorizationEvent.pendingLinks.length === 1 &&
    abortedAuthorizationEvent.deliveredLinks.length === 0
);
commitNativeLinkOutcome(abortedAuthorizationEvent, 'authorized-online');
check(
  'the next committed authorization drains the retained event exactly once after an aborted candidate',
  JSON.stringify(abortedAuthorizationEvent.deliveredLinks) ===
    JSON.stringify(['ketnoieu://academy/after-abort']) &&
    abortedAuthorizationEvent.pendingLinks.length === 0
);

const ordinaryAuthorizedEvent = createNativeLinkQueueHarness();
commitNativeLinkOutcome(ordinaryAuthorizedEvent, 'authorized-online');
emitNativeLink(ordinaryAuthorizedEvent, 'ketnoieu://local/live');
check(
  'authorized native runtime URLs use the canonical live listener exactly once instead of the startup queue',
  JSON.stringify(ordinaryAuthorizedEvent.deliveredLinks) ===
    JSON.stringify(['ketnoieu://local/live']) &&
    ordinaryAuthorizedEvent.pendingLinks.length === 0
);

const postStartOutageEvent = createNativeLinkQueueHarness();
commitNativeLinkOutcome(postStartOutageEvent, 'authorized-online');
disableNativeLiveLinking(postStartOutageEvent);
emitNativeLink(postStartOutageEvent, 'ketnoieu://travel/during-outage');
enableNativeLiveLinking(postStartOutageEvent);
emitNativeLink(postStartOutageEvent, 'ketnoieu://travel/after-reconnect');
check(
  'post-start outage never reactivates the startup queue and reconnect restores only new live events',
  postStartOutageEvent.pendingLinks.length === 0 &&
    JSON.stringify(postStartOutageEvent.deliveredLinks) ===
      JSON.stringify(['ketnoieu://travel/after-reconnect'])
);

enableNativeLiveLinking(rejectedPendingEvent);
emitNativeLink(rejectedPendingEvent, 'ketnoieu://home/new-after-reconnect');
check(
  'rejected-start reconnect restores new live URLs without replaying the cleared pending event',
  JSON.stringify(rejectedPendingEvent.deliveredLinks) ===
    JSON.stringify(['ketnoieu://home/new-after-reconnect']) &&
    rejectedPendingEvent.pendingLinks.length === 0
);

const webPendingEvent = createNativeLinkQueueHarness(false);
emitNativeLink(webPendingEvent, 'https://ketnoieu.example/travel');
check(
  'web startup does not instantiate or populate the native pending-link buffer',
  webPendingEvent.owner === 'idle' &&
    !webPendingEvent.listenerActive &&
    webPendingEvent.pendingLinks.length === 0
);

const cleanedUpPendingListener = createNativeLinkQueueHarness();
cleanedUpPendingListener.pendingLinks = [];
disableNativeLiveLinking(cleanedUpPendingListener);
emitNativeLink(cleanedUpPendingListener, 'ketnoieu://home/after-cleanup');
check(
  'terminal listener cleanup relinquishes pending ownership and prevents duplicate delivery',
  cleanedUpPendingListener.owner === 'idle' &&
    !cleanedUpPendingListener.listenerActive &&
    cleanedUpPendingListener.deliveredLinks.length === 0
);

let ordinaryOnlineSession = advanceSession(pendingStartupSession(), online);
let ordinaryOnlineLifecycle = advanceRec2RootLinkingLifecycle(
  INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
  ordinaryOnlineSession,
  withSessionRootLinking(ordinaryOnlineSession, online),
  true
);
check(
  'online first mount authorizes normal linking without a remount generation',
  ordinaryOnlineSession.startupLinkingOutcome === 'authorized-online' &&
    ordinaryOnlineLifecycle.navigationMounted &&
    ordinaryOnlineLifecycle.linkingInitializationComplete &&
    !ordinaryOnlineLifecycle.pendingStartupLinkingInitialization &&
    ordinaryOnlineLifecycle.initializationGeneration === 0
);

const unknownWithoutMountSession = advanceSession(
  pendingStartupSession(),
  initialUnknownConnectivity,
  false
);
const unknownWithoutMountLifecycle = advanceRec2RootLinkingLifecycle(
  INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
  unknownWithoutMountSession,
  withSessionRootLinking(unknownWithoutMountSession, initialUnknownConnectivity),
  false
);
check(
  'unknown connectivity without a navigation mount manufactures no terminal startup decision',
  unknownWithoutMountSession.startupLinkingOutcome === 'pending' &&
    unknownWithoutMountLifecycle === INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE
);

let unknownMountedSession = advanceSession(
  pendingStartupSession(),
  initialUnknownConnectivity,
  true
);
let unknownMountedLifecycle = advanceRec2RootLinkingLifecycle(
  INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
  unknownMountedSession,
  withSessionRootLinking(unknownMountedSession, initialUnknownConnectivity),
  true
);
check(
  'unknown-connectivity first mount records pending startup linking initialization',
  unknownMountedSession.startupLinkingOutcome === 'pending' &&
    unknownMountedLifecycle.navigationMounted &&
    unknownMountedLifecycle.pendingStartupLinkingObserved &&
    unknownMountedLifecycle.pendingStartupLinkingInitialization &&
    unknownMountedLifecycle.initializationGeneration === 0
);
unknownMountedSession = advanceSession(unknownMountedSession, online, true);
unknownMountedLifecycle = advanceRec2RootLinkingLifecycle(
  unknownMountedLifecycle,
  unknownMountedSession,
  withSessionRootLinking(unknownMountedSession, online),
  true
);
check(
  'unknown-connectivity mounted startup remounts exactly once when online authority arrives',
  unknownMountedSession.startupLinkingOutcome === 'authorized-online' &&
    unknownMountedLifecycle.linkingInitializationComplete &&
    !unknownMountedLifecycle.pendingStartupLinkingInitialization &&
    unknownMountedLifecycle.initializationGeneration === 1
);
const completedUnknownLifecycle = unknownMountedLifecycle;
unknownMountedLifecycle = advanceRec2RootLinkingLifecycle(
  unknownMountedLifecycle,
  unknownMountedSession,
  withSessionRootLinking(unknownMountedSession, online),
  true
);
check(
  'authorized unknown-connectivity recovery cannot request a duplicate startup remount',
  unknownMountedLifecycle === completedUnknownLifecycle &&
    unknownMountedLifecycle.initializationGeneration === 1
);

let partialUnknownSession = advanceSession(
  pendingStartupSession(),
  unknownInternetReachability,
  true
);
check(
  'connected transport with unknown Internet reachability keeps startup pending',
  partialUnknownSession.startupLinkingOutcome === 'pending'
);
partialUnknownSession = advanceSession(partialUnknownSession, online, true);
check(
  'fully ready online truth authorizes linking after partial connectivity was unknown',
  partialUnknownSession.startupLinkingOutcome === 'authorized-online' &&
    resolveRec2SessionRootLinking(partialUnknownSession, online)
);

let remoteOpsPendingSession = advanceSession(
  pendingStartupSession(),
  onlinePendingRemoteReadiness,
  true
);
let remoteOpsPendingLifecycle = advanceRec2RootLinkingLifecycle(
  INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
  remoteOpsPendingSession,
  withSessionRootLinking(remoteOpsPendingSession, onlinePendingRemoteReadiness),
  true
);
check(
  'fully connected remote-ops-pending first mount records pending startup linking',
  remoteOpsPendingSession.startupLinkingOutcome === 'pending' &&
    remoteOpsPendingLifecycle.pendingStartupLinkingObserved &&
    remoteOpsPendingLifecycle.pendingStartupLinkingInitialization &&
    remoteOpsPendingLifecycle.initializationGeneration === 0
);
remoteOpsPendingSession = advanceSession(remoteOpsPendingSession, online, true);
remoteOpsPendingLifecycle = advanceRec2RootLinkingLifecycle(
  remoteOpsPendingLifecycle,
  remoteOpsPendingSession,
  withSessionRootLinking(remoteOpsPendingSession, online),
  true
);
check(
  'remote-ops readiness remounts the mounted pending startup exactly once',
  remoteOpsPendingSession.startupLinkingOutcome === 'authorized-online' &&
    remoteOpsPendingLifecycle.linkingInitializationComplete &&
    !remoteOpsPendingLifecycle.pendingStartupLinkingInitialization &&
    remoteOpsPendingLifecycle.initializationGeneration === 1
);

let preMountOfflineSession = advanceSession(pendingStartupSession(), hydrating, false);
let preMountOfflineLifecycle = advanceRec2RootLinkingLifecycle(
  INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
  preMountOfflineSession,
  withSessionRootLinking(preMountOfflineSession, hydrating),
  false
);
check(
  'explicit offline truth before any navigation mount does not reject an unevaluated initial URL',
  hydrating.renderMode === 'loading' &&
    preMountOfflineSession.startupLinkingOutcome === 'pending' &&
    !preMountOfflineLifecycle.navigationMounted &&
    !preMountOfflineLifecycle.pendingStartupLinkingObserved
);
check(
  'loading, offline-blocked, and maintenance states cannot reject before navigation mounts',
  [hydrating, authenticated, securityBlocked].every(
    (policy) =>
      advanceSession(pendingStartupSession(), policy, false).startupLinkingOutcome === 'pending'
  )
);
preMountOfflineSession = advanceSession(preMountOfflineSession, online, true);
preMountOfflineLifecycle = advanceRec2RootLinkingLifecycle(
  preMountOfflineLifecycle,
  preMountOfflineSession,
  withSessionRootLinking(preMountOfflineSession, online),
  true
);
check(
  'pre-mount offline observation followed by online truth uses normal first-mount initial linking',
  preMountOfflineSession.startupLinkingOutcome === 'authorized-online' &&
    preMountOfflineLifecycle.navigationMounted &&
    preMountOfflineLifecycle.linkingInitializationComplete &&
    preMountOfflineLifecycle.initializationGeneration === 0 &&
    resolveRec2SessionRootLinking(preMountOfflineSession, online)
);

let explicitOfflineLifecycleSession = advanceSession(
  pendingStartupSession(),
  localOffline,
  true
);
let explicitOfflineLifecycle = advanceRec2RootLinkingLifecycle(
  INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
  explicitOfflineLifecycleSession,
  withSessionRootLinking(explicitOfflineLifecycleSession, localOffline),
  true
);
check(
  'an explicit offline local-shell first mount terminally rejects only the startup URL',
  explicitOfflineLifecycleSession.startupLinkingOutcome === 'rejected-offline' &&
    explicitOfflineLifecycle.navigationMounted &&
    !explicitOfflineLifecycle.pendingStartupLinkingInitialization &&
    explicitOfflineLifecycle.initializationGeneration === 0
);
explicitOfflineLifecycleSession = advanceSession(explicitOfflineLifecycleSession, online, true);
const explicitOfflineReconnectBoundary = withSessionRootLinking(
  explicitOfflineLifecycleSession,
  online
);
explicitOfflineLifecycle = advanceRec2RootLinkingLifecycle(
  explicitOfflineLifecycle,
  explicitOfflineLifecycleSession,
  explicitOfflineReconnectBoundary,
  true
);
check(
  'rejected offline startup restores future live links without remounting its initial URL',
  explicitOfflineLifecycleSession.startupLinkingOutcome === 'rejected-offline' &&
    explicitOfflineReconnectBoundary.rootLinkingAllowed &&
    !explicitOfflineLifecycle.linkingInitializationComplete &&
    explicitOfflineLifecycle.initializationGeneration === 0
);

ordinaryOnlineSession = advanceSession(ordinaryOnlineSession, localOffline, true);
const ordinaryOutageBoundary = withSessionRootLinking(ordinaryOnlineSession, localOffline);
ordinaryOnlineLifecycle = advanceRec2RootLinkingLifecycle(
  ordinaryOnlineLifecycle,
  ordinaryOnlineSession,
  ordinaryOutageBoundary,
  true
);
check(
  'post-start outage denies current linking without changing the authorized startup outcome',
  ordinaryOnlineSession.startupLinkingOutcome === 'authorized-online' &&
    !ordinaryOutageBoundary.rootLinkingAllowed &&
    ordinaryOnlineLifecycle.initializationGeneration === 0
);

ordinaryOnlineSession = advanceSession(ordinaryOnlineSession, online, true);
const ordinaryReconnectBoundary = withSessionRootLinking(ordinaryOnlineSession, online);
ordinaryOnlineLifecycle = advanceRec2RootLinkingLifecycle(
  ordinaryOnlineLifecycle,
  ordinaryOnlineSession,
  ordinaryReconnectBoundary,
  true
);
check(
  'post-start reconnect restores live linking without a cold-start remount',
  ordinaryOnlineSession.startupLinkingOutcome === 'authorized-online' &&
    ordinaryReconnectBoundary.rootLinkingAllowed &&
    ordinaryOnlineLifecycle.initializationGeneration === 0
);

const repeatedOutageLinking: boolean[] = [];
for (const policy of [localOffline, online, localOffline, online]) {
  ordinaryOnlineSession = advanceSession(ordinaryOnlineSession, policy, true);
  const boundary = withSessionRootLinking(ordinaryOnlineSession, policy);
  ordinaryOnlineLifecycle = advanceRec2RootLinkingLifecycle(
    ordinaryOnlineLifecycle,
    ordinaryOnlineSession,
    boundary,
    true
  );
  repeatedOutageLinking.push(boundary.rootLinkingAllowed);
}
check(
  'multiple post-start outages follow current authority with no permanent lock or generation growth',
  JSON.stringify(repeatedOutageLinking) === JSON.stringify([false, true, false, true]) &&
    ordinaryOnlineSession.startupLinkingOutcome === 'authorized-online' &&
    ordinaryOnlineLifecycle.initializationGeneration === 0
);

let pendingThenOfflineSession = advanceSession(
  pendingStartupSession(),
  initialUnknownConnectivity,
  true
);
let pendingThenOfflineLifecycle = advanceRec2RootLinkingLifecycle(
  INITIAL_REC2_ROOT_LINKING_LIFECYCLE_STATE,
  pendingThenOfflineSession,
  withSessionRootLinking(pendingThenOfflineSession, initialUnknownConnectivity),
  true
);
pendingThenOfflineSession = advanceSession(pendingThenOfflineSession, localOffline, true);
pendingThenOfflineLifecycle = advanceRec2RootLinkingLifecycle(
  pendingThenOfflineLifecycle,
  pendingThenOfflineSession,
  withSessionRootLinking(pendingThenOfflineSession, localOffline),
  true
);
pendingThenOfflineSession = advanceSession(pendingThenOfflineSession, online, true);
const pendingOfflineReconnectBoundary = withSessionRootLinking(
  pendingThenOfflineSession,
  online
);
pendingThenOfflineLifecycle = advanceRec2RootLinkingLifecycle(
  pendingThenOfflineLifecycle,
  pendingThenOfflineSession,
  pendingOfflineReconnectBoundary,
  true
);
check(
  'mounted pending startup followed by explicit offline rejects replay but restores live links',
  pendingThenOfflineSession.startupLinkingOutcome === 'rejected-offline' &&
    pendingThenOfflineLifecycle.pendingStartupLinkingObserved &&
    !pendingThenOfflineLifecycle.pendingStartupLinkingInitialization &&
    pendingOfflineReconnectBoundary.rootLinkingAllowed &&
    pendingThenOfflineLifecycle.initializationGeneration === 0
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

const invalidStartupSession = {
  startupLinkingOutcome: 'invalid-runtime-value',
} as unknown as Rec2OfflineSessionState;
const invalidStartupAdvanced = advanceSession(invalidStartupSession, online);
check(
  'invalid startup-linking state fails closed and cannot acquire live linking authority',
  invalidStartupAdvanced === invalidStartupSession &&
    !resolveRec2SessionRootLinking(invalidStartupAdvanced, online)
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
const appConfigSource = readFileSync('app.config.js', 'utf8');
const navigationContainerSource = readFileSync(
  'node_modules/@react-navigation/native/src/NavigationContainer.tsx',
  'utf8'
);
const useThenableSource = readFileSync(
  'node_modules/@react-navigation/native/src/useThenable.tsx',
  'utf8'
);
const nativeUseLinkingSource = readFileSync(
  'node_modules/@react-navigation/native/src/useLinking.native.tsx',
  'utf8'
);
const webUseLinkingSource = readFileSync(
  'node_modules/@react-navigation/native/src/useLinking.tsx',
  'utf8'
);
const offlinePolicySource = readFileSync(
  'src/app/bootstrap/rec2OfflineHomePolicy.ts',
  'utf8'
);
const startupSource = readFileSync(
  'src/app/bootstrap/useAppStartupOrchestration.ts',
  'utf8'
);
const mainTabSource = readFileSync('src/navigation/MainTabNavigator.tsx', 'utf8');
check(
  'raw connectivity never participates in navigator identity while the bounded lifecycle generation does',
  appSource.includes("key={`root-${user?.phone ?? 'guest'}`}") &&
    appSource.includes('key={`root-linking-${rootLinkingInitializationGeneration}`}') &&
    !appSource.includes('key={`root-${connectivity') &&
    !appSource.includes('key={`root-linking-${connectivity')
);
check(
  'AppRoot projects the bounded linking lifecycle before render-mode early returns',
  appSource.indexOf('const projectedRootLinkingLifecycle = advanceRec2RootLinkingLifecycle(') <
    appSource.indexOf("if (offlinePolicy.renderMode === 'offline-blocked')")
);
check(
  'AppRoot derives mount authority before pure session, boundary, and lifecycle projections',
  appSource.indexOf('const navigationWillMount =') <
    appSource.indexOf('const projectedOfflineSession = advanceRec2OfflineSession(') &&
    appSource.includes('{ navigationWillMount }') &&
    appSource.indexOf('const projectedOfflineSession = advanceRec2OfflineSession(') <
      appSource.indexOf('const projectedOfflineBoundary: Rec2OfflineHomeRuntimeBoundary =') &&
    appSource.indexOf('const projectedOfflineBoundary: Rec2OfflineHomeRuntimeBoundary =') <
      appSource.indexOf(
        'const projectedRootLinkingLifecycle = advanceRec2RootLinkingLifecycle('
      )
);
check(
  'new-architecture AppRoot persists projected startup linking state only in commit phase',
  appConfigSource.includes('newArchEnabled: true') &&
    !appSource.includes('offlineSessionRef.current = advanceRec2OfflineSession(') &&
    !appSource.includes(
      'rootLinkingLifecycleRef.current = advanceRec2RootLinkingLifecycle('
    ) &&
    /useLayoutEffect\(\(\) => \{\s*offlineSessionRef\.current = projectedOfflineSession;\s*rootLinkingLifecycleRef\.current = projectedRootLinkingLifecycle;\s*}, \[projectedOfflineSession, projectedRootLinkingLifecycle\]\);/s.test(
      appSource
    )
);
check(
  'AppNavigationShell renders the exact projected boundary, generation, and startup outcome',
  appSource.includes('offlineBoundary={projectedOfflineBoundary}') &&
    appSource.includes('projectedRootLinkingLifecycle.initializationGeneration') &&
    appSource.includes('startupLinkingOutcome={projectedOfflineSession.startupLinkingOutcome}')
);
check(
  'installed React Navigation captures initial linking in a mount-scoped thenable',
  navigationContainerSource.includes(
    'const [isResolved, initialState] = useThenable(getInitialState);'
  ) && useThenableSource.includes('const [promise] = React.useState(create);')
);
check(
  'installed native linking resubscribes live URL handling when enabled changes',
  nativeUseLinkingSource.includes('const subscription = Linking.addEventListener') &&
    nativeUseLinkingSource.includes('return subscribe(listener);') &&
    /return subscribe\(listener\);\s*}, \[enabled,/.test(nativeUseLinkingSource)
);
check(
  'installed native linking drops runtime URL events while disabled and cannot recover them from launch URL state',
  nativeUseLinkingSource.includes('if (!enabled)') &&
    nativeUseLinkingSource.includes('Linking.getInitialURL()') &&
    nativeUseLinkingSource.indexOf('if (!enabled)') <
      nativeUseLinkingSource.indexOf('const navigation = ref.current')
);
check(
  'installed web linking refreshes its history listener when enabled changes',
  webUseLinkingSource.includes('return history.listen(() => {') &&
    /}, \[\s*enabled,\s*history,/s.test(webUseLinkingSource)
);
check(
  'rejected offline startup suppresses getInitialURL while retaining the ordinary live subscription',
  appSource.includes('const rootLinkingAfterRejectedStartup') &&
    appSource.includes('getInitialURL: () => null') &&
    appSource.includes("startupLinkingOutcome === 'rejected-offline'") &&
    appSource.includes('? rootLinkingAfterRejectedStartup')
);
check(
  'native pending runtime-link buffering is bounded with deterministic drop-oldest overflow',
  offlinePolicySource.includes('REC2_PENDING_NATIVE_LINK_BUFFER_MAX_SIZE = 8') &&
    offlinePolicySource.includes('next.slice(-REC2_PENDING_NATIVE_LINK_BUFFER_MAX_SIZE)') &&
    appSource.includes('enqueueRec2PendingNativeLink(')
);
check(
  'native pending listener is commit-owned and web never instantiates the native buffer',
  appSource.includes("Platform.OS === 'web' || nativeLinkSubscriptionRef.current") &&
    appSource.includes("Linking.addEventListener('url'") &&
    appSource.includes("nativeLinkListenerOwnerRef.current === 'pending-buffer'") &&
    appSource.includes("if (startupLinkingOutcome === 'pending')") &&
    appSource.includes('ensureNativeLinkSubscription();')
);
check(
  'pending queue drains only through the committed React Navigation subscription handoff',
  appSource.includes(
    'const committedOutcome = committedStartupLinkingOutcomeRef.current;'
  ) &&
    appSource.includes("committedOutcome !== 'authorized-online'") &&
    appSource.includes('for (const url of settlement.linksToDeliver) listener(url);') &&
    appSource.indexOf('committedStartupLinkingOutcomeRef.current = startupLinkingOutcome;') <
      appSource.indexOf('const committedOutcome = committedStartupLinkingOutcomeRef.current;')
);
check(
  'pending queue release waits for the committed NavigationContainer generation to become ready',
  appSource.includes('navigationReadyGenerationRef.current !== committedRootLinkingGenerationRef.current') &&
    appSource.includes('onReady={handleRootNavigationReady}') &&
    appSource.includes('releasePendingNativeLinksIfReady();')
);
check(
  'rejected-offline commit clears rather than drains pending native startup events',
  appSource.includes("if (startupLinkingOutcome === 'rejected-offline')") &&
    appSource.includes('pendingNativeLinksRef.current = settlement.pendingLinks;') &&
    offlinePolicySource.includes("if (outcome === 'authorized-online')") &&
    offlinePolicySource.includes('return { pendingLinks: [], linksToDeliver: [] };')
);
check(
  'custom native subscribe preserves the canonical route config without duplicating route parsing',
  appSource.includes('() => ({ ...rootLinking, subscribe: subscribeToNativeLinks })') &&
    appSource.includes(
      '() => ({ ...rootLinkingAfterRejectedStartup, subscribe: subscribeToNativeLinks })'
    ) &&
    !appSource.includes('getStateFromPath:')
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
