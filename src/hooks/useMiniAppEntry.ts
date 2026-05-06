import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';

import {
  activeRoleToMiniAppRole,
  presentMiniAppEntry,
  resolveMiniAppEntry,
} from '../core/miniapps';
import type { MiniAppId } from '../core/miniapps/miniAppTypes';
import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/routes';
import { useUserStore } from '../store/userStore';

/**
 * Pack A — resolves registry gates then navigates via {@link presentMiniAppEntry}
 * (explicit Alerts; **no** silent fallback to Hub/Home).
 */
export function useMiniAppEntry(): Readonly<{
  openMiniApp: (miniAppId: MiniAppId, onAllowed?: () => void) => void;
}> {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const activeRole = useUserStore((s) => s.currentActiveRole);
  const miniRole = useMemo(() => activeRoleToMiniAppRole(activeRole), [activeRole]);

  const openMiniApp = useCallback(
    (miniAppId: MiniAppId, onAllowed?: () => void) => {
      const result = resolveMiniAppEntry({
        miniAppId,
        userRole: miniRole,
        enabledFeatureFlags: featureFlags,
      });
      presentMiniAppEntry({ result, navigation, t, onAllowed });
    },
    [featureFlags, miniRole, navigation, t]
  );

  return { openMiniApp };
}
