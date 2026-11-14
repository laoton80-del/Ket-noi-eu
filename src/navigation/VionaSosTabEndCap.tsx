import { useState, type ReactElement } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n';

/** Bottom-tab SOS end cap. A press opens a confirm sheet; it does not dispatch help. */
export function VionaSosTabEndCap({
  onConfirm,
}: Readonly<{ onConfirm: () => void }>): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('sos.fabLabel')}
        accessibilityHint={t('sos.tabConfirmHint', {
          defaultValue: 'Opens a confirmation sheet. This does not place a call.',
        })}
        onPress={() => setOpen(true)}
        style={styles.cap}
        testID="viona-sos-tab-end-cap"
      >
        <Text style={styles.capLabel}>SOS</Text>
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.scrim}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('sos.confirmCancel', { defaultValue: 'Cancel' })}
            onPress={() => setOpen(false)}
            style={styles.dismiss}
          />
          <View style={styles.sheet}>
            <Text style={styles.title}>{t('sos.confirmTitle', { defaultValue: 'Open SOS?' })}</Text>
            <Text style={styles.body}>
              {t('sos.confirmBody', {
                defaultValue: 'Opens the existing emergency flow. This does not place a call.',
              })}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                onConfirm();
              }}
              style={styles.confirm}
            >
              <Text style={styles.confirmLabel}>{t('sos.confirmYes', { defaultValue: 'Confirm' })}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.cancel}>
              <Text style={styles.cancelLabel}>{t('sos.confirmCancel', { defaultValue: 'Cancel' })}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cap: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 112, 90, 0.18)',
    borderWidth: 1,
    borderColor: '#E5705A',
  },
  capLabel: { color: '#F0997B', fontWeight: '800', letterSpacing: 0.6 },
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 7, 19, 0.55)' },
  dismiss: { flex: 1 },
  sheet: {
    margin: 16,
    borderRadius: 18,
    padding: 18,
    gap: 10,
    backgroundColor: '#07111C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  title: { color: '#F4F8FC', fontSize: 18, fontWeight: '700' },
  body: { color: '#B7C6D6', fontSize: 14, lineHeight: 20 },
  confirm: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5705A',
  },
  confirmLabel: { color: '#1A0C0A', fontWeight: '800' },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { color: '#D4AF7C', fontWeight: '700' },
});
