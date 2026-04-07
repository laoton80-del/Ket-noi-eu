import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EmergencyType } from '../../services/emergency/emergencyPhrasePacks';

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
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 104,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  active: {
    borderColor: '#EF4444',
    backgroundColor: '#2B0E0E',
  },
  pressed: {
    opacity: 0.88,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 6,
  },
  sub: {
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 17,
  },
});
