import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type VionaCraneVariant = 'sapphire' | 'gold' | 'ice' | 'mono';

type VionaCraneMarkProps = Readonly<{
  size?: number;
  variant?: VionaCraneVariant;
  glow?: boolean;
}>;

const STROKE: Record<VionaCraneVariant, string> = {
  sapphire: '#7DD3FC',
  gold: '#E7C27A',
  ice: '#F4F8FC',
  mono: '#F4F8FC',
};

/** One open stroke: head and neck on the left, feathered wing on the right. */
const CRANE_D =
  'M8 34 C14 16 30 12 34 26 C31 18 18 22 20 36 C28 54 38 80 48 106 C62 74 80 42 96 24 C86 32 78 46 88 30 C96 20 108 24 100 38';

export function VionaCraneMark({
  size = 48,
  variant = 'sapphire',
  glow = false,
}: VionaCraneMarkProps) {
  const stroke = STROKE[variant];
  const titleId = useId();
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="VIONA crane-wing mark"
      style={
        glow
          ? {
              shadowColor: stroke,
              shadowOpacity: 0.4,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            }
          : undefined
      }
    >
      <Svg width={size} height={size} viewBox="0 0 100 112">
        <Path
          d={CRANE_D}
          fill="none"
          stroke={stroke}
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          id={titleId}
        />
      </Svg>
    </View>
  );
}
