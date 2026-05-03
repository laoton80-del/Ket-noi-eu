/**
 * Glass surface with Hub-specific 1px aura border & glow (Multiverse).
 */
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useHubTheme } from '../../context/HubThemeContext';
import { auraHexToRgba } from '../../theme/colors';

export type GlassCardProps = Readonly<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Slightly stronger aura for pressed / featured rows */
  emphasis?: 'default' | 'strong';
}>;

export function GlassCard({ children, style, emphasis = 'default' }: GlassCardProps): ReactElement {
  const { auraBorder, auraGlow, accentSecondary } = useHubTheme();
  const borderColor = emphasis === 'strong' ? auraHexToRgba(auraGlow, 0.65) : auraBorder;
  const shadowOpacity = emphasis === 'strong' ? 0.42 : 0.28;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor,
          shadowColor: auraGlow,
          shadowOpacity,
        },
        style,
      ]}
    >
      {/* Faint inner rim — secondary aura only (keeps shell dark). */}
      <View
        style={[styles.innerGlow, { borderColor: auraHexToRgba(accentSecondary, 0.14) }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(22, 22, 30, 0.78)',
    padding: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    borderWidth: 1,
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    opacity: 0.85,
  },
});
