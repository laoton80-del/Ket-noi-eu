import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AcademyGlassCard, type AcademyGlassAccent } from '../components/academy/AcademyGlassCard';
import { AccountNeonGlassPanel } from '../components/account/AccountNeonGlassPanel';
import { SmartTrioLanguageSheet } from '../components/smartTrio/SmartTrioLanguageSheet';
import {
  VionaGlobalTopRail,
  useVionaGlobalTopRailWebLegacySuppression,
} from '../components/viona/VionaGlobalTopRail';
import { VionaBottomEscapeBar } from '../components/viona/VionaBottomEscapeBar';
import {
  VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY,
  vionaAccountRoleStroke,
  VIONA_ACCOUNT_ROLE_ACCENTS,
} from '../components/viona/globalLightNetworkTokens';
import { APP_BRAND } from '../config/appBrand';
import { useHomeCommand } from '../context/HomeCommandContext';
import { useFullscreenMode } from '../hooks/useFullscreenMode';
import { useTranslation } from '../i18n';
import { MAIN_TAB, type RootStackParamList } from '../navigation/routes';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

const GLN = VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY;
const ACADEMY_GLOBAL_BG = require('../../assets/UI/viona-academy-global-network-bg-v1.png');
const ACADEMY_CANVAS = '#050B14';
const HUB_MAX_WIDTH = 1040;
const TABLET_MIN = 768;

type Nav = NativeStackNavigationProp<RootStackParamList>;

type AcademyModuleConfig = Readonly<{
  id: string;
  accent: AcademyGlassAccent;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: 'academyHub.module1Title' | 'academyHub.module2Title' | 'academyHub.module3Title' | 'academyHub.module4Title' | 'academyHub.module5Title' | 'academyHub.module6Title';
  statusKey: 'academyHub.module1Status' | 'academyHub.module2Status' | 'academyHub.module3Status' | 'academyHub.module4Status' | 'academyHub.module5Status' | 'academyHub.module6Status';
  bodyKey: 'academyHub.module1Body' | 'academyHub.module2Body' | 'academyHub.module3Body' | 'academyHub.module4Body' | 'academyHub.module5Body' | 'academyHub.module6Body';
  onPress: () => void;
}>;

