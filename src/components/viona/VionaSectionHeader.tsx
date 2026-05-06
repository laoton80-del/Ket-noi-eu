import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { type VionaSurfaceVariant, vionaOps, vionaPremium, vionaTrust } from './vionaTrustTokens';

export type VionaSectionHeaderProps = Readonly<{
  title: string;
  subtitle?: string;
  /** Small uppercase line above title */
  kicker?: string;
  /** Typography colors follow surface mode */
  mode?: Extract<VionaSurfaceVariant, 'light' | 'premium' | 'ops'>;
  /** Larger title for hub hero intros */
  emphasis?: 'default' | 'hero';
}>;

export function VionaSectionHeader({
  title,
  subtitle,
  kicker,
  mode = 'light',
  emphasis = 'default',
}: VionaSectionHeaderProps): ReactElement {
  const pal =
    mode === 'ops'
      ? {
          kicker: vionaOps.accent,
          title: vionaOps.text,
          sub: vionaOps.textMuted,
        }
      : mode === 'premium'
        ? {
            kicker: vionaPremium.ribbonGold,
            title: vionaPremium.headerInk,
            sub: vionaTrust.inkMuted,
          }
        : {
            kicker: vionaTrust.accentGold,
            title: vionaTrust.ink,
            sub: vionaTrust.inkMuted,
          };

  return (
    <View style={styles.wrap}>
      {kicker ? (
        <Text style={[styles.kicker, { color: pal.kicker }]}>{kicker}</Text>
      ) : null}
      <Text style={[styles.title, emphasis === 'hero' && styles.titleHero, { color: pal.title }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sub, emphasis === 'hero' && styles.subHero, { color: pal.sub }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
    gap: 4,
  },
  kicker: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    letterSpacing: -0.2,
  },
  titleHero: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.35,
  },
  sub: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  subHero: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});
