import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { readCharityLedgerTotals } from '../../services/fintech/CharityService';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { useTranslation } from '../../i18n';

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CharityWidget() {
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

  return (
    <View style={styles.wrap} className={applyWebStyles('kn-glass')}>
      <View style={styles.header}>
        <View style={styles.heartWrap}>
          <Ionicons name="heart" size={18} color="#F43F5E" />
        </View>
        <Text style={styles.title}>{t('home.charityTitle')}</Text>
        <Pressable style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.86 }]} onPress={() => void refresh()}>
          <Ionicons name="refresh" size={14} color="#E11D48" />
        </Pressable>
      </View>

      <View style={styles.amountWrap}>
        {loading ? (
          <ActivityIndicator color="#E11D48" />
        ) : (
          <>
            <Animated.Text style={styles.amount}>{displayAmount || fallbackText}</Animated.Text>
            <Text style={styles.subtext}>
              Mỗi giao dịch của bạn đang góp phần mang bữa ăn và lớp học đến cho trẻ em nghèo Việt Nam.
            </Text>
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
    borderColor: 'rgba(244, 63, 94, 0.24)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  title: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
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
  amountWrap: { gap: 8 },
  amount: {
    color: '#E11D48',
    fontSize: 34,
    fontFamily: FontFamily.extrabold,
  },
  subtext: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
});
