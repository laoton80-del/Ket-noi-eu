import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { useHomeCommand } from '../../context/HomeCommandContext';
import { useFullscreenMode } from '../../hooks/useFullscreenMode';
import { useMiniAppEntry } from '../../hooks/useMiniAppEntry';
import { useTranslation } from '../../i18n';
import { MAIN_TAB, type RootStackParamList, type RootTabParamList } from '../../navigation/routes';
import { useWalletState } from '../../state/wallet';
import { useUserStore, type ActiveRole } from '../../store/userStore';
import { useVionaHomeDaylightBoost } from './useVionaHomeDaylightBoost';

const NOOP = () => {};

function homeTabForRole(role: ActiveRole): keyof RootTabParamList {
  switch (role) {
    case 'B2B':
      return MAIN_TAB.B2B.merchant;
    case 'BROKER':
      return MAIN_TAB.BROKER.radar;
    case 'ADMIN':
      return MAIN_TAB.ADMIN.deck;
    default:
      return MAIN_TAB.B2C.home;
  }
}

export type UseMiniAppShellChromeOptions = Readonly<{
  /** When true, enables web Daylight Boost toggle metadata (does not force Home layout). */
  enableDaylightToggle?: boolean;
}>;

export type MiniAppShellChrome = Readonly<{
  goBack: () => void;
  goHome: () => void;
  openLanguage: () => void;
  openAccount: () => void;
  openSafetyAssist: () => void;
  openVioWallet: () => void;
  languageSheetOpen: boolean;
  setLanguageSheetOpen: (open: boolean) => void;
  walletChipLabel: string;
  showRolePicker: boolean;
  openRolePicker: () => void;
  fullscreenControl:
    | Readonly<{
        isActive: boolean;
        onPress: () => void;
        accessibilityLabel: string;
        label: string;
      }>
    | undefined;
  daylightControl:
    | Readonly<{
        label: string;
        onPress: () => void;
        accessibilityLabel: string;
        isDaylight: boolean;
      }>
    | undefined;
  toggleDaylightBoost: () => void;
  railLegacyLabels: Readonly<{
    languageTitle: string;
    accountA11y: string;
    accountChip: string;
    accountChipShort: string;
    sosFabLabel: string;
  }>;
}>;

export function useMiniAppShellChrome(options: UseMiniAppShellChromeOptions = {}): MiniAppShellChrome {
  const { enableDaylightToggle = false } = options;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const homeCommand = useHomeCommand();
  const { openMiniApp } = useMiniAppEntry();
  const wallet = useWalletState();
  const activeRole = useUserStore((s) => s.currentActiveRole);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [daylightBoost, setDaylightBoost] = useVionaHomeDaylightBoost();

  const { isWeb: isWebFullscreen, isSupported: isFullscreenSupported, isFullscreen, toggleFullscreen } =
    useFullscreenMode();

  const desktopWeb = Platform.OS === 'web' && width >= 768;

  const goHome = useCallback(() => {
    const tab = homeTabForRole(activeRole);
    openMiniApp('hub', () => navigation.navigate('Tabs', { screen: tab }));
  }, [activeRole, navigation, openMiniApp]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    goHome();
  }, [goHome, navigation]);

  const openLanguage = useCallback(() => {
    if (homeCommand) {
      homeCommand.openLanguageSheet();
      return;
    }
    setLanguageSheetOpen(true);
  }, [homeCommand]);

  const openAccount = useCallback(() => {
    if (homeCommand) {
      homeCommand.openAccount();
      return;
    }
    navigation.navigate('PersonalHub');
  }, [homeCommand, navigation]);

  const openSafetyAssist = useCallback(() => {
    homeCommand?.triggerSafetyAssist();
  }, [homeCommand]);

  const openVioWallet = useCallback(() => {
    navigation.navigate('Wallet');
  }, [navigation]);

  const openRolePicker = useCallback(() => {
    homeCommand?.openRolePicker();
  }, [homeCommand]);

  const walletChipLabel = useMemo(() => {
    const n = wallet.credits;
    const useCompact = width < 400;
    return useCompact ? t('home.walletChipCompact', { amount: n }) : t('home.walletChipFull', { amount: n });
  }, [t, wallet.credits, width]);

  const fullscreenControl = useMemo(() => {
    if (!desktopWeb || !isWebFullscreen || !isFullscreenSupported) return undefined;
    return {
      isActive: isFullscreen,
      onPress: toggleFullscreen,
      label: isFullscreen ? t('shell.fullscreen.exit') : t('shell.fullscreen.enter'),
      accessibilityLabel: isFullscreen ? t('shell.fullscreen.exit') : t('shell.fullscreen.enter'),
    };
  }, [desktopWeb, isFullscreen, isFullscreenSupported, isWebFullscreen, t, toggleFullscreen]);

  const daylightToggleLabel = useMemo(() => {
    if (daylightBoost) {
      return i18n.language?.startsWith('vi') ? 'Tắt đèn' : 'Night';
    }
    return i18n.language?.startsWith('vi') ? 'Bật đèn' : 'Daylight';
  }, [daylightBoost, i18n.language]);

  const toggleDaylightBoost = useCallback(() => {
    setDaylightBoost((v) => !v);
  }, [setDaylightBoost]);

  const daylightControl = useMemo(() => {
    if (!enableDaylightToggle || Platform.OS !== 'web') return undefined;
    return {
      label: daylightToggleLabel,
      onPress: toggleDaylightBoost,
      accessibilityLabel: daylightToggleLabel,
      isDaylight: daylightBoost,
    };
  }, [daylightBoost, daylightToggleLabel, enableDaylightToggle, toggleDaylightBoost]);

  const railLegacyLabels = useMemo(
    () => ({
      languageTitle: t('smartTrio.switcher.title'),
      accountA11y: t('home.accountChipA11y'),
      accountChip: t('home.accountChip'),
      accountChipShort: t('home.accountChipShort'),
      sosFabLabel: t('sos.fabLabel'),
    }),
    [t]
  );

  return {
    goBack,
    goHome,
    openLanguage,
    openAccount,
    openSafetyAssist: homeCommand ? openSafetyAssist : NOOP,
    openVioWallet,
    languageSheetOpen,
    setLanguageSheetOpen,
    walletChipLabel,
    showRolePicker: Boolean(homeCommand?.showRolePicker),
    openRolePicker: homeCommand ? openRolePicker : NOOP,
    fullscreenControl,
    daylightControl,
    toggleDaylightBoost,
    railLegacyLabels,
  };
}
