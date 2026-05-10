/**
 * Modal gate for SOS hold UX (AF.SOS.1).
 * - `continueToAppSos`: completing hold invokes `onHoldComplete` (opens existing in-app SOS flow).
 * - `preLogin`: completing hold only signals acknowledgment — parent must not dial or navigate to authenticated SOS.
 */
import { type ReactElement } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED } from '../../config/sosPlusSurface';
import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../i18n';
import { VionaSosHoldButton } from './VionaSosHoldButton';

export type VionaSosHoldGateVariant = 'continueToAppSos' | 'preLogin';

export type VionaSosHoldGateModalProps = Readonly<{
  visible: boolean;
  onRequestClose: () => void;
  onHoldComplete: () => void;
  variant?: VionaSosHoldGateVariant;
  /** Opens SOS Plus info modal (optional). */
  onOpenPlusInfo?: () => void;
}>;

export function VionaSosHoldGateModal({
  visible,
  onRequestClose,
  onHoldComplete,
  variant = 'continueToAppSos',
  onOpenPlusInfo,
}: VionaSosHoldGateModalProps): ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const maxW = Math.min(440, width - 28);
  const maxSheetH = Math.min(height * 0.9, 620);

  const title = variant === 'preLogin' ? t('sos.preLoginGateTitle') : t('sos.gateTitle');
  const sub = variant === 'preLogin' ? t('sos.preLoginGateSub') : t('sos.gateSub');
  const holdHelper = variant === 'preLogin' ? t('sos.preLoginHoldHelper') : t('sos.holdHelper');

  const showPlusSurface = SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED && onOpenPlusInfo != null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onRequestClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.sheet, { maxWidth: maxW, maxHeight: maxSheetH }]}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showPlusSurface ? (
              <View style={styles.plusStrip}>
                <Text style={styles.plusName}>{t('sos.plusName')}</Text>
                <Text style={styles.plusPrice}>{t('sos.priceEuroUi')}</Text>
                <Text style={styles.plusTagline}>{t('sos.plusTagline')}</Text>
                <Text style={styles.holdProductLine}>{t('sos.holdThreeProduct')}</Text>
                <Pressable
                  onPress={onOpenPlusInfo}
                  style={({ pressed }) => [styles.learnLink, pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('sos.learnBasicVsPlusA11y')}
                >
                  <Text style={styles.learnLinkText}>{t('sos.learnBasicVsPlus')}</Text>
                </Pressable>
              </View>
            ) : null}

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sub}>{sub}</Text>

            {variant === 'preLogin' ? (
              <View style={styles.preLoginCallout}>
                <Text style={styles.preLoginCalloutText}>{t('sos.disclaimerNotReplacement')}</Text>
              </View>
            ) : null}
          </ScrollView>

          {visible ? (
            <VionaSosHoldButton onHoldComplete={onHoldComplete} helperText={holdHelper} />
          ) : null}
          <Pressable
            onPress={onRequestClose}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={t('sos.cancelHold')}
          >
            <Text style={styles.cancelText}>{t('sos.cancelHold')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    width: '100%',
    borderRadius: vionaTokens.radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(220, 72, 85, 0.38)',
    backgroundColor: 'rgba(10, 14, 22, 0.98)',
    paddingHorizontal: vionaTokens.spacing[20],
    paddingTop: vionaTokens.spacing[16],
    paddingBottom: vionaTokens.spacing[20],
    gap: vionaTokens.spacing[12],
  },
  scroll: {
    maxHeight: 380,
  },
  scrollContent: {
    paddingBottom: vionaTokens.spacing[8],
    gap: vionaTokens.spacing[12],
  },
  plusStrip: {
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(220, 72, 85, 0.35)',
    backgroundColor: 'rgba(36, 10, 14, 0.55)',
    paddingVertical: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[12],
    gap: vionaTokens.spacing[6],
    marginBottom: vionaTokens.spacing[4],
  },
  plusName: {
    fontFamily: FontFamily.extrabold,
    fontSize: 15,
    color: vionaTokens.fashionTech.sosNeon,
    textAlign: 'center',
  },
  plusPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: vionaTokens.fashionTech.inkOnDark,
    textAlign: 'center',
  },
  plusTagline: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.fashionTech.mutedOnDark,
    textAlign: 'center',
  },
  holdProductLine: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.fashionTech.inkOnDark,
    textAlign: 'center',
  },
  learnLink: {
    alignSelf: 'center',
    marginTop: vionaTokens.spacing[4],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(244, 246, 250, 0.22)',
  },
  learnLinkText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: vionaTokens.fashionTech.sosNeon,
    textDecorationLine: 'underline',
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 18,
    color: vionaTokens.fashionTech.inkOnDark,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
    color: vionaTokens.fashionTech.mutedOnDark,
    textAlign: 'center',
  },
  preLoginCallout: {
    marginTop: vionaTokens.spacing[4],
    padding: vionaTokens.spacing[12],
    borderRadius: vionaTokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  preLoginCalloutText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.fashionTech.inkOnDark,
    textAlign: 'center',
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: vionaTokens.spacing[4],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(244, 246, 250, 0.22)',
  },
  cancelText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: vionaTokens.fashionTech.mutedOnDark,
  },
});
