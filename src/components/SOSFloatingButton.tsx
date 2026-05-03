import { type ReactElement } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
export function SOSFloatingButton({ tabBarLift, onHoldComplete }: SOSFloatingButtonProps): ReactElement {
  const insets = useSafeAreaInsets();
  const bottom = tabBarLift + Math.max(insets.bottom, 10) + 6;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        zIndex: 70,
        bottom,
        right: Math.max(insets.right, 14),
      }}
    >
      <SOSShieldComponent onHoldComplete={onHoldComplete} />
    </View>
  );
}
