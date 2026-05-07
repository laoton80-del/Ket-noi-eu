import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSmartTrio } from '../../context/SmartTrioContext';
import type { MarketCode, SmartTrioLocale } from '../../core/i18n/smartTrioTypes';
import { useTranslation } from '../../i18n';
import { SmartTrioLanguageSheet } from './SmartTrioLanguageSheet';

export type SmartTrioLanguageChipPlacement = 'sheet' | 'floating' | 'dock';

export type SmartTrioLanguageChipProps = Readonly<{
  tabBarLift: number;
  placement: SmartTrioLanguageChipPlacement;
  isDesktopWeb?: boolean;
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
}: SmartTrioLanguageChipProps): ReactElement {
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
  const dockSummary = useMemo(
    () => [t(localeI18nKey(appLocale)), t(marketI18nKey(marketCode))].join(' · '),
    [appLocale, marketCode, t]
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
        top: insets.top + 58,
        right: Math.max(insets.right, 14),
      } as const;
    }
    return {
      bottom: tabBarLift + Math.max(insets.bottom, 8) + 64,
      alignSelf: 'center' as const,
    };
  }, [placement, isDesktopWeb, insets.top, insets.right, insets.bottom, tabBarLift]);

  const narrow = width < 420;

  const dockMode = placement === 'dock';
  const body = (
    <>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.row,
          placement === 'floating' && styles.rowFloating,
          dockMode && styles.rowDock,
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('shell.utility.language')}
      >
        <View style={[styles.iconWrap, dockMode && styles.iconWrapDock]}>
          <Ionicons name="globe-outline" size={18} color="#7AE4FF" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.caption} numberOfLines={1}>
            {dockMode ? t('shell.utility.language') : t('smartTrio.switcher.title')}
          </Text>
          <Text style={styles.summary} numberOfLines={dockMode ? 1 : narrow ? 2 : 1}>
            {dockMode ? dockSummary : summary}
          </Text>
        </View>
        <Text style={styles.change}>{dockMode ? t('shell.utility.change') : t('smartTrio.switcher.change')}</Text>
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

  if (placement === 'dock') {
    return <View style={styles.dockWrap}>{body}</View>;
  }

  return <View style={styles.sheetWrap}>{body}</View>;
}

const styles = StyleSheet.create({
  sheetWrap: { width: '100%' },
  dockWrap: { width: '100%' },
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
  rowDock: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 19, 36, 0.8)',
    borderColor: 'rgba(122, 228, 255, 0.16)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(122, 228, 255, 0.12)',
  },
  iconWrapDock: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  caption: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.74)', textTransform: 'uppercase' },
  summary: { fontSize: 13, fontWeight: '800', color: '#F6FAFF' },
  change: { fontSize: 12, fontWeight: '900', color: '#8DEBFF' },
});
