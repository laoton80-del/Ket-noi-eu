import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactElement, type ReactNode, type RefObject } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHomeCommand } from '../../context/HomeCommandContext';
import { useTranslation } from '../../i18n';
import { SmartTrioLanguageSheet } from '../smartTrio/SmartTrioLanguageSheet';
import { theme } from '../../theme/theme';
import { vionaTrust } from './vionaTrustTokens';
import {
  VionaBottomEscapeBar,
  type VionaBottomEscapeAccent,
} from './VionaBottomEscapeBar';
import {
  VionaGlobalTopRail,
  useVionaGlobalTopRailWebLegacySuppression,
} from './VionaGlobalTopRail';
import { useMiniAppShellChrome } from './useMiniAppShellChrome';
import { VIONA_GLOBAL_LIGHT_NETWORK_CANVAS } from './globalLightNetworkTokens';

export type VionaMiniAppUniverse = 'local' | 'travel' | 'academy' | 'business' | 'sos';

export type VionaMiniAppSurfaceMode = 'midnight' | 'light' | 'danger';

export type VionaMiniAppShellProps = Readonly<{
  universe: VionaMiniAppUniverse;
  title: string;
  subtitle?: string;
  caption?: string;
  children: ReactNode;
  showDock?: boolean;
  dockCurrentLabel?: string;
  scrollBottomClearance?: number;
  surfaceMode?: VionaMiniAppSurfaceMode;
  legacySuppressRootId?: string;
  onBack?: () => void;
  onHome?: () => void;
  onPressCurrent?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  rootStyle?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<ScrollView | null>;
}>;

const DEFAULT_DOCK_BOTTOM_OFFSET = 58;
const DEFAULT_SCROLL_CLEARANCE = 172;

const SURFACE_CANVAS: Readonly<Record<VionaMiniAppSurfaceMode, string>> = {
  midnight: VIONA_GLOBAL_LIGHT_NETWORK_CANVAS.base,
  light: vionaTrust.canvas,
  danger: '#12080C',
};

const UNIVERSE_DOCK_ACCENT: Readonly<Record<VionaMiniAppUniverse, VionaBottomEscapeAccent>> = {
  local: 'emerald',
  travel: 'cyan',
  academy: 'violet',
  business: 'gold',
  sos: 'magenta',
};

const UNIVERSE_DOCK_ICON: Readonly<Record<VionaMiniAppUniverse, keyof typeof Ionicons.glyphMap>> = {
  local: 'location-outline',
  travel: 'airplane-outline',
  academy: 'school-outline',
  business: 'briefcase-outline',
  sos: 'shield-outline',
};

export function VionaMiniAppShell({
  universe,
  title,
  subtitle = '',
  caption = '',
  children,
  showDock = false,
  dockCurrentLabel,
  scrollBottomClearance,
  surfaceMode = 'midnight',
  legacySuppressRootId,
  onBack,
  onHome,
  onPressCurrent,
  contentContainerStyle,
  rootStyle,
  scrollRef,
}: VionaMiniAppShellProps): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const homeCommand = useHomeCommand();
  const desktopWeb = Platform.OS === 'web' && width > 768;
  const enableDaylight = surfaceMode === 'midnight' && universe !== 'sos';

  const chrome = useMiniAppShellChrome({ enableDaylightToggle: enableDaylight });

  const handleBack = onBack ?? chrome.goBack;
  const handleHome = onHome ?? chrome.goHome;

  const titleLine2 = subtitle.trim().length > 0 ? subtitle : caption;
  const titleA11y = [title, titleLine2].filter((line) => line.trim().length > 0).join('. ');

  const rootId = legacySuppressRootId ?? `viona-miniapp-${universe}-root`;

  useVionaGlobalTopRailWebLegacySuppression({
    rootId,
    enabled: desktopWeb,
    labels: chrome.railLegacyLabels,
    scenePadMin: 40,
  });

  const scrollPadBottom = useMemo(() => {
    if (scrollBottomClearance != null) return scrollBottomClearance;
    if (!showDock) return Math.max(insets.bottom, 12) + 24;
    return (
      DEFAULT_DOCK_BOTTOM_OFFSET +
      insets.bottom +
      DEFAULT_SCROLL_CLEARANCE +
      Math.max(insets.bottom, 12) +
      20
    );
  }, [insets.bottom, scrollBottomClearance, showDock]);

  const dockBottomOffset = DEFAULT_DOCK_BOTTOM_OFFSET + insets.bottom;
  const defaultDockLabels: Record<VionaMiniAppUniverse, string> = useMemo(
    () => ({
      local: t('shell.miniapp.local'),
      travel: t('shell.miniapp.travel'),
      academy: t('shell.miniapp.academy'),
      business: t('shell.miniapp.business'),
      sos: t('shell.miniapp.sos'),
    }),
    [t]
  );
  const resolvedCurrentLabel = (dockCurrentLabel ?? defaultDockLabels[universe]).trim();

  const topRailProps = useMemo(
    () => ({
      density: desktopWeb && width < 1180 ? ('compact' as const) : ('comfortable' as const),
      onPressLogo: handleHome,
      titleLine1: title,
      titleLine2,
      titleA11y,
      onPressLanguage: chrome.openLanguage,
      onPressSafety: chrome.openSafetyAssist,
      onPressAccount: chrome.openAccount,
      onPressVio: chrome.openVioWallet,
      showVioCredits: true,
      fullscreenControl: chrome.fullscreenControl,
      daylightControl: chrome.daylightControl,
      showRolePicker: chrome.showRolePicker,
      onPressRole: chrome.openRolePicker,
    }),
    [chrome, desktopWeb, handleHome, title, titleA11y, titleLine2, width]
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: SURFACE_CANVAS[surfaceMode] }, rootStyle]}
      edges={['top', 'left', 'right']}
    >
      <View
        style={styles.flex}
        nativeID={rootId}
        {...(Platform.OS === 'web' ? ({ id: rootId } as const) : {})}
      >
        <View style={styles.railPad}>
          <VionaGlobalTopRail {...topRailProps} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollPadBottom },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        {showDock ? (
          <VionaBottomEscapeBar
            placement="fixed"
            fixedBottomOffset={dockBottomOffset}
            showBack
            showHome
            onBack={handleBack}
            onHome={handleHome}
            showCurrent={resolvedCurrentLabel.length > 0}
            currentLabel={resolvedCurrentLabel}
            onPressCurrent={onPressCurrent ?? handleHome}
            currentAccentKind={UNIVERSE_DOCK_ACCENT[universe]}
            currentIcon={UNIVERSE_DOCK_ICON[universe]}
          />
        ) : null}
      </View>

      {!homeCommand ? (
        <SmartTrioLanguageSheet
          visible={chrome.languageSheetOpen}
          onClose={() => chrome.setLanguageSheetOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  railPad: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
});
