import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { webGlassStyle } from '../../utils/webStyles';
import {
  emergencyHubAccentTokens,
  emergencyUiTokens,
  type EmergencyHubAccent,
} from './emergencyUiTokens';

export type EmergencyHubTileProps = Readonly<{
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: EmergencyHubAccent;
  onPress: () => void;
  accessibilityLabel: string;
  statusLabel?: string;
  /** Half-width hub cell (default) or full-width guidance row. */
  layout?: 'grid' | 'full';
}>;

export function EmergencyHubTile({
  title,
  subtitle,
  icon,
  accent,
  onPress,
  accessibilityLabel,
  statusLabel,
  layout = 'grid',
}: EmergencyHubTileProps): ReactElement {
  const tokens = emergencyHubAccentTokens[accent];
  const isFull = layout === 'full';
  const a11y = subtitle ? `${accessibilityLabel}. ${subtitle}` : accessibilityLabel;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isFull ? styles.cardFull : styles.cardGrid,
        {
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
        },
        pressed && styles.pressed,
        webGlassStyle,
      ]}
      className={applyWebStyles('kn-glass')}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <View style={styles.stack}>
        <View style={styles.iconRow}>
          <View
            style={[
              styles.iconCapsule,
              { backgroundColor: tokens.iconBg, borderColor: tokens.iconBorder },
            ]}
          >
            <Ionicons name={icon} size={22} color={tokens.icon} accessibilityIgnoresInvertColors />
          </View>
          {statusLabel ? (
            <Text style={[styles.statusPill, { color: tokens.icon, borderColor: tokens.iconBorder }]}>
              {statusLabel}
            </Text>
          ) : null}
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {isFull ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color="rgba(203, 213, 225, 0.75)"
            style={styles.chevronFull}
            accessibilityIgnoresInvertColors
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: emergencyUiTokens.hubTileMinHeight,
    justifyContent: 'center',
  },
  cardGrid: {
    width: '48%',
    flexGrow: 0,
    flexShrink: 0,
  },
  cardFull: {
    width: '100%',
    minHeight: 72,
  },
  pressed: {
    opacity: 0.92,
  },
  stack: {
    gap: 10,
    width: '100%',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    width: '100%',
  },
  iconCapsule: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  statusPill: {
    flexShrink: 1,
    fontSize: 8,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    overflow: 'hidden',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 17,
    fontFamily: FontFamily.extrabold,
    letterSpacing: -0.14,
  },
  subtitle: {
    color: 'rgba(203, 213, 225, 0.88)',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FontFamily.medium,
  },
  chevronFull: {
    position: 'absolute',
    right: 0,
    top: 14,
  },
});
