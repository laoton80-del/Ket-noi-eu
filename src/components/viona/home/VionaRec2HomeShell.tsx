import { Ionicons } from '@expo/vector-icons';
// react-dom is present for web; this app does not ship its type package.
// @ts-expect-error module has no declaration file
import { createPortal } from 'react-dom';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '../../../i18n';
import { resolveVionaCollapsedOrb } from '../../../navigation/vionaBottomShellGeometry';
import { useHomeCommand } from '../../../context/HomeCommandContext';
import { VionaGlobalSosShellAction } from '../VionaGlobalSosShellAction';
import { VionaCompanionOrbImage } from '../brand/VionaCompanionOrbImage';
import { UniversePhotoTile } from './UniversePhotoTile';
import { VionaHomeCompanionPanel } from './VionaHomeCompanionPanel';
import { VionaHomeSidebar } from './VionaHomeSidebar';
import { VionaHomeSuggestionChips } from './VionaHomeSuggestionChips';
import { VionaHomeTopBar } from './VionaHomeTopBar';
import { readHomeColumnOpen, writeHomeColumnOpen } from './vionaHomeColumnMemory';
import { resolveVionaCinematicTier, vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import {
  VIONA_REC2_GATED_CARD_CONTENT_OPACITY,
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
  type VionaRec2UniverseContract,
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
  previewMode?: boolean;
}>;

function UniverseCard({
  universe,
  callbacks,
  width,
  reducedMotion,
  enterIndex,
}: Readonly<{
  universe: VionaRec2UniverseContract;
  callbacks: VionaRec2UniverseCallbacks;
  width: number;
  reducedMotion: boolean;
  enterIndex: number;
}>) {
  return (
    <UniversePhotoTile
      universe={universe}
      callbacks={callbacks}
      width={width}
      reducedMotion={reducedMotion}
      subtitleStyle={styles.cardSubtitle}
      enterIndex={enterIndex}
    />
  );
}

function VionaCompanionOrb({
  reducedMotion,
  onPress,
}: Readonly<{ reducedMotion: boolean; onPress: () => void }>) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const orb = resolveVionaCollapsedOrb(width);
  const seated =
    Platform.OS === 'web'
      ? ({ position: 'fixed', bottom: orb.dockBottom, zIndex: 400 } as unknown as ViewStyle)
      : { bottom: Math.max(12, orb.dockBottom - 24) };

  const dock = (
    <View pointerEvents="box-none" style={[styles.companionDock, seated]} testID="viona-motion">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.rec2.companionChat')}
        onPress={onPress}
        style={({ pressed }) => [
          styles.companionDockButton,
          pressed && (reducedMotion ? styles.cardPressedReducedMotion : styles.cardPressed),
        ]}
      >
        <VionaCompanionOrbImage size={orb.size} reducedMotion={reducedMotion} />
        <Text style={styles.companionDockLabel}>Viona</Text>
      </Pressable>
    </View>
  );
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(dock, document.body);
  }
  return dock;
}

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
    <View
      style={[styles.stateBanner, state === 'gated' && styles.gatedFade]}
      accessibilityLiveRegion="polite"
    >
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
  previewMode = false,
}: VionaRec2HomeShellProps) {
  const { t } = useTranslation();
  const homeCommand = useHomeCommand();
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measuredSize, setMeasuredSize] = useState<Readonly<{
    width: number;
    height: number;
  }> | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [companionOpen, setCompanionOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => readHomeColumnOpen('sidebar'));
  const [desktopCompanionOpen, setDesktopCompanionOpen] = useState(() => readHomeColumnOpen('companion'));
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
  // Native keeps its existing tab navigation even on a wide device.
  const tier = shellPlatform === 'web'
    ? resolveVionaCinematicTier(dimensions.width)
    : dimensions.width < 768 ? 'phone' : 'tablet';
  const desktopFrame = shellPlatform === 'web' && tier === 'desktop';
  const sidebarReserve = desktopFrame && sidebarOpen ? vionaCinematicTokens.layout.railWidth : 0;
  const companionReserve = desktopFrame && desktopCompanionOpen ? vionaCinematicTokens.layout.companionWidth : 0;
  const [heroFailed, setHeroFailed] = useState(false);
  const imagePresentation = resolveVionaRec2ImagePresentation({
    provenance: 'licensed',
    loadState: heroFailed ? 'error' : 'ready',
  });
  const layout = useMemo(
    () =>
      resolveVionaRec2HomeLayout({
        width: desktopFrame
          ? Math.max(1, shellWidth - sidebarReserve - companionReserve)
          : shellWidth,
        height: shellHeight,
        fontScale: dimensions.fontScale,
        safeAreaInsets: insets,
        shellPlatform,
      }),
    [companionReserve, desktopFrame, dimensions.fontScale, insets, shellHeight, shellPlatform, shellWidth, sidebarReserve]
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
  const sosAction = shellPlatform === 'web' && homeCommand ? (
    <VionaGlobalSosShellAction onHoldComplete={homeCommand.triggerSafetyAssist} />
  ) : null;

  useEffect(() => {
    if (desktopFrame) setCompanionOpen(false);
  }, [desktopFrame]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (companionOpen) setCompanionOpen(false);
      if (sidebarOpen) {
        setSidebarOpen(false);
        writeHomeColumnOpen('sidebar', false);
      }
      if (desktopCompanionOpen) {
        setDesktopCompanionOpen(false);
        writeHomeColumnOpen('companion', false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [companionOpen, desktopCompanionOpen, sidebarOpen]);

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
      <View
        style={[
          styles.commandRow,
          layout.columns === 1 && styles.commandRowStacked,
          { paddingTop: layout.headerControlTopClearance },
        ]}
      >
        <VionaHomeTopBar
          displayName={normalizedName}
          regionLabel={normalizedRegion}
          previewMode={previewMode}
          showBrand={!desktopFrame || !sidebarOpen}
          reducedMotion={reducedMotion}
          onOpenLanguage={onOpenLanguage}
          sosAction={sosAction}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onFocus={() => undefined}
          menu={
            desktopFrame
              ? {
                  open: sidebarOpen,
                  onPress: () => {
                    const next = !sidebarOpen;
                    setSidebarOpen(next);
                    writeHomeColumnOpen('sidebar', next);
                  },
                }
              : undefined
          }
        />
      </View>

      <LinearGradient
        colors={['rgba(62, 36, 18, 0.55)', 'rgba(12, 54, 98, 0.94)', 'rgba(4, 17, 34, 0.96)']}
        style={[styles.hero, tier === 'desktop' && styles.heroDesktop, tier === 'tablet' && styles.heroTablet]}
      >
        {imagePresentation.mode === 'image' ? (
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
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(10, 26, 51, 0)', 'rgba(10, 26, 51, 0.28)', 'rgba(10, 26, 51, 0.7)']}
          locations={[0, 0.42, 1]}
          style={styles.heroScrim}
        />
        <View style={styles.heroCopy}>
          <Text style={[styles.greeting, { lineHeight: typography.greetingLineHeight }]}>
            {normalizedName
              ? t('home.rec2.greetingNamed', { name: normalizedName })
              : t('home.rec2.greetingGuest')}
          </Text>
          <Text style={[styles.headline, { lineHeight: typography.headlineLineHeight }]}>
            {t('home.rec2.explorePrompt')}
          </Text>
          <Text style={[styles.contextText, { lineHeight: typography.bodyLineHeight }]}>
            {t('home.rec2.headline')}
          </Text>
        </View>
        <VionaHomeSuggestionChips universes={universes} callbacks={universeCallbacks} />
        {imagePresentation.mode === 'image' ? null : (
          <View style={styles.visualFallback}>
            <Ionicons name="planet-outline" size={23} color="#63C8FF" />
            <Text style={[styles.visualFallbackText, { lineHeight: typography.bodyLineHeight }]}>
              {t('home.rec2.imageFallback')}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ContentStateBanner state={contentState} typography={typography} />
      <TaskStrip typography={typography} />

      <View style={styles.section}>
        <View style={[styles.sectionHeadingRow, layout.columns === 1 && styles.sectionHeadingColumn]}>
          <Text style={[styles.sectionTitle, { lineHeight: typography.sectionTitleLineHeight }]}>
            {t('home.rec2.universesTitle')}
          </Text>
          <Text style={[styles.layoutLabel, { lineHeight: typography.microLineHeight }]}>
            {t(`home.rec2.layouts.${layout.mode}`)} · {layout.columns} × {layout.rows}
          </Text>
        </View>
        <View style={[styles.grid, { gap: layout.gap }]}>
          {universes.map((universe, index) => (
            <UniverseCard
              key={universe.id}
              universe={universe}
              callbacks={universeCallbacks}
              width={layout.cardWidth}
              reducedMotion={reducedMotion}
              enterIndex={index}
            />
          ))}
        </View>
      </View>

      {companionOpen && !desktopFrame ? (
        <View style={styles.companionSheet}>
          <VionaHomeCompanionPanel
            displayName={normalizedName}
            previewMode={previewMode}
            reducedMotion={reducedMotion}
            universes={universes}
            callbacks={universeCallbacks}
            onClose={() => setCompanionOpen(false)}
          />
        </View>
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
      <LinearGradient colors={['#020713', '#04152A', '#020813']} style={[styles.stage, desktopFrame && styles.stageRow]}>
        {desktopFrame && sidebarOpen ? (
          <VionaHomeSidebar
            universes={universes}
            callbacks={universeCallbacks}
            reducedMotion={reducedMotion}
          />
        ) : null}
        <View style={styles.center}>{center}</View>
        {desktopFrame && desktopCompanionOpen ? (
          <View style={styles.reservedCompanion}>
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0, 209, 255, 0)', 'rgba(0, 209, 255, 0.28)', 'rgba(0, 209, 255, 0)']}
              style={styles.companionDivider}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.companionScroll}>
              <VionaHomeCompanionPanel
                displayName={normalizedName}
                previewMode={previewMode}
                reducedMotion={reducedMotion}
                universes={universes}
                callbacks={universeCallbacks}
                onClose={() => {
                  setDesktopCompanionOpen(false);
                  writeHomeColumnOpen('companion', false);
                }}
              />
            </ScrollView>
          </View>
        ) : null}
        {!(desktopFrame ? desktopCompanionOpen : companionOpen) ? (
          <VionaCompanionOrb
            reducedMotion={reducedMotion}
            onPress={() => {
              if (desktopFrame) {
                setDesktopCompanionOpen(true);
                writeHomeColumnOpen('companion', true);
                return;
              }
              setCompanionOpen(true);
            }}
          />
        ) : null}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020713' },
  stage: { flex: 1, position: 'relative' },
  stageRow: { flexDirection: 'row' },
  center: { flex: 1, minWidth: 0 },
  scroller: { flex: 1 },
  reservedCompanion: {
    width: vionaCinematicTokens.layout.companionWidth,
    padding: 16,
    paddingLeft: 18,
    backgroundColor: 'rgba(10, 26, 51, 0.42)',
  },
  companionDivider: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 1,
  },
  companionScroll: { paddingBottom: 24 },
  heroDesktop: { minHeight: 280 },
  heroTablet: { minHeight: 240 },
  companionDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    alignItems: 'center',
  },
  companionDockButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  companionDockLabel: {
    marginTop: 2,
    color: '#E6F4FF',
    fontSize: 11,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
    letterSpacing: 0.4,
  },
  companionSheet: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(230, 244, 255, 0.14)',
    backgroundColor: 'rgba(10, 26, 51, 0.94)',
    padding: 16,
    ...vionaCinematicTokens.elevation.cardOnShell,
  },
  content: { paddingTop: 18 },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(230, 244, 255, 0.14)',
    padding: 24,
    gap: 22,
    overflow: 'hidden',
    minHeight: 240,
    ...vionaCinematicTokens.elevation.cardOnShell,
  },
  heroPhoto: { ...StyleSheet.absoluteFillObject },
  heroPhotoFill: { width: '100%', height: '100%' },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 12, 24, 0.62)' },
  commandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, zIndex: 1 },
  commandRowStacked: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { gap: 10, maxWidth: 720, zIndex: 1 },
  greeting: {
    color: 'rgba(0, 209, 255, 0.72)',
    fontSize: 12,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
    letterSpacing: 1.8,
  },
  headline: {
    color: '#F7FAFF',
    fontSize: 28,
    lineHeight: 34,
    fontFamily: vionaCinematicTokens.fontFamily.bold,
    fontWeight: '700',
    textShadowColor: 'rgba(10, 26, 51, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
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
    borderColor: 'rgba(230, 244, 255, 0.12)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(5, 22, 40, 0.82)',
  },
  gatedFade: { opacity: VIONA_REC2_GATED_CARD_CONTENT_OPACITY },
  stateText: { color: '#B9CFDF', fontSize: 12, flex: 1 },
  section: { gap: 16 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionHeadingColumn: { flexDirection: 'column', alignItems: 'flex-start' },
  sectionTitle: {
    color: '#F0F6FC',
    fontSize: 18,
    fontFamily: vionaCinematicTokens.fontFamily.bold,
    fontWeight: '700',
  },
  layoutLabel: { color: '#738DA3', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch' },
  cardHost: {
    minHeight: 180,
    borderRadius: 21,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#06101F',
  },
  cardSubtitle: { color: '#A7BACB', fontSize: 12, lineHeight: 17 },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  cardPressedReducedMotion: { opacity: 0.78 },
  taskEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(230, 244, 255, 0.12)',
    backgroundColor: 'rgba(11, 28, 51, 0.82)',
  },
  taskEmptyText: { color: '#A6BACB', fontSize: 12, lineHeight: 17, flex: 1 },
  truthNote: { color: '#61798E', fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 12 },
});
