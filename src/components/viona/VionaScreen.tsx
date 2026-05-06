import { type ReactElement, type ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { vionaMaxContentWidth, vionaShellBackground, type VionaShellVariant } from './vionaDesignTokens';

export type VionaScreenProps = Readonly<{
  children: ReactNode;
  /** Consumer trust / travel wash / ops dashboard */
  variant?: VionaShellVariant;
  edges?: readonly Edge[];
  /** Optional outer style (e.g. flex) */
  style?: StyleProp<ViewStyle>;
  /** When true, children are wrapped in a centered max-width column (web + large phones). */
  constrainWidth?: boolean;
  maxContentWidth?: number;
}>;

const DEFAULT_EDGES: readonly Edge[] = ['top', 'left', 'right'];

export function VionaScreen({
  children,
  variant = 'light',
  edges = DEFAULT_EDGES,
  style,
  constrainWidth = false,
  maxContentWidth = vionaMaxContentWidth,
}: VionaScreenProps): ReactElement {
  const { width } = useWindowDimensions();
  const shouldConstrain = constrainWidth || (Platform.OS === 'web' && width > maxContentWidth);

  const inner = shouldConstrain ? (
    <View style={[styles.constrain, { maxWidth: maxContentWidth, width: '100%' as const }]}>{children}</View>
  ) : (
    children
  );

  return (
    <View style={[styles.root, { backgroundColor: vionaShellBackground(variant) }, style]}>
      <SafeAreaView style={styles.safe} edges={[...edges]}>
        {inner}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  constrain: {
    flex: 1,
    alignSelf: 'center',
  },
});
