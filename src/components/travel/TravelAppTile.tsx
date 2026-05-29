import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { localConstellation } from '../local/localConstellationTokens';
import {
  TravelGlassCard,
  TravelIconCapsule,
  travelSemanticTokens,
  type TravelSemanticAccent,
} from './TravelGlassCard';

const INK = localConstellation.inkStrong;
const INK_SUB = localConstellation.inkCardSub;

/** Pack 3 — compact scenario tiles at desktop; quick-help stays hero-adjacent. */
export function travelAppTileMetrics(viewportWidth: number): Readonly<{
  scenarioMinHeight: number;
  quickHelpMinHeight: number;
  scenarioPaddingV: number;
  quickHelpPaddingV: number;
  iconSize: number;
  quickHelpIconSize: number;
}> {
  if (viewportWidth >= 1024) {
    return {
      scenarioMinHeight: 100,
      quickHelpMinHeight: 108,
      scenarioPaddingV: 10,
      quickHelpPaddingV: 12,
      iconSize: 19,
      quickHelpIconSize: 21,
    };
  }
  if (viewportWidth >= 768) {
    return {
      scenarioMinHeight: 104,
      quickHelpMinHeight: 110,
      scenarioPaddingV: 11,
      quickHelpPaddingV: 13,
      iconSize: 20,
      quickHelpIconSize: 22,
    };
  }
  return {
    scenarioMinHeight: 108,
    quickHelpMinHeight: 112,
    scenarioPaddingV: 12,
    quickHelpPaddingV: 14,
    iconSize: 20,
    quickHelpIconSize: 22,
  };
}

export type TravelAppTileVariant = 'standard' | 'quickHelp';

export type TravelAppTileProps = Readonly<{
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelSemanticAccent;
  accentSecondary?: TravelSemanticAccent;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  variant?: TravelAppTileVariant;
  statusLabel?: string;
  /** Responsive min-height / padding overrides from travelAppTileMetrics. */
  layoutMetrics?: ReturnType<typeof travelAppTileMetrics>;
}>;

export function TravelAppTile({
  title,
  subtitle,
  icon,
  accent,
  accentSecondary,
  onPress,
  accessibilityLabel,
  testID,
  variant = 'standard',
  statusLabel,
  layoutMetrics,
}: TravelAppTileProps): ReactElement {
  const tokens = travelSemanticTokens(accent);
  const isQuickHelp = variant === 'quickHelp';
  const metrics = layoutMetrics ?? travelAppTileMetrics(390);
  const minHeight = isQuickHelp ? metrics.quickHelpMinHeight : metrics.scenarioMinHeight;
  const paddingV = isQuickHelp ? metrics.quickHelpPaddingV : metrics.scenarioPaddingV;
  const iconSize = isQuickHelp ? metrics.quickHelpIconSize : metrics.iconSize;
  const a11y = accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title);

  return (
    <TravelGlassCard
      testID={testID}
      visual={isQuickHelp ? 'quickHelp' : 'standard'}
      accent={accent}
      intensity={isQuickHelp ? 'primary' : 'standard'}
      compact
      onPress={onPress}
      accessibilityLabel={a11y}
      contentStyle={[
        styles.tileInnerBase,
        {
          minHeight,
          paddingVertical: paddingV,
        },
      ]}
      style={[styles.tileCardBase, { minHeight }]}
    >
      <View style={[styles.stack, isQuickHelp ? styles.stackQuickHelp : styles.stackScenario]}>
        <View style={styles.iconRow}>
          <TravelIconCapsule
            icon={icon}
            ink={tokens.ink}
            accent={accent}
            accentSecondary={accentSecondary}
            size={iconSize}
            prominent={isQuickHelp}
            intensity={isQuickHelp ? 'primary' : 'standard'}
          />
          {statusLabel ? (
            <Text
              style={[
                styles.statusPill,
                accent === 'magenta' && styles.statusPillEmergency,
                {
                  color: tokens.ink,
                  borderColor: tokens.stroke,
                  backgroundColor: tokens.statusFill,
                  textShadowColor: tokens.glow,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                },
              ]}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
          ) : null}
        </View>
        <View style={styles.textBlock}>
          <Text
            style={[
              styles.title,
              {
                textShadowColor: tokens.glow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: isQuickHelp ? 10 : 7,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </TravelGlassCard>
  );
}

const styles = StyleSheet.create({
  tileCardBase: {
    width: '100%',
    minHeight: 44,
  },
  tileInnerBase: {
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  stack: {
    alignItems: 'flex-start',
    width: '100%',
  },
  stackScenario: {
    gap: 8,
  },
  stackQuickHelp: {
    gap: 9,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
    minHeight: 44,
  },
  textBlock: {
    width: '100%',
    gap: 3,
    minWidth: 0,
  },
  title: {
    width: '100%',
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.18,
    lineHeight: 17,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 14,
    opacity: 0.96,
  },
  statusPill: {
    flexShrink: 1,
    maxWidth: '52%',
    fontSize: 7.5,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    textAlign: 'right',
  },
  statusPillEmergency: {
    borderColor: 'rgba(255, 120, 155, 0.78)',
    backgroundColor: 'rgba(255, 110, 140, 0.16)',
    textShadowColor: travelSemanticTokens('magenta').glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
