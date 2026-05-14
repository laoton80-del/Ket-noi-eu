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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SmartTrioLanguageSheet } from '../components/smartTrio/SmartTrioLanguageSheet';
import {
  VionaGlobalTopRail,
  useVionaGlobalTopRailWebLegacySuppression,
} from '../components/viona/VionaGlobalTopRail';
import { VionaBottomEscapeBar } from '../components/viona/VionaBottomEscapeBar';
import { APP_BRAND } from '../config/appBrand';
import { useHomeCommand } from '../context/HomeCommandContext';
import { useFullscreenMode } from '../hooks/useFullscreenMode';
import { useTranslation } from '../i18n';
import { MAIN_TAB, type RootStackParamList } from '../navigation/routes';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

const ACADEMY_GLOBAL_BG = require('../../assets/UI/viona-academy-global-network-bg-v1.png');
const ACADEMY_CANVAS = '#050B14';

const INK = 'rgba(245, 243, 255, 0.96)';
const INK_MUTED = 'rgba(210, 208, 230, 0.82)';
const VIOLET_STROKE = 'rgba(167, 139, 250, 0.55)';
const CYAN_STROKE = 'rgba(34, 211, 238, 0.42)';
const GOLD_SOFT = 'rgba(253, 224, 138, 0.88)';
const CARD_FILL = 'rgba(10, 14, 32, 0.78)';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ModuleTone = 'violet' | 'cyan';

function AcademyModuleCard({
  title,
  status,
  body,
  tone,
  icon,
  onPress,
  a11y,
}: Readonly<{
  title: string;
  status: string;
  body: string;
  tone: ModuleTone;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  a11y: string;
}>): ReactElement {
  const [hovered, setHovered] = useState(false);
  const stroke = tone === 'violet' ? VIOLET_STROKE : CYAN_STROKE;
  const iconColor = tone === 'violet' ? 'rgba(196, 181, 253, 0.95)' : 'rgba(103, 232, 249, 0.95)';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.moduleCard,
        {
          borderColor: hovered ? 'rgba(255, 255, 255, 0.22)' : stroke,
          backgroundColor: hovered ? 'rgba(12, 16, 36, 0.88)' : CARD_FILL,
        },
        Platform.OS === 'web' && hovered && styles.moduleCardHover,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.moduleHeader}>
        <Ionicons name={icon} size={22} color={iconColor} />
        <View style={styles.moduleTitleBlock}>
          <Text style={styles.moduleTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{status}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.moduleBody}>{body}</Text>
      <Text style={styles.moduleCtaHint}>{'›'}</Text>
    </Pressable>
  );
}

