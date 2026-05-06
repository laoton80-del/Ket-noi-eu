import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export type VigTokenIconProps = Readonly<{
  size?: number;
}>;

/** Metallic VIG Token mark with premium gold glow. */
export function VigTokenIcon({ size = 20 }: VigTokenIconProps) {
  return (
    <View style={[styles.glowWrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          <LinearGradient id="vigOuterGold" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FFD700" />
            <Stop offset="0.5" stopColor="#D4AF37" />
            <Stop offset="1" stopColor="#B8860B" />
          </LinearGradient>
          <LinearGradient id="vigInnerGold" x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FFEAA8" />
            <Stop offset="0.55" stopColor="#D4AF37" />
            <Stop offset="1" stopColor="#8F650A" />
          </LinearGradient>
        </Defs>
        <Path d="M32 4C47.464 4 60 16.536 60 32C60 47.464 47.464 60 32 60C16.536 60 4 47.464 4 32C4 16.536 16.536 4 32 4Z" fill="url(#vigOuterGold)" />
        <Path d="M32 12C43.046 12 52 20.954 52 32C52 43.046 43.046 52 32 52C20.954 52 12 43.046 12 32C12 20.954 20.954 12 32 12Z" fill="url(#vigInnerGold)" />
        <Path d="M19.5 24H28L32 34L36 24H44.5L35 42H29L19.5 24Z" fill="#4A2D06" />
        <Path d="M25.5 44H38.5" stroke="#4A2D06" strokeWidth="3.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
});
