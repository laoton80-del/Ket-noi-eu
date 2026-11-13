import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import type { RootStackParamList } from '../../navigation/routes';
import type { RedirectTarget } from '../../context/AuthContext';
import type { AuthUser } from '../../context/authTypes';
import {
  completeGuidedIntentEntry,
  isGuidedIntentEntryCompleted,
  setLeTanGuidedAiSeed,
  type GuidedIntentId,
} from '../../onboarding/guidedOnboardingStorage';
import { warnIfAdminDebugInReleaseBuild } from '../../config/adminDebugGate';
import { getDocumentTypeLabel, runStartupDocumentAlarmCheck } from '../../services/DocumentAlarmService';
import { buildVisaExpiryThresholdTrigger, orchestrateAutonomousAction } from '../../services/autonomy';
import { scheduleHolidayNotificationsForCountry } from '../../services/holidays';
import {
  addForegroundNotificationListener,
  initializePushNotificationsOnStartup,
} from '../../services/NotificationService';
import { markAppInstallOnce, setGrowthUserTraits, trackGrowthEvent, trackGrowthEventOnce } from '../../services/growth';
import { runStorageMigrations } from '../../storage/runMigrations';
import {
  emitOperationalSignal,
  installGlobalErrorHandlers,
  resolveOpsRuntimeConfig,
  type OpsRuntimeConfig,
} from '../../observability/operationsRuntime';
import { LAUNCH_PILOT_CONFIG, PILOT_LEONA_SERVICES_FALLBACK_PREFILL } from '../../config/launchPilot';
import {
  REC2_OPS_CONFIG_CACHE_KEY,
  canRunRec2RemoteInitializers,
  canResolveRec2RemoteOpsConfig,
  claimRec2RemoteInitializerOnce,
  isRec2RemoteOpsResolutionReady,
  resolveRec2LocalOpsConfig,
  type Rec2ConnectivityState,
} from './rec2OfflineHomePolicy';

type UseAppStartupOrchestrationArgs = {
  isHydrating: boolean;
  user: AuthUser | null;
  connectivity: Rec2ConnectivityState;
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
  setPendingRedirect: (target: RedirectTarget | null) => void;
};

function navigateWhenReady(navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>, fn: () => void) {
  const tick = () => {
    if (navigationRef.isReady()) fn();
    else requestAnimationFrame(tick);
  };
  tick();
}

function isDesktopWebIntentModalBlocked(): boolean {
  if (Platform.OS !== 'web') return false;
  const maybeWindow = globalThis as { innerWidth?: number };
  return (maybeWindow.innerWidth ?? 0) >= 1024;
}

async function readLocalOpsConfig(): Promise<OpsRuntimeConfig> {
  let cached: unknown = null;
  try {
    const raw = await AsyncStorage.getItem(REC2_OPS_CONFIG_CACHE_KEY);
    cached = raw ? JSON.parse(raw) : null;
  } catch {
    cached = null;
  }
  return resolveRec2LocalOpsConfig({
    envKillSwitch: process.env.EXPO_PUBLIC_OPS_KILL_SWITCH,
    envReadOnlyMode: process.env.EXPO_PUBLIC_OPS_READ_ONLY_MODE,
    envDisabledFeatures: process.env.EXPO_PUBLIC_OPS_DISABLED_FEATURES,
    cached,
  });
}

