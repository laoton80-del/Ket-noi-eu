import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';
import { VionaStatusPill } from './VionaStatusPill';

type FashionAccent = 'local' | 'travel' | 'academy' | 'business' | 'care';

type FashionStatusTone = 'lite' | 'pilot' | 'demo' | 'comingSoon' | 'safe';

const GRADIENTS: Readonly<Record<FashionAccent, readonly [string, string, string]>> = {
  local: [vionaTokens.fashionTech.worlds.local[0], vionaTokens.fashionTech.worlds.local[1], vionaTokens.fashionTech.worlds.local[2]],
  travel: [vionaTokens.fashionTech.worlds.travel[0], vionaTokens.fashionTech.worlds.travel[1], vionaTokens.fashionTech.worlds.travel[2]],
  academy: [vionaTokens.fashionTech.worlds.academy[0], vionaTokens.fashionTech.worlds.academy[1], vionaTokens.fashionTech.worlds.academy[2]],
  business: [vionaTokens.fashionTech.worlds.business[0], vionaTokens.fashionTech.worlds.business[1], vionaTokens.fashionTech.worlds.business[2]],
  care: [vionaTokens.fashionTech.worlds.care[0], vionaTokens.fashionTech.worlds.care[1], vionaTokens.fashionTech.worlds.care[2]],
};

export type VionaFashionWorldCardProps = Readonly<{
  title: string;
  subtitle: string;
  accent: FashionAccent;
  icon?: ReactNode;
  status?: { label: string; tone: FashionStatusTone };
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'heroRow' | 'grid';
}>;

export function VionaFashionWorldCard({
  title,
  subtitle,
  accent,
  icon,
  status,
  onPress,
  disabled = false,
  variant = 'grid',
}: VionaFashionWorldCardProps) {
  const grad = GRADIENTS[accent];
  const minH = variant === 'heroRow' ? 168 : 142;

  const inner = (
    <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.grad}>
      <View style={styles.rowShell}>
        <View style={styles.accentRail} />
        <View style={[styles.inner, { minHeight: minH }]}>
          <View style={styles.topRow}>
            {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
            <View style={styles.copy}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.sub}>{subtitle}</Text>
            </View>
          </View>
          {status ? (
            <View style={styles.pillRow}>
              <VionaStatusPill label={status.label} tone={status.tone} size="sm" />
            </View>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );

  if (!onPress) return <View style={disabled && styles.disabled}>{inner}</View>;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.pressWrap, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrap: {
    borderRadius: vionaTokens.radius.lg,
    overflow: 'hidden',
  },
  grad: {
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.champagneLine,
    overflow: 'hidden',
  },
  rowShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  accentRail: {
    width: 3,
    backgroundColor: vionaTokens.fashionTech.champagne,
    opacity: 0.9,
  },
  inner: {
    flex: 1,
    paddingHorizontal: vionaTokens.spacing[12],
    paddingVertical: vionaTokens.spacing[16],
    gap: vionaTokens.spacing[8],
  },
  topRow: {
    flexDirection: 'row',
    gap: vionaTokens.spacing[12],
    alignItems: 'flex-start',
  },
  iconSlot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.champagneLine,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vionaTokens.spacing[6],
  },
  title: {
    color: vionaTokens.fashionTech.inkOnDark,
    fontFamily: FontFamily.extrabold,
    fontSize: 16,
    lineHeight: 21,
  },
  sub: {
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  pillRow: {
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.52,
  },
  pressed: {
    opacity: 0.92,
  },
});
