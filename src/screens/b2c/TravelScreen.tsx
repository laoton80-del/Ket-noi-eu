import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { TravelDirectionSelector } from '../../components/travel/TravelDirectionSelector';
import {
  TravelGlassCard,
  TravelIconCapsule,
  travelSemanticTokens,
  type TravelSemanticAccent,
} from '../../components/travel/TravelGlassCard';
import {
  localConstellation,
  localWebRailPillGlassStyle,
} from '../../components/local/localConstellationTokens';
import { VionaMiniAppShell } from '../../components/viona/VionaMiniAppShell';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import type { TravelDirectionId } from '../../core/travel/travelDirectionTypes';
import { useMiniAppEntry } from '../../hooks/useMiniAppEntry';
import { useTranslation } from '../../i18n';
import { MAIN_TAB, type RootStackParamList } from '../../navigation/routes';
import { useAuth } from '../../context/AuthContext';
import {
  getTravelLocationConsentState,
  setTravelLocationConsent,
} from '../../services/compliance/sensorConsent';
import { getTravelContext } from '../../services/context/UserContextService';
import { listVietnameseRestaurantsByProximity, type CravingsRadarHit } from '../../services/travel/travelCravingsRadar';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

function weatherLabelKey(weatherCode: number): string {
  if (weatherCode < 20) return 'clear';
  if (weatherCode < 50) return 'cloudy';
  if (weatherCode < 70) return 'lightRain';
  if (weatherCode < 90) return 'storms';
  return 'watch';
}

function fxLabelKey(homeCountryCode: string | undefined): string {
  const cc = (homeCountryCode ?? 'EU').toUpperCase();
  if (cc === 'CZ') return 'cz';
  if (cc === 'PL') return 'pl';
  if (cc === 'VN') return 'vn';
  return 'default';
}

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const INK_SUB = localConstellation.inkCardSub;
const CYAN = localConstellation.accentCyan;
const BORDER = localConstellation.border;

const IMG_TRAVEL_HERO = require('../../assets/viona/home/viona-hero-travel-1280x428.png');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TravelRoute = RouteProp<RootStackParamList, 'TravelHub'>;

type TravelScenarioId =
  | 'airport'
  | 'hotel'
  | 'taxi'
  | 'restaurant'
  | 'transit'
  | 'shopping'
  | 'hospital'
  | 'emergency'
  | 'translation';

type TravelScenario = Readonly<{
  id: TravelScenarioId;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelSemanticAccent;
  capsuleSecondary?: TravelSemanticAccent;
  onPress: () => void;
}>;

const SCENARIO_SEMANTIC: Readonly<Record<TravelScenarioId, TravelSemanticAccent>> = {
  airport: 'cyan',
  hotel: 'gold',
  taxi: 'cyan',
  restaurant: 'emerald',
  transit: 'cyan',
  shopping: 'violet',
  hospital: 'emerald',
  emergency: 'magenta',
  translation: 'violet',
};

const SCENARIO_CAPSULE_SECONDARY: Partial<Readonly<Record<TravelScenarioId, TravelSemanticAccent>>> = {
  shopping: 'gold',
  translation: 'cyan',
};

