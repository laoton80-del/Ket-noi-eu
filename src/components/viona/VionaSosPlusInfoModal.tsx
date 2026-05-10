/**
 * SOS Basic vs SOS Plus — informational modal only (AF.SOS.1).
 * Does not subscribe, record, dispatch, or place calls.
 */
import { Ionicons } from '@expo/vector-icons';
import { type ReactElement } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOS_PLUS_PROFILE_UI_ENABLED } from '../../config/sosPlusProduction';
import { vionaTokens } from '../../design';
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';

export type VionaSosPlusInfoModalProps = Readonly<{
  visible: boolean;
  onRequestClose: () => void;
  /** Opens stack screen `SosPlusProfile` — close modal first in handler. */
  onPressOpenProfile?: () => void;
}>;

function TierCard({
  title,
  badge,
  body,
  accent,
}: Readonly<{ title: string; badge: string; body: string; accent: 'basic' | 'plus' }>): ReactElement {
  return (
    <View
      style={[
        styles.tierCard,
        accent === 'plus' ? styles.tierCardPlus : styles.tierCardBasic,
      ]}
    >
      <View style={styles.tierHeader}>
        <Text style={styles.tierTitle}>{title}</Text>
        <View style={[styles.badge, accent === 'plus' ? styles.badgePlus : styles.badgeBasic]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.tierBody}>{body}</Text>
    </View>
  );
}

function CapabilityRow({
  label,
  tierLabel,
}: Readonly<{ label: string; tierLabel: string }>): ReactElement {
  return (
    <View style={styles.capRow}>
      <Ionicons name="ellipse" size={6} color={vionaTokens.fashionTech.sosNeon} style={styles.capDot} />
      <View style={styles.capTextWrap}>
        <Text style={styles.capLabel}>{label}</Text>
        <Text style={styles.capTier}>{tierLabel}</Text>
      </View>
    </View>
  );
}

