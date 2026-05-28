/**
 * Local dynamic hero — Home hero grammar (copy left, visual right, no in-hero tiles).
 * Theme-invariant premium dark-glass frame; hero images stay daylight/golden-hour assets.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageStyle,
} from 'react-native';

import { vionaTokens } from '../../../design';
import { getLocalHeroAsset, type LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';
import { getLocalHeroVisualSpec } from '../../../design/vionaLocalHeroVisuals';
import {
  FASHION_HOME_FRAME_BORDER,
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from '../fashionHomeDesktopShell';
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../i18n';

/** Match the delivered 1600x520 daylight assets so cover-crop stays minimal. */
const HERO_ASPECT = 1600 / 520;

export type LocalDynamicHeroProps = Readonly<{
  onBrowseServices: () => void;
  onBookingAssist: () => void;
  activeHeroKey?: LocalHeroVisualKey;
  /** @deprecated Ignored — Local hero uses theme-invariant premium dark glass. */
  daylight?: boolean;
  testID?: string;
}>;

export function LocalDynamicHero({
  onBrowseServices,
  onBookingAssist,
  activeHeroKey = 'default',
  testID = 'local-dynamic-hero',
}: LocalDynamicHeroProps): ReactElement {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isNarrow = width < 520;
  const shortViewport = height > 0 && height < 520;
  const compactHero = shortViewport || (height > 0 && width / height > 1.8);
  // True-fit: the frame derives its height from its real rendered width via aspectRatio, so `cover`
  // matches the 1600x520 composition (no over-crop). Floors keep copy readable on narrow frames;
  // the max cap stops the banner from getting too tall on very wide single-column layouts.
  const frameSizing = {
    aspectRatio: HERO_ASPECT,
    minHeight: compactHero ? 184 : isNarrow ? 212 : 248,
    maxHeight: compactHero ? 300 : 440,
  } as const;
  const visual = getLocalHeroVisualSpec(activeHeroKey);
  const heroSource = getLocalHeroAsset(activeHeroKey);
  const fallbackHeroSource = getLocalHeroAsset('default');
  const previousSourceRef = useRef(heroSource);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (previousSourceRef.current === heroSource) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    previousSourceRef.current = heroSource;
  }, [fadeAnim, heroSource]);

  const imageWebStyle = useMemo(
    () =>
      (Platform.OS === 'web'
        ? {
            width: '100%',
            height: '100%',
            objectFit: 'cover' as const,
            objectPosition: visual.preferredObjectPosition,
          }
        : {}) as ImageStyle,
    [visual.preferredObjectPosition]
  );
  const scrimStrength = Math.max(0.44, Math.min(0.72, visual.textScrimStrength));

  return (
    <View testID={testID} style={styles.shell}>
      <View style={[styles.frame, frameSizing]}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            `rgba(4, 7, 12, ${scrimStrength.toFixed(2)})`,
            `rgba(4, 7, 12, ${(scrimStrength * 0.42).toFixed(2)})`,
            'rgba(4, 7, 12, 0)',
          ]}
          locations={[0, 0.48, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.leftScrim}
        />
        <View style={styles.imageClip} pointerEvents="none">
          <Image
            source={fallbackHeroSource}
            resizeMode="cover"
            style={[styles.imageFill, imageWebStyle]}
            accessibilityIgnoresInvertColors
          />
          <Animated.View style={[styles.imageFadeLayer, { opacity: fadeAnim }]}>
            <Image
              source={heroSource}
              resizeMode="cover"
              style={[styles.imageFill, imageWebStyle]}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(4, 6, 10, 0.26)']}
            style={styles.bottomHandoff}
          />
        </View>
        <View style={styles.copyCol} pointerEvents="box-none">
          <Text style={styles.eyebrow}>{t('localHub.reframe.heroEyebrow')}</Text>
          <Text style={[styles.headline, isNarrow && styles.headlineNarrow]}>
            {t('localHub.reframe.heroHeadline')}
          </Text>
          <Text style={styles.subtitle}>{t('localHub.reframe.heroSubtitle')}</Text>
          <View style={styles.ctaRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('localHub.reframe.heroCtaBrowse')}
              onPress={onBrowseServices}
              style={({ pressed }) => [styles.ctaPrimary, pressed && styles.ctaPressed]}
            >
              <LinearGradient
                colors={['rgba(255, 232, 188, 0.98)', 'rgba(201, 169, 98, 0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaPrimaryFill}
              >
                <Text style={styles.ctaPrimaryText}>{t('localHub.reframe.heroCtaBrowse')}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('localHub.reframe.heroCtaBookingAssist')}
              onPress={onBookingAssist}
              style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaPressed]}
            >
              <Text style={styles.ctaSecondaryText}>{t('localHub.reframe.heroCtaBookingAssist')}</Text>
            </Pressable>
          </View>
          <View style={styles.trustStrip}>
            <Text style={styles.trustText}>{t('localCommerce.safety.pillRequestOnly')}</Text>
            <View style={styles.trustDivider} />
            <Text style={styles.trustText}>{t('localCommerce.safety.pillNoPayment')}</Text>
            <View style={styles.trustDivider} />
            <Text style={styles.trustText}>{t('localHub.reframe.trustMerchantFirst')}</Text>
          </View>
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.edgeOverlay,
            premiumFrameEdgeOverlay(vionaTokens.radius.xxl),
            premiumCrispEdgeStroke(FASHION_HOME_FRAME_BORDER),
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: vionaTokens.radius.xxl,
    overflow: 'hidden',
  },
  frame: {
    width: '100%',
    borderRadius: vionaTokens.radius.xxl,
    overflow: 'hidden',
    backgroundColor: 'rgba(6, 10, 18, 0.92)',
    position: 'relative',
  },
  leftScrim: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '58%',
    maxWidth: 420,
    zIndex: 2,
  },
  imageClip: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  imageFadeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomHandoff: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '28%',
  },
  copyCol: {
    zIndex: 4,
    paddingHorizontal: vionaTokens.spacing[16],
    paddingVertical: vionaTokens.spacing[20],
    maxWidth: 520,
    gap: vionaTokens.spacing[8],
  },
  eyebrow: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(120, 255, 210, 0.92)',
  },
  headline: {
    fontFamily: FontFamily.extrabold,
    fontSize: 26,
    lineHeight: 32,
    color: '#FFFFFF',
  },
  headlineNarrow: {
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(236, 244, 255, 0.9)',
    maxWidth: 480,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[8],
    marginTop: vionaTokens.spacing[4],
  },
  ctaPrimary: {
    borderRadius: vionaTokens.radius.md,
    overflow: 'hidden',
  },
  ctaPrimaryFill: {
    paddingHorizontal: vionaTokens.spacing[16],
    paddingVertical: vionaTokens.spacing[12],
  },
  ctaPrimaryText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: 'rgba(18, 24, 36, 0.96)',
  },
  ctaSecondary: {
    borderRadius: vionaTokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(120, 210, 255, 0.42)',
    backgroundColor: 'rgba(10, 18, 32, 0.72)',
    paddingHorizontal: vionaTokens.spacing[16],
    paddingVertical: vionaTokens.spacing[12],
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: 'rgba(230, 244, 255, 0.96)',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  trustStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: vionaTokens.spacing[6],
    marginTop: vionaTokens.spacing[6],
    paddingVertical: vionaTokens.spacing[6],
    paddingHorizontal: vionaTokens.spacing[8],
    borderRadius: vionaTokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(120, 255, 210, 0.28)',
    backgroundColor: 'rgba(6, 12, 22, 0.62)',
    alignSelf: 'flex-start',
  },
  trustText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(248, 252, 255, 0.92)',
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
  edgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
});
