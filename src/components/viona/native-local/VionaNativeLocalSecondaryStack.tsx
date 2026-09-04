import { Ionicons } from '@expo/vector-icons';
import type { Ref } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type NativeLocalStatusStep = Readonly<{
  id: string;
  label: string;
}>;

export type NativeLocalClassifiedPreview = Readonly<{
  id: string;
  title: string;
  city: string;
  priceLabel: string;
  isVip: boolean;
}>;

export type NativeLocalMerchantItem = Readonly<{
  id: 'hub' | 'bookingAssist' | 'aiReceptionist';
  title: string;
  subtitle: string;
  accessibilityLabel: string;
  onPress: () => void;
}>;

export type NativeLocalConnectedItem = Readonly<{
  id: 'travel' | 'business' | 'academy';
  title: string;
  subtitle: string;
  accessibilityLabel: string;
  onPress: () => void;
}>;

export type VionaNativeLocalSecondaryStackProps = Readonly<{
  statusTitle: string;
  statusSteps: readonly NativeLocalStatusStep[];
  statusNote: string;
  classifiedsTitle: string;
  classifiedsSubtitle: string;
  classifiedsSafety: string;
  classifiedsVipLabel: string;
  vipHighlightLabel: string;
  createListingLabel: string;
  createListingA11y: string;
  onCreateListing: () => void;
  viewAllLabel: string;
  viewAllA11y: string;
  onViewAllClassifieds: () => void;
  classifiedPreviews: readonly NativeLocalClassifiedPreview[];
  classifiedsAnchorRef?: Ref<View>;
  merchantTitle: string;
  merchantItems: readonly NativeLocalMerchantItem[];
  connectedTitle: string;
  connectedItems: readonly NativeLocalConnectedItem[];
  reduceMotion: boolean;
}>;

/**
 * Native Local secondary stack. Presentation only for request status, classifieds preview,
 * merchant entries, and connected universes. Composer, VIP spend, and flags stay on LocalScreen.
 */
