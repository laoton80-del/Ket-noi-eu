import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { VionaStatusPill } from './VionaStatusPill';
import { VionaSurface } from './VionaSurface';

type VionaUniverseAccent = 'local' | 'travel' | 'academy' | 'ai' | 'safety';

function pastelBackground(accent: VionaUniverseAccent): string {
  if (accent === 'safety') return vionaTokens.colors.safety.bg;
  return vionaTokens.colors.universe[accent].bg;
}

function accentColor(accent: VionaUniverseAccent): string {
  if (accent === 'safety') return vionaTokens.colors.safety.accent;
  return vionaTokens.colors.universe[accent].accent;
}

type StatusToneProps = Parameters<typeof VionaStatusPill>[0]['tone'];

export type VionaUniverseCardProps = Readonly<{
  title: string;
  subtitle: string;
  icon?: ReactNode;
  status?: { label: string; tone: StatusToneProps };
  onPress?: () => void;
  accent: VionaUniverseAccent;
  disabled?: boolean;
  /** Editorial flagship — glass surface, accent rail, strong icon well (World Stage). */
  layout?: 'default' | 'worldStage';
}>;

export function VionaUniverseCard({
  title,
  subtitle,
  icon,
  status,
  onPress,
  accent,
  disabled = false,
  layout = 'default',
}: VionaUniverseCardProps) {
  const bar = accentColor(accent);
  const fill = pastelBackground(accent);
  const isStage = layout === 'worldStage';

  const content = isStage ? (
    <VionaSurface
      variant="hero"
      style={[
        styles.surfaceStage,
        {
          borderColor: 'rgba(15, 23, 42, 0.12)',
          borderLeftColor: bar,
          borderLeftWidth: 4,
        },
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.rowStage}>
        {icon ? (
          <View style={[styles.iconWell, { borderColor: `${bar}66`, backgroundColor: `${bar}14` }]}>{icon}</View>
        ) : null}
        <View style={styles.copyWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitleStage}>{subtitle}</Text>
          {status ? <VionaStatusPill label={status.label} tone={status.tone} size="sm" /> : null}
        </View>
      </View>
    </VionaSurface>
  ) : (
    <VionaSurface
      variant="elevated"
      style={[
        styles.surface,
        {
          backgroundColor: fill,
          borderColor: `${bar}55`,
        },
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: bar }]} />
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
  surfaceStage: {
    paddingVertical: vionaTokens.spacing[16],
    paddingHorizontal: vionaTokens.spacing[16],
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
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
  rowStage: {
    flexDirection: 'row',
    gap: vionaTokens.spacing[16],
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    ...vionaTokens.shadows.soft,
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
  subtitleStage: {
    color: vionaTokens.colors.softInk,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
  },
});