export function VionaSosPlusInfoModal({
  visible,
  onRequestClose,
  onPressOpenProfile,
}: VionaSosPlusInfoModalProps): ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const maxH = Math.min(height * 0.92, 720);
  const maxW = Math.min(440, width - 28);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onRequestClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
        <View style={[styles.sheet, { width: maxW, maxHeight: maxH }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.modalTitle}>{t('sos.plusInfoTitle')}</Text>
            <Pressable
              onPress={onRequestClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('sos.close')}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.75 }]}
            >
              <Ionicons name="close" size={22} color={vionaTokens.fashionTech.mutedOnDark} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <Text style={styles.priceLine}>{t('sos.priceEuroUi')}</Text>
            <Text style={styles.tagline}>{t('sos.plusTagline')}</Text>
            <Text style={styles.holdReminder}>{t('sos.holdThreeProduct')}</Text>

            <TierCard
              title={t('sos.basicTierTitle')}
              badge={t('sos.basicTierBadge')}
              body={t('sos.basicTierBody')}
              accent="basic"
            />
            <TierCard
              title={t('sos.plusTierTitle')}
              badge={t('sos.plusTierBadge')}
              body={t('sos.plusTierBody')}
              accent="plus"
            />

            <Text style={styles.sectionTitle}>{t('sos.plannedCapabilitiesTitle')}</Text>
            <CapabilityRow label={t('sos.capVoiceKeywords')} tierLabel={t('sos.capTierPilot')} />
            <CapabilityRow label={t('sos.capLocationGuidance')} tierLabel={t('sos.capTierPlanned')} />
            <CapabilityRow label={t('sos.capTrustedContact')} tierLabel={t('sos.capTierPlanned')} />
            <CapabilityRow label={t('sos.capRecording')} tierLabel={t('sos.capTierPilotConsent')} />
            <CapabilityRow label={t('sos.capRouting')} tierLabel={t('sos.capTierFutureSetup')} />

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerStrong}>{t('sos.disclaimerNotReplacement')}</Text>
              <Text style={styles.disclaimerMuted}>{t('sos.disclaimerUiOnly')}</Text>
            </View>
          </ScrollView>

          {SOS_PLUS_PROFILE_UI_ENABLED && onPressOpenProfile ? (
            <Pressable
              onPress={onPressOpenProfile}
              style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={t('sosPlus.openProfileA11y')}
            >
              <Text style={styles.profileBtnText}>{t('sosPlus.openProfileCta')}</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onRequestClose}
            style={({ pressed }) => [styles.primaryClose, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryCloseText}>{t('sos.plusInfoUnderstood')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 12, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sheet: {
    borderRadius: vionaTokens.radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(220, 72, 85, 0.35)',
    backgroundColor: 'rgba(12, 14, 20, 0.98)',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: vionaTokens.spacing[20],
    paddingTop: vionaTokens.spacing[16],
    paddingBottom: vionaTokens.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    flex: 1,
    fontFamily: FontFamily.extrabold,
    fontSize: 18,
    lineHeight: 24,
    color: vionaTokens.fashionTech.inkOnDark,
    paddingRight: 8,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 120,
  },
  scrollContent: {
    paddingHorizontal: vionaTokens.spacing[20],
    paddingTop: vionaTokens.spacing[12],
    paddingBottom: vionaTokens.spacing[32],
    gap: vionaTokens.spacing[12],
  },
  priceLine: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: vionaTokens.fashionTech.sosNeon,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: vionaTokens.fashionTech.inkOnDark,
    textAlign: 'center',
  },
  holdReminder: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.fashionTech.mutedOnDark,
    textAlign: 'center',
    marginBottom: vionaTokens.spacing[4],
  },
  sectionTitle: {
    marginTop: vionaTokens.spacing[6],
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
    letterSpacing: 0.6,
    color: vionaTokens.fashionTech.mutedOnDark,
    textTransform: 'uppercase',
  },
  tierCard: {
    borderRadius: vionaTokens.radius.lg,
    padding: vionaTokens.spacing[12],
    borderWidth: 1,
    gap: vionaTokens.spacing[8],
  },
  tierCardBasic: {
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tierCardPlus: {
    borderColor: 'rgba(220, 72, 85, 0.45)',
    backgroundColor: 'rgba(48, 12, 18, 0.45)',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaTokens.spacing[8],
  },
  tierTitle: {
    flex: 1,
    fontFamily: FontFamily.extrabold,
    fontSize: 15,
    color: vionaTokens.fashionTech.inkOnDark,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
  },
  badgeBasic: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  badgePlus: {
    borderColor: 'rgba(255, 92, 108, 0.5)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: vionaTokens.fashionTech.mutedOnDark,
  },
  tierBody: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
    color: vionaTokens.fashionTech.mutedOnDark,
  },
  capRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  capDot: {
    marginTop: 7,
  },
  capTextWrap: {
    flex: 1,
    gap: 2,
  },
  capLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: vionaTokens.fashionTech.inkOnDark,
  },
  capTier: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: vionaTokens.fashionTech.sosNeon,
    opacity: 0.92,
  },
  disclaimerBox: {
    marginTop: vionaTokens.spacing[8],
    padding: vionaTokens.spacing[12],
    borderRadius: vionaTokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: vionaTokens.spacing[8],
  },
  disclaimerStrong: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    lineHeight: 19,
    color: vionaTokens.fashionTech.inkOnDark,
  },
  disclaimerMuted: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    color: vionaTokens.fashionTech.mutedOnDark,
  },
  profileBtn: {
    marginHorizontal: vionaTokens.spacing[16],
    marginBottom: vionaTokens.spacing[8],
    marginTop: vionaTokens.spacing[4],
    paddingVertical: 12,
    borderRadius: vionaTokens.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 246, 250, 0.22)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  profileBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: vionaTokens.fashionTech.sosNeon,
  },
  primaryClose: {
    marginHorizontal: vionaTokens.spacing[16],
    marginBottom: vionaTokens.spacing[12],
    marginTop: vionaTokens.spacing[6],
    paddingVertical: 14,
    borderRadius: vionaTokens.radius.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(220, 72, 85, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 108, 0.45)',
  },
  primaryCloseText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
