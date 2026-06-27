/**
 * Travel "Tình huống du lịch" compact inline glass tile — shared universe shortcut primitive.
 * UI-only; preserves navigation handlers from callers.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ComponentProps, type ReactElement } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  premiumLuminousInk,
  premiumSemanticGlow,
  premiumUniverseAccentSpec,
  type VionaUniverseAccent,
} from '../../design/premiumTileVisualTokens';
import { VIONA_COMPACT_SITUATION_INLINE_GAP_PX } from '../../design/vionaCompactSituationTileLayout';
import { FontFamily } from '../../theme/typography';

export type VionaCompactSituationQuickAccent = 'gold' | 'cyan' | 'emerald' | 'violet' | 'blue' | 'sos';

export function vionaCompactSituationQuickAccentToUniverse(
  accent: VionaCompactSituationQuickAccent
): VionaUniverseAccent {
  if (accent === 'sos') return 'magenta';
  if (accent === 'blue') return 'cyan';
  return accent;
}

export type VionaCompactSituationTileProps = Readonly<{
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: VionaUniverseAccent;
  onPress: () => void;
  fill?: boolean;
  minHeight?: number;
  paddingHorizontal?: number;
  capsuleSize?: number;
  iconSize?: number;
  titleLines?: 1 | 2;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}>;

function compactTileWebFrameStyle(
  accent: VionaUniverseAccent,
  active: boolean
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const spec = premiumUniverseAccentSpec(accent);
  const stroke = active ? spec.strokeHover : spec.stroke;
  const glow = active ? spec.glowHover : spec.glow;
  return {
    boxShadow: active
      ? `inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 1px ${stroke}, 0 0 14px ${glow}, 0 2px 6px rgba(8, 18, 32, 0.22)`
      : `inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 0 0 1px ${stroke}, 0 0 10px ${glow}, 0 2px 5px rgba(8, 18, 32, 0.18)`,
    transition:
      'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease-out, border-color 200ms ease-out, background-color 200ms ease-out',
  } as ViewStyle;
}

export function VionaCompactSituationTile({
  label,
  icon,
  accent,
  onPress,
  fill = false,
  minHeight = 44,
  paddingHorizontal = 12,
  capsuleSize = 24,
  iconSize = 12,
  titleLines = 1,
  testID,
  accessibilityLabel,
  style,
}: VionaCompactSituationTileProps): ReactElement {
  const [active, setActive] = useState(false);
  const spec = premiumUniverseAccentSpec(accent);
  const accentStroke = active ? spec.strokeHover : spec.stroke;
  const accentGlassFill = active ? spec.glowHover : spec.glow;
  const iconColor = active ? spec.inkHover : spec.ink;
  const cardWebFrameStyle = compactTileWebFrameStyle(accent, active);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.card,
        fill ? styles.cardFill : null,
        {
          minHeight,
          height: minHeight,
          maxHeight: minHeight,
          paddingHorizontal,
          borderColor: accentStroke,
          backgroundColor: accentGlassFill,
        },
        cardWebFrameStyle,
        style,
        Platform.OS === 'web' &&
          ({
            transform: pressed
              ? [{ scale: 0.985 }]
              : active
                ? [{ translateY: -1 }, { scale: 1.003 }]
                : [],
          } as object),
        Platform.OS !== 'web' && (active || pressed) && styles.cardActive,
        Platform.OS !== 'web' && pressed && { opacity: 0.92 },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[spec.cornerWash, spec.cornerWashHover, 'transparent']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.accentTint}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.11)', 'rgba(255, 255, 255, 0.03)', 'transparent']}
        locations={[0, 0.18, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.fxSheen}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.innerHighlight}
      />
      <View style={[styles.inlineRow, { gap: VIONA_COMPACT_SITUATION_INLINE_GAP_PX }]}>
        <View style={[styles.iconStack, { width: capsuleSize, height: capsuleSize }]}>
          <View
            style={[
              styles.iconCapsule,
              {
                width: capsuleSize,
                height: capsuleSize,
                borderRadius: capsuleSize / 2,
                borderColor: accentStroke,
                shadowColor: premiumSemanticGlow(accent, active ? 'hovered' : 'default'),
              },
            ]}
          >
            <Ionicons name={icon} size={iconSize} color={iconColor} accessibilityIgnoresInvertColors />
          </View>
        </View>
        <Text style={styles.titleInline} numberOfLines={titleLines}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1.35,
    backgroundColor: 'rgba(6, 12, 24, 0.42)',
    justifyContent: 'center',
    minWidth: 0,
  },
  cardFill: {
    width: '100%',
    flex: 1,
  },
  cardActive: {
    borderColor: 'rgba(132, 238, 255, 0.38)',
  },
  accentTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    opacity: 0.76,
  },
  fxSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    opacity: 0.74,
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    opacity: 0.68,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    minHeight: 0,
    paddingVertical: 1,
  },
  iconStack: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconCapsule: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    backgroundColor: 'rgba(4, 10, 18, 0.18)',
    zIndex: 1,
    overflow: 'hidden',
  },
  titleInline: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.titleBright,
    lineHeight: 12,
  },
});
