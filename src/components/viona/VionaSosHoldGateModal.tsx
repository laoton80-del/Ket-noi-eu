/**
 * Modal gate for SOS hold UX on desktop Home (stub pack).
 * Completing the hold invokes `onHoldComplete` (typically opens the existing in-app SOS sheet).
 *
 * TODO: Replace stub gate with productized flow after emergency UX + legal sign-off.
 */
import { type ReactElement } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../i18n';
import { VionaSosHoldButton } from './VionaSosHoldButton';

export type VionaSosHoldGateModalProps = Readonly<{
  visible: boolean;
  onRequestClose: () => void;
  onHoldComplete: () => void;
}>;

export function VionaSosHoldGateModal({ visible, onRequestClose, onHoldComplete }: VionaSosHoldGateModalProps): ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxW = Math.min(420, width - 32);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onRequestClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.sheet, { maxWidth: maxW }]}>
          <Text style={styles.title}>{t('sos.gateTitle')}</Text>
          <Text style={styles.sub}>{t('sos.gateSub')}</Text>
          {visible ? (
            <VionaSosHoldButton
              onHoldComplete={() => {
                onHoldComplete();
              }}
            />
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
    borderColor: vionaTokens.fashionTech.champagneLine,
    backgroundColor: 'rgba(10, 14, 22, 0.96)',
    paddingHorizontal: vionaTokens.spacing[20],
    paddingVertical: vionaTokens.spacing[24],
    gap: vionaTokens.spacing[12],
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
    marginBottom: vionaTokens.spacing[8],
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: vionaTokens.spacing[8],
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