export function VionaNativeLocalSecondaryStack({
  statusTitle,
  statusSteps,
  statusNote,
  classifiedsTitle,
  classifiedsSubtitle,
  classifiedsSafety,
  classifiedsVipLabel,
  vipHighlightLabel,
  createListingLabel,
  createListingA11y,
  onCreateListing,
  viewAllLabel,
  viewAllA11y,
  onViewAllClassifieds,
  classifiedPreviews,
  classifiedsAnchorRef,
  merchantTitle,
  merchantItems,
  connectedTitle,
  connectedItems,
  reduceMotion,
}: VionaNativeLocalSecondaryStackProps) {
  return (
    <View testID="viona-native-local-secondary-stack" style={styles.root}>
      <View testID="viona-native-local-status-strip" style={styles.status} accessibilityLabel={`${statusTitle}. ${statusNote}`}>
        <Text style={styles.kicker}>{statusTitle}</Text>
        <View style={styles.statusFlow}>
          {statusSteps.map((step, idx) => (
            <View key={step.id} style={styles.statusStep}>
              {idx > 0 ? <Text style={styles.statusArrow}>→</Text> : null}
              <Text style={styles.statusLabel}>{step.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>{statusNote}</Text>
      </View>

      <View
        ref={classifiedsAnchorRef}
        collapsable={false}
        testID="viona-native-local-classifieds-preview"
        style={styles.section}
      >
        <Text style={styles.kicker}>{classifiedsTitle}</Text>
        <Text style={styles.body}>{classifiedsSubtitle}</Text>
        <Text style={styles.note}>{classifiedsVipLabel}</Text>
        <View style={styles.ctaRow}>
          <Pressable
            testID="local-native-classifieds-create"
            onPress={onCreateListing}
            accessibilityRole="button"
            accessibilityLabel={createListingA11y}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressedFade]}
          >
            <Ionicons name="add-circle-outline" size={18} color={tkn.accent.local} />
            <Text style={styles.actionLabel}>{createListingLabel}</Text>
          </Pressable>
          <Pressable
            testID="local-native-classifieds-view-all"
            onPress={onViewAllClassifieds}
            accessibilityRole="button"
            accessibilityLabel={viewAllA11y}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressedFade]}
          >
            <Text style={styles.actionLabel}>{viewAllLabel}</Text>
          </Pressable>
        </View>
        {classifiedPreviews.map((post) => (
          <Pressable
            key={post.id}
            testID={`local-native-classified-${post.id}`}
            onPress={onViewAllClassifieds}
            accessibilityRole="button"
            accessibilityLabel={`${post.title}. ${post.city}. ${post.priceLabel}`}
            style={({ pressed }) => [
              styles.post,
              pressed && (reduceMotion ? styles.pressedFade : styles.pressedScale),
            ]}
          >
            <Text style={styles.postTitle} numberOfLines={2}>
              {post.title}
            </Text>
            <Text style={styles.postMeta} numberOfLines={1}>
              {post.city} · {post.priceLabel}
            </Text>
            {post.isVip ? <Text style={styles.vip}>{vipHighlightLabel}</Text> : null}
          </Pressable>
        ))}
        <Text style={styles.safety}>{classifiedsSafety}</Text>
      </View>

      <View testID="viona-native-local-merchant-section" style={styles.section}>
        <Text style={styles.kicker}>{merchantTitle}</Text>
        {merchantItems.map((item) => (
          <Pressable
            key={item.id}
            testID={`local-native-merchant-${item.id}`}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressedFade]}
          >
            <View style={styles.copy}>
              <Text style={styles.actionLabel}>{item.title}</Text>
              <Text style={styles.actionSub} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View testID="viona-native-local-connected-section" style={styles.section}>
        <Text style={styles.kicker}>{connectedTitle}</Text>
        {connectedItems.map((item) => (
          <Pressable
            key={item.id}
            testID={`local-native-connected-${item.id}`}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressedFade]}
          >
            <View style={styles.copy}>
              <Text style={styles.actionLabel}>{item.title}</Text>
              <Text style={styles.actionSub} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: tkn.spacing[16],
    paddingBottom: tkn.spacing[24],
  },
  section: {
    width: '100%',
    gap: tkn.spacing[8],
  },
  status: {
    width: '100%',
    gap: tkn.spacing[8],
    padding: tkn.spacing[12],
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    backgroundColor: tkn.bg.surface,
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    color: tkn.accent.local,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  note: {
    fontFamily: FontFamily.medium,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
  safety: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
  statusFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tkn.spacing[4],
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[4],
  },
  statusArrow: {
    fontFamily: FontFamily.medium,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
  },
  statusLabel: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tkn.spacing[8],
  },
  actionBtn: {
    minHeight: tkn.hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[8],
    paddingHorizontal: tkn.spacing[12],
    borderRadius: tkn.radius.md,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    backgroundColor: tkn.bg.muted,
  },
  actionRow: {
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    backgroundColor: tkn.bg.surface,
    paddingHorizontal: tkn.spacing[12],
    paddingVertical: tkn.spacing[8],
    justifyContent: 'center',
  },
  copy: {
    minWidth: 0,
  },
  actionLabel: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.title.fontSize,
    lineHeight: tkn.type.title.lineHeight,
  },
  actionSub: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
  post: {
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    backgroundColor: tkn.bg.surface,
    padding: tkn.spacing[12],
    gap: tkn.spacing[4],
    minHeight: tkn.hit.min,
  },
  postTitle: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.title.fontSize,
    lineHeight: tkn.type.title.lineHeight,
  },
  postMeta: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
  vip: {
    fontFamily: FontFamily.semibold,
    color: tkn.accent.local,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  pressedFade: {
    opacity: 0.88,
  },
});
