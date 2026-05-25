/**
 * Wave 3B — premium hub section anatomy (kicker/title/subtitle + content grid).
 * Avoids long dashboard row assumptions; compact spacing for mobile 390.
 */
import { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import {
  isPremiumShellMobile,
  premiumLuminousInk,
  premiumShellLayout,
  premiumUniverseAccentSpec,
  type VionaUniverseAccent,
} from '../../design/premiumTileVisualTokens';
import { FontFamily } from '../../theme/typography';

export type PremiumSectionProps = Readonly<{
  kicker?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  /** Kicker ink follows leading hub atmosphere; tile children may use other semantic accents. */
  leadingAccent?: VionaUniverseAccent;
  compact?: boolean;
  testID?: string;
}>;

export function PremiumSection({
  kicker,
  title,
  subtitle,
  action,
  children,
  leadingAccent = 'emerald',
  compact,
  testID,
}: PremiumSectionProps): ReactElement {
  const { width } = useWindowDimensions();
  const isMobile = isPremiumShellMobile(width);
  const isCompact = compact ?? isMobile;
  const kickerColor = premiumUniverseAccentSpec(leadingAccent).ink;

  return (
    <View
      testID={testID}
      style={[styles.root, isCompact && styles.rootCompact]}
    >
      {kicker ? (
        <Text style={[styles.kicker, { color: kickerColor }]} numberOfLines={1}>
          {kicker}
        </Text>
      ) : null}
      {title || action ? (
        <View style={styles.titleRow}>
          {title ? (
            <Text style={[styles.title, isCompact && styles.titleCompact]} numberOfLines={2}>
              {title}
            </Text>
          ) : (
            <View style={styles.titleFlex} />
          )}
          {action ? <View style={styles.actionSlot}>{action}</View> : null}
        </View>
      ) : null}
      {subtitle ? (
        <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]} numberOfLines={isMobile ? 3 : 2}>
          {subtitle}
        </Text>
      ) : null}
      {children ? <View style={[styles.content, isCompact && styles.contentCompact]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    gap: premiumShellLayout.sectionGapDefault,
  },
  rootCompact: {
    gap: premiumShellLayout.sectionGapMobile,
  },
  kicker: {
    fontSize: premiumShellLayout.sectionKickerSize,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  titleFlex: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: premiumShellLayout.sectionTitleSize,
    fontFamily: FontFamily.extrabold,
    color: premiumLuminousInk.titleBright,
    letterSpacing: -0.12,
  },
  titleCompact: {
    fontSize: 13,
  },
  actionSlot: {
    flexShrink: 0,
  },
  subtitle: {
    fontSize: premiumShellLayout.sectionSubtitleSize,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitle,
    lineHeight: 15,
  },
  subtitleCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  content: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    marginTop: 2,
  },
  contentCompact: {
    marginTop: 0,
  },
});
