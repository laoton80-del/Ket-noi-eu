import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

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
 * Native-only PersonalHub Clear Premium composition (P4-B2).
 * Presentation only. Domain callbacks and slots stay on CaNhanScreen.
 * CHILDREN / host slots: GDPR + history. No navigation owner, wallet writes, SOS, role picker, or Web constellation.
 * Phone-portrait foundation only. Not P4-C four-matrix. Not P4-D a11y certification.
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
  return (
    <View testID="viona-native-account-clear-premium-composition" style={styles.root} collapsable={false}>
      <Text style={styles.brandHint}>{brandHint}</Text>
      <Text style={styles.screenTitle}>{screenTitle}</Text>
      <Text style={styles.screenSubtitle} numberOfLines={2}>
        {screenSubtitle}
      </Text>

      <View testID="account-native-pilot" style={styles.card}>
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
        style={({ pressed }) => [styles.flagshipCard, pressed && styles.pressed]}
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
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
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
      {shortcuts.map((item) => (
        <ActionTile key={item.id} item={item} />
      ))}

      <View testID="account-native-identity" style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{identityTitle}</Text>
          <Text style={styles.badge}>{identityBadge}</Text>
        </View>
        {identityRows.map((row) => (
          <View key={row.label} style={styles.identityRow}>
            <Text style={styles.identityKey}>{row.label}</Text>
            <Text style={styles.identityValue}>{row.value}</Text>
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
          style={({ pressed }) => [styles.identityCta, pressed && styles.pressed]}
        >
          <Text style={styles.identityCtaText}>{identityEditCta}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionKicker}>{settingsKicker}</Text>
      {settings.map((item) => (
        <ActionTile key={item.id} item={item} />
      ))}

      <View testID="account-native-gdpr-slot">{gdprSlot}</View>
      <View testID="account-native-history-slot">{historySlot}</View>

      <Pressable
        testID="account-native-onboarding-reset"
        onPress={onOnboardingResetPress}
        accessibilityRole="button"
        accessibilityLabel={onboardingResetA11y}
        style={({ pressed }) => [styles.secondaryRow, pressed && styles.pressed]}
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
          style={({ pressed }) => [styles.secondaryRow, pressed && styles.pressed]}
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
        <View testID="account-native-dev-token" style={styles.card}>
          <Text style={styles.cardKicker}>{devTokenLabel}</Text>
          <Text style={styles.meta}>{devTokenHint}</Text>
          <Pressable
            onPress={onCopyDevTokenPress}
            accessibilityRole="button"
            accessibilityLabel={devTokenCta}
            style={({ pressed }) => [styles.identityCta, pressed && styles.pressed]}
          >
            <Text style={styles.identityCtaText}>{devTokenCta}</Text>
          </Pressable>
          {devTokenPreview ? (
            <Text style={styles.footnote} selectable>
              {devTokenPreview}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ActionTile({ item }: { item: NativeAccountActionItem }) {
  return (
    <Pressable
      testID={item.testID}
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel}
      style={({ pressed }) => [styles.actionTile, pressed && styles.pressed]}
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
    width: '100%',
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
  },
  identityValue: {
    ...tkn.type.meta,
    color: tkn.ink.primary,
    fontFamily: FontFamily.bold,
    flex: 1,
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
