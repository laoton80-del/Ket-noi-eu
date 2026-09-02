import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { VionaNativeHomeHeader, type VionaNativeHomeHeaderProps } from './VionaNativeHomeHeader';
import {
  VionaNativeHomePrimaryEntry,
  type VionaNativeHomePrimaryEntryProps,
} from './VionaNativeHomePrimaryEntry';
import {
  VionaNativeUniverseLauncher,
  type VionaNativeUniverseLauncherItem,
} from './VionaNativeUniverseLauncher';
import { VionaNativeQuickActions, type VionaNativeQuickActionsProps } from './VionaNativeQuickActions';

export type NativeHomeLayoutInput = Readonly<{
  mode: 'mobile' | 'tablet';
  isLandscape: boolean;
  reduceMotion: boolean;
}>;

export type VionaNativeHomeClearPremiumCompositionProps = Readonly<{
  layout: NativeHomeLayoutInput;
  header: VionaNativeHomeHeaderProps;
  primaryEntry: VionaNativeHomePrimaryEntryProps;
  launcherItems: readonly VionaNativeUniverseLauncherItem[];
  quickActions: VionaNativeQuickActionsProps;
  children?: ReactNode;
}>;

/**
 * Native-only Home layout owner (Phase 1).
 * No domain, navigation, feature flags, SOS host, or Account chrome.
 */
export function VionaNativeHomeClearPremiumComposition({
  layout,
  header,
  primaryEntry,
  launcherItems,
  quickActions,
  children,
}: VionaNativeHomeClearPremiumCompositionProps) {
  const fourAcross = layout.mode === 'tablet' || layout.isLandscape;

  return (
    <View
      testID="viona-native-home-clear-premium-composition"
      style={[styles.root, fourAcross && styles.rootWide]}
    >
      <VionaNativeHomeHeader {...header} />
      <VionaNativeHomePrimaryEntry {...primaryEntry} />
      <VionaNativeUniverseLauncher
        items={launcherItems}
        fourAcross={fourAcross}
        reduceMotion={layout.reduceMotion}
      />
      <VionaNativeQuickActions {...quickActions} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: tkn.bg.canvas,
    paddingBottom: tkn.spacing[8],
  },
  rootWide: {
    paddingHorizontal: tkn.spacing[4],
  },
});
