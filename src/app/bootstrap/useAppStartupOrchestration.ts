import { useEffect, useRef, useState } from 'react';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
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
import { markAppInstallOnce, setGrowthUserTraits, trackGrowthEvent, trackGrowthEventOnce } from '../../services/growth';
import { runStorageMigrations } from '../../storage/runMigrations';
import {
  emitOperationalSignal,
  installGlobalErrorHandlers,
  measureOperation,
  resolveOpsRuntimeConfig,
  type OpsRuntimeConfig,
} from '../../observability/operationsRuntime';
import { LAUNCH_PILOT_CONFIG, PILOT_LEONA_SERVICES_FALLBACK_PREFILL } from '../../config/launchPilot';

type UseAppStartupOrchestrationArgs = {
  isHydrating: boolean;
  user: AuthUser | null;
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

export function useAppStartupOrchestration({
  isHydrating,
  user,
  navigationRef,
  setPendingRedirect,
}: UseAppStartupOrchestrationArgs) {
  const [intentGateReady, setIntentGateReady] = useState(false);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [opsReady, setOpsReady] = useState(false);
  const [opsConfig, setOpsConfig] = useState<OpsRuntimeConfig | null>(null);
  const startupAutonomyCheckedRef = useRef(false);

  useEffect(() => {
    installGlobalErrorHandlers();
    void measureOperation('storage_migrations', runStorageMigrations);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const cfg = await resolveOpsRuntimeConfig();
      if (!active) return;
      setOpsConfig(cfg);
      setOpsReady(true);
      if (cfg.readOnlyMode) {
        emitOperationalSignal('warn', 'ops_read_only_mode_enabled', { source: cfg.source });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    warnIfAdminDebugInReleaseBuild();
  }, []);

  useEffect(() => {
    void markAppInstallOnce();
  }, []);

  useEffect(() => {
    void trackGrowthEvent('app_open');
  }, []);

  useEffect(() => {
    setGrowthUserTraits(
      user
        ? {
            country: user.country,
            segment: user.segment,
          }
        : undefined
    );
  }, [user]);

  useEffect(() => {
    void (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      try {
        await Notifications.getDevicePushTokenAsync();
      } catch {
        // Dev client / simulator may not provide a device token; remote push still optional for local vault reminders.
      }
      if (user?.country) {
        await scheduleHolidayNotificationsForCountry(user.country);
      }
    })();
  }, [user?.country]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification?.request?.content?.data as { route?: string; prefillRequest?: string; autoSubmit?: boolean } | undefined;
      if (!data?.route) return;
      if (data.route === 'LeonaCall') {
        if (navigationRef.isReady()) {
          navigationRef.navigate('LeonaCall', {
            prefillRequest: typeof data.prefillRequest === 'string' ? data.prefillRequest : undefined,
            autoSubmit: data.autoSubmit === true,
          });
        }
      }
    });
    return () => sub.remove();
  }, [navigationRef]);

  useEffect(() => {
    void (async () => {
      const done = await isGuidedIntentEntryCompleted();
      if (!done) setShowIntentModal(true);
      setIntentGateReady(true);
    })();
  }, []);

  useEffect(() => {
    if (startupAutonomyCheckedRef.current) return;
    if (isHydrating) return;
    startupAutonomyCheckedRef.current = true;
    let active = true;
    void (async () => {
      const action = await runStartupDocumentAlarmCheck();
      if (!active || !action) return;
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
        if (!active) return;
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
            if (!navigationRef.isReady()) return;
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
  }, [isHydrating, navigationRef, user]);

  const onGuidedIntent = async (id: GuidedIntentId) => {
    await completeGuidedIntentEntry();
    void trackGrowthEventOnce('onboarding_complete');
    setShowIntentModal(false);
    const go = () => {
      switch (id) {
        case 'call_book':
          void setLeTanGuidedAiSeed(
            'Chào bạn, mình là LOAN. Bạn muốn gọi hay đặt lịch? Nói một câu — mình gợi ý bước tiếp theo.'
          );
          if (user) {
            navigationRef.navigate('Tabs', { screen: 'LeTan' });
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
    await completeGuidedIntentEntry();
    void trackGrowthEventOnce('onboarding_complete');
    setShowIntentModal(false);
  };

  return {
    intentGateReady,
    showIntentModal,
    opsReady,
    opsConfig,
    onGuidedIntent,
    onSkipGuidedIntent,
  };
}
