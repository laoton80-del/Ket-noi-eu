import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { vionaTokens } from '../../design';
import { readCharityLedgerTotals } from '../../services/fintech/CharityService';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { useTranslation } from '../../i18n';

const CHARITY_INK = '#0f172a';
const CHARITY_INK_MUTED = 'rgba(15, 23, 42, 0.72)';

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export type CharityWidgetLayoutVariant = 'default' | 'impactSecondary';

type CharityWidgetProps = Readonly<{
  layoutVariant?: CharityWidgetLayoutVariant;
}>;

export function CharityWidget({ layoutVariant = 'default' }: CharityWidgetProps) {
  const { t } = useTranslation();
  const [totalUsd, setTotalUsd] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('$0');
  const [loading, setLoading] = useState(false);
  const animatedValue = useSharedValue(0);
  const lockRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  useAnimatedReaction(
    () => animatedValue.value,
    (value) => {
      runOnJS(setDisplayAmount)(formatUsd(value));
    }
  );

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
  const rose = vionaTokens.colors.impact.accent;
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
    borderColor: `${vionaTokens.colors.impact.accent}38`,
    backgroundColor: 'rgba(255, 246, 250, 0.92)',
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
    color: vionaTokens.colors.muted,
    fontFamily: FontFamily.semibold,
  },
  impactSub: {
    fontSize: 11,
    lineHeight: 15,
    color: vionaTokens.colors.muted,
    fontFamily: FontFamily.medium,
  },
  title: {
    color: CHARITY_INK,
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
  },
  titleImpact: {
    color: vionaTokens.colors.ink,
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
    backgroundColor: `${vionaTokens.colors.impact.accent}14`,
  },
  amountWrap: { gap: 8 },
  amount: {
    color: '#E11D48',
    fontSize: 34,
    fontFamily: FontFamily.extrabold,
  },
  amountImpact: {
    color: vionaTokens.colors.impact.accent,
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
    color: vionaTokens.colors.softInk,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
});
