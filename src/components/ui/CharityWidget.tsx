import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { vionaTokens } from '../../design';
import { readCharityLedgerTotals } from '../../services/fintech/CharityService';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { useTranslation } from '../../i18n';

const CHARITY_INK = '#0f172a';
const CHARITY_INK_MUTED = 'rgba(15, 23, 42, 0.72)';

/** Desktop Care Heart Fund — warm charity coral (not nightclub magenta/pink). */
const CARE_CORAL = '#FF6B6B';
const CARE_CHAMPAGNE_ROSE_BORDER = 'rgba(201, 169, 98, 0.42)';
const CARE_SOFT_CORAL_GLOW = 'rgba(255, 107, 107, 0.22)';

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export type CharityWidgetLayoutVariant = 'default' | 'impactSecondary' | 'desktopFashionCare';

type CharityWidgetProps = Readonly<{
  layoutVariant?: CharityWidgetLayoutVariant;
}>;

export function CharityWidget({ layoutVariant = 'default' }: CharityWidgetProps) {
  const { t } = useTranslation();
  const [totalUsd, setTotalUsd] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('$0');
  const [loading, setLoading] = useState(false);
  const animatedValue = useSharedValue(0);
  const heartPulse = useSharedValue(1);
  const lockRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  useAnimatedReaction(
    () => animatedValue.value,
    (value) => {
      runOnJS(setDisplayAmount)(formatUsd(value));
    }
  );

  useEffect(() => {
    if (layoutVariant !== 'desktopFashionCare') {
      cancelAnimation(heartPulse);
      heartPulse.value = 1;
      return;
    }
    heartPulse.value = withRepeat(
      withSequence(
        withTiming(1.034, { duration: 780, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 820, easing: Easing.in(Easing.cubic) }),
        withTiming(1.022, { duration: 700, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 800, easing: Easing.in(Easing.cubic) }),
        withTiming(1, { duration: 4200 })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(heartPulse);
      heartPulse.value = 1;
    };
  }, [layoutVariant, heartPulse]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartPulse.value }],
  }));

  const refresh = useCallback(async () => {
    const now = Date.now();
    if (lockRef.current || now - lastRefreshAtRef.current < 600) return;
    lockRef.current = true;
    lastRefreshAtRef.current = now;
    setLoading(true);
    try {
      const totals = await readCharityLedgerTotals();
      setTotalUsd(totals.totalUsd);
      animatedValue.value = withTiming(totals.totalUsd, { duration: 850 });
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  }, [animatedValue]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const fallbackText = useMemo(() => formatUsd(totalUsd), [totalUsd]);

  const impact = layoutVariant === 'impactSecondary';
  const desktopCare = layoutVariant === 'desktopFashionCare';
  const rose = vionaTokens.colors.impact.accent;

  if (desktopCare) {
    return (
      <LinearGradient
        colors={['rgba(42, 18, 24, 0.97)', 'rgba(14, 20, 34, 0.96)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wrapDesktopCareShell}
      >
        <View style={styles.wrapDesktopCareInner} className={applyWebStyles('kn-glass')}>
          <View style={styles.desktopCareRow}>
            <Animated.View style={[styles.desktopCareHeartRing, heartAnimatedStyle]}>
              <Ionicons name="heart" size={24} color={CARE_CORAL} />
            </Animated.View>
            <View style={styles.desktopCareMain}>
              <View style={styles.desktopCareTitleRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.desktopCareKicker}>{t('home.impact.kicker')}</Text>
                  <Text style={styles.desktopCareTitle}>{t('home.impact.title')}</Text>
                  <Text style={styles.desktopCareSub}>{t('home.impact.subtitle')}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.desktopCareRefresh, pressed && { opacity: 0.86 }]}
                  onPress={() => void refresh()}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.charityTitle')}
                >
                  <Ionicons name="refresh" size={16} color="rgba(218, 192, 148, 0.92)" />
                </Pressable>
              </View>
              <View style={styles.desktopCareAmountBlock}>
                {loading ? (
                  <ActivityIndicator color={CARE_CORAL} />
                ) : (
                  <>
                    <Animated.Text style={styles.desktopCareAmount}>{displayAmount || fallbackText}</Animated.Text>
                    <Text style={styles.desktopCareBody}>{t('home.charityBody')}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  const wrapStyle = impact ? styles.wrapImpact : styles.wrap;
  const heartWrapStyle = impact ? styles.heartWrapImpact : styles.heartWrap;
  const titleStyle = impact ? styles.titleImpact : styles.title;
  const refreshStyle = impact ? styles.refreshBtnImpact : styles.refreshBtn;
  const amountStyle = impact ? styles.amountImpact : styles.amount;
  const subStyle = impact ? styles.subtextImpact : styles.subtext;

  return (
    <View style={wrapStyle} className={applyWebStyles('kn-glass')}>
      <View style={styles.header}>
        <View style={heartWrapStyle}>
          <Ionicons name="heart" size={impact ? 16 : 18} color={rose} />
        </View>
        <View style={styles.titleCol}>
          {impact ? <Text style={styles.impactKicker}>{t('home.impact.kicker')}</Text> : null}
          <Text style={titleStyle}>{impact ? t('home.impact.title') : t('home.charityTitle')}</Text>
          {impact ? <Text style={styles.impactSub}>{t('home.impact.subtitle')}</Text> : null}
        </View>
        <Pressable style={({ pressed }) => [refreshStyle, pressed && { opacity: 0.86 }]} onPress={() => void refresh()}>
          <Ionicons name="refresh" size={14} color={rose} />
        </Pressable>
      </View>

      <View style={styles.amountWrap}>
        {loading ? (
          <ActivityIndicator color={rose} />
        ) : (
          <>
            <Animated.Text style={amountStyle}>{displayAmount || fallbackText}</Animated.Text>
            <Text style={subStyle}>{t('home.charityBody')}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapDesktopCareShell: {
    borderRadius: vionaTokens.radius.xl,
    borderWidth: 1,
    borderColor: CARE_CHAMPAGNE_ROSE_BORDER,
    overflow: 'hidden',
    shadowColor: CARE_CORAL,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 5,
  },
  wrapDesktopCareInner: {
    paddingVertical: vionaTokens.spacing[16],
    paddingHorizontal: vionaTokens.spacing[16],
    gap: vionaTokens.spacing[8],
  },
  desktopCareRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: vionaTokens.spacing[12],
  },
  desktopCareHeartRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CARE_CHAMPAGNE_ROSE_BORDER,
    backgroundColor: 'rgba(255, 107, 107, 0.07)',
    shadowColor: CARE_SOFT_CORAL_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 3,
  },
  desktopCareMain: {
    flex: 1,
    minWidth: 0,
    gap: vionaTokens.spacing[8],
  },
  desktopCareTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: vionaTokens.spacing[8],
  },
  desktopCareKicker: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(214, 196, 168, 0.82)',
    fontFamily: FontFamily.semibold,
  },
  desktopCareTitle: {
    color: vionaTokens.fashionTech.inkOnDark,
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    lineHeight: 22,
    textShadowColor: 'rgba(8, 4, 6, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  desktopCareSub: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(203, 213, 225, 0.8)',
    fontFamily: FontFamily.medium,
  },
  desktopCareRefresh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.32)',
    backgroundColor: 'rgba(12, 18, 28, 0.45)',
  },
  desktopCareAmountBlock: {
    gap: 6,
  },
  desktopCareAmount: {
    color: 'rgba(255, 214, 198, 0.96)',
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(18, 12, 14, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  desktopCareBody: {
    color: 'rgba(226, 232, 240, 0.85)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
  wrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.28)',
    backgroundColor: 'rgba(255,255,255,0.82)',
    padding: 14,
    gap: 8,
  },
  wrapImpact: {
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 124, 198, 0.34)',
    backgroundColor: 'rgba(28, 16, 24, 0.92)',
    padding: vionaTokens.spacing[12],
    gap: vionaTokens.spacing[8],
    ...vionaTokens.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  heartWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,113,133,0.15)',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 3,
  },
  heartWrapImpact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${vionaTokens.colors.impact.accent}18`,
  },
  impactKicker: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(244, 246, 250, 0.72)',
    fontFamily: FontFamily.semibold,
  },
  impactSub: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(244, 246, 250, 0.75)',
    fontFamily: FontFamily.medium,
  },
  title: {
    color: CHARITY_INK,
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
  },
  titleImpact: {
    color: vionaTokens.fashionTech.textPrimary,
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,113,133,0.14)',
  },
  refreshBtnImpact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 124, 198, 0.16)',
  },
  amountWrap: { gap: 8 },
  amount: {
    color: '#E11D48',
    fontSize: 34,
    fontFamily: FontFamily.extrabold,
  },
  amountImpact: {
    color: '#ff9fd2',
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
  },
  subtext: {
    color: CHARITY_INK_MUTED,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
  subtextImpact: {
    color: 'rgba(244, 246, 250, 0.82)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
});
