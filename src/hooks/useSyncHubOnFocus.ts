import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useHubTheme } from '../context/HubThemeContext';
import type { HubId } from '../theme/colors';

/**
 * Sets the Multiverse Hub aura while this screen is focused (tab or stack).
 */
export function useSyncHubOnFocus(hub: HubId): void {
  const { setCurrentHub } = useHubTheme();

  useFocusEffect(
    useCallback(() => {
      setCurrentHub(hub);
    }, [hub, setCurrentHub])
  );
}
