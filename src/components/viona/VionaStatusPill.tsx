import { StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';

type VionaStatusTone =
  | 'lite'
  | 'pilot'
  | 'demo'
  | 'request'
  | 'gated'
  | 'comingSoon'
  | 'safe'
  | 'warning';

type VionaStatusSize = 'sm' | 'md';

export type VionaStatusPillProps = Readonly<{
  label: string;
  tone: VionaStatusTone;
  size?: VionaStatusSize;
}>;

const toneStyleMap: Record<VionaStatusTone, { bg: string; border: string; fg: string }> = {
  lite: { bg: 'rgba(33, 81, 154, 0.1)', border: 'rgba(33, 81, 154, 0.22)', fg: vionaTokens.colors.blue },
  pilot: { bg: 'rgba(26, 143, 160, 0.12)', border: 'rgba(26, 143, 160, 0.26)', fg: vionaTokens.colors.teal },
  demo: { bg: 'rgba(24, 60, 115, 0.1)', border: 'rgba(24, 60, 115, 0.22)', fg: vionaTokens.colors.indigo },
  request: { bg: 'rgba(230, 124, 106, 0.12)', border: 'rgba(230, 124, 106, 0.25)', fg: vionaTokens.colors.coral },
  gated: { bg: 'rgba(23, 49, 90, 0.12)', border: 'rgba(23, 49, 90, 0.25)', fg: vionaTokens.colors.softInk },
  comingSoon: { bg: 'rgba(201, 138, 46, 0.12)', border: 'rgba(201, 138, 46, 0.3)', fg: vionaTokens.colors.warning },
  safe: { bg: 'rgba(14, 159, 110, 0.12)', border: 'rgba(14, 159, 110, 0.3)', fg: vionaTokens.colors.success },
  warning: { bg: 'rgba(200, 75, 90, 0.12)', border: 'rgba(200, 75, 90, 0.3)', fg: vionaTokens.colors.safetyRed },
};

const sizeStyleMap: Record<VionaStatusSize, { padX: number; padY: number; fontSize: number }> = {
  sm: { padX: vionaTokens.spacing[8], padY: vionaTokens.spacing[4], fontSize: 10 },
  md: { padX: vionaTokens.spacing[12], padY: vionaTokens.spacing[6], fontSize: 11 },
};

export function VionaStatusPill({ label, tone, size = 'sm' }: VionaStatusPillProps) {
  const toneStyle = toneStyleMap[tone];
  const sizeStyle = sizeStyleMap[size];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: toneStyle.bg,
          borderColor: toneStyle.border,
          paddingHorizontal: sizeStyle.padX,
          paddingVertical: sizeStyle.padY,
        },
      ]}
    >
      <Text style={[styles.text, { color: toneStyle.fg, fontSize: sizeStyle.fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: vionaTokens.radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.35,
  },
});
