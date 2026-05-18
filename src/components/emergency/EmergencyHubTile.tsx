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
      accessibilityLabel={accessibilityLabel}
    >
      {statusLabel ? (
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{statusLabel}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <View
          style={[
            styles.iconCapsule,
            { backgroundColor: tokens.iconBg, borderColor: tokens.iconBorder },
          ]}
        >
          <Ionicons name={icon} size={isFull ? 22 : 20} color={tokens.icon} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {isFull ? <Ionicons name="chevron-forward" size={18} color="rgba(203, 213, 225, 0.75)" /> : null}
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
  statusPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(216, 180, 254, 0.45)',
    zIndex: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: '#E9D5FF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: FontFamily.extrabold,
  },
  subtitle: {
    color: 'rgba(203, 213, 225, 0.88)',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FontFamily.medium,
  },
});
