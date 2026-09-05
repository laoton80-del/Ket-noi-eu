import { useCallback, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';

import { useFashionHomePrefersReducedMotion } from '../fashionHomeDesktopShell';
import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

/** Account-specific 2-col gap. Not Local 8-as-column-law; token spacing reused. */
export const ACCOUNT_NATIVE_ACTION_GAP = tkn.spacing[8];
/** Conservative readable action-tile min for 2-col. Not Local 148 / 304 / 460 / 616. */
export const ACCOUNT_NATIVE_TWO_COL_MIN_TILE = 176;
export const ACCOUNT_NATIVE_MAX_COLUMNS = 2 as const;

export type AccountNativeListColumns = 1 | 2;

/**
 * Shortcuts/settings columns. Portrait always 1.
 * PHONE PORTRAIT: one column for every major section. Do not copy Local tile-threshold column law.
 * PHONE LANDSCAPE / TABLET LANDSCAPE: 2-col shortcuts/settings only if measured inner width fits 2 tiles + gap.
 * TABLET PORTRAIT: remains one column (orientation gate). App shell maxWidth 600 is READ_ONLY.
 * Two columns only when native landscape AND measured contentWidth fits two readable tiles + gap.
 * Web never activates this grid. Device labels are not column authority.
 * Max columns = 2. Never 3/4. Never desktop dashboard. Not Local column law.
 * SOURCE ASSERTIONS DO NOT PROVE FOUR_MATRIX_VISUAL_GREEN.
 */
export function resolveAccountNativeShortcutSettingsColumns(
  contentWidth: number,
  isLandscape: boolean,
  platformOS: typeof Platform.OS = Platform.OS
): AccountNativeListColumns {
  if (platformOS === 'web') return 1;
  if (!isLandscape) return 1;
  if (contentWidth <= 0) return 1;
  const needed = ACCOUNT_NATIVE_TWO_COL_MIN_TILE * 2 + ACCOUNT_NATIVE_ACTION_GAP;
  if (contentWidth < needed) return 1;
  return ACCOUNT_NATIVE_MAX_COLUMNS;
}

export function tileWidthForAccountNativeColumns(
  contentWidth: number,
  columns: AccountNativeListColumns
): number {
  if (contentWidth <= 0 || columns <= 0) return 0;
  return Math.max(
    tkn.hit.min,
    Math.floor((contentWidth - ACCOUNT_NATIVE_ACTION_GAP * (columns - 1)) / columns)
  );
}

export type NativeAccountIdentityRow = Readonly<{
  label: string;
  value: string;
}>;

export type NativeAccountPilotItem = Readonly<{
  key: string;
  label: string;
}>;

export type NativeAccountActionItem = Readonly<{
  id: string;
  testID?: string;
  icon: keyof typeof Ionicons.glyphMap;
  statusLabel: string;
  title: string;
  subtitle: string;
  accessibilityLabel: string;
  onPress: () => void;
}>;

export type VionaNativeAccountClearPremiumCompositionProps = Readonly<{
  brandHint: string;
  screenTitle: string;
  screenSubtitle: string;
  pilotTitle: string;
  pilotBanner: string;
  pilotItems: readonly NativeAccountPilotItem[];
  profileSectionKicker: string;
  profileName: string;
  profilePlan: string;
  profileA11y: string;
  onProfilePress: () => void;
  creditsTitle: string;
  creditsBadge: string;
  creditsBalance: string;
  creditsHint: string;
  creditsFootnote: string;
  creditsA11y: string;
  onWalletPress: () => void;
  shortcutsKicker: string;
  shortcuts: readonly NativeAccountActionItem[];
  identityTitle: string;
  identityBadge: string;
  identityFootnote: string;
  identityRows: readonly NativeAccountIdentityRow[];
  identityEditCta: string;
  identityEditA11y: string;
  onIdentityEditPress: () => void;
  settingsKicker: string;
  settings: readonly NativeAccountActionItem[];
  gdprSlot: ReactNode;
  historySlot: ReactNode;
  onboardingResetLabel: string;
  onboardingResetA11y: string;
  onOnboardingResetPress: () => void;
  adminUnlocked: boolean;
  adminTitle: string;
  adminBody: string;
  onAdminResetPress: () => void;
  showDevToken: boolean;
  devTokenLabel: string;
  devTokenHint: string;
  devTokenCta: string;
  onCopyDevTokenPress: () => void;
  devTokenPreview: string | null;
}>;

/**
 * Native-only PersonalHub Clear Premium composition (P4-B2 + P4-C four-matrix presentation).
 * Presentation only. Domain callbacks and slots stay on CaNhanScreen.
 * Canonical signals: onLayout contentWidth + isLandscape (width > height) + useFashionHomePrefersReducedMotion.
 * Phone portrait remains one column. Max two columns for shortcuts/settings only when landscape + measured width.
 * Not Local 304/460/616 column law. Not 3/4-column. Not P4-D a11y certification.
 * SOURCE ASSERTIONS DO NOT PROVE FOUR_MATRIX_VISUAL_GREEN.
 */
export function VionaNativeAccountClearPremiumComposition({
  brandHint,
  screenTitle,
  screenSubtitle,
  pilotTitle,
  pilotBanner,
  pilotItems,
  profileSectionKicker,
  profileName,
  profilePlan,
  profileA11y,
  onProfilePress,
  creditsTitle,
  creditsBadge,
  creditsBalance,
  creditsHint,
  creditsFootnote,
  creditsA11y,
  onWalletPress,
  shortcutsKicker,
  shortcuts,
  identityTitle,
  identityBadge,
  identityFootnote,
  identityRows,
  identityEditCta,
  identityEditA11y,
  onIdentityEditPress,
  settingsKicker,
  settings,
  gdprSlot,
  historySlot,
  onboardingResetLabel,
  onboardingResetA11y,
  onOnboardingResetPress,
  adminUnlocked,
  adminTitle,
  adminBody,
  onAdminResetPress,
  showDevToken,
  devTokenLabel,
  devTokenHint,
  devTokenCta,
  onCopyDevTokenPress,
  devTokenPreview,
}: VionaNativeAccountClearPremiumCompositionProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const reduceMotion = useFashionHomePrefersReducedMotion();
  const [contentWidth, setContentWidth] = useState(0);

  const onMeasureLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setContentWidth((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, []);

  const listColumns = resolveAccountNativeShortcutSettingsColumns(contentWidth, isLandscape);
  const listTileWidth = tileWidthForAccountNativeColumns(contentWidth, listColumns);
  const compact = isLandscape && Platform.OS !== 'web';
  const pressStyle = reduceMotion ? styles.pressedReduced : styles.pressed;

  return (
    <View
      testID="viona-native-account-clear-premium-composition"
      style={[styles.root, compact && styles.rootCompact]}
      collapsable={false}
    >
      <View
        testID="account-native-measure"
        onLayout={onMeasureLayout}
        style={styles.measure}
        collapsable={false}
      >
      <Text style={styles.brandHint}>{brandHint}</Text>
      <Text style={styles.screenTitle}>{screenTitle}</Text>
      <Text style={styles.screenSubtitle} numberOfLines={2}>
        {screenSubtitle}
      </Text>

      <View testID="account-native-pilot" style={[styles.card, compact && styles.cardCompact]}>
        <Text style={styles.cardKicker}>{pilotTitle}</Text>
        <Text style={styles.body} numberOfLines={2}>
          {pilotBanner}
        </Text>
        <View style={styles.pilotRow}>
          {pilotItems.map((item) => (
            <View key={item.key} style={styles.pilotChip}>
              <Text style={styles.pilotChipText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionKicker}>{profileSectionKicker}</Text>
      <Pressable
        testID="account-native-profile"
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel={profileA11y}
        style={({ pressed }) => [styles.flagshipCard, compact && styles.flagshipCardCompact, pressed && pressStyle]}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={tkn.accent.business} />
        </View>
        <View style={styles.flagshipMeta}>
          <Text style={styles.flagshipTitle}>{profileName}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {profilePlan}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tkn.ink.secondary} />
      </Pressable>

      <Pressable
        testID="account-native-credits"
        onPress={onWalletPress}
        accessibilityRole="button"
        accessibilityLabel={creditsA11y}
        style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && pressStyle]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.inlineIconTitle}>
            <Ionicons name="wallet-outline" size={18} color={tkn.accent.business} />
            <Text style={styles.cardTitle}>{creditsTitle}</Text>
          </View>
          <Text style={styles.badge}>{creditsBadge}</Text>
        </View>
        <Text style={styles.balance}>{creditsBalance}</Text>
        <Text style={styles.meta} numberOfLines={2}>
          {creditsHint}
        </Text>
        <Text style={styles.footnote} numberOfLines={2}>
          {creditsFootnote}
        </Text>
      </Pressable>

      <Text style={styles.sectionKicker}>{shortcutsKicker}</Text>
      <View
        testID="account-native-shortcuts"
        style={listColumns === 2 ? styles.actionGrid : styles.actionStack}
      >
        {shortcuts.map((item) => (
          <ActionTile
            key={item.id}
            item={item}
            tileWidth={listColumns === 2 ? listTileWidth : undefined}
            compact={compact}
            pressStyle={pressStyle}
          />
        ))}
      </View>

      <View testID="account-native-identity" style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {identityTitle}
          </Text>
          <Text style={styles.badge}>{identityBadge}</Text>
        </View>
        {identityRows.map((row) => (
          <View key={row.label} style={styles.identityRow}>
            <Text style={styles.identityKey}>{row.label}</Text>
            <Text style={styles.identityValue} numberOfLines={2}>
              {row.value}
            </Text>
          </View>
        ))}
        <Text style={styles.footnote} numberOfLines={2}>
          {identityFootnote}
        </Text>
        <Pressable
          testID="account-native-identity-edit"
          onPress={onIdentityEditPress}
          accessibilityRole="button"
          accessibilityLabel={identityEditA11y}
          style={({ pressed }) => [styles.identityCta, pressed && pressStyle]}
        >
          <Text style={styles.identityCtaText}>{identityEditCta}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionKicker}>{settingsKicker}</Text>
      <View
        testID="account-native-settings"
        style={listColumns === 2 ? styles.actionGrid : styles.actionStack}
      >
        {settings.map((item) => (
          <ActionTile
            key={item.id}
            item={item}
            tileWidth={listColumns === 2 ? listTileWidth : undefined}
            compact={compact}
            pressStyle={pressStyle}
          />
        ))}
      </View>

      <View testID="account-native-gdpr-slot">{gdprSlot}</View>
      <View testID="account-native-history-slot">{historySlot}</View>

      <Pressable
        testID="account-native-onboarding-reset"
        onPress={onOnboardingResetPress}
        accessibilityRole="button"
        accessibilityLabel={onboardingResetA11y}
        style={({ pressed }) => [styles.secondaryRow, compact && styles.secondaryRowCompact, pressed && pressStyle]}
      >
        <Text style={styles.secondaryRowText}>{onboardingResetLabel}</Text>
        <Ionicons name="refresh" size={18} color={tkn.ink.secondary} />
      </Pressable>

      {adminUnlocked ? (
        <Pressable
          testID="account-native-admin-reset"
          onLongPress={onAdminResetPress}
          delayLongPress={1200}
          accessibilityRole="button"
          accessibilityLabel={adminTitle}
          style={({ pressed }) => [styles.secondaryRow, compact && styles.secondaryRowCompact, pressed && pressStyle]}
        >
          <View style={styles.flagshipMeta}>
            <Text style={styles.secondaryRowText}>{adminTitle}</Text>
            <Text style={styles.meta} numberOfLines={2}>
              {adminBody}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {showDevToken ? (
        <View testID="account-native-dev-token" style={[styles.card, compact && styles.cardCompact]}>
          <Text style={styles.cardKicker}>{devTokenLabel}</Text>
          <Text style={styles.meta} numberOfLines={2}>
            {devTokenHint}
          </Text>
          <Pressable
            onPress={onCopyDevTokenPress}
            accessibilityRole="button"
            accessibilityLabel={devTokenCta}
            style={({ pressed }) => [styles.identityCta, pressed && pressStyle]}
          >
            <Text style={styles.identityCtaText}>{devTokenCta}</Text>
          </Pressable>
          {devTokenPreview ? (
            <Text style={styles.footnote} selectable numberOfLines={2}>
              {devTokenPreview}
            </Text>
          ) : null}
        </View>
      ) : null}
      </View>
    </View>
  );
}

function ActionTile({
  item,
  tileWidth,
  compact,
  pressStyle,
}: {
  item: NativeAccountActionItem;
  tileWidth?: number;
  compact: boolean;
  pressStyle: { opacity: number };
}) {
  return (
    <Pressable
      testID={item.testID}
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel}
      style={({ pressed }) => [
        styles.actionTile,
        compact && styles.actionTileCompact,
        tileWidth != null ? { width: tileWidth } : styles.actionTileFull,
        pressed && pressStyle,
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={item.icon} size={20} color={tkn.accent.business} />
      </View>
      <View style={styles.flagshipMeta}>
        <Text style={styles.badge}>{item.statusLabel}</Text>
        <Text style={styles.actionTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tkn.ink.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: tkn.bg.canvas,
    paddingHorizontal: tkn.spacing[16],
    paddingTop: tkn.spacing[12],
    paddingBottom: tkn.spacing[24],
    gap: tkn.spacing[8],
  },
  rootCompact: {
    paddingTop: tkn.spacing[8],
    paddingBottom: tkn.spacing[16],
    gap: tkn.spacing[8],
  },
  measure: {
    width: '100%',
    alignSelf: 'stretch',
    gap: tkn.spacing[8],
  },
  actionStack: {
    width: '100%',
    gap: tkn.spacing[8],
  },
  actionGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ACCOUNT_NATIVE_ACTION_GAP,
  },
  actionTileFull: {
    width: '100%',
  },
  cardCompact: {
    padding: tkn.spacing[12],
  },
  flagshipCardCompact: {
    paddingVertical: tkn.spacing[8],
  },
  actionTileCompact: {
    paddingVertical: tkn.spacing[8],
  },
  secondaryRowCompact: {
    paddingVertical: tkn.spacing[8],
  },
  pressedReduced: {
    opacity: 0.88,
  },
  brandHint: {
    ...tkn.type.brand,
    color: tkn.ink.secondary,
    fontFamily: FontFamily.semibold,
  },
  screenTitle: {
    ...tkn.type.greeting,
    color: tkn.ink.primary,
    fontFamily: FontFamily.extrabold,
  },
  screenSubtitle: {
    ...tkn.type.wish,
    color: tkn.ink.secondary,
    fontFamily: FontFamily.medium,
    marginBottom: tkn.spacing[8],
  },
  sectionKicker: {
    ...tkn.type.chip,
    color: tkn.ink.secondary,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    marginTop: tkn.spacing[8],
  },
  card: {
    width: '100%',
    backgroundColor: tkn.bg.surface,
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    padding: tkn.spacing[16],
    gap: tkn.spacing[8],
  },
  flagshipCard: {
    width: '100%',
    minHeight: tkn.hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[12],
    backgroundColor: tkn.bg.surface,
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    paddingHorizontal: tkn.spacing[16],
    paddingVertical: tkn.spacing[12],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tkn.bg.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagshipMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  flagshipTitle: {
    ...tkn.type.title,
    color: tkn.ink.primary,
    fontFamily: FontFamily.bold,
  },
  cardKicker: {
    ...tkn.type.chip,
    color: tkn.ink.secondary,
    fontFamily: FontFamily.bold,
  },
  cardTitle: {
    ...tkn.type.title,
    color: tkn.ink.primary,
    fontFamily: FontFamily.bold,
  },
  body: {
    ...tkn.type.body,
    color: tkn.ink.primary,
    fontFamily: FontFamily.medium,
  },
  meta: {
    ...tkn.type.meta,
    color: tkn.ink.secondary,
    fontFamily: FontFamily.medium,
  },
  footnote: {
    ...tkn.type.meta,
    color: tkn.ink.secondary,
    fontFamily: FontFamily.regular,
  },
  balance: {
    fontSize: 20,
    lineHeight: 24,
    color: tkn.ink.primary,
    fontFamily: FontFamily.extrabold,
  },
  badge: {
    ...tkn.type.chip,
    color: tkn.accent.business,
    fontFamily: FontFamily.bold,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tkn.spacing[8],
  },
  inlineIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[8],
    flex: 1,
    minWidth: 0,
  },
  pilotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tkn.spacing[8],
  },
  pilotChip: {
    minHeight: tkn.hit.min,
    justifyContent: 'center',
    paddingHorizontal: tkn.spacing[12],
    borderRadius: tkn.radius.pill,
    backgroundColor: tkn.bg.muted,
  },
  pilotChipText: {
    ...tkn.type.chip,
    color: tkn.ink.primary,
    fontFamily: FontFamily.bold,
  },
  actionTile: {
    minHeight: tkn.hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[12],
    backgroundColor: tkn.bg.surface,
    borderRadius: tkn.radius.md,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    paddingHorizontal: tkn.spacing[12],
    paddingVertical: tkn.spacing[12],
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: tkn.radius.sm,
    backgroundColor: tkn.bg.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...tkn.type.title,
    color: tkn.ink.primary,
    fontFamily: FontFamily.bold,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tkn.spacing[12],
  },
  identityKey: {
    ...tkn.type.meta,
    color: tkn.ink.secondary,
    fontFamily: FontFamily.medium,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  identityValue: {
    ...tkn.type.meta,
    color: tkn.ink.primary,
    fontFamily: FontFamily.bold,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  identityCta: {
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.md,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    backgroundColor: tkn.bg.muted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tkn.spacing[16],
  },
  identityCtaText: {
    ...tkn.type.button,
    color: tkn.ink.primary,
    fontFamily: FontFamily.bold,
  },
  secondaryRow: {
    width: '100%',
    minHeight: tkn.hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tkn.spacing[12],
    backgroundColor: tkn.bg.surface,
    borderRadius: tkn.radius.md,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    paddingHorizontal: tkn.spacing[16],
    paddingVertical: tkn.spacing[12],
  },
  secondaryRowText: {
    ...tkn.type.body,
    color: tkn.ink.primary,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
});
