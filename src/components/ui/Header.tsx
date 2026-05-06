/**
 * Hub-aware app header — aura underline + live dot so the active universe is obvious at a glance.
 */
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useHubTheme } from '../../context/HubThemeContext';
import { auraHexToRgba } from '../../theme/colors';

export type HeaderProps = Readonly<{
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

export function Header({ title, subtitle, left, right, style }: HeaderProps): ReactElement {
  const { accentPrimary, accentSecondary, textPrimary, textImperialGold } = useHubTheme();

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        <View style={styles.center}>
          <View style={styles.titleRow}>
            <View style={[styles.auraPulse, { backgroundColor: accentPrimary }]} />
            <Text style={[styles.title, { color: textImperialGold }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {subtitle ? (
            <Text style={[styles.sub, { color: auraHexToRgba(textPrimary, 0.55) }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.side}>{right}</View>
      </View>
      <View style={styles.auraBar}>
        <View style={[styles.auraBarSeg, { flex: 1, backgroundColor: accentPrimary }]} />
        <View style={[styles.auraBarSeg, { flex: 0.6, backgroundColor: accentSecondary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 10,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  side: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  auraPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  sub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  auraBar: {
    height: 2,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
    opacity: 0.95,
  },
  auraBarSeg: {
    height: '100%',
  },
});