export function AcademyScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const homeCommand = useHomeCommand();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const desktopWeb = Platform.OS === 'web' && width >= TABLET_MIN;
  const backdropOpacity = desktopWeb ? 0.56 : 0.44;
  const horizontalPad = width >= TABLET_MIN ? theme.spacing.xl : theme.spacing.lg;
  const contentWidth = Math.min(width, HUB_MAX_WIDTH);
  const gridColumns = width >= 960 ? 3 : width >= 640 ? 2 : 1;
  const gridGap = width >= TABLET_MIN ? 14 : 12;
  const innerTrackWidth = contentWidth - horizontalPad * 2;
  const moduleWidth =
    gridColumns === 1
      ? innerTrackWidth
      : (innerTrackWidth - gridGap * (gridColumns - 1)) / gridColumns;

  const { isWeb: isWebFs, isSupported: fsSupported, isFullscreen, toggleFullscreen } = useFullscreenMode();

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

  useVionaGlobalTopRailWebLegacySuppression({
    rootId: 'academy-hub-root',
    enabled: desktopWeb,
    labels: railLegacyLabels,
    scenePadMin: 40,
  });

  const fullscreenControl = useMemo(() => {
    if (!desktopWeb || !isWebFs || !fsSupported) return undefined;
    return {
      isActive: isFullscreen,
      onPress: toggleFullscreen,
      accessibilityLabel: isFullscreen ? t('shell.fullscreen.exit') : t('shell.fullscreen.enter'),
      label: isFullscreen ? t('shell.fullscreen.exit') : t('shell.fullscreen.enter'),
    };
  }, [desktopWeb, fsSupported, isFullscreen, isWebFs, t, toggleFullscreen]);

  const openLanguageSheet = useCallback(() => setLanguageSheetOpen(true), []);
  const openSafetyAssist = useCallback(() => {
    homeCommand?.triggerSafetyAssist();
  }, [homeCommand]);
  const openAccountHub = useCallback(() => {
    if (homeCommand) {
      homeCommand.openAccount();
      return;
    }
    navigation.navigate('PersonalHub');
  }, [homeCommand, navigation]);
  const openVioWallet = useCallback(() => {
    navigation.navigate('Wallet');
  }, [navigation]);
  const goHomeFromLogo = useCallback(() => {
    navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.home });
  }, [navigation]);
  const bottomEscapeBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.home });
  }, [navigation]);

  const academyTopRailProps = useMemo(
    () => ({
      density: desktopWeb && width < 1180 ? ('compact' as const) : ('comfortable' as const),
      onPressLogo: goHomeFromLogo,
      titleLine1: t('academyHub.railTitle'),
      titleLine2: `${APP_BRAND.iconLabel} · ${t('academyHub.railContext')}`,
      titleA11y: `${t('academyHub.railTitle')}. ${t('academyHub.railContext')}`,
      onPressLanguage: openLanguageSheet,
      onPressSafety: openSafetyAssist,
      onPressAccount: openAccountHub,
      onPressVio: openVioWallet,
      showVioCredits: true,
      fullscreenControl,
      showRolePicker: Boolean(homeCommand?.showRolePicker),
      onPressRole: homeCommand?.openRolePicker,
    }),
    [
      desktopWeb,
      width,
      goHomeFromLogo,
      t,
      openLanguageSheet,
      openSafetyAssist,
      openAccountHub,
      openVioWallet,
      fullscreenControl,
      homeCommand?.showRolePicker,
      homeCommand?.openRolePicker,
    ]
  );

  const modules = useMemo((): readonly AcademyModuleConfig[] => {
    const nav = navigation.navigate.bind(navigation);
    return [
      {
        id: 'module-1',
        accent: 'violet',
        icon: 'school-outline',
        titleKey: 'academyHub.module1Title',
        statusKey: 'academyHub.module1Status',
        bodyKey: 'academyHub.module1Body',
        onPress: () => nav('LiveAiTeacher'),
      },
      {
        id: 'module-2',
        accent: 'cyan',
        icon: 'book-outline',
        titleKey: 'academyHub.module2Title',
        statusKey: 'academyHub.module2Status',
        bodyKey: 'academyHub.module2Body',
        onPress: () => nav('AdultLearningHome'),
      },
      {
        id: 'module-3',
        accent: 'cyan',
        icon: 'earth-outline',
        titleKey: 'academyHub.module3Title',
        statusKey: 'academyHub.module3Status',
        bodyKey: 'academyHub.module3Body',
        onPress: () => nav('AdultLearningHome'),
      },
      {
        id: 'module-4',
        accent: 'emerald',
        icon: 'color-palette-outline',
        titleKey: 'academyHub.module4Title',
        statusKey: 'academyHub.module4Status',
        bodyKey: 'academyHub.module4Body',
        onPress: () => nav('KidsLearningHome'),
      },
      {
        id: 'module-5',
        accent: 'emerald',
        icon: 'people-outline',
        titleKey: 'academyHub.module5Title',
        statusKey: 'academyHub.module5Status',
        bodyKey: 'academyHub.module5Body',
        onPress: () => nav('KidsLearningHome'),
      },
      {
        id: 'module-6',
        accent: 'violet',
        icon: 'bulb-outline',
        titleKey: 'academyHub.module6Title',
        statusKey: 'academyHub.module6Status',
        bodyKey: 'academyHub.module6Body',
        onPress: () => nav('LiveAiTeacher'),
      },
    ];
  }, [navigation]);

  const hubShellStyle = useMemo((): ViewStyle => {
    return {
      width: '100%',
      maxWidth: HUB_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: horizontalPad,
    };
  }, [horizontalPad]);

  const violetInk = VIONA_ACCOUNT_ROLE_ACCENTS.violet.ink;
  const goldInk = VIONA_ACCOUNT_ROLE_ACCENTS.gold.ink;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
        <Image
          source={ACADEMY_GLOBAL_BG}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: backdropOpacity },
            Platform.OS === 'web'
              ? ({
                  objectFit: 'cover',
                  objectPosition: '50% 22%',
                  imageRendering: '-webkit-optimize-contrast',
                } as ImageStyle)
              : null,
          ]}
        />
        <View style={styles.backdropVeil} />
        <View style={styles.backdropVioletWash} />
      </View>

      <View
        style={[styles.hubRoot, hubShellStyle]}
        nativeID="academy-hub-root"
        {...(Platform.OS === 'web' ? ({ id: 'academy-hub-root' } as const) : {})}
      >
        <VionaGlobalTopRail {...academyTopRailProps} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === 'web' && styles.scrollContentWebGrow,
            { paddingBottom: width >= TABLET_MIN ? 132 : 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AccountNeonGlassPanel role="violet" tier="elevated" radius={20} contentStyle={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={[styles.heroGlyph, { borderColor: vionaAccountRoleStroke('violet', false) }]}>
                <Ionicons name="sparkles" size={20} color={violetInk} accessibilityIgnoresInvertColors />
              </View>
              <Text style={styles.heroKicker}>{t('academyHub.heroBadge')}</Text>
            </View>
            <Text style={styles.heroTitle}>{t('academyHub.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('academyHub.heroSubtitle')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('academyHub.primaryCta')}
              onPress={() => navigation.navigate('LiveAiTeacher')}
              style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="sparkles-outline" size={18} color={goldInk} accessibilityIgnoresInvertColors />
              <Text style={styles.heroCtaText}>{t('academyHub.primaryCta')}</Text>
            </Pressable>
          </AccountNeonGlassPanel>

          <AccountNeonGlassPanel role="emerald" tier="identity" radius={16} contentStyle={styles.safetyInner}>
            <View style={styles.safetyRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={VIONA_ACCOUNT_ROLE_ACCENTS.emerald.ink} />
              <Text style={styles.safetyText}>{t('academyHub.safetyNote')}</Text>
            </View>
          </AccountNeonGlassPanel>

          <Text style={styles.sectionLabel}>{t('home.universeAcademyTitle')}</Text>

          <View
            style={[
              styles.moduleGrid,
              {
                gap: gridGap,
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: gridColumns === 1 ? 'center' : 'flex-start',
              },
            ]}
          >
            {modules.map((mod) => (
              <View key={mod.id} style={{ width: moduleWidth, maxWidth: '100%' }}>
                <AcademyGlassCard
                  accent={mod.accent}
                  icon={mod.icon}
                  title={t(mod.titleKey)}
                  status={t(mod.statusKey)}
                  body={t(mod.bodyKey)}
                  onPress={mod.onPress}
                  testID={`academy-hub-${mod.id}`}
                />
              </View>
            ))}
          </View>

          <VionaBottomEscapeBar showBack showHome onBack={bottomEscapeBack} onHome={goHomeFromLogo} />
        </ScrollView>
      </View>

      <SmartTrioLanguageSheet visible={languageSheetOpen} onClose={() => setLanguageSheetOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ACADEMY_CANVAS,
    overflow: 'hidden',
  },
  backdropVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 18, 0.22)',
  },
  backdropVioletWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(120, 60, 200, 0.06)',
  },
  hubRoot: {
    flex: 1,
    minHeight: 0,
    zIndex: 2,
    paddingTop: theme.spacing.sm,
    flexDirection: 'column',
    width: '100%',
  },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: {
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
    width: '100%',
  },
  scrollContentWebGrow: { flexGrow: 1 },
  heroInner: {
    padding: theme.spacing.lg,
    gap: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroGlyph: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90, 50, 160, 0.18)',
  },
  heroKicker: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(246, 212, 110, 0.38)',
    backgroundColor: 'rgba(246, 212, 110, 0.1)',
    color: VIONA_ACCOUNT_ROLE_ACCENTS.gold.ink,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    color: GLN.titleIvory,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.medium,
    color: GLN.bodyMuted,
  },
  heroCta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(246, 212, 110, 0.55)',
    backgroundColor: 'rgba(246, 212, 110, 0.1)',
  },
  heroCtaText: {
    color: VIONA_ACCOUNT_ROLE_ACCENTS.gold.ink,
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
  },
  safetyInner: {
    padding: theme.spacing.md,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: GLN.bodyMuted,
    fontFamily: FontFamily.medium,
  },
  sectionLabel: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: GLN.titleIvory,
    letterSpacing: 0.35,
  },
  moduleGrid: {
    width: '100%',
  },
});
