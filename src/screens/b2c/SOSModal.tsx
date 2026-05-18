import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import {
  buildSosIncidentPayload,
  serializeSosPayload,
  type SosIncidentPayload,
} from '../../services/emergency/sosTelemetry';
import { appendUsageHistory } from '../../services/history';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';
import { SOS_PLUS_PROFILE_UI_ENABLED } from '../../config/sosPlusProduction';
import { SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED } from '../../config/sosPlusSurface';
import { VionaSosPlusInfoModal } from '../../components/viona/VionaSosPlusInfoModal';

export type SOSModalProps = Readonly<{
  visible: boolean;
  onRequestClose: () => void;
  /** Root stack — required because this modal mounts under tabs, not the stack. */
  stackNavigation: NativeStackNavigationProp<RootStackParamList>;
}>;

const NULL_COORDS = {
  latitude: null as number | null,
  longitude: null as number | null,
  accuracyMeters: null as number | null,
};

/** Subtle per-category neon — icon, card border, hover/press tint (serious SOS, not loud). */
type SosActionAccent = Readonly<{
  icon: string;
  border: string;
  borderStrong: string;
  shadow: string;
  fillHover: string;
  fillPressed: string;
}>;

const SOS_ACTION_ACCENTS = {
  medical: {
    icon: '#f9a8d4',
    border: 'rgba(249, 168, 212, 0.38)',
    borderStrong: 'rgba(249, 168, 212, 0.56)',
    shadow: 'rgba(249, 168, 212, 0.42)',
    fillHover: 'rgba(249, 168, 212, 0.07)',
    fillPressed: 'rgba(249, 168, 212, 0.11)',
  },
  police: {
    icon: '#93c5fd',
    border: 'rgba(147, 197, 253, 0.38)',
    borderStrong: 'rgba(147, 197, 253, 0.55)',
    shadow: 'rgba(147, 197, 253, 0.4)',
    fillHover: 'rgba(147, 197, 253, 0.07)',
    fillPressed: 'rgba(147, 197, 253, 0.11)',
  },
  fire: {
    icon: '#fb923c',
    border: 'rgba(251, 146, 60, 0.4)',
    borderStrong: 'rgba(251, 146, 60, 0.58)',
    shadow: 'rgba(251, 146, 60, 0.42)',
    fillHover: 'rgba(251, 146, 60, 0.07)',
    fillPressed: 'rgba(251, 146, 60, 0.11)',
  },
  trusted: {
    icon: '#c4b5fd',
    border: 'rgba(196, 181, 253, 0.38)',
    borderStrong: 'rgba(196, 181, 253, 0.55)',
    shadow: 'rgba(196, 181, 253, 0.4)',
    fillHover: 'rgba(196, 181, 253, 0.07)',
    fillPressed: 'rgba(196, 181, 253, 0.11)',
  },
  scam: {
    icon: '#fcd34d',
    border: 'rgba(252, 211, 77, 0.36)',
    borderStrong: 'rgba(252, 211, 77, 0.54)',
    shadow: 'rgba(252, 211, 77, 0.38)',
    fillHover: 'rgba(252, 211, 77, 0.07)',
    fillPressed: 'rgba(252, 211, 77, 0.11)',
  },
  embassy: {
    icon: '#5eead4',
    border: 'rgba(94, 234, 212, 0.38)',
    borderStrong: 'rgba(94, 234, 212, 0.55)',
    shadow: 'rgba(94, 234, 212, 0.4)',
    fillHover: 'rgba(94, 234, 212, 0.07)',
    fillPressed: 'rgba(94, 234, 212, 0.11)',
  },
} as const satisfies Record<string, SosActionAccent>;

/**
 * Emergency guidance sheet: honest copy, no auto-dial, no live GPS/response claims.
 */
