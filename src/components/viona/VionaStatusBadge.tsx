import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { vionaSpacing } from './vionaDesignTokens';
import { vionaOps, vionaPremium, vionaTrust } from './vionaTrustTokens';

/** Aligns with `miniAppRegistry` readiness / status vocabulary */
export type VionaMiniAppStatus =
  | 'active'
  | 'lite'
  | 'beta'
  | 'pilot'
  | 'demo'
  | 'gated'
  | 'frozen'
  | 'comingSoon';

export type VionaStatusBadgeProps = Readonly<{
  status: VionaMiniAppStatus;
  /** Surface behind badge — affects contrast */
  mode?: 'light' | 'premium' | 'ops';
}>;

function labelFor(status: VionaMiniAppStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'lite':
      return 'Lite';
    case 'beta':
      return 'Beta';
    case 'pilot':
      return 'Pilot';
    case 'demo':
      return 'Demo';
    case 'gated':
      return 'Gated';
    case 'frozen':
      return 'Paused';
    case 'comingSoon':
      return 'Soon';
  }
}

function colors(
  status: VionaMiniAppStatus,
  mode: 'light' | 'premium' | 'ops'
): Readonly<{ bg: string; border: string; text: string }> {
  if (mode === 'ops') {
    return {
      bg: 'rgba(248, 250, 252, 0.08)',
      border: vionaOps.border,
      text: vionaOps.text,
    };
  }
  if (status === 'demo' || status === 'pilot') {
    return {
      bg: 'rgba(37, 99, 235, 0.12)',
      border: 'rgba(37, 99, 235, 0.35)',
      text: vionaTrust.signal,
    };
  }
  if (status === 'gated' || status === 'frozen') {
    return {
      bg: 'rgba(100, 116, 139, 0.12)',
      border: 'rgba(100, 116, 139, 0.35)',
      text: vionaTrust.inkMuted,
    };
  }
  if (status === 'comingSoon') {
    return {
      bg: vionaTrust.surfaceMuted,
      border: vionaTrust.border,
      text: vionaTrust.inkMuted,
    };
  }
  if (status === 'beta') {
    return {
      bg: 'rgba(200, 164, 77, 0.14)',
      border: vionaPremium.ribbonGold,
      text: mode === 'premium' ? vionaPremium.headerInk : vionaTrust.ink,
    };
  }
  if (status === 'active') {
    return {
      bg: 'rgba(34, 197, 94, 0.12)',
      border: 'rgba(22, 163, 74, 0.45)',
      text: '#166534',
    };
  }
  /* lite */
  return {
    bg: vionaTrust.surfaceMuted,
    border: vionaTrust.border,
    text: vionaTrust.ink,
  };
}

export function VionaStatusBadge({ status, mode = 'light' }: VionaStatusBadgeProps): ReactElement {
  const pal = colors(status, mode);
  return (
    <View style={[styles.wrap, { backgroundColor: pal.bg, borderColor: pal.border }]}>
      <Text style={[styles.text, { color: pal.text }]} accessibilityLabel={`Status ${labelFor(status)}`}>
        {labelFor(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: vionaSpacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
