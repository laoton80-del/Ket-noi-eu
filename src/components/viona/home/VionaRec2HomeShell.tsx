import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Platform,
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
import { VionaRec2AlfredPanel } from './VionaRec2AlfredPanel';
import {
  VIONA_REC2_NOTIFICATION_PRESENTATION,
  VIONA_REC2_GATED_CARD_CONTENT_OPACITY,
  createVionaRec2UniverseContract,
  invokeVionaRec2UniverseCallback,
  resolveVionaRec2HomeLayout,
  resolveVionaRec2ImagePresentation,
  resolveVionaRec2TaskSurface,
  resolveVionaRec2TypographyMetrics,
  type VionaRec2ContentState,
  type VionaRec2TypographyMetrics,
  type VionaRec2UniverseAvailabilityInput,
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
  type VionaRec2UniverseId,
} from './vionaRec2HomeContract';

type IconName = ComponentProps<typeof Ionicons>['name'];

const UNIVERSE_VISUALS: Readonly<
  Record<VionaRec2UniverseId, Readonly<{ icon: IconName; accent: string; glow: string }>>
> = {
  local: { icon: 'location-outline', accent: '#F3A431', glow: 'rgba(243, 164, 49, 0.24)' },
  travel: { icon: 'airplane-outline', accent: '#39BFFF', glow: 'rgba(57, 191, 255, 0.23)' },
  academy: { icon: 'school-outline', accent: '#AE62FF', glow: 'rgba(174, 98, 255, 0.22)' },
  business: { icon: 'business-outline', accent: '#38D59A', glow: 'rgba(56, 213, 154, 0.22)' },
  account: { icon: 'person-circle-outline', accent: '#5B9DFF', glow: 'rgba(91, 157, 255, 0.22)' },
  sos: { icon: 'shield-checkmark-outline', accent: '#FF5B65', glow: 'rgba(255, 91, 101, 0.23)' },
};

export type VionaRec2HomeShellProps = Readonly<{
  displayName?: string | null;
  regionLabel?: string | null;
  universeAvailability: VionaRec2UniverseAvailabilityInput;
  universeCallbacks: VionaRec2UniverseCallbacks;
  onOpenLanguage?: () => void;
  contentState?: VionaRec2ContentState;
  reducedMotion?: boolean;
}>;

