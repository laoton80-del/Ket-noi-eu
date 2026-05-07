import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { VionaButton } from './VionaButton';
import { VionaSurface } from './VionaSurface';

type ModalAction = Readonly<{
  label: string;
  onPress: () => void;
}>;

export type VionaModalSurfaceProps = Readonly<{
  title: string;
  subtitle?: string;
  children: ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  onDismiss?: () => void;
}>;

export function VionaModalSurface({
  title,
  subtitle,
  children,
  primaryAction,
  secondaryAction,
  onDismiss,
}: VionaModalSurfaceProps) {
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <VionaSurface variant="elevated" style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
        <View style={styles.actions}>
          {primaryAction ? (
            <VionaButton variant="primary" size="md" onPress={primaryAction.onPress}>
              {primaryAction.label}
            </VionaButton>
          ) : null}
          {secondaryAction ? (
            <VionaButton variant="secondary" size="md" onPress={secondaryAction.onPress}>
              {secondaryAction.label}
            </VionaButton>
          ) : null}
        </View>
      </VionaSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: vionaTokens.spacing[20],
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 24, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 410,
    borderRadius: vionaTokens.radius.xxl,
    paddingHorizontal: vionaTokens.spacing[20],
    paddingVertical: vionaTokens.spacing[20],
  },
  title: {
    color: vionaTokens.colors.ink,
    ...vionaTokens.typography.h2,
  },
  subtitle: {
    marginTop: vionaTokens.spacing[6],
    color: vionaTokens.colors.muted,
    ...vionaTokens.typography.body,
  },
  body: {
    marginTop: vionaTokens.spacing[16],
  },
  actions: {
    marginTop: vionaTokens.spacing[16],
    gap: vionaTokens.spacing[8],
  },
});