function travelScenarioGridColumns(width: number): 1 | 2 | 3 | 4 {
  if (width >= 1366) return 4;
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

function scenarioCellWidthPercent(columns: 1 | 2 | 3 | 4): `${number}%` {
  if (columns === 1) return '100%';
  if (columns === 2) return '48.5%';
  if (columns === 3) return '31.2%';
  return '23.5%';
}

function scenarioIconInk(id: TravelScenarioId): string {
  return travelSemanticTokens(SCENARIO_SEMANTIC[id]).ink;
}

function scenarioCapsuleSecondary(id: TravelScenarioId): TravelSemanticAccent | undefined {
  return SCENARIO_CAPSULE_SECONDARY[id];
}

const QUICK_HELP_IDS: readonly TravelScenarioId[] = ['translation', 'taxi', 'emergency'];

const TRAVEL_SCENARIO_GROUPS = [
  {
    labelKey: 'travelHub.groupMove' as const,
    scenarioIds: ['airport', 'taxi', 'transit'] as const satisfies readonly TravelScenarioId[],
  },
  {
    labelKey: 'travelHub.groupStayEat' as const,
    scenarioIds: ['hotel', 'restaurant', 'shopping'] as const satisfies readonly TravelScenarioId[],
  },
  {
    labelKey: 'travelHub.groupSafetyHelp' as const,
    scenarioIds: ['hospital', 'emergency', 'translation'] as const satisfies readonly TravelScenarioId[],
  },
] as const;

function TravelQuickHelpChip({
  scenarioId,
  icon,
  label,
  accent,
  iconInk,
  onPress,
  a11yLabel,
}: Readonly<{
  scenarioId: TravelScenarioId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent: TravelSemanticAccent;
  iconInk: string;
  onPress: () => void;
  a11yLabel: string;
}>): ReactElement {
  return (
    <TravelGlassCard
      visual="quickHelp"
      accent={accent}
      intensity="primary"
      onPress={onPress}
      accessibilityLabel={a11yLabel}
      contentStyle={styles.quickHelpInner}
      style={styles.quickHelpCard}
    >
      <View style={styles.quickHelpRowInner}>
        <TravelIconCapsule
          icon={icon}
          ink={iconInk}
          accent={accent}
          accentSecondary={scenarioCapsuleSecondary(scenarioId)}
          size={18}
          prominent
          intensity="primary"
        />
        <Text style={styles.quickHelpLabel} numberOfLines={2}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={iconInk} style={styles.quickHelpChevron} />
      </View>
    </TravelGlassCard>
  );
}

function TravelScenarioCard({
  item,
}: Readonly<{
  item: TravelScenario;
}>): ReactElement {
  const { t } = useTranslation();
  return (
    <TravelGlassCard
      visual="standard"
      accent={item.accent}
      intensity="standard"
      compact
      onPress={item.onPress}
      accessibilityLabel={t(`travelHub.scenario.${item.id}.title`)}
      contentStyle={styles.scenarioInner}
    >
      <View style={styles.scenarioRow}>
        <TravelIconCapsule
          icon={item.icon}
          ink={scenarioIconInk(item.id)}
          accent={item.accent}
          accentSecondary={item.capsuleSecondary}
          size={16}
          intensity="standard"
        />
        <View style={styles.scenarioBody}>
          <View style={styles.scenarioTitleRow}>
            <Text style={styles.scenarioTitle} numberOfLines={1}>
              {t(`travelHub.scenario.${item.id}.title`)}
            </Text>
            {item.id === 'emergency' ? (
              <Text style={styles.scenarioChipEmergency}>{t('travelHub.scenarioChipSafety')}</Text>
            ) : null}
          </View>
          <Text style={styles.scenarioSub} numberOfLines={2}>
            {t(`travelHub.scenario.${item.id}.sub`)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={INK_MUTED} />
      </View>
    </TravelGlassCard>
  );
}

function TravelScenarioGroupBlock({
  labelKey,
  scenarios,
  columns,
  cellWidth,
}: Readonly<{
  labelKey: 'travelHub.groupMove' | 'travelHub.groupStayEat' | 'travelHub.groupSafetyHelp';
  scenarios: readonly TravelScenario[];
  columns: 1 | 2 | 3 | 4;
  cellWidth: `${number}%`;
}>): ReactElement {
  const { t } = useTranslation();
  return (
    <View style={styles.groupBlock}>
      <Text style={styles.groupKicker}>{t(labelKey)}</Text>
      <View style={[styles.scenarioGrid, columns > 1 ? styles.scenarioGridMultiCol : null]}>
        {scenarios.map((item) => (
          <View key={item.id} style={[styles.scenarioCell, { width: cellWidth }]}>
            <TravelScenarioCard item={item} />
          </View>
        ))}
      </View>
    </View>
  );
}

function TravelConnectedLink({
  icon,
  label,
  onPress,
  a11yLabel,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  a11yLabel: string;
}>) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.connectedLink,
        Platform.OS === 'web' ? localWebRailPillGlassStyle('cyan', hovered) : { borderColor: BORDER, borderWidth: 1 },
        pressed && { opacity: 0.88 },
      ]}
    >
      <Ionicons name={icon} size={15} color={CYAN} />
      <Text style={styles.connectedLinkText} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={INK_MUTED} />
    </Pressable>
  );
}

