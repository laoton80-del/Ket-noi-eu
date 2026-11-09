import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Platform,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '../../../i18n';
import { useHomeCommand } from '../../../context/HomeCommandContext';
import { VionaCraneMark } from '../brand/VionaCraneMark';
import { VionaGlobalSosShellAction } from '../VionaGlobalSosShellAction';
import { VionaCinematicCompanion } from './VionaCinematicCompanion';
import { VionaCinematicRail } from './VionaCinematicRail';
import { VionaCinematicUniverseCard } from './VionaCinematicUniverseCard';
import { resolveVionaCinematicTier, vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import {
  VIONA_REC2_NOTIFICATION_PRESENTATION,
  createVionaRec2UniverseContract,
  resolveVionaRec2HomeLayout,
  resolveVionaRec2ImagePresentation,
  resolveVionaRec2TaskSurface,
  resolveVionaRec2TypographyMetrics,
  type VionaRec2ContentState,
  type VionaRec2TypographyMetrics,
  type VionaRec2UniverseAvailabilityInput,
  type VionaRec2UniverseCallbacks,
} from './vionaRec2HomeContract';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type VionaRec2HomeShellProps = Readonly<{
  displayName?: string | null;
  regionLabel?: string | null;
  universeAvailability: VionaRec2UniverseAvailabilityInput;
  universeCallbacks: VionaRec2UniverseCallbacks;
  onOpenLanguage?: () => void;
  contentState?: VionaRec2ContentState;
  reducedMotion?: boolean;
}>;

function ContentStateBanner({
  state,
  typography,
}: Readonly<{ state: VionaRec2ContentState; typography: VionaRec2TypographyMetrics }>) {
  const { t } = useTranslation();
  if (state === 'default') return null;
  const icon: IconName =
    state === 'loading'
      ? 'hourglass-outline'
      : state === 'offline'
        ? 'cloud-offline-outline'
        : state === 'gated'
          ? 'lock-closed-outline'
          : 'file-tray-outline';
  return (
    <View style={styles.stateBanner} accessibilityLiveRegion="polite">
      {state === 'loading' ? <ActivityIndicator color="#65C8FF" size="small" /> : <Ionicons name={icon} size={18} color="#65C8FF" />}
      <Text style={[styles.stateText, { lineHeight: typography.bodyLineHeight }]}>
        {t(`home.rec2.states.${state}`)}
      </Text>
    </View>
  );
}

function TaskStrip({ typography }: Readonly<{ typography: VionaRec2TypographyMetrics }>) {
  const { t } = useTranslation();
  const taskSurface = resolveVionaRec2TaskSurface();
  return (
    <View style={styles.section} testID="viona-rec2-task-surface">
      <Text style={[styles.sectionTitle, { lineHeight: typography.sectionTitleLineHeight }]}>
        {t('home.rec2.tasks.title')}
      </Text>
      <View style={styles.taskEmpty} accessibilityLiveRegion="polite">
        <Ionicons name="file-tray-outline" size={17} color="#68CFFF" />
        <Text style={[styles.taskEmptyText, { lineHeight: typography.bodyLineHeight }]}>
          {taskSurface.state === 'no-trusted-adapter' ? t('home.rec2.tasks.noTrustedAdapter') : ''}
        </Text>
      </View>
    </View>
  );
}

export function VionaRec2HomeShell({
  displayName,
  regionLabel,
  universeAvailability,
  universeCallbacks,
  onOpenLanguage,
  contentState = 'default',
  reducedMotion = false,
}: VionaRec2HomeShellProps) {
  const { t } = useTranslation();
  const homeCommand = useHomeCommand();
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measuredSize, setMeasuredSize] = useState<Readonly<{
    width: number;
    height: number;
  }> | null>(null);
  const onRootLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) return;
    setMeasuredSize((current) =>
      current?.width === width && current.height === height ? current : { width, height }
    );
  }, []);
  const shellWidth = measuredSize?.width ?? dimensions.width;
  const shellHeight = measuredSize?.height ?? dimensions.height;
  const shellPlatform = Platform.OS === 'web' ? 'web' : 'native';
  // Native keeps its existing tab navigation even on a wide device. The
  // permanent web desktop classification must not leak into native chrome.
  const tier = shellPlatform === 'web'
    ? resolveVionaCinematicTier(dimensions.width)
    : dimensions.width < 768 ? 'phone' : 'tablet';
  const [heroFailed, setHeroFailed] = useState(false);
  const heroPresentation = resolveVionaRec2ImagePresentation({
    provenance: 'unverified',
    loadState: heroFailed ? 'error' : 'ready',
  });
  const [companionOpen, setCompanionOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [navPinned, setNavPinned] = useState(false);
  const [vionaOpen, setVionaOpen] = useState(false);
  const [vionaPinned, setVionaPinned] = useState(false);
  const focusShell = tier !== 'phone';
  const reserveCompanion = useMemo(() => {
    if (!(vionaPinned && tier === 'desktop')) return false;
    const reserved = resolveVionaRec2HomeLayout({
      width: Math.max(1, shellWidth - vionaCinematicTokens.layout.companionWidth),
      height: shellHeight,
      fontScale: dimensions.fontScale,
      safeAreaInsets: insets,
      shellPlatform,
    });
    return reserved.cardWidth >= 280;
  }, [
    dimensions.fontScale,
    insets,
    shellHeight,
    shellPlatform,
    shellWidth,
    tier,
    vionaPinned,
  ]);
  const layout = useMemo(
    () =>
      resolveVionaRec2HomeLayout({
        width: reserveCompanion
          ? Math.max(1, shellWidth - vionaCinematicTokens.layout.companionWidth)
          : shellWidth,
        height: shellHeight,
        fontScale: dimensions.fontScale,
        safeAreaInsets: insets,
        shellPlatform,
      }),
    [
      dimensions.fontScale,
      insets,
      reserveCompanion,
      shellHeight,
      shellPlatform,
      shellWidth,
    ]
  );
  const universes = useMemo(
    () => createVionaRec2UniverseContract(universeAvailability),
    [universeAvailability]
  );
  const typography = useMemo(
    () => resolveVionaRec2TypographyMetrics(layout.fontScale),
    [layout.fontScale]
  );
  const normalizedName = displayName?.trim() || null;
  const normalizedRegion = regionLabel?.trim() || null;

  useEffect(() => {
    if (tier === 'desktop') return;
    setNavOpen(false);
    setNavPinned(false);
    setVionaOpen(false);
    setVionaPinned(false);
  }, [tier]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (navOpen && !navPinned) {
        setNavOpen(false);
        return;
      }
      if (vionaOpen && !vionaPinned) setVionaOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen, navPinned, vionaOpen, vionaPinned]);

  const requestNavOpen = (open: boolean) => {
    setNavOpen(open);
    if (!open) return;
    if (tier !== 'desktop' || !vionaPinned) {
      setVionaOpen(false);
      if (tier !== 'desktop') setVionaPinned(false);
    }
  };
  const requestVionaOpen = (open: boolean) => {
    setVionaOpen(open);
    if (!open) return;
    if (tier !== 'desktop' || !navPinned) {
      setNavOpen(false);
      if (tier !== 'desktop') setNavPinned(false);
    }
  };

  const center = (
        <ScrollView
          key={`viona-rec2-home-content-${layout.fontScale}`}
          style={styles.scroller}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: layout.contentBreathingClearance + layout.shellBottomObstruction,
              gap: layout.gap,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['rgba(62, 36, 18, 0.55)', 'rgba(12, 54, 98, 0.94)', 'rgba(4, 17, 34, 0.96)']}
            style={[styles.hero, tier === 'desktop' && styles.heroDesktop, tier === 'tablet' && styles.heroTablet]}
          >
            {heroPresentation.mode === 'image' ? (
              <View pointerEvents="none" style={styles.heroPhoto}>
                <Image
                  source={require('../../../../assets/brand/viona/cinematic/photos/hero-night-abstract.webp')}
                  resizeMode="cover"
                  accessible={false}
                  accessibilityIgnoresInvertColors
                  onError={() => setHeroFailed(true)}
                  style={styles.heroPhotoFill}
                />
              </View>
            ) : null}
            <View pointerEvents="none" style={styles.heroScrim} />
            <View style={[styles.commandRow, layout.columns === 1 && styles.commandRowStacked]}>
              <View style={styles.brandBlock}>
                <View style={styles.brandMark}>
                  <VionaCraneMark size={tier === 'phone' ? 28 : 36} variant="sapphire" glow={!reducedMotion} />
                </View>
                <Text style={[styles.brand, { lineHeight: typography.brandLineHeight }]}>VIONA</Text>
                <Text style={[styles.brandSubtitle, { lineHeight: typography.microLineHeight }]}>
                  {t('home.rec2.brandSubtitle')}
                </Text>
              </View>
              <View
                style={[
                  styles.headerControls,
                  { paddingTop: layout.headerControlTopClearance },
                  layout.columns === 1 && styles.headerControlsStacked,
                  focusShell && styles.headerControlsDockClearance,
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.rec2.language')}
                  accessibilityState={{ disabled: !onOpenLanguage }}
                  disabled={!onOpenLanguage}
                  onPress={onOpenLanguage}
                  style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
                >
                  <Ionicons name="language-outline" size={20} color="#DDEEFF" />
                </Pressable>
                <View
                  accessibilityRole="button"
                  accessibilityLabel={t('home.rec2.notificationUnavailable')}
                  accessibilityState={{ disabled: true }}
                  style={styles.headerButton}
                >
                  <Ionicons name="notifications-outline" size={20} color="#71879C" />
                </View>
                {focusShell && shellPlatform === 'web' && homeCommand ? (
                  <VionaGlobalSosShellAction onHoldComplete={homeCommand.triggerSafetyAssist} />
                ) : null}
              </View>
            </View>

            <View style={styles.heroCopy}>
              <Text style={[styles.greeting, { lineHeight: typography.greetingLineHeight }]}>
                {normalizedName
                  ? t('home.rec2.greetingNamed', { name: normalizedName })
                  : t('home.rec2.greetingGuest')}
              </Text>
              <Text style={[styles.headline, { lineHeight: typography.headlineLineHeight }]}>
                {t('home.rec2.headline')}
              </Text>
              {normalizedRegion ? (
                <View style={styles.contextRow}>
                  <Ionicons name="location-outline" size={15} color="#86D6FF" />
                  <Text style={[styles.contextText, { lineHeight: typography.bodyLineHeight }]}>
                    {normalizedRegion}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.visualFallback}>
              <Ionicons name="planet-outline" size={23} color="#63C8FF" />
              <Text style={[styles.visualFallbackText, { lineHeight: typography.bodyLineHeight }]}>
                {t('home.rec2.imageFallback')}
              </Text>
            </View>
          </LinearGradient>

          <ContentStateBanner state={contentState} typography={typography} />
          <TaskStrip typography={typography} />

          <View style={styles.section}>
            <View
              style={[
                styles.sectionHeadingRow,
                layout.columns === 1 && styles.sectionHeadingColumn,
              ]}
            >
              <Text style={[styles.sectionTitle, { lineHeight: typography.sectionTitleLineHeight }]}>
                {t('home.rec2.universesTitle')}
              </Text>
              <Text style={[styles.layoutLabel, { lineHeight: typography.microLineHeight }]}>
                {t(`home.rec2.layouts.${layout.mode}`)} · {layout.columns} × {layout.rows}
              </Text>
            </View>
            <View style={[styles.grid, { gap: layout.gap }]}>
              {universes.map((universe) => (
                <VionaCinematicUniverseCard
                  key={universe.id}
                  universe={universe}
                  callbacks={universeCallbacks}
                  width={Math.min(layout.cardWidth, 520)}
                  reducedMotion={reducedMotion}
                  imageSource={
                    universe.id === 'local'
                      ? require('../../../../assets/brand/viona/cinematic/photos/card-local.webp')
                      : universe.id === 'travel'
                        ? require('../../../../assets/brand/viona/cinematic/photos/card-travel.webp')
                        : universe.id === 'business'
                          ? require('../../../../assets/brand/viona/cinematic/photos/card-business.webp')
                          : universe.id === 'academy'
                            ? require('../../../../assets/brand/viona/cinematic/photos/card-academy.webp')
                            : universe.id === 'account'
                              ? require('../../../../assets/brand/viona/cinematic/photos/card-account.webp')
                              : universe.id === 'sos'
                                ? require('../../../../assets/brand/viona/cinematic/photos/card-sos.webp')
                                : undefined
                  }
                />
              ))}
            </View>
          </View>

          {!focusShell ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.rec2.alfred.expand')}
              onPress={() => setCompanionOpen(true)}
              style={styles.companionEntry}
            >
              <VionaCraneMark size={22} variant="sapphire" glow={!reducedMotion} />
              <Text style={styles.companionEntryText}>{t('home.rec2.alfred.title')}</Text>
            </Pressable>
          ) : null}
          {companionOpen && !focusShell ? (
            <VionaCinematicCompanion
              mode="sheet"
              reducedMotion={reducedMotion}
              onClose={() => setCompanionOpen(false)}
            />
          ) : null}

          <Text style={[styles.truthNote, { lineHeight: typography.truthLineHeight }]}>
            {VIONA_REC2_NOTIFICATION_PRESENTATION.availability === 'unavailable'
              ? t('home.rec2.runtimeTruth')
              : ''}
          </Text>
        </ScrollView>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingBottom: layout.shellBottomObstruction }]}
      edges={['top', 'left', 'right']}
      onLayout={onRootLayout}
      testID="viona-rec2-home-shell"
    >
      <LinearGradient colors={['#020713', '#04152A', '#020813']} style={[styles.stage, reserveCompanion && styles.stageRow]}>
        <View style={styles.center}>{center}</View>
        {focusShell ? (
          <VionaCinematicRail
            universes={universes}
            callbacks={universeCallbacks}
            onOpenLanguage={onOpenLanguage}
            open={navOpen}
            pinned={navPinned}
            hoverEnabled={tier === 'desktop' && Platform.OS === 'web'}
            reducedMotion={reducedMotion}
            onOpenChange={requestNavOpen}
            onPinnedChange={(pinned) => {
              setNavPinned(pinned);
              if (pinned) setNavOpen(true);
            }}
          />
        ) : null}
        {focusShell && reserveCompanion ? (
          <View style={styles.reservedCompanion}>
            <VionaCinematicCompanion
              mode="panel"
              reducedMotion={reducedMotion}
              pinned={vionaPinned}
              onPinnedChange={(pinned) => {
                setVionaPinned(pinned);
                if (pinned) setVionaOpen(true);
              }}
              onClose={() => {
                setVionaPinned(false);
                setVionaOpen(false);
              }}
            />
          </View>
        ) : null}
        {focusShell && !reserveCompanion ? (
          <VionaCinematicCompanion
            mode="dock"
            reducedMotion={reducedMotion}
            open={vionaOpen}
            pinned={vionaPinned}
            hoverEnabled={tier === 'desktop' && Platform.OS === 'web'}
            dockBottom={12}
            onOpenChange={requestVionaOpen}
            onPinnedChange={(pinned) => {
              setVionaPinned(pinned);
              if (pinned) {
                setVionaOpen(true);
                if (!navPinned) setNavOpen(false);
              }
            }}
            onClose={() => {
              setVionaPinned(false);
              setVionaOpen(false);
            }}
          />
        ) : null}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020713' },
  background: { flex: 1 },
  stage: { flex: 1 },
  stageRow: { flexDirection: 'row' },
  center: { flex: 1, minWidth: 0 },
  scroller: { flex: 1 },
  headerControlsDockClearance: { marginRight: 56 },
  reservedCompanion: {
    width: vionaCinematicTokens.layout.companionWidth,
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(148, 196, 232, 0.28)',
  },
  heroDesktop: { minHeight: 300 },
  heroTablet: { minHeight: 260 },
  brandMark: { marginBottom: 6 },
  companionEntry: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.35)',
    backgroundColor: 'rgba(8, 20, 36, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  companionEntryText: { color: '#F4F8FC', fontSize: 16, fontWeight: '700' },
  content: { paddingTop: 10 },
  hero: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(98, 185, 245, 0.32)',
    padding: 20,
    gap: 18,
    overflow: 'hidden',
    minHeight: 220,
  },
  heroPhoto: { ...StyleSheet.absoluteFillObject },
  heroPhotoFill: { width: '100%', height: '100%' },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 12, 24, 0.62)' },
  commandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, zIndex: 1 },
  commandRowStacked: { flexDirection: 'column', alignItems: 'stretch' },
  brandBlock: { gap: 8, flexShrink: 1, flexDirection: 'row', alignItems: 'center' },
  brand: { color: '#FFFFFF', fontSize: 25, fontWeight: '300', letterSpacing: 7 },
  brandSubtitle: { color: '#9BB6CC', fontSize: 10, letterSpacing: 1.3 },
  headerControls: { flexDirection: 'row', gap: 8 },
  headerControlsStacked: { alignSelf: 'flex-end' },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(143, 189, 224, 0.3)',
    backgroundColor: 'rgba(2, 12, 24, 0.54)',
  },
  headerButtonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  heroCopy: { gap: 7, maxWidth: 720, zIndex: 1 },
  greeting: { color: '#8FD9FF', fontSize: 13, fontWeight: '700' },
  headline: { color: '#F7FAFF', fontSize: 26, lineHeight: 34, fontWeight: '800' },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contextText: { color: '#B7CADB', fontSize: 12 },
  visualFallback: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(99, 200, 255, 0.26)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(3, 15, 29, 0.72)',
    zIndex: 1,
  },
  visualFallbackText: { color: '#96B5CA', fontSize: 11, flexShrink: 1 },
  stateBanner: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(82, 180, 240, 0.26)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(5, 22, 40, 0.82)',
  },
  stateText: { color: '#B9CFDF', fontSize: 12, flex: 1 },
  section: { gap: 12 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionHeadingColumn: { flexDirection: 'column', alignItems: 'flex-start' },
  sectionTitle: { color: '#F0F6FC', fontSize: 18, fontWeight: '800' },
  layoutLabel: { color: '#738DA3', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch' },
  cardHost: {
    minHeight: 180,
    borderRadius: 21,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#06101F',
  },
  cardGradient: { flexGrow: 1, minHeight: 180, padding: 16, gap: 12 },
  cardFocused: { shadowColor: '#57C4FF', shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  cardPressedReducedMotion: { opacity: 0.78 },
  cardDisabled: { opacity: 0.92 },
  iconCore: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { flex: 1, gap: 5 },
  cardTitle: { color: '#F4F8FC', fontSize: 18, fontWeight: '800' },
  cardSubtitle: { color: '#A7BACB', fontSize: 12, lineHeight: 17 },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  availability: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  taskEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(89, 176, 231, 0.23)',
    backgroundColor: 'rgba(7, 25, 44, 0.82)',
  },
  taskEmptyText: { color: '#A6BACB', fontSize: 12, lineHeight: 17, flex: 1 },
  truthNote: { color: '#61798E', fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 12 },
});