export function SOSModal({
  visible,
  onRequestClose,
  stackNavigation,
}: SOSModalProps): ReactElement {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { user } = useAuth();
  const [plusInfoOpen, setPlusInfoOpen] = useState(false);

  /** Wide desktop web: 3×2 grid, near-full-height panel, compact vertical rhythm. */
  const sosWebDesktopFit = Platform.OS === 'web' && width >= 1100;
  /** Narrow web only: optional grab pill (desktop/tablet web hides it). */
  const sosWebShowHandle = Platform.OS === 'web' && width < 768;

  useEffect(() => {
    if (!visible) setPlusInfoOpen(false);
  }, [visible]);

  const logIntent = useCallback(
    (kind: SosIncidentPayload['kind'], extraNote?: string) => {
      const payload = buildSosIncidentPayload(kind, NULL_COORDS);
      const serialized = serializeSosPayload(payload);
      if (__DEV__) {
        console.info('[VIONA SOS] incident intent', serialized);
      }
      void appendUsageHistory({
        type: 'emergency',
        status: 'success',
        note: `${kind}:${extraNote ?? 'sos_sheet'}:${serialized.slice(0, 280)}`,
      });
      return payload;
    },
    []
  );

  const showRoutingGuidance = useCallback(() => {
    Alert.alert(t('sos.routingSetupTitle'), t('sos.routingSetupBody'), [{ text: t('sos.close') }]);
  }, [t]);

  const onMedical = useCallback(() => {
    logIntent('medical', 'guidance_only');
    showRoutingGuidance();
  }, [logIntent, showRoutingGuidance]);

  const onPolice = useCallback(() => {
    logIntent('police', 'guidance_only');
    showRoutingGuidance();
  }, [logIntent, showRoutingGuidance]);

  const onFire = useCallback(() => {
    logIntent('fire', 'guidance_only');
    showRoutingGuidance();
  }, [logIntent, showRoutingGuidance]);

  const onTrustedContact = useCallback(() => {
    logIntent('trusted_contact', 'guidance_only');
    Alert.alert(t('sos.trustedContactTitle'), t('sos.trustedContactBody'), [{ text: t('sos.close') }]);
  }, [logIntent, t]);

  const onScam = useCallback(() => {
    const payload = logIntent('scam_report', 'local_note');
    onRequestClose();
    Alert.alert(t('sos.reportNoteTitle'), t('sos.reportNoteBody'), [{ text: t('sos.close') }]);
    if (__DEV__) {
      console.info('[VIONA SOS] scam report note', serializeSosPayload(payload), user?.serverUserId);
    }
  }, [logIntent, onRequestClose, t, user?.serverUserId]);

  const onEmbassy = useCallback(() => {
    logIntent('embassy_help', 'guidance_only');
    Alert.alert(t('sos.legacyEmbassyAlertTitle'), t('sos.legacyEmbassyAlertBody'), [{ text: t('sos.close') }]);
  }, [logIntent, t]);

  /** Desktop web: slim viewport breath above sheet so panel gains height; narrow/tablet web unchanged. */
  const topReservePx =
    Platform.OS === 'web'
      ? sosWebDesktopFit
        ? 8
        : 10
      : Math.max(insets.top + 8, 48);
  const availableHeight = Math.max(0, height - topReservePx);
  const vhCap =
    height *
    (Platform.OS === 'web' ? (sosWebDesktopFit ? 0.98 : 0.988) : 0.975);
  /** Never taller than remaining viewport; never force taller than `availableHeight` on tiny windows. */
  const sheetMax =
    availableHeight <= 0
      ? Math.min(height, 280)
      : Math.min(availableHeight, Math.max(180, vhCap));

  /** Sheet horizontal padding is 18 + 18 — fallback until native grid `onLayout` measures real width. */
  const sosSheetSidePad = 36;
  const actionGap = 16;
  const usableActionWidth = Math.max(0, width - sosSheetSidePad);
  /** Premium app-tile grid: 3×2 desktop web, 2-col from 360px (no horizontal list rows on mobile). */
  const actionCols =
    Platform.OS === 'web'
      ? width >= 1100
        ? 3
        : width >= 360
          ? 2
          : 1
      : width >= 760
        ? 3
        : width >= 360
          ? 2
          : 1;

  /**
   * Pixel widths from window falsely assume the sheet is full-bleed; the SOS sheet is narrower on web,
   * so cards became too wide → only 2 per row. Web uses `calc` vs grid width; native uses measured row width.
   */
  const [sosActionsGridWidth, setSosActionsGridWidth] = useState(0);
  const onSosActionsGridLayout = useCallback((e: LayoutChangeEvent) => {
    if (Platform.OS === 'web') return;
    const w = Math.round(e.nativeEvent.layout.width);
    setSosActionsGridWidth((prev) => (w > 0 && w !== prev ? w : prev));
  }, []);

  const nativeGridInner =
    sosActionsGridWidth > 0 ? sosActionsGridWidth : usableActionWidth;
  const actionGridCardWidthNative =
    Platform.OS !== 'web' && actionCols > 1
      ? (nativeGridInner - actionGap * (actionCols - 1)) / actionCols
      : undefined;

  /** Web: equal thirds/halves of the grid container (gap 16 → 32px total between 3 cols). */
  const gridWebCellStyle: ViewStyle | undefined =
    Platform.OS === 'web' && actionCols === 3
      ? styles.gridCellWeb3Col
      : Platform.OS === 'web' && actionCols === 2
        ? styles.gridCellWeb2Col
        : undefined;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onRequestClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onRequestClose} accessibilityLabel={t('sos.close')} />
          <View
            key={`sos-sheet-${i18n.language}`}
            style={[
              styles.sheet,
              {
                height: sheetMax,
                maxHeight: sheetMax,
                paddingBottom:
                  Platform.OS === 'web' && sosWebDesktopFit
                    ? 8
                    : Math.max(insets.bottom, 16) + 8,
                paddingTop:
                  Platform.OS !== 'web'
                    ? 10
                    : sosWebShowHandle
                      ? 12
                      : sosWebDesktopFit
                        ? 2
                        : 6,
              },
            ]}
          >
            {Platform.OS !== 'web' || sosWebShowHandle ? (
              <View style={styles.handleLane} accessibilityElementsHidden>
                <View style={styles.handle} />
              </View>
            ) : null}
            <ScrollView
              style={styles.scrollArea}
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                Platform.OS === 'web' && sosWebDesktopFit && styles.scrollContentWebDesktopFit,
                Platform.OS === 'web' && !sosWebDesktopFit && width >= 768 && styles.scrollContentWebTablet,
                Platform.OS === 'web' && !sosWebDesktopFit && width < 768 && styles.scrollContentWebNarrow,
              ]}
            >
              <View style={[styles.titleBlock, sosWebDesktopFit && styles.titleBlockDesktopFit]}>
                <View style={styles.headerGlyph}>
                  <Ionicons name="alert-circle" size={36} color="#EF4444" accessibilityIgnoresInvertColors />
                </View>
                <Text
                  style={styles.guideTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                  maxFontSizeMultiplier={1.35}
                >
                  {t('sos.guideTitle')}
                </Text>
                <Text
                  style={styles.guideSubtitle}
                  numberOfLines={3}
                  adjustsFontSizeToFit
                  minimumFontScale={0.68}
                  maxFontSizeMultiplier={1.25}
                >
                  {t('sos.guideSubtitle')}
                </Text>
                <Text
                  style={styles.guideAiNote}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  maxFontSizeMultiplier={1.2}
                >
                  {t('sos.guideAiNote')}
                </Text>
              </View>

              {SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED ? (
                <Pressable
                  onPress={() => setPlusInfoOpen(true)}
                  style={({ pressed }) => [
                    styles.plusInfoLink,
                    sosWebDesktopFit && styles.plusInfoLinkDesktopFit,
                    pressed && { opacity: 0.88 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('sos.learnBasicVsPlusA11y')}
                >
                  <Text style={styles.plusInfoLinkText}>{t('sos.sheetPlusLearnMore')}</Text>
                </Pressable>
              ) : null}

              <View style={[styles.locationBanner, sosWebDesktopFit && styles.locationBannerDesktopFit]}>
                <Ionicons name="navigate-outline" size={22} color="#FCA5A5" style={styles.bannerIcon} />
                <View style={styles.bannerTextCol}>
                  <Text
                    style={styles.bannerHeadline}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    maxFontSizeMultiplier={1.2}
                  >
                    {t('sos.locationGuidanceHeadline')}
                  </Text>
                  <Text
                    style={styles.bannerDetail}
                    numberOfLines={6}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    maxFontSizeMultiplier={1.15}
                  >
                    {t('sos.locationGuidanceDetail')}
                  </Text>
                </View>
              </View>

              <View style={[styles.routingCallout, sosWebDesktopFit && styles.routingCalloutDesktopFit]}>
                <Text style={styles.routingCalloutTitle} numberOfLines={2}>
                  {t('sos.routingSetupTitle')}
                </Text>
                <Text style={styles.routingCalloutBody} numberOfLines={4}>
                  {t('sos.routingSetupBody')}
                </Text>
              </View>

              <View
                style={[
                  styles.actionsGrid,
                  actionCols === 1 ? styles.actionsGridSingleCol : { gap: actionGap },
                ]}
                onLayout={onSosActionsGridLayout}
              >
                <SosActionCard
                  accent={SOS_ACTION_ACCENTS.medical}
                  icon="medkit"
                  title={t('sos.medicalTitle')}
                  subtitle={t('sos.emergencyRowSub')}
                  onPress={onMedical}
                  testHint="medical"
                  gridWebCellStyle={gridWebCellStyle}
                  cardWidth={actionGridCardWidthNative}
                  singleColumn={actionCols === 1}
                  compact={sosWebDesktopFit && actionCols >= 3}
                />
                <SosActionCard
                  accent={SOS_ACTION_ACCENTS.police}
                  icon="shield"
                  title={t('sos.policeTitle')}
                  subtitle={t('sos.emergencyRowSub')}
                  onPress={onPolice}
                  testHint="police"
                  gridWebCellStyle={gridWebCellStyle}
                  cardWidth={actionGridCardWidthNative}
                  singleColumn={actionCols === 1}
                  compact={sosWebDesktopFit && actionCols >= 3}
                />
                <SosActionCard
                  accent={SOS_ACTION_ACCENTS.fire}
                  icon="flame"
                  title={t('sos.fireTitle')}
                  subtitle={t('sos.emergencyRowSub')}
                  onPress={onFire}
                  testHint="fire"
                  gridWebCellStyle={gridWebCellStyle}
                  cardWidth={actionGridCardWidthNative}
                  singleColumn={actionCols === 1}
                  compact={sosWebDesktopFit && actionCols >= 3}
                />
                <SosActionCard
                  accent={SOS_ACTION_ACCENTS.trusted}
                  icon="people"
                  title={t('sos.trustedContactRowTitle')}
                  subtitle={t('sos.trustedContactRowSub')}
                  onPress={onTrustedContact}
                  testHint="trusted"
                  gridWebCellStyle={gridWebCellStyle}
                  cardWidth={actionGridCardWidthNative}
                  singleColumn={actionCols === 1}
                  compact={sosWebDesktopFit && actionCols >= 3}
                />
                <SosActionCard
                  accent={SOS_ACTION_ACCENTS.scam}
                  icon="warning"
                  title={t('sos.reportScam')}
                  subtitle={t('sos.reportScamSub')}
                  onPress={onScam}
                  testHint="scam"
                  gridWebCellStyle={gridWebCellStyle}
                  cardWidth={actionGridCardWidthNative}
                  singleColumn={actionCols === 1}
                  compact={sosWebDesktopFit && actionCols >= 3}
                />
                <SosActionCard
                  accent={SOS_ACTION_ACCENTS.embassy}
                  icon="globe-outline"
                  title={t('sos.sheetEmbassyTitle')}
                  subtitle={t('sos.sheetEmbassySub')}
                  onPress={onEmbassy}
                  testHint="embassy"
                  gridWebCellStyle={gridWebCellStyle}
                  cardWidth={actionGridCardWidthNative}
                  singleColumn={actionCols === 1}
                  compact={sosWebDesktopFit && actionCols >= 3}
                />
              </View>

              <Text
                style={[styles.footerDisclaimer, sosWebDesktopFit && styles.footerDisclaimerDesktopFit]}
                maxFontSizeMultiplier={1.15}
              >
                {t('sos.footerDisclaimer')}
              </Text>

              <Pressable
                onPress={onRequestClose}
                style={({ pressed }) => [
                  styles.dismissBtn,
                  sosWebDesktopFit && styles.dismissBtnDesktopFit,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('sos.close')}
              >
                <Text
                  style={styles.dismissLabel}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {t('sos.close')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED ? (
        <VionaSosPlusInfoModal
          visible={plusInfoOpen}
          onRequestClose={() => setPlusInfoOpen(false)}
          onPressOpenProfile={
            SOS_PLUS_PROFILE_UI_ENABLED
              ? () => {
                  setPlusInfoOpen(false);
                  stackNavigation.navigate('SosPlusProfile');
                }
              : undefined
          }
        />
      ) : null}
    </>
  );
}

function SosActionCard({
  accent,
  icon,
  title,
  subtitle,
  onPress,
  testHint,
  gridWebCellStyle,
  cardWidth,
  disabled = false,
  singleColumn = false,
  compact = false,
}: Readonly<{
  accent: SosActionAccent;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  testHint: string;
  gridWebCellStyle?: ViewStyle;
  cardWidth?: number;
  disabled?: boolean;
  singleColumn?: boolean;
  compact?: boolean;
}>): ReactElement {
  const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={(state) => {
        const pressed = state.pressed;
        const hovered =
          Platform.OS === 'web' &&
          'hovered' in state &&
          Boolean((state as Readonly<{ hovered?: boolean }>).hovered);
        return [
          styles.tileCard,
          compact && styles.tileCardCompact,
          singleColumn && styles.tileCardSingleCol,
          gridWebCellStyle,
          gridWebCellStyle == null && cardWidth != null ? { width: cardWidth } : null,
          { borderColor: accent.border },
          webPointer,
          pressed &&
            !disabled && {
              backgroundColor: accent.fillPressed,
              borderColor: accent.borderStrong,
            },
          !disabled &&
            hovered &&
            Platform.OS === 'web' && {
              backgroundColor: accent.fillHover,
              borderColor: accent.borderStrong,
              shadowColor: accent.shadow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            },
          disabled && styles.tileCardDisabled,
        ];
      }}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`${title}. ${subtitle}`}
      testID={`sos-row-${testHint}`}
    >
      <View
        style={[
          styles.tileIconWrap,
          compact && styles.tileIconWrapCompact,
          { borderColor: accent.icon },
        ]}
      >
        <Ionicons name={icon} size={compact ? 22 : 24} color={accent.icon} accessibilityIgnoresInvertColors />
      </View>
      <View style={styles.tileTextCol}>
        <Text style={styles.tileTitle} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {title}
        </Text>
        <Text style={styles.tileSub} numberOfLines={2} maxFontSizeMultiplier={1.12}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 8, 22, 0.82)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#050A14',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.38)',
    paddingHorizontal: 18,
    /** paddingTop applied inline (native / web / handle variants). */
    paddingTop: 0,
    maxWidth: '100%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 16,
  },
  /** Native-only lane so the grab pill never shares vertical space with the scroll header. */
  handleLane: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingTop: 8,
    paddingBottom: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
    maxWidth: '100%',
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 32,
    gap: 14,
    maxWidth: '100%',
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollContentWebNarrow: {
    paddingTop: 6,
    gap: 14,
  },
  /** Web ≥768 with no grab handle: keep icon near sheet top (no dead band above glyph). */
  scrollContentWebTablet: {
    paddingTop: 8,
    paddingBottom: 28,
    gap: 12,
  },
  /** ≥1100px web: icon tight to inner top; tighter stacks so 3×2 + footer fit shorter viewports. */
  scrollContentWebDesktopFit: {
    paddingTop: 4,
    paddingBottom: 10,
    gap: 10,
  },
  titleBlock: { gap: 8, alignItems: 'center', maxWidth: '100%', marginTop: 0 },
  titleBlockDesktopFit: { gap: 6 },
  headerGlyph: {
    marginBottom: 2,
  },
  guideTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.2,
    maxWidth: '100%',
  },
  guideSubtitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(226, 232, 240, 0.92)',
    textAlign: 'center',
    maxWidth: '100%',
  },
  guideAiNote: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(148, 163, 184, 0.95)',
    textAlign: 'center',
    maxWidth: '100%',
  },
  plusInfoLink: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.42)',
    backgroundColor: 'rgba(69, 10, 10, 0.55)',
    maxWidth: '100%',
  },
  plusInfoLinkDesktopFit: {
    marginTop: 0,
    paddingVertical: 6,
  },
  plusInfoLinkText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#FCA5A5',
    textAlign: 'center',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.28)',
    maxWidth: '100%',
  },
  locationBannerDesktopFit: {
    padding: 10,
    gap: 8,
  },
  bannerIcon: { flexShrink: 0, marginTop: 2 },
  bannerTextCol: { flex: 1, minWidth: 0, gap: 6, maxWidth: '100%' },
  bannerHeadline: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '800',
    color: '#E2E8F0',
    lineHeight: 21,
  },
  bannerDetail: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(203, 213, 225, 0.9)',
    lineHeight: 21,
  },
  routingCallout: {
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    gap: 6,
    maxWidth: '100%',
  },
  routingCalloutDesktopFit: {
    marginTop: 2,
    padding: 10,
    gap: 4,
  },
  routingCalloutTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '800',
    color: '#FECACA',
    textAlign: 'center',
    maxWidth: '100%',
  },
  routingCalloutBody: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(254, 243, 199, 0.92)',
    textAlign: 'center',
    maxWidth: '100%',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
  },
  actionsGridSingleCol: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    gap: 10,
  },
  /** Web: equal thirds of grid row; gap 16×2 = 32px between three columns (`calc` is web-only RN). */
  gridCellWeb3Col: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    width: 'calc((100% - 32px) / 3)' as ViewStyle['width'],
    maxWidth: 'calc((100% - 32px) / 3)' as ViewStyle['width'],
  },
  /** Web: two columns; one 16px gap. */
  gridCellWeb2Col: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    width: 'calc((100% - 16px) / 2)' as ViewStyle['width'],
    maxWidth: 'calc((100% - 16px) / 2)' as ViewStyle['width'],
  },
  tileCard: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 17, 34, 0.96)',
    borderWidth: 1,
    minHeight: 108,
    gap: 10,
  },
  tileCardSingleCol: {
    width: '100%',
    maxWidth: '100%',
  },
  tileCardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 96,
    gap: 8,
  },
  tileCardDisabled: { opacity: 0.42 },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
  },
  tileIconWrapCompact: {
    width: 40,
    height: 40,
    borderRadius: 11,
  },
  tileTextCol: {
    alignItems: 'flex-start',
    gap: 4,
    width: '100%',
    minWidth: 0,
  },
  tileTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
    color: '#F8FAFC',
    letterSpacing: -0.14,
    lineHeight: 17,
    maxWidth: '100%',
  },
  tileSub: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(203, 213, 225, 0.88)',
    lineHeight: 14,
    maxWidth: '100%',
  },
  footerDisclaimer: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(148, 163, 184, 0.95)',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
    maxWidth: '100%',
  },
  footerDisclaimerDesktopFit: {
    marginTop: 2,
  },
  dismissBtn: {
    marginTop: 12,
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    maxWidth: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
  },
  dismissBtnDesktopFit: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  dismissLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    fontWeight: '700',
    color: '#F4F6FA',
    maxWidth: '100%',
    textAlign: 'center',
  },
});