export function TravelScreen() {
  const { t } = useTranslation();
  const { openMiniApp } = useMiniAppEntry();
  const navigation = useNavigation<Nav>();
  const route = useRoute<TravelRoute>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const scrollRef = useRef<ScrollView>(null);
  const [destinationQuery, setDestinationQuery] = useState(route.params?.destinationQuery?.trim() ?? '');
  const [gpsCity, setGpsCity] = useState('');
  const [weatherCode, setWeatherCode] = useState(0);
  const [lat, setLat] = useState(10.8231);
  const [lng, setLng] = useState(106.6297);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const [cravingsModalOpen, setCravingsModalOpen] = useState(false);
  const [cravingsHits, setCravingsHits] = useState<readonly CravingsRadarHit[]>([]);
  type LocationGate = 'loading' | 'prompt' | 'ready';
  const [locationGate, setLocationGate] = useState<LocationGate>('loading');
  const [gpsOptIn, setGpsOptIn] = useState(false);
  const [travelDirectionId, setTravelDirectionId] = useState<TravelDirectionId | null>(null);

  const scenarioGridColumns = travelScenarioGridColumns(width);
  const scenarioCellWidth = scenarioCellWidthPercent(scenarioGridColumns);

  useEffect(() => {
    void getTravelLocationConsentState().then((state) => {
      if (state === 'granted') {
        setGpsOptIn(true);
        setLocationGate('ready');
        return;
      }
      if (state === 'declined') {
        setGpsOptIn(false);
        setLocationGate('ready');
        return;
      }
      setGpsOptIn(false);
      setLocationGate('prompt');
    });
  }, []);

  useEffect(() => {
    const q = route.params?.destinationQuery?.trim();
    if (q) setDestinationQuery(q);
  }, [route.params?.destinationQuery]);

  useEffect(() => {
    if (locationGate !== 'ready' || !gpsOptIn) return;
    let cancelled = false;
    void (async () => {
      setLoadingCtx(true);
      try {
        const ctx = await getTravelContext({ skipPersistCity: true });
        if (!cancelled) {
          setGpsCity(ctx.city);
          setWeatherCode(ctx.weatherCode);
          setLat(ctx.latitude);
          setLng(ctx.longitude);
          setCravingsHits(
            listVietnameseRestaurantsByProximity({ latitude: ctx.latitude, longitude: ctx.longitude })
          );
        }
      } finally {
        if (!cancelled) setLoadingCtx(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locationGate, gpsOptIn]);

  useEffect(() => {
    if (locationGate !== 'ready' || gpsOptIn) return;
    setLoadingCtx(false);
  }, [locationGate, gpsOptIn]);

  const displayCity = useMemo(() => {
    const q = destinationQuery.trim();
    if (q.length >= 2) return q;
    return gpsCity.length > 0 ? gpsCity : '';
  }, [destinationQuery, gpsCity]);

  const weatherLine = useMemo(
    () => t(`travelHub.weather.${weatherLabelKey(weatherCode)}`),
    [t, weatherCode]
  );
  const fxLine = useMemo(
    () => t(`travelHub.fx.${fxLabelKey(user?.country)}`),
    [t, user?.country]
  );

  const travelScrollBottomClearance = useMemo(
    () => localConstellation.tabBarClearanceBottom + Math.max(insets.bottom, 12) + 48,
    [insets.bottom]
  );

  const openLeona = useCallback(
    (prefillRequest: string) => {
      openMiniApp('b2cAiCallAssistant', () =>
        navigation.navigate('LeonaCall', { prefillRequest, autoSubmit: false })
      );
    },
    [navigation, openMiniApp]
  );

  const openInterpreter = useCallback(
    (scenario: 'travel' | 'doctor' | 'general' = 'travel') => {
      openMiniApp('minhKhangTranslator', () =>
        navigation.navigate('LiveInterpreter', { scenario, guidedEntry: true })
      );
    },
    [navigation, openMiniApp]
  );

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const openLocalUniverse = useCallback(() => {
    openMiniApp('local', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.local }));
  }, [navigation, openMiniApp]);

  const openAcademyUniverse = useCallback(() => {
    if (!featureFlags.academyLiteEnabled) return;
    openMiniApp('academy', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.ai }));
  }, [featureFlags.academyLiteEnabled, navigation, openMiniApp]);

  const openBusinessUniverse = useCallback(() => {
    openMiniApp('merchantDashboard', () => navigation.navigate('MerchantDashboard'));
  }, [navigation, openMiniApp]);

  const travelScenarios = useMemo((): readonly TravelScenario[] => {
    const withSemantic = (id: TravelScenarioId): Pick<TravelScenario, 'accent' | 'capsuleSecondary'> => ({
      accent: SCENARIO_SEMANTIC[id],
      capsuleSecondary: SCENARIO_CAPSULE_SECONDARY[id],
    });
    return [
      {
        id: 'airport',
        icon: 'airplane-outline',
        ...withSemantic('airport'),
        onPress: () => navigation.navigate('TravelFlightSearch'),
      },
      {
        id: 'hotel',
        icon: 'bed-outline',
        ...withSemantic('hotel'),
        onPress: () => navigation.navigate('TravelHospitality'),
      },
      {
        id: 'taxi',
        icon: 'car-outline',
        ...withSemantic('taxi'),
        onPress: () => openLeona(t('travelHub.leonaPrefill.taxi')),
      },
      {
        id: 'restaurant',
        icon: 'restaurant-outline',
        ...withSemantic('restaurant'),
        onPress: () => setCravingsModalOpen(true),
      },
      {
        id: 'transit',
        icon: 'train-outline',
        ...withSemantic('transit'),
        onPress: () => openLeona(t('travelHub.leonaPrefill.transit')),
      },
      {
        id: 'shopping',
        icon: 'bag-handle-outline',
        ...withSemantic('shopping'),
        onPress: () => openLeona(t('travelHub.leonaPrefill.shopping')),
      },
      {
        id: 'hospital',
        icon: 'medkit-outline',
        ...withSemantic('hospital'),
        onPress: () => openInterpreter('doctor'),
      },
      {
        id: 'emergency',
        icon: 'shield-outline',
        ...withSemantic('emergency'),
        onPress: () => navigation.navigate('EmergencySOS'),
      },
      {
        id: 'translation',
        icon: 'language-outline',
        ...withSemantic('translation'),
        onPress: () => openInterpreter('travel'),
      },
    ];
  }, [navigation, openInterpreter, openLeona, t]);

  const scenarioById = useMemo(() => {
    const map = new Map<TravelScenarioId, TravelScenario>();
    for (const item of travelScenarios) map.set(item.id, item);
    return map;
  }, [travelScenarios]);

  const connectedUniversesAfterDock = (
    <>
      <Text style={styles.sectionKicker}>{t('travelHub.connectedUniversesKicker')}</Text>
      <View style={styles.connectedStrip}>
        <TravelConnectedLink
          icon="location-outline"
          label={t('travelHub.connectedLocal')}
          onPress={openLocalUniverse}
          a11yLabel={t('travelHub.connectedLocal')}
        />
        {featureFlags.academyLiteEnabled ? (
          <TravelConnectedLink
            icon="school-outline"
            label={t('travelHub.connectedAcademy')}
            onPress={openAcademyUniverse}
            a11yLabel={t('travelHub.connectedAcademy')}
          />
        ) : null}
        <TravelConnectedLink
          icon="briefcase-outline"
          label={t('travelHub.connectedBusiness')}
          onPress={openBusinessUniverse}
          a11yLabel={t('travelHub.connectedBusiness')}
        />
      </View>
    </>
  );

  const shellProps = {
    universe: 'travel' as const,
    title: t('travelHub.screenTitle'),
    subtitle: t('travelHub.railSubtitle'),
    showDock: true,
    dockPlacement: 'inline' as const,
    childrenAfterDock: connectedUniversesAfterDock,
    dockCurrentLabel: t('shell.miniapp.travel'),
    surfaceMode: 'midnight' as const,
    legacySuppressRootId: 'travel-hub-root',
    scrollRef,
    scrollBottomClearance: travelScrollBottomClearance,
    onPressCurrent: scrollToTop,
  };

  if (locationGate === 'loading') {
    return (
      <VionaMiniAppShell {...shellProps} showDock={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={CYAN} />
        </View>
      </VionaMiniAppShell>
    );
  }

  if (locationGate === 'prompt') {
    return (
      <VionaMiniAppShell {...shellProps} showDock={false}>
        <TravelGlassCard tier="hero" contentStyle={styles.consentInner}>
          <Ionicons name="location-outline" size={40} color={CYAN} />
          <Text style={styles.consentHeadline}>{t('travelHub.consentHeadline')}</Text>
          <Text style={styles.consentCopy}>{t('travelHub.consentCopy')}</Text>
          <Pressable
            onPress={() => {
              void (async () => {
                await setTravelLocationConsent(true);
                setGpsOptIn(true);
                setLocationGate('ready');
              })();
            }}
            style={({ pressed }) => [styles.consentPrimaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.consentPrimaryLabel}>{t('travelHub.consentPrimary')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void (async () => {
                await setTravelLocationConsent(false);
                setGpsOptIn(false);
                setLocationGate('ready');
              })();
            }}
            style={({ pressed }) => [styles.consentSecondaryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.consentSecondaryLabel}>{t('travelHub.consentSecondary')}</Text>
          </Pressable>
        </TravelGlassCard>
      </VionaMiniAppShell>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <VionaMiniAppShell {...shellProps}>
        <TravelGlassCard visual="hero" accent="cyan" intensity="primary" contentStyle={styles.heroInner}>
          <View style={styles.heroStage}>
            <Image source={IMG_TRAVEL_HERO} style={styles.heroCinematicImage} resizeMode="cover" />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(4, 8, 16, 0.94)', 'rgba(4, 10, 20, 0.72)', 'rgba(4, 10, 20, 0.28)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroTextStack}>
              <Text style={styles.kicker}>{t('travelHub.heroKicker')}</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {t('travelHub.heroCompanion')}
              </Text>
              <Text style={styles.heroSub} numberOfLines={2}>
                {t('travelHub.heroSub')}
              </Text>
            </View>
          </View>
        </TravelGlassCard>

        <Text style={styles.quickHelpSectionKicker}>{t('travelHub.quickHelpKicker')}</Text>
        <View style={styles.quickHelpRow}>
          {QUICK_HELP_IDS.map((id) => {
            const item = scenarioById.get(id);
            if (!item) return null;
            return (
              <View key={id} style={styles.quickHelpCell}>
                <TravelQuickHelpChip
                  scenarioId={id}
                  icon={item.icon}
                  label={t(`travelHub.scenario.${id}.title`)}
                  accent={item.accent}
                  iconInk={scenarioIconInk(id)}
                  onPress={item.onPress}
                  a11yLabel={t(`travelHub.scenario.${id}.title`)}
                />
              </View>
            );
          })}
        </View>

        <Text style={styles.scenariosSectionKicker}>{t('travelHub.scenariosKicker')}</Text>

        {TRAVEL_SCENARIO_GROUPS.map((group) => {
          const groupScenarios = group.scenarioIds
            .map((id) => scenarioById.get(id))
            .filter((item): item is TravelScenario => item != null);
          return (
            <TravelScenarioGroupBlock
              key={group.labelKey}
              labelKey={group.labelKey}
              scenarios={groupScenarios}
              columns={scenarioGridColumns}
              cellWidth={scenarioCellWidth}
            />
          );
        })}

        <View style={styles.secondaryZone}>
          <TravelDirectionSelector selectedId={travelDirectionId} onSelect={setTravelDirectionId} />

          <TravelGlassCard visual="standard" accent="cyan" intensity="quiet" contentStyle={styles.metaInner}>
          <Text style={styles.metaLabel}>{t('travelHub.destinationLabel')}</Text>
          <TextInput
            value={destinationQuery}
            onChangeText={setDestinationQuery}
            placeholder={t('travelHub.destinationPlaceholder')}
            placeholderTextColor="rgba(226, 232, 240, 0.42)"
            style={styles.metaInput}
          />
          <Text style={styles.metaHelper}>{t('travelHub.destinationHelper')}</Text>
          {loadingCtx ? (
            <View style={styles.metaLoading}>
              <ActivityIndicator color={CYAN} />
              <Text style={styles.metaLoadingText}>{t('travelHub.syncingLocation')}</Text>
            </View>
          ) : (
            <Text style={styles.metaText}>
              {displayCity.length > 0 ? `${displayCity} · ` : ''}
              {weatherLine} · {fxLine}
            </Text>
          )}
          {!gpsOptIn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('travelHub.enableLocationA11y')}
              onPress={() => setLocationGate('prompt')}
              style={({ pressed }) => [styles.enableLocationBtn, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="location-outline" size={16} color={CYAN} />
              <Text style={styles.enableLocationText}>{t('travelHub.enableLocationCta')}</Text>
            </Pressable>
          ) : null}
          </TravelGlassCard>

          <Text style={styles.sectionKicker}>{t('travelHub.connectedLocalHelpKicker')}</Text>
          <TravelGlassCard
            visual="standard"
            accent="cyan"
            intensity="quiet"
            onPress={() => navigation.navigate('LocalFixer')}
            accessibilityLabel={t('travelHub.connectedLocalHelpA11y')}
            contentStyle={styles.mapCardInner}
          >
          <Text style={styles.kicker}>{t('travelHub.connectedLocalHelpTitle')}</Text>
          <Text style={styles.mapHelpSub}>{t('travelHub.connectedLocalHelpSub')}</Text>
          <View style={styles.mapShell}>
            <LinearGradient
              colors={['rgba(12, 22, 38, 0.92)', 'rgba(8, 16, 28, 0.96)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.mapPin}>
              <Ionicons name="location" size={22} color={CYAN} />
            </View>
            <View style={styles.mapBadge}>
              <Text style={styles.mapBadgeText}>{t('travelHub.localHelpersBadge')}</Text>
              {displayCity.length >= 2 ? (
                <Text style={styles.mapBadgeSub}>
                  {`${displayCity} · ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`}
                </Text>
              ) : (
                <Text style={styles.mapBadgeSub}>
                  {t('travelHub.mapBadgePlaceholderLine1')}
                  {'\n'}
                  {t('travelHub.mapBadgePlaceholderLine2')}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.mapCtaRow}>
            <Text style={styles.mapCtaText}>{t('travelHub.connectedLocalHelpCta')}</Text>
            <Ionicons name="arrow-forward" size={18} color={CYAN} />
          </View>
          </TravelGlassCard>
        </View>
      </VionaMiniAppShell>

      <Modal visible={cravingsModalOpen} transparent animationType="fade" onRequestClose={() => setCravingsModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCravingsModalOpen(false)}>
          <Pressable style={styles.modalShell} onPress={(e) => e.stopPropagation()}>
            <TravelGlassCard tier="utility" contentStyle={styles.modalInner}>
              <Text style={styles.modalTitle}>{t('travelHub.cravingsModalTitle')}</Text>
              <Text style={styles.modalSub}>{t('travelHub.cravingsModalSub')}</Text>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {cravingsHits.length === 0 ? (
                  <Text style={styles.modalEmpty}>{t('travelHub.cravingsEmpty')}</Text>
                ) : (
                  cravingsHits.map((hit) => (
                    <Pressable
                      key={hit.id}
                      onPress={() => {
                        setCravingsModalOpen(false);
                        navigation.navigate('MerchantDetail', {
                          merchantId: hit.id,
                          merchantName: hit.name,
                          industry: 'Restaurant',
                        });
                      }}
                      style={({ pressed }) => [styles.cravingRow, pressed && { opacity: 0.88 }]}
                    >
                      <Text style={styles.cravingName}>{hit.name}</Text>
                      <Text style={styles.cravingMeta}>{hit.distanceKm.toFixed(1)} km</Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
              <Pressable onPress={() => setCravingsModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>{t('travelHub.modalClose')}</Text>
              </Pressable>
            </TravelGlassCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInner: {
    minHeight: 102,
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  heroStage: {
    minHeight: 102,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCinematicImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '62%',
    opacity: 0.9,
  },
  heroTextStack: {
    gap: 5,
    zIndex: 4,
    maxWidth: '68%',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  kicker: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: CYAN,
    letterSpacing: 0.9,
    textShadowColor: 'rgba(132, 238, 255, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heroTitle: {
    fontSize: 21,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(252, 253, 255, 0.99)',
    letterSpacing: -0.32,
    lineHeight: 26,
    textShadowColor: 'rgba(132, 238, 255, 0.38)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  heroCompanion: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: 'rgba(248, 250, 252, 0.96)',
    lineHeight: 18,
    letterSpacing: -0.08,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
    marginTop: 1,
    opacity: 0.92,
  },
  sectionKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(186, 214, 230, 0.78)',
    letterSpacing: 0.95,
    marginTop: 10,
    marginBottom: 8,
  },
  quickHelpSectionKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(140, 220, 255, 0.96)',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 10,
    textShadowColor: 'rgba(92, 205, 255, 0.42)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  scenariosSectionKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(186, 198, 214, 0.88)',
    letterSpacing: 0.9,
    marginTop: 2,
    marginBottom: 10,
  },
  secondaryZone: {
    marginTop: theme.spacing.md,
    gap: 2,
    opacity: 0.96,
  },
  quickHelpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  quickHelpCell: {
    flex: 1,
    minWidth: 0,
  },
  quickHelpCard: {
    minHeight: 64,
  },
  quickHelpInner: {
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  quickHelpRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickHelpLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(252, 253, 255, 0.98)',
    lineHeight: 15,
    letterSpacing: -0.04,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quickHelpChevron: {
    opacity: 0.82,
  },
  groupBlock: {
    marginBottom: theme.spacing.xs,
  },
  groupKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(186, 198, 214, 0.9)',
    letterSpacing: 0.85,
    marginBottom: 8,
  },
  scenarioGrid: {
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  scenarioGridMultiCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  scenarioCell: {
    width: '100%',
  },
  scenarioInner: {
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  scenarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scenarioBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  scenarioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  scenarioChipEmergency: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: travelSemanticTokens('magenta').ink,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 110, 140, 0.62)',
    backgroundColor: 'rgba(255, 110, 140, 0.14)',
    overflow: 'hidden',
    textShadowColor: travelSemanticTokens('magenta').glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  scenarioTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.18,
  },
  scenarioSub: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: INK_SUB,
    lineHeight: 14,
    opacity: 0.92,
  },
  mapCardInner: { gap: 8 },
  mapHelpSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
  },
  mapShell: {
    height: 112,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mapPin: {
    position: 'absolute',
    top: '36%',
    left: '46%',
  },
  mapBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(8, 14, 26, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.28)',
  },
  mapBadgeText: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: INK,
  },
  mapBadgeSub: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 14,
  },
  mapCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapCtaText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: INK,
  },
  rowCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: INK,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 15,
  },
  metaInner: { gap: 8 },
  metaLabel: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: INK_MUTED,
    letterSpacing: 0.4,
  },
  metaInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: INK,
    backgroundColor: 'rgba(8, 14, 26, 0.55)',
  },
  metaHelper: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
  },
  metaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaLoadingText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
  },
  metaText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    lineHeight: 18,
  },
  enableLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.32)',
    alignSelf: 'flex-start',
  },
  enableLocationText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: CYAN,
  },
  connectedStrip: { gap: 8, marginBottom: theme.spacing.xl },
  connectedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(10, 14, 22, 0.42)',
  },
  connectedLinkText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: INK,
  },
  consentInner: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  consentHeadline: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: INK,
    textAlign: 'center',
  },
  consentCopy: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    lineHeight: 20,
    textAlign: 'center',
  },
  consentPrimaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(92, 205, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.42)',
    alignItems: 'center',
    marginTop: 6,
  },
  consentPrimaryLabel: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  consentSecondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  consentSecondaryLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: CYAN,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.72)',
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  modalShell: { maxHeight: '78%' },
  modalInner: { gap: 8 },
  modalTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: INK,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
  },
  modalScroll: { maxHeight: 320 },
  modalEmpty: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    paddingVertical: 12,
  },
  cravingRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  cravingName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: INK,
  },
  cravingMeta: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: INK_SUB,
    marginTop: 2,
  },
  modalCloseBtn: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalCloseText: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
});
