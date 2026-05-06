import { Ionicons } from '@expo/vector-icons';
import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { vionaSpacing } from './vionaDesignTokens';
import { vionaTrust } from './vionaTrustTokens';
import { VionaButton } from './VionaButton';

export type VionaEmptyStateProps = Readonly<{
  title: string;
  description: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  primaryAction?: Readonly<{ label: string; onPress: () => void }>;
  variant?: 'light' | 'premium' | 'ops';
}>;

function ink(variant: 'light' | 'premium' | 'ops'): string {
  if (variant === 'ops') return '#F8FAFC';
  return vionaTrust.ink;
}

function muted(variant: 'light' | 'premium' | 'ops'): string {
  if (variant === 'ops') return 'rgba(248, 250, 252, 0.68)';
  return vionaTrust.inkMuted;
}

export function VionaEmptyState({
  title,
  description,
  iconName = 'folder-open-outline',
  primaryAction,
  variant = 'light',
}: VionaEmptyStateProps): ReactElement {
  const iconColor = variant === 'ops' ? 'rgba(248, 250, 252, 0.85)' : vionaTrust.signal;
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={[styles.iconRing, variant === 'ops' && styles.iconRingOps]}>
        <Ionicons name={iconName} size={28} color={iconColor} accessibilityElementsHidden />
      </View>
      <Text style={[styles.title, { color: ink(variant) }]}>{title}</Text>
      <Text style={[styles.body, { color: muted(variant) }]}>{description}</Text>
      {primaryAction ? (
        <View style={styles.cta}>
          <VionaButton label={primaryAction.label} onPress={primaryAction.onPress} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: vionaSpacing.xl,
    paddingHorizontal: vionaSpacing.lg,
    gap: vionaSpacing.md,
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: vionaTrust.signalMutedBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vionaSpacing.xs,
  },
  iconRingOps: {
    backgroundColor: 'rgba(248, 250, 252, 0.1)',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
  },
  cta: {
    marginTop: vionaSpacing.sm,
    width: '100%',
    maxWidth: 280,
  },
});
