import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { VionaStatusPill } from './VionaStatusPill';
import { VionaSurface } from './VionaSurface';

type VionaUniverseAccent = 'local' | 'travel' | 'academy' | 'ai' | 'safety';

const accentMap: Record<VionaUniverseAccent, string> = {
  local: vionaTokens.colors.blue,
  travel: vionaTokens.colors.indigo,
  academy: vionaTokens.colors.teal,
  ai: vionaTokens.colors.coral,
  safety: vionaTokens.colors.safetyRed,
};

type StatusToneProps = Parameters<typeof VionaStatusPill>[0]['tone'];

export type VionaUniverseCardProps = Readonly<{
  title: string;
  subtitle: string;
  icon?: ReactNode;
  status?: { label: string; tone: StatusToneProps };
  onPress?: () => void;
  accent: VionaUniverseAccent;
  disabled?: boolean;
}>;

export function VionaUniverseCard({
  title,
  subtitle,
  icon,
  status,
  onPress,
  accent,
  disabled = false,
}: VionaUniverseCardProps) {
  const content = (
    <VionaSurface variant="elevated" style={[styles.surface, disabled && styles.disabled]}>
      <View style={[styles.accentBar, { backgroundColor: accentMap[accent] }]} />
      <View style={styles.row}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <View style={styles.copyWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {status ? <VionaStatusPill label={status.label} tone={status.tone} size="sm" /> : null}
        </View>
      </View>
    </VionaSurface>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && !disabled && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    paddingTop: vionaTokens.spacing[12],
    paddingBottom: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[12],
  },
  accentBar: {
    height: 3,
    borderRadius: vionaTokens.radius.pill,
    marginBottom: vionaTokens.spacing[12],
  },
  row: {
    flexDirection: 'row',
    gap: vionaTokens.spacing[12],
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyWrap: {
    flex: 1,
    gap: vionaTokens.spacing[6],
  },
  title: {
    color: vionaTokens.colors.ink,
    ...vionaTokens.typography.title,
  },
  subtitle: {
    color: vionaTokens.colors.muted,
    ...vionaTokens.typography.meta,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
  },
});
