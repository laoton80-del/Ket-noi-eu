import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../i18n';

/** Below this window width, use a slightly smaller wordmark so chips keep air. */
const LOGO_COMPACT_BREAKPOINT = 1060;
const LOGO_IMAGE = require('../../../assets/brand/viona/logo-in-app.png');

export type VionaFashionHomeCommandBarProps = Readonly<{
  /** Tighter typography and chips for mid-width desktop or short landscape viewports. */
  density?: 'comfortable' | 'compact';
  onPressLogo: () => void;
  /** Primary greeting line (name + time-of-day hello). */
  headerGreetingLine1: string;
  /** Short supportive wish for the time of day. */
  headerWishLine: string;
  /** Prominent local time + explicit region (e.g. “08:33 tại …”). */
  headerTimeLocationLine: string;
  /**
   * Desktop fashion home: large clock line + separate region line (localized country).
   * When set, overrides the single-line `headerTimeLocationLine` for visual layout (a11y still uses full string).
   */
  desktopTimeRegion?: Readonly<{
    clockLine: string;
    regionLine: string | null;
  }>;
  /** Full greeting block for screen readers. */
  headerGreetingA11y: string;
  onPressLanguage: () => void;
  onPressVio: () => void;
  onPressSafety: () => void;
  onPressAccount: () => void;
  onPressRole?: () => void;
  showRolePicker: boolean;
}>;

