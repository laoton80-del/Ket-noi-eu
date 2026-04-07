import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';

type WidgetCardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function WidgetCard({ children, style }: WidgetCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
    padding: 14,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
  },
});

