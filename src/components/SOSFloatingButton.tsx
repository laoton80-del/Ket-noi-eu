import { useNavigationState } from '@react-navigation/native';
import { type ReactElement } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  isFashionHomeDesktopShell,
  readFocusedTabRouteFromRootState,
} from '../navigation/fashionHomeDesktopShell';
import { useUserStore } from '../store/userStore';
import { SOSShieldComponent } from './premium/SOSShieldComponent';

export type SOSFloatingButtonProps = Readonly<{
  /** Distance from bottom edge to clear tab bar + home indicator region (same basis as ProfileSwitcher). */
  tabBarLift: number;
  /** After 3s hold — opens triage sheet; {@link initiateAITriage} is invoked by parent. */
  onHoldComplete: () => void;
}>;

/**
 * High-visibility emergency FAB — delegates interaction to {@link SOSShieldComponent} (hold-to-trigger).
 */
export function SOSFloatingButton({ tabBarLift, onHoldComplete }: SOSFloatingButtonProps): ReactElement | null {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const currentActiveRole = useUserStore((s) => s.currentActiveRole);
  const focusedTabRoute = useNavigationState(readFocusedTabRouteFromRootState);
  const fashionHomeDesktopShellLocal = isFashionHomeDesktopShell({
    platform: Platform.OS,
    windowWidth: width,
    activeRole: currentActiveRole,
    focusedTabRoute,
  });
  if (fashionHomeDesktopShellLocal) {
    return null;
  }
  const bottom = tabBarLift + Math.max(insets.bottom, 10) + (isDesktopWeb ? 40 : 0);
  const right = Math.max(insets.right, isDesktopWeb ? 32 : 14);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        zIndex: 65,
        bottom,
        right,
      }}
    >
      <SOSShieldComponent reduceMotionGlow={isDesktopWeb} onHoldComplete={onHoldComplete} />
    </View>
  );
}