export function VionaFashionHomeCommandBar({
  density = 'comfortable',
  onPressLogo,
  headerGreetingLine1,
  headerWishLine,
  headerTimeLocationLine,
  desktopTimeRegion,
  headerGreetingA11y,
  onPressLanguage,
  onPressVio,
  onPressSafety,
  onPressAccount,
  onPressRole,
  showRolePicker,
}: VionaFashionHomeCommandBarProps) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const compactDensity = density === 'compact';
  const useCompactLogo = compactDensity || (windowWidth > 0 && windowWidth < LOGO_COMPACT_BREAKPOINT);

  return (
    <View style={[styles.bar, compactDensity && styles.barCompact]}>
      <View style={[styles.leftCluster, compactDensity && styles.leftClusterCompact]}>
        <Pressable
          onPress={onPressLogo}
          style={({ pressed }) => [styles.logoBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="VIONA Hub"
        >
          <Image
            source={LOGO_IMAGE}
            resizeMode="contain"
            style={useCompactLogo ? styles.logoImageCompact : styles.logoImage}
          />
        </Pressable>
        <View
          style={styles.greetingBlock}
          accessibilityRole="text"
          accessibilityLabel={headerGreetingA11y}
        >
          <Text
            style={[styles.greetingLine1, compactDensity && styles.greetingLine1Compact]}
            numberOfLines={2}
          >
            {headerGreetingLine1}
          </Text>
          <Text style={[styles.wishLine, compactDensity && styles.wishLineCompact]} numberOfLines={2}>
            {headerWishLine}
          </Text>
          {desktopTimeRegion != null ? (
            <View style={styles.desktopTimeBlock}>
              <Text
                style={[styles.desktopClockLine, compactDensity && styles.desktopClockLineCompact]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {desktopTimeRegion.clockLine}
              </Text>
              {desktopTimeRegion.regionLine != null && desktopTimeRegion.regionLine.length > 0 ? (
                <Text
                  style={[styles.desktopRegionLine, compactDensity && styles.desktopRegionLineCompact]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {desktopTimeRegion.regionLine}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text
              style={[styles.timeLocationLine, compactDensity && styles.timeLocationLineCompact]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {headerTimeLocationLine}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.utilityCluster, compactDensity && styles.utilityClusterCompact]}>
        {showRolePicker && onPressRole ? (
          <Pressable
            onPress={onPressRole}
            style={({ pressed }) => [styles.utilBtn, compactDensity && styles.utilBtnCompact, pressed && styles.pressed]}
          >
            <Ionicons name="shuffle-outline" size={compactDensity ? 15 : 16} color={vionaTokens.fashionTech.champagne} />
            <Text style={styles.utilLabel} numberOfLines={1}>
              {t('shell.utility.switchRole')}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onPressLanguage}
          style={({ pressed }) => [styles.utilBtn, compactDensity && styles.utilBtnCompact, pressed && styles.pressed]}
        >
          <Ionicons name="globe-outline" size={compactDensity ? 15 : 16} color={vionaTokens.fashionTech.champagne} />
          <Text style={styles.utilLabel} numberOfLines={1}>
            {t('shell.utility.language')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onPressVio}
          style={({ pressed }) => [styles.utilBtn, compactDensity && styles.utilBtnCompact, pressed && styles.pressed]}
        >
          <Ionicons name="wallet-outline" size={compactDensity ? 15 : 16} color={vionaTokens.fashionTech.champagne} />
          <Text style={styles.utilLabel} numberOfLines={1}>
            {t('shell.utility.vioCredits')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onPressSafety}
          style={({ pressed }) => [
            styles.utilBtn,
            compactDensity && styles.utilBtnCompact,
            styles.sosBtn,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('sos.a11yChip')}
        >
          <Ionicons name="shield" size={compactDensity ? 15 : 16} color={vionaTokens.fashionTech.sosNeon} />
          <Text style={[styles.utilLabel, styles.sosLabel]} numberOfLines={1}>
            {t('sos.chip')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onPressAccount}
          style={({ pressed }) => [styles.utilBtn, compactDensity && styles.utilBtnCompact, pressed && styles.pressed]}
        >
          <Ionicons name="person-circle-outline" size={compactDensity ? 15 : 16} color={vionaTokens.fashionTech.champagne} />
          <Text style={styles.utilLabel} numberOfLines={1}>
            {t('shell.utility.accountProfile')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Top shell row — background comes from parent `HomeScreen` fashion shell; no “floating card”. */
  bar: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaTokens.spacing[8],
    paddingVertical: vionaTokens.spacing[6],
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 0,
  },
  barCompact: {
    gap: vionaTokens.spacing[8],
    paddingVertical: vionaTokens.spacing[4],
  },
  leftCluster: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: vionaTokens.spacing[12],
    flex: 1,
    minWidth: 200,
  },
  leftClusterCompact: {
    gap: vionaTokens.spacing[12],
    minWidth: 160,
  },
  logoBtn: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    flexShrink: 0,
    borderRadius: vionaTokens.radius.md,
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 236,
    height: 72,
    backgroundColor: vionaTokens.fashionTech.canvas,
  },
  logoImageCompact: {
    width: 176,
    height: 54,
    backgroundColor: vionaTokens.fashionTech.canvas,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: vionaTokens.spacing[2],
  },
  greetingLine1: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    letterSpacing: 0.12,
    lineHeight: 20,
    color: vionaTokens.fashionTech.inkOnDark,
    flexShrink: 1,
  },
  greetingLine1Compact: {
    fontSize: 14,
    lineHeight: 18,
  },
  wishLine: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    letterSpacing: 0.15,
    lineHeight: 16,
    color: vionaTokens.fashionTech.mutedOnDark,
    flexShrink: 1,
  },
  wishLineCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  timeLocationLine: {
    marginTop: 2,
    fontFamily: FontFamily.extrabold,
    fontSize: 19,
    letterSpacing: 0.25,
    lineHeight: 24,
    color: vionaTokens.fashionTech.champagne,
    flexShrink: 1,
    maxWidth: '100%',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(5, 10, 18, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  timeLocationLineCompact: {
    fontSize: 16,
    lineHeight: 21,
  },
  desktopTimeBlock: {
    marginTop: 2,
    gap: 2,
    maxWidth: '100%',
  },
  desktopClockLine: {
    fontFamily: FontFamily.extrabold,
    fontSize: 26,
    letterSpacing: 0.4,
    lineHeight: 30,
    color: vionaTokens.fashionTech.champagne,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(5, 10, 18, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  desktopClockLineCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  desktopRegionLine: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    letterSpacing: 0.2,
    lineHeight: 18,
    color: vionaTokens.fashionTech.inkOnDark,
    opacity: 0.92,
    textShadowColor: 'rgba(5, 10, 18, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  desktopRegionLineCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  utilityCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[6],
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    minWidth: 220,
  },
  utilityClusterCompact: {
    minWidth: 160,
  },
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.champagneLine,
    backgroundColor: 'rgba(8, 12, 20, 0.55)',
    maxWidth: 200,
  },
  utilBtnCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxWidth: 180,
  },
  sosBtn: {
    borderColor: vionaTokens.fashionTech.sosNeonGlow,
    backgroundColor: 'rgba(40, 10, 14, 0.55)',
    shadowColor: vionaTokens.fashionTech.sosNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  sosLabel: {
    color: vionaTokens.fashionTech.sosNeon,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.8,
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
