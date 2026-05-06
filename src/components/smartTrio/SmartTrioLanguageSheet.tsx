import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, type ReactElement } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSmartTrio } from '../../context/SmartTrioContext';
import type { MarketCode, SmartTrioLocale } from '../../core/i18n/smartTrioTypes';
import { useTranslation } from '../../i18n';

const MARKET_OPTIONS: readonly MarketCode[] = [
  'GLOBAL',
  'CZ',
  'DE',
  'VN',
  'US',
  'FR',
  'JP',
  'KR',
];

export type SmartTrioLanguageSheetProps = Readonly<{
  visible: boolean;
  onClose: () => void;
}>;

function marketI18nKey(code: MarketCode): string {
  const slug = code === 'GLOBAL' ? 'global' : code.toLowerCase();
  return `smartTrio.market.${slug}`;
}

function localeI18nKey(locale: SmartTrioLocale): string {
  return `smartTrio.language.${locale}`;
}

export function SmartTrioLanguageSheet({ visible, onClose }: SmartTrioLanguageSheetProps): ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    resolved,
    supportedLocales,
    marketCode,
    setMarketCode,
    setUserSelectedLocale,
    userSelectedLocale,
  } = useSmartTrio();

  const onPickLocale = useCallback(
    (locale: SmartTrioLocale) => {
      setUserSelectedLocale(locale);
      onClose();
    },
    [onClose, setUserSelectedLocale]
  );

  const onClearLocale = useCallback(() => {
    setUserSelectedLocale(undefined);
    onClose();
  }, [onClose, setUserSelectedLocale]);

  const onPickMarket = useCallback(
    (code: MarketCode) => {
      setMarketCode(code);
      onClose();
    },
    [onClose, setMarketCode]
  );

  const supportedList = useMemo(() => [...supportedLocales], [supportedLocales]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('smartTrio.switcher.title')}</Text>
          <Text style={styles.subtitle}>{t('smartTrio.switcher.subtitle')}</Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>{t('smartTrio.switcher.appLanguage')}</Text>
            <Pressable
              onPress={onClearLocale}
              style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
            >
              <Text style={styles.optionText}>{t('smartTrio.switcher.followDevice')}</Text>
              {!userSelectedLocale ? (
                <Ionicons name="checkmark-circle" size={20} color="#7AE4FF" />
              ) : (
                <Ionicons name="ellipse-outline" size={20} color="rgba(255,255,255,0.35)" />
              )}
            </Pressable>
            {supportedList.map((loc) => (
              <Pressable
                key={loc}
                onPress={() => onPickLocale(loc)}
                style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
              >
                <Text style={styles.optionText}>{t(localeI18nKey(loc))}</Text>
                {userSelectedLocale === loc ? (
                  <Ionicons name="checkmark-circle" size={20} color="#7AE4FF" />
                ) : (
                  <Ionicons name="ellipse-outline" size={20} color="rgba(255,255,255,0.35)" />
                )}
              </Pressable>
            ))}

            <Text style={[styles.sectionLabel, styles.sectionSpacer]}>{t('smartTrio.switcher.market')}</Text>
            {MARKET_OPTIONS.map((code) => {
              const active = marketCode === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => onPickMarket(code)}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
                >
                  <Text style={styles.optionText}>{t(marketI18nKey(code))}</Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={20} color="#7AE4FF" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color="rgba(255,255,255,0.35)" />
                  )}
                </Pressable>
              );
            })}

            <View style={styles.readonlyBlock}>
              <Text style={styles.readonlyLabel}>{t('smartTrio.switcher.nativeLanguage')}</Text>
              <Text style={styles.readonlyValue}>{t(localeI18nKey(resolved.nativeLocale))}</Text>
              <Text style={styles.readonlyLabel}>{t('smartTrio.switcher.customerLanguage')}</Text>
              <Text style={styles.readonlyValue}>{t(localeI18nKey(resolved.customerLocale))}</Text>
              <Text style={styles.readonlyLabel}>{t('smartTrio.switcher.merchantLanguage')}</Text>
              <Text style={styles.readonlyValue}>{t(localeI18nKey(resolved.merchantLocale))}</Text>
            </View>

            <Text style={styles.notice}>{t('smartTrio.switcher.localOnlyNotice')}</Text>
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
          >
            <Text style={styles.closeLabel}>{t('smartTrio.switcher.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    maxHeight: Platform.OS === 'web' ? '85%' : '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: 'rgba(18, 24, 38, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  subtitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  scroll: { maxHeight: 420 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(122,228,255,0.9)', textTransform: 'uppercase' },
  sectionSpacer: { marginTop: 16 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionPressed: { opacity: 0.88 },
  optionText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', flex: 1, paddingRight: 8 },
  readonlyBlock: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  readonlyLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
  readonlyValue: { fontSize: 14, fontWeight: '700', color: '#E8ECFF', marginBottom: 8 },
  notice: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.42)',
    marginTop: 14,
    lineHeight: 16,
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  closeLabel: { fontSize: 15, fontWeight: '800', color: '#C9D6FF' },
});
