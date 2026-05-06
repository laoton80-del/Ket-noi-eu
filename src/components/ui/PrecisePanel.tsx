import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';

type PrecisePanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PrecisePanel({ children, style }: PrecisePanelProps) {
  return (
    <View
      style={[
        {
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.colors.GraphiteBlue,
          backgroundColor: theme.colors.CeolWhite,
          padding: theme.spacing.md,
          shadowColor: theme.colors.glass.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