export function useAppStartupOrchestration({
  isHydrating,
  user,
  connectivity,
  navigationRef,
  setPendingRedirect,
}: UseAppStartupOrchestrationArgs) {
  const [intentGateReady, setIntentGateReady] = useState(false);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [opsReady, setOpsReady] = useState(false);
  const [remoteOpsReady, setRemoteOpsReady] = useState(false);
  const [opsConfig, setOpsConfig] = useState<OpsRuntimeConfig | null>(null);
  const claimedInitializersRef = useRef(new Set<string>());
  const mountedRef = useRef(true);
  const remoteStartupAllowedRef = useRef(false);
  const lastGrowthTraitsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!claimRec2RemoteInitializerOnce(claimedInitializersRef.current, 'storage-migrations', true)) return;
    void runStorageMigrations();
  }, []);

  useEffect(() => {
    let active = true;
    setRemoteOpsReady(false);
    void (async () => {
      const localConfig = await readLocalOpsConfig();
      if (!active || !mountedRef.current) return;
      setOpsConfig(localConfig);
      setOpsReady(true);

      const remoteConfigAllowed = canResolveRec2RemoteOpsConfig({
        connectivity,
        isHydrating,
        operationalKillSwitch: localConfig.killSwitch,
        operationalReadOnlyMode: localConfig.readOnlyMode,
      });
      if (
        !claimRec2RemoteInitializerOnce(
          claimedInitializersRef.current,
          'ops-config-remote',
          remoteConfigAllowed
        )
      ) {
        return;
      }

      const cfg = await resolveOpsRuntimeConfig();
      if (!active || !mountedRef.current) return;
      setOpsConfig(cfg);
      setRemoteOpsReady(isRec2RemoteOpsResolutionReady(cfg.source));
      if (cfg.readOnlyMode) {
        emitOperationalSignal('warn', 'ops_read_only_mode_enabled', { source: cfg.source });
      }
    })();
    return () => {
      active = false;
    };
  }, [connectivity.isConnected, connectivity.isInternetReachable, isHydrating]);

  const remoteStartupAllowed = canRunRec2RemoteInitializers({
    connectivity,
    isHydrating,
    remoteOpsReady,
    operationalKillSwitch: opsConfig?.killSwitch === true,
    operationalReadOnlyMode: opsConfig?.readOnlyMode === true,
  });
  remoteStartupAllowedRef.current = remoteStartupAllowed;

  useEffect(() => {
    if (
      claimRec2RemoteInitializerOnce(
        claimedInitializersRef.current,
        'global-error-handlers',
        remoteStartupAllowed
      )
    ) {
      installGlobalErrorHandlers();
    }
  }, [remoteStartupAllowed]);

  useEffect(() => {
    warnIfAdminDebugInReleaseBuild();
  }, []);

  useEffect(() => {
    if (
      !claimRec2RemoteInitializerOnce(
        claimedInitializersRef.current,
        'growth-session',
        remoteStartupAllowed
      )
    ) {
      return;
    }
    void markAppInstallOnce();
    void trackGrowthEvent('app_open');
  }, [remoteStartupAllowed]);

  useEffect(() => {
    if (!remoteStartupAllowed) return;
    const traitsKey = user ? `${user.phone ?? ''}|${user.country ?? ''}|${user.segment ?? ''}` : 'guest';
    if (lastGrowthTraitsKeyRef.current === traitsKey) return;
    lastGrowthTraitsKeyRef.current = traitsKey;
    setGrowthUserTraits(
      user
        ? {
            country: user.country,
            segment: user.segment,
          }
        : undefined
    );
  }, [remoteStartupAllowed, user]);

  useEffect(() => {
    const pushKey = `push:${user?.phone ?? 'guest'}:${user?.country ?? ''}`;
    if (
      !claimRec2RemoteInitializerOnce(
        claimedInitializersRef.current,
        pushKey,
        remoteStartupAllowed
      )
    ) {
      return;
    }
    void (async () => {
      try {
        await initializePushNotificationsOnStartup();
      } catch {
        // Device-token support remains optional; this path runs only with verified connectivity.
      }
      if (user?.country) {
        await scheduleHolidayNotificationsForCountry(user.country);
      }
    })();
  }, [remoteStartupAllowed, user?.country, user?.phone]);

  useEffect(() => {
    const sub = addForegroundNotificationListener(() => {
      // Presentation is local. No remote or protected action runs from this listener.
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!remoteStartupAllowedRef.current) return;
      const data = response.notification?.request?.content?.data as { route?: string; prefillRequest?: string; autoSubmit?: boolean } | undefined;
      if (!data?.route) return;
      if (data.route === 'LeonaCall' && navigationRef.isReady()) {
        navigationRef.navigate('LeonaCall', {
          prefillRequest: typeof data.prefillRequest === 'string' ? data.prefillRequest : undefined,
          autoSubmit: data.autoSubmit === true,
        });
      }
    });
    return () => sub.remove();
  }, [navigationRef]);

  useEffect(() => {
    if (isHydrating) return;
    if (!claimRec2RemoteInitializerOnce(claimedInitializersRef.current, 'guided-intent-read', true)) return;
    let active = true;
    void (async () => {
      const done = await isGuidedIntentEntryCompleted();
      if (!active) return;
      if (remoteStartupAllowedRef.current && !done && !isDesktopWebIntentModalBlocked()) {
        setShowIntentModal(true);
      }
      setIntentGateReady(true);
    })();
    return () => {
      active = false;
    };
  }, [isHydrating]);

  useEffect(() => {
    if (!remoteStartupAllowed) setShowIntentModal(false);
  }, [remoteStartupAllowed]);

  useEffect(() => {
    if (
      !claimRec2RemoteInitializerOnce(
        claimedInitializersRef.current,
        'startup-autonomy',
        remoteStartupAllowed
      )
    ) {
      return;
    }
    let active = true;
    void (async () => {
      const action = await runStartupDocumentAlarmCheck();
      if (!active || !action || !remoteStartupAllowedRef.current) return;
      if (user) {
        const trigger = buildVisaExpiryThresholdTrigger({
          documentId: action.documentId,
          expiryDate: action.expiryDate,
          daysLeft: action.daysLeft,
        });
        const auto = await orchestrateAutonomousAction({
          trigger,
          user,
        });
        if (!active || !remoteStartupAllowedRef.current) return;
        if (auto.decision.status === 'allowed' && auto.resumeAction?.route === 'LeonaCall' && navigationRef.isReady()) {
          navigationRef.navigate('LeonaCall', auto.resumeAction.params);
          return;
        }
      }
      Alert.alert('Nhắc hạn giấy tờ', action.ctaMessage, [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: () => {
            if (!remoteStartupAllowedRef.current || !navigationRef.isReady()) return;
            const docLabel = getDocumentTypeLabel(action.documentType);
            navigationRef.navigate('LeonaCall', {
              prefillRequest: `Gọi hỗ trợ gia hạn ${docLabel} trước ngày ${action.expiryDate}.`,
              autoSubmit: true,
            });
          },
        },
      ]);
    })();
    return () => {
      active = false;
    };
  }, [navigationRef, remoteStartupAllowed, user]);

  const onGuidedIntent = async (id: GuidedIntentId) => {
    if (!remoteStartupAllowedRef.current) return;
    await completeGuidedIntentEntry();
    void trackGrowthEventOnce('onboarding_complete');
    setShowIntentModal(false);
    const go = () => {
      if (!remoteStartupAllowedRef.current) return;
      switch (id) {
        case 'call_book':
          void setLeTanGuidedAiSeed(
            'Chào bạn, mình là LOAN. Bạn muốn gọi hay đặt lịch? Nói một câu — mình gợi ý bước tiếp theo.'
          );
          if (user) {
            navigationRef.navigate('AiReceptionistDemoSimulator');
          } else {
            setPendingRedirect('LeTan');
            navigationRef.navigate('Login', { redirectTo: 'LeTan' });
          }
          break;
        case 'language':
          navigationRef.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' });
          break;
        case 'documents':
          if (user) {
            navigationRef.navigate('Vault');
          } else {
            setPendingRedirect('Vault');
            navigationRef.navigate('Login', { redirectTo: 'Vault' });
          }
          break;
        case 'services':
          if (LAUNCH_PILOT_CONFIG.enableRadarSurface) {
            navigationRef.navigate('RadarDiscovery');
          } else {
            navigationRef.navigate('LeonaCall', {
              prefillRequest: PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
              autoSubmit: false,
            });
          }
          break;
        default:
          break;
      }
    };
    navigateWhenReady(navigationRef, go);
  };

  const onSkipGuidedIntent = async () => {
    if (!remoteStartupAllowedRef.current) return;
    await completeGuidedIntentEntry();
    void trackGrowthEventOnce('onboarding_complete');
    setShowIntentModal(false);
  };

  return {
    intentGateReady,
    showIntentModal,
    opsReady,
    remoteOpsReady,
    opsConfig,
    remoteStartupAllowed,
    onGuidedIntent,
    onSkipGuidedIntent,
  };
}
