import type { ImageSourcePropType, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { VionaFashionHomeAdaptiveComposition } from './VionaFashionHomeAdaptiveComposition';

/**
 * Phase 0 — native Home opening-stage presentation boundary.
 *
 * Parity wrapper: forwards existing AdaptiveComposition props unchanged.
 * Does not own SOS, Account, Language, tabs, universe handlers, flags, or API.
 * Does not take `children`; world cards remain siblings in HomeScreen.
 */
export type VionaNativeHomeOpeningStageProps = Readonly<{
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

export function VionaNativeHomeOpeningStage({
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
    </View>
  );
}