export function AcademyScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const homeCommand = useHomeCommand();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const desktopWeb = Platform.OS === 'web' && width > 768;
  const backdropOpacity = desktopWeb ? 0.58 : 0.42;
  const gridColumns = width >= 720 ? 2 : 1;
  const gridGap = 12;
  const horizontalPad = theme.spacing.lg;
  const moduleWidth =
    gridColumns === 2 ? (width - horizontalPad * 2 - gridGap) / 2 : width - horizontalPad * 2;

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
      </View>

      <View
        style={styles.hubRoot}
        nativeID="academy-hub-root"
        {...(Platform.OS === 'web' ? ({ id: 'academy-hub-root' } as const) : {})}
      >
        <VionaGlobalTopRail {...academyTopRailProps} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === 'web' && styles.scrollContentWebGrow,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>{t('academyHub.heroBadge')}</Text>
            <Text style={styles.heroTitle}>{t('academyHub.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('academyHub.heroSubtitle')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('academyHub.primaryCta')}
              onPress={() => navigation.navigate('LiveAiTeacher')}
              style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="sparkles-outline" size={18} color={GOLD_SOFT} />
              <Text style={styles.heroCtaText}>{t('academyHub.primaryCta')}</Text>
            </Pressable>
          </View>

          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color={CYAN_STROKE} />
            <Text style={styles.safetyText}>{t('academyHub.safetyNote')}</Text>
          </View>

          <Text style={styles.sectionLabel}>{t('home.universeAcademyTitle')}</Text>

          <View
            style={[
              styles.moduleGrid,
              { gap: gridGap, flexDirection: gridColumns === 2 ? 'row' : 'column', flexWrap: 'wrap' },
            ]}
          >
            <View style={{ width: moduleWidth }}>
              <AcademyModuleCard
                title={t('academyHub.module1Title')}
                status={t('academyHub.module1Status')}
                body={t('academyHub.module1Body')}
                tone="violet"
                icon="school-outline"
                a11y={t('academyHub.module1Title')}
                onPress={() => navigation.navigate('LiveAiTeacher')}
              />
            </View>
            <View style={{ width: moduleWidth }}>
              <AcademyModuleCard
                title={t('academyHub.module2Title')}
                status={t('academyHub.module2Status')}
                body={t('academyHub.module2Body')}
                tone="cyan"
                icon="book-outline"
                a11y={t('academyHub.module2Title')}
                onPress={() => navigation.navigate('AdultLearningHome')}
              />
            </View>
            <View style={{ width: moduleWidth }}>
              <AcademyModuleCard
                title={t('academyHub.module3Title')}
                status={t('academyHub.module3Status')}
                body={t('academyHub.module3Body')}
                tone="cyan"
                icon="earth-outline"
                a11y={t('academyHub.module3Title')}
                onPress={() => navigation.navigate('AdultLearningHome')}
              />
            </View>
            <View style={{ width: moduleWidth }}>
              <AcademyModuleCard
                title={t('academyHub.module4Title')}
                status={t('academyHub.module4Status')}
                body={t('academyHub.module4Body')}
                tone="violet"
                icon="color-palette-outline"
                a11y={t('academyHub.module4Title')}
                onPress={() => navigation.navigate('KidsLearningHome')}
              />
            </View>
            <View style={{ width: moduleWidth }}>
              <AcademyModuleCard
                title={t('academyHub.module5Title')}
                status={t('academyHub.module5Status')}
                body={t('academyHub.module5Body')}
                tone="violet"
                icon="people-outline"
                a11y={t('academyHub.module5Title')}
                onPress={() => navigation.navigate('KidsLearningHome')}
              />
            </View>
            <View style={{ width: moduleWidth }}>
              <AcademyModuleCard
                title={t('academyHub.module6Title')}
                status={t('academyHub.module6Status')}
                body={t('academyHub.module6Body')}
                tone="cyan"
                icon="bulb-outline"
                a11y={t('academyHub.module6Title')}
                onPress={() => navigation.navigate('LiveAiTeacher')}
              />
            </View>
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
    backgroundColor: 'rgba(5, 11, 20, 0.14)',
  },
  hubRoot: {
    flex: 1,
    minHeight: 0,
    zIndex: 2,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    flexDirection: 'column',
  },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  scrollContentWebGrow: { flexGrow: 1 },
  hero: {
    borderRadius: 18,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: VIOLET_STROKE,
    backgroundColor: CARD_FILL,
    gap: 8,
  },
  heroKicker: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 138, 0.35)',
    backgroundColor: 'rgba(253, 224, 138, 0.1)',
    color: GOLD_SOFT,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
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
    borderColor: CYAN_STROKE,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  heroCtaText: {
    color: CYAN_STROKE,
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: theme.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.28)',
    backgroundColor: 'rgba(6, 20, 28, 0.55)',
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: INK_MUTED,
    fontFamily: FontFamily.medium,
  },
  sectionLabel: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: INK,
    letterSpacing: 0.3,
  },
  moduleGrid: {
    width: '100%',
  },
  moduleCard: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 0,
    minHeight: 132,
  },
  moduleCardHover: {
    transform: [{ translateY: -1 }],
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  moduleTitleBlock: { flex: 1, gap: 6 },
  moduleTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: INK,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: GOLD_SOFT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moduleBody: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: INK_MUTED,
    fontFamily: FontFamily.regular,
  },
  moduleCtaHint: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    fontSize: 18,
    color: 'rgba(255,255,255,0.25)',
    fontFamily: FontFamily.semibold,
  },
});
