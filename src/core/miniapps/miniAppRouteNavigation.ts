import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList, RootTabParamList } from '../../navigation/routes';
import type { MiniAppRouteRef } from './miniAppTypes';

const TABS_PREFIX = 'Tabs/';

/**
 * Navigates using a registry `MiniAppRouteRef` (`Tabs/...` or stack key).
 * Does not apply gates — use after {@link resolveMiniAppEntry} / presenter.
 */
export function navigateMiniAppRouteRef(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  routeRef: MiniAppRouteRef
): void {
  if (routeRef.startsWith(TABS_PREFIX)) {
    const tabName = routeRef.slice(TABS_PREFIX.length) as keyof RootTabParamList;
    if (tabName === 'TabAi') {
      navigation.navigate('Tabs', { screen: 'TabAi', params: undefined });
      return;
    }
    navigation.navigate('Tabs', { screen: tabName });
    return;
  }

  switch (routeRef) {
    case 'LeonaCall':
      navigation.navigate('LeonaCall', undefined);
      return;
    case 'LiveInterpreter':
      navigation.navigate('LiveInterpreter', undefined);
      return;
    case 'AiReceptionistSetupChecklist':
      navigation.navigate('AiReceptionistSetupChecklist');
      return;
    default:
      // Dynamic stack route from registry; ParamList cannot be narrowed from a plain string key.
      navigation.navigate(routeRef as never);
  }
}
