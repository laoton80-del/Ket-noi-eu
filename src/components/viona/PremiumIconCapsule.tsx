/**
 * Wave 3B — semantic icon capsule (visual primitive only).
 * Emerald ≠ paid/settled. Gold ≠ commercial/payout. Magenta ≠ dispatch/rescue.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  premiumIconCapsuleSize,
  premiumSemanticGlow,
  premiumTileGlass,
  premiumTileIconCapsule,
  premiumTileLayout,
  premiumUniverseAccentSpec,
  premiumUniverseInk,
  premiumUniverseStroke,
  type PremiumTileSize,
  type PremiumTileState,
  type VionaUniverseAccent,
} from '../../design/premiumTileVisualTokens';

const INK_MUTED = 'rgba(226, 232, 240, 0.55)';

export type PremiumIconCapsuleProps = Readonly<{
  accent: VionaUniverseAccent;
  icon?: keyof typeof Ionicons.glyphMap;
  renderIcon?: () => ReactNode;
  size?: PremiumTileSize;
  capsuleSize?: number;
  iconSize?: number;
  tileState?: PremiumTileState;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>;

export function PremiumIconCapsule({
  accent,
  icon,
  renderIcon,
  size = 'compact',
  capsuleSize,
  iconSize,
  tileState = 'default',
  disabled = false,
  style,
  accessibilityLabel,
}: PremiumIconCapsuleProps): ReactElement {
  const resolvedState: PremiumTileState = disabled ? 'disabled' : tileState;
  const spec = premiumUniverseAccentSpec(accent);
  const hovered = resolvedState === 'hovered' || resolvedState === 'pressed';
  const dimmed = disabled || resolvedState === 'disabled';
  const side = capsuleSize ?? premiumIconCapsuleSize(size);
  const glyphSize =
    iconSize ?? (size === 'quickHelp' ? premiumTileLayout.iconSizeQuickHelp : premiumTileLayout.iconSize);
  const ink = dimmed ? INK_MUTED : premiumUniverseInk(accent, resolvedState);
  const stroke = dimmed ? premiumTileGlass.borderDefault : premiumUniverseStroke(accent, resolvedState);
  const fill = dimmed
    ? 'rgba(148, 163, 184, 0.08)'
    : hovered
      ? spec.iconCapsuleFillHover
      : spec.iconCapsuleFill;
  const glow = premiumSemanticGlow(accent, resolvedState);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.capsule,
        {
          width: side,
          height: side,
          borderRadius: Math.round(side * 0.27),
          borderColor: stroke,
          borderWidth: premiumTileIconCapsule.borderWidth,
          backgroundColor: fill,
          shadowColor: glow,
          shadowOpacity: hovered ? premiumTileIconCapsule.shadowOpacityHover : premiumTileIconCapsule.shadowOpacityDefault,
          shadowRadius: hovered ? premiumTileIconCapsule.shadowRadiusHover : premiumTileIconCapsule.shadowRadiusDefault,
          shadowOffset: { width: 0, height: 0 },
          opacity: dimmed ? 0.72 : 1,
        },
        style,
      ]}
    >
      {renderIcon ? (
        renderIcon()
      ) : icon ? (
        <Ionicons name={icon} size={glyphSize} color={ink} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