function UniverseCard({
  universe,
  width,
  callbacks,
  reducedMotion,
  typography,
}: Readonly<{
  universe: VionaRec2UniverseContract;
  width: number;
  callbacks: VionaRec2UniverseCallbacks;
  reducedMotion: boolean;
  typography: VionaRec2TypographyMetrics;
}>) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const visual = UNIVERSE_VISUALS[universe.id];
  const interactive = universe.availability === 'available' && typeof callbacks[universe.id] === 'function';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`home.rec2.universes.${universe.id}.title`)}
      accessibilityHint={
        interactive
          ? t('home.rec2.universeOpenHint')
          : t(`home.rec2.availability.${universe.availability}`)
      }
      accessibilityState={{ disabled: !interactive }}
      disabled={!interactive}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => invokeVionaRec2UniverseCallback(universe, callbacks)}
      style={({ pressed }) => [
        styles.cardHost,
        { width, borderColor: focused ? visual.accent : 'rgba(133, 174, 211, 0.25)' },
        focused && styles.cardFocused,
        pressed && (reducedMotion ? styles.cardPressedReducedMotion : styles.cardPressed),
        !interactive && styles.cardDisabled,
      ]}
    >
      <LinearGradient colors={[visual.glow, 'rgba(7, 18, 32, 0.96)']} style={styles.cardGradient}>
        <View style={[styles.iconCore, { borderColor: visual.accent, backgroundColor: visual.glow }]}>
          <Ionicons name={visual.icon} size={24} color={visual.accent} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={[styles.cardTitle, { lineHeight: typography.cardTitleLineHeight }]}>
            {t(`home.rec2.universes.${universe.id}.title`)}
          </Text>
          <Text style={[styles.cardSubtitle, { lineHeight: typography.bodyLineHeight }]}>
            {t(`home.rec2.universes.${universe.id}.subtitle`)}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <Text
            style={[
              styles.availability,
              { color: visual.accent, lineHeight: typography.availabilityLineHeight },
            ]}
          >
            {t(`home.rec2.availability.${universe.availability}`)}
          </Text>
          <Ionicons
            name={interactive ? 'arrow-forward-circle-outline' : 'lock-closed-outline'}
            size={20}
            color={interactive ? visual.accent : '#72869A'}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
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
  const layout = useMemo(
    () =>
      resolveVionaRec2HomeLayout({
        width: measuredSize?.width ?? dimensions.width,
        height: measuredSize?.height ?? dimensions.height,
        fontScale: dimensions.fontScale,
        safeAreaInsets: insets,
        shellPlatform: Platform.OS === 'web' ? 'web' : 'native',
      }),
    [
      dimensions.fontScale,
      dimensions.height,
      dimensions.width,
      insets.bottom,
      insets.left,
      insets.right,
      insets.top,
      measuredSize?.height,
      measuredSize?.width,
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
  const imagePresentation = resolveVionaRec2ImagePresentation({
    provenance: 'unknown',
    loadState: 'missing',
  });
  const normalizedName = displayName?.trim() || null;
  const normalizedRegion = regionLabel?.trim() || null;

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingBottom: layout.shellBottomObstruction }]}
      edges={['top', 'left', 'right']}
      onLayout={onRootLayout}
      testID="viona-rec2-home-shell"
    >
      <LinearGradient colors={['#020713', '#04152A', '#020813']} style={styles.background}>
        <ScrollView
          key={`viona-rec2-home-content-${layout.fontScale}`}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: layout.contentBreathingClearance,
              gap: layout.gap,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={['rgba(12, 54, 98, 0.94)', 'rgba(4, 17, 34, 0.96)']} style={styles.hero}>
            <View style={[styles.commandRow, layout.columns === 1 && styles.commandRowStacked]}>
              <View style={styles.brandBlock}>
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
                {imagePresentation.mode === 'gradient-fallback'
                  ? t('home.rec2.imageFallback')
                  : t('home.rec2.imageReady')}
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
                <UniverseCard
                  key={universe.id}
                  universe={universe}
                  callbacks={universeCallbacks}
                  width={layout.cardWidth}
                  reducedMotion={reducedMotion}
                  typography={typography}
                />
              ))}
            </View>
          </View>

          <VionaRec2AlfredPanel reducedMotion={reducedMotion} />

          <Text style={[styles.truthNote, { lineHeight: typography.truthLineHeight }]}>
            {VIONA_REC2_NOTIFICATION_PRESENTATION.availability === 'unavailable'
              ? t('home.rec2.runtimeTruth')
              : ''}
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020713' },
  background: { flex: 1 },
  content: { paddingTop: 10 },
  hero: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(98, 185, 245, 0.32)',
    padding: 20,
    gap: 18,
    overflow: 'hidden',
  },
  commandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  commandRowStacked: { flexDirection: 'column', alignItems: 'stretch' },
  brandBlock: { gap: 2, flexShrink: 1 },
  brand: { color: '#FFFFFF', fontSize: 25, fontWeight: '300', letterSpacing: 7 },
  brandSubtitle: { color: '#9BB6CC', fontSize: 10, letterSpacing: 1.3 },
  headerControls: { flexDirection: 'row', gap: 8 },
  headerControlsStacked: { alignSelf: 'flex-end' },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(143, 189, 224, 0.3)',
    backgroundColor: 'rgba(2, 12, 24, 0.54)',
  },
  headerButtonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  heroCopy: { gap: 7, maxWidth: 720 },
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
    backgroundColor: 'rgba(3, 15, 29, 0.64)',
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
  cardDisabled: { opacity: VIONA_REC2_GATED_CARD_CONTENT_OPACITY },
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
