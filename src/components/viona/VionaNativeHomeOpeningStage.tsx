import type { ImageSourcePropType, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { VionaFashionHomeAdaptiveComposition } from './VionaFashionHomeAdaptiveComposition';
import {
  VionaNativeHomeClearPremiumComposition,
  type NativeHomeLayoutInput,
  type VionaNativeHomeClearPremiumCompositionProps,
} from './native-home/VionaNativeHomeClearPremiumComposition';
import type { VionaNativeHomeHeaderProps } from './native-home/VionaNativeHomeHeader';
import type { VionaNativeHomePrimaryEntryProps } from './native-home/VionaNativeHomePrimaryEntry';
import type { VionaNativeUniverseLauncherItem } from './native-home/VionaNativeUniverseLauncher';
import type {
  VionaNativeQuickActionItem,
  VionaNativeQuickActionsProps,
} from './native-home/VionaNativeQuickActions';

export type {
  NativeHomeLayoutInput,
  VionaNativeHomeHeaderProps,
  VionaNativeHomePrimaryEntryProps,
  VionaNativeUniverseLauncherItem,
  VionaNativeQuickActionItem,
  VionaNativeQuickActionsProps,
};

/** Phase 0 AdaptiveComposition parity remains available for rollback. */
const PHASE1_NATIVE_CLEAR_PREMIUM = true;

export type VionaNativeHomeOpeningStageProps = Readonly<{
  layout: NativeHomeLayoutInput;
  header: VionaNativeHomeHeaderProps;
  primaryEntry: VionaNativeHomePrimaryEntryProps;
  launcherItems: readonly VionaNativeUniverseLauncherItem[];
  quickActions: VionaNativeQuickActionsProps;
  mode: 'mobile' | 'tablet';
  brandLabel: string;
  greetingLine1: string;
  greetingWish: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: ImageSourcePropType;
  heroA11yLabel: string;
  style?: ViewStyle;
}>;

/**
 * Native Home opening-stage presentation boundary.
 *
 * Phase 1 mounts Clear Premium composition.
 * Phase 0 AdaptiveComposition forwarder remains in-file for rollback.
 * Does not own SOS, Account, Language, tabs, universe handlers, flags, or API.
 * Does not take `children`; world cards remain siblings in HomeScreen.
 */
export function VionaNativeHomeOpeningStage({
  layout,
  header,
  primaryEntry,
  launcherItems,
  quickActions,
  mode,
  brandLabel,
  greetingLine1,
  greetingWish,
  eyebrow,
  title,
  subtitle,
  heroImage,
  heroA11yLabel,
  style,
}: VionaNativeHomeOpeningStageProps) {
  return (
    <View testID="viona-native-home-opening-stage">
      {PHASE1_NATIVE_CLEAR_PREMIUM ? (
        <VionaNativeHomeClearPremiumComposition
          layout={layout}
          header={header}
          primaryEntry={primaryEntry}
          launcherItems={launcherItems}
          quickActions={quickActions}
        />
      ) : (
        <VionaFashionHomeAdaptiveComposition
          mode={mode}
          brandLabel={brandLabel}
          greetingLine1={greetingLine1}
          greetingWish={greetingWish}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          heroImage={heroImage}
          heroA11yLabel={heroA11yLabel}
          style={style}
        />
      )}
    </View>
  );
}

export type { VionaNativeHomeClearPremiumCompositionProps };
