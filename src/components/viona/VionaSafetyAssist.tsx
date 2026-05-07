import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { VionaStatusPill } from './VionaStatusPill';
import { VionaSurface } from './VionaSurface';

type VionaSafetyMode = 'lite' | 'pilot' | 'ready';

export type VionaSafetyAssistProps = Readonly<{
  label: string;
  subtitle?: string;
  onPress: () => void;
  mode: VionaSafetyMode;
  compact?: boolean;
}>;

const modeMap: Record<VionaSafetyMode, { label: string; tone: 'lite' | 'pilot' | 'safe' }> = {
  lite: { label: 'LITE', tone: 'lite' },
  pilot: { label: 'PILOT', tone: 'pilot' },
  ready: { label: 'READY', tone: 'safe' },
};

export function VionaSafetyAssist({
  label,
  subtitle,
  onPress,
  mode,
  compact = false,
}: VionaSafetyAssistProps) {
  const modeConfig = modeMap[mode];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <VionaSurface
        variant="impact"
        style={[
          styles.surface,
          compact && styles.surfaceCompact,
          { borderColor: 'rgba(200, 75, 90, 0.28)' },
        ]}
      >
        <View style={styles.row}>
          <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
            {label}
          </Text>
          <VionaStatusPill label={modeConfig.label} tone={modeConfig.tone} size={compact ? 'sm' : 'md'} />
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </VionaSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    paddingVertical: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[12],
  },
  surfaceCompact: {
    paddingVertical: vionaTokens.spacing[8],
    paddingHorizontal: vionaTokens.spacing[8],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: vionaTokens.spacing[8],
  },
  label: {
    color: vionaTokens.colors.ink,
    ...vionaTokens.typography.title,
    flex: 1,
  },
  labelCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    marginTop: vionaTokens.spacing[6],
    color: vionaTokens.colors.muted,
    ...vionaTokens.typography.meta,
  },
  subtitleCompact: {
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.9,
  },
});
