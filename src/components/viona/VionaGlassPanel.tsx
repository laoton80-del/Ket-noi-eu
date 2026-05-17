import { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';

export type VionaGlassPanelProps = Readonly<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'warm' | 'cool';
}>;

const toneOverlay: Record<NonNullable<VionaGlassPanelProps['tone']>, string> = {
  default: 'rgba(201, 169, 98, 0.06)',
  warm: 'rgba(255, 124, 198, 0.08)',
  cool: 'rgba(112, 200, 255, 0.08)',
};

export function VionaGlassPanel({ children, style, tone = 'default' }: VionaGlassPanelProps): ReactElement {
  return (
    <View style={[styles.base, style]}>
      <View pointerEvents="none" style={[styles.overlay, { backgroundColor: toneOverlay[tone] }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: vionaTokens.radius.xl,
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.borderSubtle,
    backgroundColor: vionaTokens.fashionTech.surfaceGlass,
    overflow: 'hidden',
    shadowColor: vionaTokens.fashionTech.shadowPanel,
    shadowOpacity: 0.36,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: vionaTokens.radius.xl,
  },
});
