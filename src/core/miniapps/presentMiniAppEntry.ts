import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/routes';
import type { ResolveMiniAppEntryResult } from './miniAppTypes';
import { navigateMiniAppRouteRef } from './miniAppRouteNavigation';

export type MiniAppTranslate = (key: string, options?: Record<string, string | number>) => string;

export type PresentMiniAppEntryParams = Readonly<{
  result: ResolveMiniAppEntryResult;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  t: MiniAppTranslate;
  /**
   * When set, called instead of navigating via registry route ref (dashboard/product overrides).
   * Still invoked only after gates pass (or after demo acknowledgment).
   */
  onAllowed?: () => void;
}>;

function messageForGate(
  reason: Extract<ResolveMiniAppEntryResult, { type: 'showGate' }>['reason'],
  t: MiniAppTranslate
): string {
  switch (reason) {
    case 'role':
      return t('miniApp.gate.role');
    case 'featureFlag':
      return t('miniApp.gate.featureFlag');
    case 'readiness':
      return t('miniApp.gate.readiness');
    case 'market':
      return t('miniApp.gate.market');
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

/**
 * Presents resolver outcomes with Alerts — **never** silently navigates to Hub/Home.
 */
export function presentMiniAppEntry(params: PresentMiniAppEntryParams): void {
  const { result, navigation, t, onAllowed } = params;

  const goOrCustom = (routeRef?: string): void => {
    if (onAllowed) {
      onAllowed();
      return;
    }
    if (routeRef) {
      navigateMiniAppRouteRef(navigation, routeRef);
    }
  };

  switch (result.type) {
    case 'navigate':
      goOrCustom(result.route);
      return;

    case 'showDemoNotice':
      Alert.alert(t('miniApp.status.demo'), t('miniApp.demo.body'), [
        { text: t('miniApp.demo.cancel'), style: 'cancel' },
        {
          text: t('miniApp.demo.continue'),
          onPress: () => goOrCustom(result.route),
        },
      ]);
      return;

    case 'showComingSoon':
      Alert.alert(t('miniApp.status.comingSoon'), t('miniApp.comingSoon.body'));
      return;

    case 'showGate':
      Alert.alert(t('miniApp.title.gate'), messageForGate(result.reason, t));
      return;

    case 'showFrozen':
      Alert.alert(t('miniApp.status.frozen'), t('miniApp.frozen.body'));
      return;

    case 'showError': {
      const translated = t(result.messageKey);
      const body =
        translated === result.messageKey ? t('miniApp.error.unavailable') : translated;
      Alert.alert(t('miniApp.error.title'), body);
      return;
    }
  }
}
