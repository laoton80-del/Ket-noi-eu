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
  lite: {
    bg: 'rgba(112, 200, 255, 0.12)',
    border: 'rgba(112, 200, 255, 0.32)',
    fg: vionaTokens.fashionTech.statusLite,
  },
  pilot: {
    bg: 'rgba(46, 207, 155, 0.12)',
    border: 'rgba(46, 207, 155, 0.3)',
    fg: vionaTokens.fashionTech.statusPilot,
  },
  demo: {
    bg: 'rgba(168, 141, 255, 0.14)',
    border: 'rgba(168, 141, 255, 0.34)',
    fg: vionaTokens.fashionTech.statusDemo,
  },
  request: { bg: 'rgba(230, 124, 106, 0.12)', border: 'rgba(230, 124, 106, 0.25)', fg: vionaTokens.colors.coral },
  gated: { bg: 'rgba(23, 49, 90, 0.12)', border: 'rgba(23, 49, 90, 0.25)', fg: vionaTokens.colors.softInk },
  comingSoon: {
    bg: 'rgba(201, 169, 98, 0.12)',
    border: 'rgba(201, 169, 98, 0.3)',
    fg: vionaTokens.fashionTech.statusComingSoon,
  },
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
