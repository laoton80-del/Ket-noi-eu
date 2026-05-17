import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { vionaTokens } from '../../design';
import {
  FASHION_HOME_COMMAND_RAIL_BORDER,
  FASHION_HOME_COMMAND_RAIL_GRADIENT,
  FASHION_HOME_COMMAND_RAIL_GREETING_EXTRA_MARGIN_PX,
  FASHION_HOME_COMMAND_RAIL_HIGHLIGHT,
  FASHION_HOME_COMMAND_RAIL_SHELL_INSET_LEFT_PX,
  FASHION_HOME_DAYLIGHT_RAIL_BORDER,
  FASHION_HOME_DAYLIGHT_RAIL_GRADIENT,
  FASHION_HOME_DAYLIGHT_RAIL_HIGHLIGHT,
  FASHION_HOME_DAYLIGHT_CHIP_CONTAINED_GLOW,
  FASHION_HOME_GLOW_CYAN,
  FASHION_HOME_GLOW_GOLD,
  FASHION_HOME_LINE_GOLD_SOFT,
  fashionHomeWebCommandUtilityHoverStyle,
  fashionHomeWebCommandUtilityPressStyle,
  fashionHomeWebDaylightTransitionStyle,
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from './fashionHomeDesktopShell';
import { VionaBrandLockup } from './VionaBrandLockup';
import { vionaGlobalTopRailWebRightReservePx } from './globalLightNetworkTokens';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../i18n';

/** RN types omit web `hovered`; runtime supplies it on react-native-web. */
type FashionHomePressableStyleState = { pressed: boolean; hovered?: boolean };

/** Below this window width, use a slightly smaller wordmark so chips keep air. */
const LOGO_COMPACT_BREAKPOINT = 1060;

export type VionaFashionHomeCommandBarProps = Readonly<{
  /** Tighter typography and chips for mid-width desktop or short landscape viewports. */
  density?: 'comfortable' | 'compact';
  onPressLogo: () => void;
  /** Primary greeting line (name + time-of-day hello). */
  headerGreetingLine1: string;
  /** Short supportive wish for the time of day. */
  headerWishLine: string;
  /** Greeting block for screen readers (greeting + wish only). */
  headerGreetingA11y: string;
  onPressLanguage: () => void;
  onPressVio: () => void;
  onPressSafety: () => void;
  onPressAccount: () => void;
  onPressRole?: () => void;
  showRolePicker: boolean;
  /** Web-only fullscreen chip; omitted on native or unsupported browsers. */
  fullscreenControl?: Readonly<{
    isActive: boolean;
    onPress: () => void;
    accessibilityLabel: string;
    label: string;
  }>;
  /** Home-only Daylight Boost (Fashion desktop web). */
  daylightBoost?: boolean;
  onPressDaylightBoost?: () => void;
  daylightBoostLabel?: string;
}>;

export function VionaFashionHomeCommandBar({
  density = 'comfortable',
  onPressLogo,
  headerGreetingLine1,
  headerWishLine,
  headerGreetingA11y,
  onPressLanguage,
  onPressVio,
  onPressSafety,
  onPressAccount,
  onPressRole,
  showRolePicker,
  fullscreenControl,
  daylightBoost,
  onPressDaylightBoost,
  daylightBoostLabel,
}: VionaFashionHomeCommandBarProps) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const compactDensity = density === 'compact';
  const useCompactLogo = compactDensity || (windowWidth > 0 && windowWidth < LOGO_COMPACT_BREAKPOINT);
  const railGradient = daylightBoost ? FASHION_HOME_DAYLIGHT_RAIL_GRADIENT : FASHION_HOME_COMMAND_RAIL_GRADIENT;
  const railBorder = daylightBoost ? FASHION_HOME_DAYLIGHT_RAIL_BORDER : FASHION_HOME_COMMAND_RAIL_BORDER;
  const railTopHighlight = daylightBoost ? FASHION_HOME_DAYLIGHT_RAIL_HIGHLIGHT : FASHION_HOME_COMMAND_RAIL_HIGHLIGHT;
  const barShellWebTransition = Platform.OS === 'web' ? fashionHomeWebDaylightTransitionStyle() : null;

  return (
    <View style={[styles.barShell, compactDensity && styles.barShellCompact, barShellWebTransition]}>
      <LinearGradient
        colors={railGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bar, compactDensity && styles.barCompact, barShellWebTransition]}
      >
        <View style={[styles.barInnerHighlight, { backgroundColor: railTopHighlight }]} pointerEvents="none" />
        <View style={[styles.barRow, compactDensity && styles.barRowCompact]}>
          <View style={[styles.brandRail, compactDensity && styles.brandRailCompact]}>
            <Pressable
              onPress={onPressLogo}
              style={({ pressed }) => [styles.logoPressable, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="VIONA Hub"
            >
              <VionaBrandLockup variant={useCompactLogo ? 'compact' : 'header'} />
            </Pressable>
            <View style={styles.greetingDivider} pointerEvents="none" />
            <View
              style={[styles.greetingBlock, { marginLeft: FASHION_HOME_COMMAND_RAIL_GREETING_EXTRA_MARGIN_PX }]}
              accessibilityRole="text"
              accessibilityLabel={headerGreetingA11y}
            >
              <Text
                style={[styles.greetingLine1, compactDensity && styles.greetingLine1Compact]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {headerGreetingLine1}
              </Text>
              <Text
                style={[styles.wishLine, compactDensity && styles.wishLineCompact]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {headerWishLine}
              </Text>
            </View>
          </View>
          <View style={[styles.utilityTrack, compactDensity && styles.utilityTrackCompact]}>
            <View
              style={[
                styles.utilityCluster,
                compactDensity && styles.utilityClusterCompact,
                Platform.OS === 'web' ? { paddingRight: vionaGlobalTopRailWebRightReservePx(windowWidth) } : null,
              ]}
            >
              {showRolePicker && onPressRole ? (
                <Pressable
                  onPress={onPressRole}
                  style={(s) => {
                    const { pressed, hovered } = s as FashionHomePressableStyleState;
                    return [
                    styles.utilBtn,
                    compactDensity && styles.utilBtnCompact,
                    Platform.OS === 'web' && fashionHomeWebCommandUtilityHoverStyle(!!hovered, !!daylightBoost),
                    Platform.OS === 'web' && fashionHomeWebCommandUtilityPressStyle(!!pressed),
                    pressed && styles.pressed,
                  ];
                  }}
                >
                  <Ionicons
                    name="shuffle-outline"
                    size={compactDensity ? 15 : 16}
                    color={vionaTokens.fashionTech.champagne}
                  />
                  <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                    {t('shell.utility.switchRole')}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={onPressLanguage}
                style={(s) => {
                  const { pressed, hovered } = s as FashionHomePressableStyleState;
                  return [
                  styles.utilBtn,
                  compactDensity && styles.utilBtnCompact,
                  Platform.OS === 'web' && fashionHomeWebCommandUtilityHoverStyle(!!hovered, !!daylightBoost),
                  pressed && styles.pressed,
                ];
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={compactDensity ? 15 : 16}
                  color={vionaTokens.fashionTech.champagne}
                />
                <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                  {t('shell.utility.language')}
                </Text>
              </Pressable>
              {onPressDaylightBoost ? (
                <Pressable
                  onPress={onPressDaylightBoost}
                  style={(s) => {
                    const { pressed, hovered } = s as FashionHomePressableStyleState;
                    return [
                    styles.utilBtn,
                    compactDensity && styles.utilBtnCompact,
                    styles.daylightBoostBtn,
                    compactDensity && styles.daylightBoostBtnCompact,
                    daylightBoost && styles.daylightBoostBtnActive,
                    Platform.OS === 'web' && daylightBoost && styles.daylightBoostBtnActiveWeb,
                    Platform.OS === 'web' && fashionHomeWebCommandUtilityHoverStyle(!!hovered, !!daylightBoost),
                    Platform.OS === 'web' && fashionHomeWebCommandUtilityPressStyle(!!pressed),
                    pressed && styles.pressed,
                  ];
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={daylightBoostLabel ?? 'Daylight Boost'}
                >
                  <Ionicons
                    name={daylightBoost ? 'moon-outline' : 'sunny-outline'}
                    size={compactDensity ? 15 : 16}
                    color={daylightBoost ? 'rgba(214, 236, 255, 0.95)' : vionaTokens.fashionTech.champagne}
                  />
                  {compactDensity ? null : (
                    <Text
                      style={[styles.utilLabel, daylightBoost && styles.daylightBoostLabelActive]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {daylightBoostLabel ?? 'Daylight'}
                    </Text>
                  )}
                </Pressable>
              ) : null}
              {fullscreenControl ? (
                <Pressable
                  onPress={fullscreenControl.onPress}
                  style={(s) => {
                    const { pressed, hovered } = s as FashionHomePressableStyleState;
                    return [
                    styles.utilBtn,
                    compactDensity && styles.utilBtnCompact,
                    compactDensity ? styles.fullscreenBtnCompact : styles.fullscreenBtn,
                    Platform.OS === 'web' && fashionHomeWebCommandUtilityHoverStyle(!!hovered, !!daylightBoost),
                    Platform.OS === 'web' && fashionHomeWebCommandUtilityPressStyle(!!pressed),
                    pressed && styles.pressed,
                  ];
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={fullscreenControl.accessibilityLabel}
                >
                  <Ionicons
                    name={fullscreenControl.isActive ? 'contract-outline' : 'expand-outline'}
                    size={compactDensity ? 15 : 16}
                    color={vionaTokens.fashionTech.champagne}
                  />
                  {compactDensity ? null : (
                    <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                      {fullscreenControl.label}
                    </Text>
                  )}
                </Pressable>
              ) : null}
              <Pressable
                onPress={onPressVio}
                style={(s) => {
                  const { pressed, hovered } = s as FashionHomePressableStyleState;
                  return [
                  styles.utilBtn,
                  compactDensity && styles.utilBtnCompact,
                  Platform.OS === 'web' && fashionHomeWebCommandUtilityHoverStyle(!!hovered, !!daylightBoost),
                  Platform.OS === 'web' && fashionHomeWebCommandUtilityPressStyle(!!pressed),
                  pressed && styles.pressed,
                ];
                }}
              >
                <Ionicons
                  name="wallet-outline"
                  size={compactDensity ? 15 : 16}
                  color={vionaTokens.fashionTech.champagne}
                />
                <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                  {t('shell.utility.vioCredits')}
                </Text>
              </Pressable>
              <Pressable
                onPress={onPressSafety}
                style={(s) => {
                  const { pressed, hovered } = s as FashionHomePressableStyleState;
                  return [
                    styles.utilBtn,
                    compactDensity && styles.utilBtnCompact,
                    styles.sosBtn,
                    Platform.OS === 'web' &&
                      fashionHomeWebCommandUtilityHoverStyle(!!hovered, !!daylightBoost, { sos: true }),
                    Platform.OS === 'web' && fashionHomeWebCommandUtilityPressStyle(!!pressed),
                    pressed && styles.pressed,
                  ];
                }}
                accessibilityRole="button"
                accessibilityLabel={t('sos.a11yChip')}
              >
                <Ionicons
                  name="shield"
                  size={compactDensity ? 15 : 16}
                  color={vionaTokens.fashionTech.sosNeon}
                />
                <Text style={[styles.utilLabel, styles.sosLabel]} numberOfLines={1} ellipsizeMode="tail">
                  {t('sos.chip')}
                </Text>
              </Pressable>
              <Pressable
                onPress={onPressAccount}
                style={(s) => {
                  const { pressed, hovered } = s as FashionHomePressableStyleState;
                  return [
                  styles.utilBtn,
                  compactDensity && styles.utilBtnCompact,
                  Platform.OS === 'web' && fashionHomeWebCommandUtilityHoverStyle(!!hovered, !!daylightBoost),
                  Platform.OS === 'web' && fashionHomeWebCommandUtilityPressStyle(!!pressed),
                  pressed && styles.pressed,
                ];
                }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={compactDensity ? 15 : 16}
                  color={vionaTokens.fashionTech.champagne}
                />
                <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                  {t('shell.utility.accountProfile')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
      <View
        pointerEvents="none"
        style={[
          styles.railEdgeOverlay,
          premiumFrameEdgeOverlay(vionaTokens.radius.lg),
          premiumCrispEdgeStroke(railBorder),
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  barShell: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: vionaTokens.radius.lg,
    marginBottom: vionaTokens.spacing[2],
    backgroundColor: 'transparent',
    position: 'relative',
  },
  barShellCompact: {
    marginBottom: vionaTokens.spacing[2],
  },
  bar: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: vionaTokens.spacing[6],
    paddingLeft: vionaTokens.spacing[6] + FASHION_HOME_COMMAND_RAIL_SHELL_INSET_LEFT_PX,
    paddingRight: vionaTokens.spacing[6],
    position: 'relative',
    borderRadius: vionaTokens.radius.lg,
    overflow: 'hidden',
  },
  railEdgeOverlay: {
    pointerEvents: 'none',
  },
  barCompact: {
    paddingVertical: vionaTokens.spacing[4],
  },
  barInnerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: FASHION_HOME_COMMAND_RAIL_HIGHLIGHT,
    zIndex: 2,
  },
  barRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaTokens.spacing[8],
  },
  barRowCompact: {
    gap: vionaTokens.spacing[6],
  },
  brandRail: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: vionaTokens.spacing[6],
    flex: 1,
    minWidth: 168,
  },
  brandRailCompact: {
    minWidth: 160,
    gap: vionaTokens.spacing[6],
  },
  logoPressable: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginLeft: -4,
    marginRight: -4,
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  greetingDivider: {
    width: 1,
    alignSelf: 'stretch',
    minHeight: 34,
    backgroundColor: FASHION_HOME_LINE_GOLD_SOFT,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 0,
    paddingVertical: 0,
  },
  greetingLine1: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    letterSpacing: 0.1,
    lineHeight: 18,
    color: vionaTokens.fashionTech.inkOnDark,
    flexShrink: 1,
  },
  greetingLine1Compact: {
    fontSize: 13,
    lineHeight: 17,
  },
  wishLine: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.12,
    lineHeight: 15,
    color: vionaTokens.fashionTech.mutedOnDark,
    flexShrink: 1,
  },
  wishLineCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  utilityTrack: {
    alignSelf: 'center',
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
    flexShrink: 0,
  },
  utilityTrackCompact: {
    alignSelf: 'stretch',
    width: '100%',
  },
  utilityCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[6],
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 168,
  },
  utilityClusterCompact: {
    minWidth: 160,
    justifyContent: 'flex-start',
  },
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 30,
    paddingVertical: 0,
    paddingHorizontal: 11,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(136, 218, 255, 0.16)',
    backgroundColor: 'rgba(10, 14, 22, 0.78)',
    shadowColor: FASHION_HOME_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: 170,
  },
  utilBtnCompact: {
    minHeight: 32,
    paddingHorizontal: 9,
    maxWidth: 154,
  },
  daylightBoostBtn: {
    maxWidth: 124,
    borderColor: FASHION_HOME_LINE_GOLD_SOFT,
    backgroundColor: 'rgba(10, 14, 22, 0.7)',
    shadowColor: FASHION_HOME_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 1,
    elevation: 0,
  },
  daylightBoostBtnCompact: {
    maxWidth: 40,
    paddingHorizontal: 8,
  },
  daylightBoostBtnActive: {
    borderColor: 'rgba(252, 228, 180, 0.48)',
    backgroundColor: 'rgba(14, 20, 32, 0.66)',
    shadowColor: FASHION_HOME_DAYLIGHT_CHIP_CONTAINED_GLOW,
    shadowOpacity: 0.32,
    shadowRadius: 1,
  },
  daylightBoostBtnActiveWeb: {
    boxShadow:
      'inset 0 0 0 1px rgba(252, 236, 200, 0.4), 0 0 3px rgba(148, 210, 255, 0.08), 0 1px 4px rgba(6, 10, 18, 0.16)',
  },
  daylightBoostLabelActive: {
    color: 'rgba(255, 248, 235, 0.96)',
  },
  fullscreenBtn: {
    maxWidth: 148,
  },
  fullscreenBtnCompact: {
    maxWidth: 44,
    paddingHorizontal: 8,
  },
  sosBtn: {
    borderColor: vionaTokens.fashionTech.sosNeonGlow,
    backgroundColor: 'rgba(28, 8, 12, 0.78)',
    shadowColor: 'rgba(255, 92, 108, 0.14)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  sosLabel: {
    color: vionaTokens.fashionTech.sosNeon,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.35,
  },
  utilLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: vionaTokens.fashionTech.inkOnDark,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.88,
  },
});
