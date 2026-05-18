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
}: TravelAppTileProps): ReactElement {
  const tokens = travelSemanticTokens(accent);
  const isQuickHelp = variant === 'quickHelp';
  const iconSize = isQuickHelp ? 22 : 20;
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
      contentStyle={isQuickHelp ? styles.quickHelpInner : styles.tileInner}
      style={isQuickHelp ? styles.quickHelpCard : styles.tileCard}
    >
      <View style={styles.stack}>
        <TravelIconCapsule
          icon={icon}
          ink={tokens.ink}
          accent={accent}
          accentSecondary={accentSecondary}
          size={iconSize}
          prominent={isQuickHelp}
          intensity={isQuickHelp ? 'primary' : 'standard'}
        />
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {statusLabel ? (
              <Text
                style={[
                  styles.statusPill,
                  accent === 'magenta' && styles.statusPillEmergency,
                  { color: tokens.ink, borderColor: tokens.stroke },
                ]}
              >
                {statusLabel}
              </Text>
            ) : null}
          </View>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={isQuickHelp ? 2 : 2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </TravelGlassCard>
  );
}

const styles = StyleSheet.create({
  tileCard: {
    width: '100%',
    minHeight: 44,
  },
  quickHelpCard: {
    width: '100%',
    minHeight: 112,
  },
  tileInner: {
    minHeight: 108,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  quickHelpInner: {
    minHeight: 112,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  stack: {
    gap: 10,
    alignItems: 'flex-start',
  },
  textBlock: {
    width: '100%',
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  title: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.16,
    lineHeight: 17,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 14,
    opacity: 0.94,
  },
  statusPill: {
    fontSize: 8,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  statusPillEmergency: {
    borderColor: 'rgba(255, 120, 155, 0.78)',
    backgroundColor: 'rgba(255, 110, 140, 0.16)',
    textShadowColor: travelSemanticTokens('magenta').glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
