import { Ionicons } from '@expo/vector-icons';
import { type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { vionaSpacing, vionaTouchMin, vionaPressedOpacity } from './vionaDesignTokens';
import { vionaOps, vionaPremium, vionaTrust } from './vionaTrustTokens';

export type VionaHeaderVariant = 'light' | 'premium' | 'ops';

export type VionaHeaderProps = Readonly<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backA11yLabel?: string;
  rightSlot?: ReactNode;
  variant?: VionaHeaderVariant;
  /** Default left for long titles; center for tab-style chrome */
  titleAlign?: 'left' | 'center';
}>;

function palette(mode: VionaHeaderVariant): Readonly<{ ink: string; muted: string; chevron: string }> {
  if (mode === 'ops') {
    return { ink: vionaOps.text, muted: vionaOps.textMuted, chevron: vionaOps.text };
  }
  if (mode === 'premium') {
    return { ink: vionaPremium.headerInk, muted: vionaTrust.inkMuted, chevron: vionaPremium.headerInk };
  }
  return { ink: vionaTrust.ink, muted: vionaTrust.inkMuted, chevron: vionaTrust.ink };
}

export function VionaHeader({
  title,
  subtitle,
  onBack,
  backA11yLabel = 'Back',
  rightSlot,
  variant = 'light',
  titleAlign = 'left',
}: VionaHeaderProps): ReactElement {
  const pal = palette(variant);
  const centerTitle = titleAlign === 'center';

  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backA11yLabel}
          hitSlop={10}
          style={({ pressed }) => [styles.sideSlot, pressed && { opacity: vionaPressedOpacity }]}
        >
          <Ionicons name="chevron-back" size={24} color={pal.chevron} />
        </Pressable>
      ) : (
        <View style={styles.sideSlot} />
      )}

      <View style={[styles.titleBlock, centerTitle && styles.titleBlockCenter]}>
        <Text
          style={[styles.title, { color: pal.ink }, centerTitle && styles.titleCenter]}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sub, { color: pal.muted }, centerTitle && styles.subCenter]} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.sideSlot}>{rightSlot ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: vionaSpacing.sm,
    paddingVertical: vionaSpacing.sm,
    minHeight: vionaTouchMin,
  },
  sideSlot: {
    width: vionaTouchMin,
    minHeight: vionaTouchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: vionaSpacing.xs,
  },
  titleBlockCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    letterSpacing: -0.2,
  },
  titleCenter: {
    textAlign: 'center',
    width: '100%',
  },
  sub: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  subCenter: {
    textAlign: 'center',
    width: '100%',
  },
});
