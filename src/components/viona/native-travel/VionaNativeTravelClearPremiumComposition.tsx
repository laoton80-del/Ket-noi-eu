import { ScrollView, StyleSheet, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import {
  VionaNativeTravelContextStrip,
  type NativeTravelGateMode,
  type VionaNativeTravelContextStripProps,
} from './VionaNativeTravelContextStrip';
import {
  VionaNativeTravelFlagshipActions,
  type VionaNativeTravelFlagshipActionsProps,
} from './VionaNativeTravelFlagshipActions';
import {
  VionaNativeTravelSecondaryStack,
  type VionaNativeTravelSecondaryStackProps,
} from './VionaNativeTravelSecondaryStack';
import {
  VionaNativeTravelUtilityActions,
  type VionaNativeTravelUtilityActionsProps,
} from './VionaNativeTravelUtilityActions';

export type NativeTravelLayoutInput = Readonly<{
  mode: 'mobile' | 'tablet';
  isLandscape: boolean;
  reduceMotion: boolean;
}>;

export type VionaNativeTravelClearPremiumCompositionProps = Readonly<{
  layout: NativeTravelLayoutInput;
  gate: NativeTravelGateMode;
  context: VionaNativeTravelContextStripProps;
  flagship: Omit<VionaNativeTravelFlagshipActionsProps, 'fourAcross' | 'reduceMotion'>;
  utility: Omit<VionaNativeTravelUtilityActionsProps, 'twoColumn' | 'reduceMotion'>;
  secondary: Omit<VionaNativeTravelSecondaryStackProps, 'reduceMotion'>;
}>;

/**
 * Native-only Travel Clear Premium layout owner (P2-B).
 * Presentation only. No domain, SOS provider, Account chrome, navigation, or AI runtime.
 */
export function VionaNativeTravelClearPremiumComposition({
  layout,
  gate,
  context,
  flagship,
  utility,
  secondary,
}: VionaNativeTravelClearPremiumCompositionProps) {
  const fourAcross = layout.isLandscape || layout.mode === 'tablet';
  const twoColumn = !layout.isLandscape || layout.mode === 'tablet';

  return (
    <View testID="viona-native-travel-clear-premium-composition" style={styles.root}>
      <ScrollView
        testID="viona-native-travel-clear-premium-scroll"
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <VionaNativeTravelContextStrip {...context} gate={gate} />
        {gate === 'ready' ? (
          <>
            <VionaNativeTravelFlagshipActions
              {...flagship}
              fourAcross={fourAcross}
              reduceMotion={layout.reduceMotion}
            />
            <VionaNativeTravelUtilityActions
              {...utility}
              twoColumn={twoColumn}
              reduceMotion={layout.reduceMotion}
            />
            <VionaNativeTravelSecondaryStack {...secondary} reduceMotion={layout.reduceMotion} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: tkn.bg.canvas,
  },
  scroll: {
    paddingHorizontal: tkn.spacing[16],
    paddingTop: tkn.spacing[12],
    paddingBottom: tkn.spacing[32],
    width: '100%',
  },
});
