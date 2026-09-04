import { StyleSheet, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import {
  VionaNativeLocalContextHero,
  type VionaNativeLocalContextHeroProps,
} from './VionaNativeLocalContextHero';
import {
  VionaNativeLocalFlagshipActions,
  type VionaNativeLocalFlagshipActionsProps,
} from './VionaNativeLocalFlagshipActions';
import {
  VionaNativeLocalSecondaryStack,
  type VionaNativeLocalSecondaryStackProps,
} from './VionaNativeLocalSecondaryStack';
import {
  VionaNativeLocalUtilityActions,
  type VionaNativeLocalUtilityActionsProps,
} from './VionaNativeLocalUtilityActions';

export type NativeLocalLayoutInput = Readonly<{
  mode: 'mobile' | 'tablet';
  isLandscape: boolean;
  reduceMotion: boolean;
}>;

export type VionaNativeLocalClearPremiumCompositionProps = Readonly<{
  layout: NativeLocalLayoutInput;
  context: Omit<VionaNativeLocalContextHeroProps, 'reduceMotion'>;
  flagship: Omit<VionaNativeLocalFlagshipActionsProps, 'reduceMotion'>;
  utility: Omit<VionaNativeLocalUtilityActionsProps, 'reduceMotion'>;
  secondary: Omit<VionaNativeLocalSecondaryStackProps, 'reduceMotion'>;
}>;

/**
 * Native-only Local Clear Premium layout owner.
 * Presentation only. No domain, SOS host, Account chrome, search engine, or commercial mutation.
 */
export function VionaNativeLocalClearPremiumComposition({
  layout,
  context,
  flagship,
  utility,
  secondary,
}: VionaNativeLocalClearPremiumCompositionProps) {
  const compact = layout.mode === 'mobile' && layout.isLandscape;

  return (
    <View
      testID="viona-native-local-clear-premium-composition"
      style={[styles.root, compact && styles.rootCompact]}
      collapsable={false}
    >
      <VionaNativeLocalContextHero {...context} reduceMotion={layout.reduceMotion} />
      <VionaNativeLocalFlagshipActions {...flagship} reduceMotion={layout.reduceMotion} />
      <VionaNativeLocalUtilityActions {...utility} reduceMotion={layout.reduceMotion} />
      <VionaNativeLocalSecondaryStack {...secondary} reduceMotion={layout.reduceMotion} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: tkn.bg.canvas,
    paddingBottom: tkn.spacing[8],
  },
  rootCompact: {
    paddingBottom: tkn.spacing[4],
  },
});
