import { type ReactElement } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOSShieldComponent } from './premium/SOSShieldComponent';

export type SOSFloatingButtonProps = Readonly<{
  /** Distance from bottom edge to clear tab bar + home indicator region (same basis as ProfileSwitcher). */
  tabBarLift: number;
  /** After hold confirmation — opens safety assistance sheet. */
  onHoldComplete: () => void;
}>;

/**
 * High-visibility emergency FAB — delegates interaction to {@link SOSShieldComponent} (hold-to-trigger).
 */
export function SOSFloatingButton({ tabBarLift, onHoldComplete }: SOSFloatingButtonProps): ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const bottom = tabBarLift + Math.max(insets.bottom, 12) + (isDesktopWeb ? 20 : 2);
  const right = Math.max(insets.right, isDesktopWeb ? 24 : 14);

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
