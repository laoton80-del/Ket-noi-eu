/**
 * Wave 3B — scroll footer spacer for premium hub chrome (dock + tab bar clearance).
 * Layout-only; no business logic.
 */
import { type ReactElement } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolvePremiumShellBottomPadding } from '../../design/premiumTileVisualTokens';

export type PremiumContentSpacerProps = Readonly<{
  withMiniappDock?: boolean;
  withTabBar?: boolean;
  extra?: number;
}>;

export function PremiumContentSpacer({
  withMiniappDock = false,
  withTabBar = true,
  extra = 0,
}: PremiumContentSpacerProps): ReactElement {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const height = resolvePremiumShellBottomPadding(width, insets.bottom, {
    withMiniappDock,
    withTabBar,
    extra,
  });
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height }} />;
}
