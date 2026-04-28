import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EmergencyType } from '../../services/emergency/emergencyPhrasePacks';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Props = {
  type: EmergencyType;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: (type: EmergencyType) => void;
};

export const EmergencyActionCard: React.FC<Props> = ({ type, title, subtitle, active, onPress }) => {
  return (
    <Pressable onPress={() => onPress(type)} style={({ pressed }) => [styles.card, active && styles.active, pressed && styles.pressed]}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: theme.colors.GraphiteBlue,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 104,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  active: {
    borderColor: theme.colors.RouteError,
    backgroundColor: theme.hybrid.chipErrorBg,
  },
  pressed: {
    opacity: 0.88,
  },
  title: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    marginBottom: 6,
  },
  sub: {
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
  },
});
