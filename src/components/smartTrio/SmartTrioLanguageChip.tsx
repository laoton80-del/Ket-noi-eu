import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSmartTrio } from '../../context/SmartTrioContext';
import type { MarketCode, SmartTrioLocale } from '../../core/i18n/smartTrioTypes';
import { useTranslation } from '../../i18n';
import { SmartTrioLanguageSheet } from './SmartTrioLanguageSheet';

export type SmartTrioLanguageChipPlacement = 'sheet' | 'floating';

export type SmartTrioLanguageChipProps = Readonly<{
  tabBarLift: number;
  placement: SmartTrioLanguageChipPlacement;
  isDesktopWeb?: boolean;
  /** When true, floating chip is not rendered (e.g. B2C Home desktop command shell). */
  suppressFloating?: boolean;
}>;

function marketI18nKey(code: MarketCode): string {
  const slug = code === 'GLOBAL' ? 'global' : code.toLowerCase();
  return `smartTrio.market.${slug}`;
}

function localeI18nKey(locale: SmartTrioLocale): string {
  return `smartTrio.language.${locale}`;
}

function triggerHaptic(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function SmartTrioLanguageChip({
  tabBarLift,
  placement,
  isDesktopWeb = false,
  suppressFloating = false,
}: SmartTrioLanguageChipProps): ReactElement | null {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { appLocale, nativeLocale, marketCode } = useSmartTrio();
  const [sheetOpen, setSheetOpen] = useState(false);

  const summary = useMemo(
    () =>
      [t(localeI18nKey(appLocale)), t(marketI18nKey(marketCode)), t(localeI18nKey(nativeLocale))].join(' · '),
    [appLocale, marketCode, nativeLocale, t]
  );

  const onOpen = useCallback(() => {
    triggerHaptic();
    setSheetOpen(true);
  }, []);

  const onCloseSheet = useCallback(() => setSheetOpen(false), []);

  const floatingStyle = useMemo(() => {
    if (placement !== 'floating') return undefined;
    if (isDesktopWeb) {
      return {
        top: insets.top + 84,
        right: Math.max(insets.right, 16),
      } as const;
    }
    return {
      bottom: tabBarLift + Math.max(insets.bottom, 8) + 64,
      alignSelf: 'center' as const,
    };
  }, [placement, isDesktopWeb, insets.top, insets.right, insets.bottom, tabBarLift]);

  const narrow = width < 420;

  if (placement === 'floating' && suppressFloating) {
    return null;
  }

  const body = (
    <>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.row,
          placement === 'floating' && styles.rowFloating,
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('smartTrio.switcher.title')}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="globe-outline" size={18} color="#7AE4FF" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.caption} numberOfLines={1}>
            {t('smartTrio.switcher.title')}
          </Text>
          <Text style={styles.summary} numberOfLines={narrow ? 2 : 1}>
            {summary}
          </Text>
        </View>
        <Text style={styles.change}>{t('smartTrio.switcher.change')}</Text>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.45)" />
      </Pressable>
      <SmartTrioLanguageSheet visible={sheetOpen} onClose={onCloseSheet} />
    </>
  );

  if (placement === 'floating') {
    return (
      <View
        style={[styles.floatingWrap, floatingStyle, isDesktopWeb && styles.floatingWrapDesktop]}
        pointerEvents="box-none"
      >
        {body}
      </View>
    );
  }

  return <View style={styles.sheetWrap}>{body}</View>;
}

const styles = StyleSheet.create({
  sheetWrap: { width: '100%' },
  floatingWrap: {
    position: 'absolute',
    zIndex: 44,
    maxWidth: '92%',
  },
  floatingWrapDesktop: {
    maxWidth: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(122, 228, 255, 0.22)',
  },
  rowFloating: {
    paddingHorizontal: 16,
    backgroundColor: 'rgba(15, 28, 52, 0.94)',
    borderColor: 'rgba(122, 228, 255, 0.36)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(122, 228, 255, 0.12)',
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  caption: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.74)', textTransform: 'uppercase' },
  summary: { fontSize: 13, fontWeight: '800', color: '#F6FAFF' },
  change: { fontSize: 12, fontWeight: '900', color: '#8DEBFF' },
});
