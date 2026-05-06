import { Ionicons } from '@expo/vector-icons';
import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { type VionaSurfaceVariant } from './vionaTrustTokens';
import { vionaRadius, vionaSpacing, vionaPressedOpacity } from './vionaDesignTokens';
import { vionaPremium, vionaTrust } from './vionaTrustTokens';
import { VionaCard } from './VionaCard';
import { VionaStatusBadge, type VionaMiniAppStatus } from './VionaStatusBadge';

export type VionaMiniAppCardLayout = 'full' | 'compact';

export type VionaMiniAppCardProps = Readonly<{
  title: string;
  description: string;
  /** Small label above title row */
  kicker?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  status: VionaMiniAppStatus;
  tags?: readonly string[];
  onPress: () => void;
  layout?: VionaMiniAppCardLayout;
  /** `premium` uses navy-tinted card border */
  surfaceVariant?: Extract<VionaSurfaceVariant, 'light' | 'muted' | 'premium'>;
  accessibilityHint?: string;
}>;

function iconColor(surfaceVariant: Extract<VionaSurfaceVariant, 'light' | 'muted' | 'premium'>): string {
  return surfaceVariant === 'premium' ? vionaPremium.headerInk : vionaTrust.signal;
}

export function VionaMiniAppCard({
  title,
  description,
  kicker,
  iconName,
  status,
  tags,
  onPress,
  layout = 'full',
  surfaceVariant = 'light',
  accessibilityHint,
}: VionaMiniAppCardProps): ReactElement {
  const compact = layout === 'compact';
  const badgeMode = surfaceVariant === 'premium' ? 'premium' : 'light';
  const ink = surfaceVariant === 'premium' ? vionaPremium.headerInk : vionaTrust.ink;
  const sub = surfaceVariant === 'premium' ? 'rgba(15, 23, 42, 0.72)' : vionaTrust.inkMuted;
  const kickerColor = surfaceVariant === 'premium' ? vionaPremium.ribbonGold : vionaTrust.inkMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.pressWrap, compact && styles.pressWrapCompact, pressed && { opacity: vionaPressedOpacity }]}
    >
      <VionaCard
        padded={!compact}
        surfaceVariant={surfaceVariant}
        style={[styles.card, compact && styles.cardCompact]}
      >
        <View style={[styles.row, compact && styles.rowTight]}>
          <View style={[styles.iconBubble, compact && styles.iconBubbleCompact, surfaceVariant === 'premium' && styles.iconBubblePremium]}>
            <Ionicons name={iconName} size={compact ? 22 : 26} color={iconColor(surfaceVariant)} />
          </View>
          <View style={styles.copyCol}>
            <View style={styles.titleRow}>
              {kicker ? (
                <Text style={[styles.kicker, { color: kickerColor }]} numberOfLines={1}>
                  {kicker}
                </Text>
              ) : (
                <View style={styles.kickerSpacer} />
              )}
              <VionaStatusBadge status={status} mode={badgeMode} />
            </View>
            <Text style={[styles.title, { color: ink }, compact && styles.titleCompact]} numberOfLines={compact ? 2 : 2}>
              {title}
            </Text>
            <Text style={[styles.body, { color: sub }, compact && styles.bodyCompact]} numberOfLines={compact ? 2 : 3}>
              {description}
            </Text>
            {!compact && tags && tags.length > 0 ? (
              <View style={styles.tagRow}>
                {tags.map((tag) => (
                  <View key={tag} style={[styles.tag, surfaceVariant === 'premium' && styles.tagPremium]}>
                    <Text style={[styles.tagText, surfaceVariant === 'premium' && styles.tagTextPremium]} numberOfLines={1}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={sub}
            style={[styles.chevron, compact && styles.chevronCompact]}
          />
        </View>
      </VionaCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrap: {
    width: '100%',
  },
  pressWrapCompact: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    marginBottom: 0,
  },
  cardCompact: {
    padding: vionaSpacing.md,
    minHeight: 118,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: vionaSpacing.md,
  },
  rowTight: {
    gap: vionaSpacing.sm,
    alignItems: 'center',
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: vionaTrust.signalMutedBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleCompact: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  iconBubblePremium: {
    backgroundColor: 'rgba(7, 25, 54, 0.08)',
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaSpacing.sm,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  kickerSpacer: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  titleCompact: {
    fontSize: 14,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  bodyCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaSpacing.sm,
    marginTop: vionaSpacing.md,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: vionaRadius.pill,
    backgroundColor: vionaTrust.surfaceMuted,
    borderWidth: 1,
    borderColor: vionaTrust.border,
  },
  tagPremium: {
    backgroundColor: 'rgba(200, 164, 77, 0.12)',
    borderColor: 'rgba(200, 164, 77, 0.35)',
  },
  tagText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: vionaTrust.ink,
  },
  tagTextPremium: {
    color: vionaPremium.headerInk,
  },
  chevron: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  chevronCompact: {
    alignSelf: 'center',
    marginTop: 0,
  },
});
