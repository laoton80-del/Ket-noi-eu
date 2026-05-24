/**
 * Wave 3B — text status chip (visual primitive only).
 * Color accents universe meaning; label text is required — never icon-only status.
 */
import type { ReactElement } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { FontFamily } from '../../theme/typography';
import {
  premiumTileLayout,
  premiumTileStatusChip,
  premiumUniverseAccentSpec,
  premiumUniverseInk,
  premiumUniverseStroke,
  type PremiumTileState,
  type VionaUniverseAccent,
} from '../../design/premiumTileVisualTokens';

export type PremiumStatusChipProps = Readonly<{
  accent: VionaUniverseAccent;
  label: string;
  tileState?: PremiumTileState;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function PremiumStatusChip({
  accent,
  label,
  tileState = 'default',
  disabled = false,
  style,
}: PremiumStatusChipProps): ReactElement {
  const resolvedState: PremiumTileState = disabled ? 'disabled' : tileState;
  const spec = premiumUniverseAccentSpec(accent);
  const hovered = resolvedState === 'hovered' || resolvedState === 'pressed';
  const fill = hovered ? spec.statusFillHover : spec.statusFill;
  const stroke = premiumUniverseStroke(accent, resolvedState);
  const ink = premiumUniverseInk(accent, resolvedState);

  return (
    <View
      style={[
        styles.chip,
        {
          borderColor: stroke,
          borderWidth: premiumTileStatusChip.borderWidth,
          backgroundColor: fill,
          opacity: disabled ? 0.72 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: ink,
            fontSize: premiumTileLayout.statusFontSize,
            lineHeight: premiumTileLayout.statusLineHeight,
          },
        ]}
        numberOfLines={1}
        accessibilityRole="text"
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexShrink: 1,
    maxWidth: '58%',
    paddingHorizontal: premiumTileStatusChip.paddingHorizontal,
    paddingVertical: premiumTileStatusChip.paddingVertical,
    borderRadius: premiumTileStatusChip.borderRadius,
  },
  label: {
    fontFamily: FontFamily.extrabold,
    letterSpacing: premiumTileStatusChip.letterSpacing,
    textTransform: premiumTileStatusChip.textTransform,
  },
});
