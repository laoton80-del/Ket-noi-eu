import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EmergencyType } from '../../services/emergency/emergencyPhrasePacks';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { webGlassStyle } from '../../utils/webStyles';
import { FontFamily } from '../../theme/typography';
import { emergencyUiTokens } from './emergencyUiTokens';

const TYPE_ICON: Record<EmergencyType, keyof typeof Ionicons.glyphMap> = {
  ambulance: 'medkit',
  police: 'shield',
  fire: 'flame',
  general112: 'alert-circle',
};

const TYPE_ICON_COLOR: Record<EmergencyType, string> = {
  ambulance: '#F9A8D4',
  police: '#93C5FD',
  fire: '#FB923C',
  general112: '#FCA5A5',
};

type Props = {
  type: EmergencyType;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: (type: EmergencyType) => void;
};

export const EmergencyActionCard: React.FC<Props> = ({ type, title, subtitle, active, onPress }) => {
  const iconColor = TYPE_ICON_COLOR[type];

  return (
    <Pressable
      onPress={() => onPress(type)}
      style={({ pressed }) => [
        styles.card,
        active && styles.active,
        pressed && styles.pressed,
        webGlassStyle,
      ]}
      className={applyWebStyles(active ? 'kn-glass' : 'kn-glass')}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconCapsule,
            active && styles.iconCapsuleActive,
            { borderColor: active ? 'rgba(248, 113, 113, 0.5)' : 'rgba(55, 65, 81, 0.9)' },
          ]}
        >
          <Ionicons name={TYPE_ICON[type]} size={18} color={iconColor} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: emergencyUiTokens.infoCardBg,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 104,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: emergencyUiTokens.infoCardBorder,
    flexGrow: 0,
    flexShrink: 0,
  },
  active: {
    borderColor: 'rgba(248, 113, 113, 0.55)',
    backgroundColor: 'rgba(43, 14, 14, 0.55)',
  },
  pressed: {
    opacity: 0.88,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconCapsule: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    flexShrink: 0,
  },
  iconCapsuleActive: {
    backgroundColor: 'rgba(127, 29, 29, 0.28)',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: FontFamily.extrabold,
    fontSize: 15,
    lineHeight: 19,
  },
  sub: {
    color: '#E5E7EB',
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 15,
  },
});
