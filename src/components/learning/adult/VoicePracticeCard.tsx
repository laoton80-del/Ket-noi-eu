import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { WidgetCard } from '../../widgets/WidgetCard';
import { AnimatedPressable } from '../../widgets/AnimatedPressable';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';

type Props = {
  onPressStart: () => void;
};

const VoicePracticeCardComponent: React.FC<Props> = ({ onPressStart }) => {
  return (
    <WidgetCard>
      <Text style={styles.title}>Luyện nói với Minh Khang</Text>
      <Text style={styles.subtitle}>
        Mở tab Lễ tân với CSKH Minh Khang và lời mở đầu luyện nói sẵn.
      </Text>
      <AnimatedPressable onPress={onPressStart} style={styles.cta}>
        <Text style={styles.ctaText}>Bắt đầu luyện</Text>
      </AnimatedPressable>
    </WidgetCard>
  );
};

export const VoicePracticeCard = React.memo(VoicePracticeCardComponent);

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: 14,
  },
  cta: {
    minHeight: 42,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});
