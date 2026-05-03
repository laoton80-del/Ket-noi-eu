import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING_AUTHORITY } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DESKTOP_BREAKPOINT = 768;
const WHEEL_SIZE = 248;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const WHEEL_RADIUS = 92;

const WHEEL_PRIZES = ['50 Xu', 'Voucher Nails -10%', '100 Xu', 'Chúc bạn may mắn', 'VIP 1 Ngày'] as const;

type StreakDayDef = {
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  line1: string;
  line2: string;
};

function buildStreakDays(bonusUnit: number): StreakDayDef[] {
  const days: StreakDayDef[] = [];
  for (let d = 1; d <= 7; d += 1) {
    if (d === 7) {
      days.push({
        day: 7,
        line1: 'Ngày 7',
        line2: 'QUÀ KHỦNG',
      });
    } else {
      const credits = d * bonusUnit;
      days.push({
        day: d as 1 | 2 | 3 | 4 | 5 | 6,
        line1: `Ngày ${d}`,
        line2: `+${credits} Xu`,
      });
    }
  }
  return days;
}

function wheelLabelOffset(index: number, total: number): { left: number; top: number } {
  const slice = 360 / total;
  const deg = -90 + slice * index + slice / 2;
  const rad = (deg * Math.PI) / 180;
  const left = WHEEL_CENTER + WHEEL_RADIUS * Math.cos(rad) - 44;
  const top = WHEEL_CENTER + WHEEL_RADIUS * Math.sin(rad) - 14;
  return { left, top };
}

export function DailyRewardScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isDesktop = width > DESKTOP_BREAKPOINT;
  const isDesktopWeb = Platform.OS === 'web' && isDesktop;

  const bonusUnit = PRICING_AUTHORITY.b2cCredits.dailyCheckInBonus;
  const streakDays = useMemo(() => buildStreakDays(bonusUnit), [bonusUnit]);
  const [spinning, setSpinning] = useState(false);

  const onCheckIn = () => {
    Alert.alert(
      'Điểm danh',
      `Bạn nhận +${bonusUnit} Xu (neo PRICING_AUTHORITY.b2cCredits.dailyCheckInBonus). Chuỗi streak sẽ đồng bộ server khi gamification bật production.`,
      [{ text: 'Tuyệt' }]
    );
  };

  const onSpin = () => {
    if (spinning) return;
    setSpinning(true);
    const pick = WHEEL_PRIZES[Math.floor(Math.random() * WHEEL_PRIZES.length)];
    setTimeout(() => {
      setSpinning(false);
      Alert.alert('Vòng quay', `Kết quả: ${pick}\n\n(Miễn phí mỗi ngày — demo client.)`, [{ text: 'OK' }]);
    }, 600);
  };

  return (
    <View
      style={[styles.shell, { backgroundColor: theme.colors.backgroundDeep }]}
      className={applyWebStyles('kn-glass kn-neon-b2b')}
    >
      <SafeAreaView
        style={[styles.safe, Platform.OS === 'web' && styles.safeWeb, isDesktopWeb && styles.safeDesktop]}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.screenTitle}>Daily Rewards</Text>
          <View style={styles.backSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>Vòng Lặp Gây Nghiện</Text>
          <Text style={styles.subline}>Casino Gold & Phoenix Dark — DAU tối đa hóa.</Text>

          <View className={applyWebStyles('kn-neon-sos')} style={styles.urgencyWrap}>
            <Text style={styles.urgencyText}>
              Mở App mỗi ngày - Nhận quà liền tay. Đừng để đứt quãng chuỗi điểm danh của bạn!
            </Text>
          </View>

          <View style={[styles.section, isDesktop && styles.sectionDesktop]} className={applyWebStyles('kn-glass')}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={22} color={theme.colors.primaryBright} />
              <Text style={styles.sectionTitle}>Điểm Danh Nhận Xu</Text>
            </View>
            <Text style={styles.sectionHint}>Neo: {bonusUnit} Xu × ngày (PRICING_AUTHORITY.b2cCredits.dailyCheckInBonus)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.streakRow}>
              {streakDays.map((d) => (
                <View key={d.day} style={styles.streakCell}>
                  <Text style={styles.streakLine1}>{d.line1}</Text>
                  <Text style={styles.streakLine2}>{d.line2}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              onPress={onCheckIn}
              style={({ pressed }) => [styles.checkInBtn, pressed && { opacity: 0.92 }]}
              className={applyWebStyles('kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel="Điểm danh ngay"
            >
              <Ionicons name="finger-print" size={26} color={theme.hybrid.onSignal} />
              <Text style={styles.checkInBtnText}>ĐIỂM DANH NGAY</Text>
            </Pressable>
          </View>

          <View style={[styles.section, styles.wheelSection, isDesktop && styles.sectionDesktop]} className={applyWebStyles('kn-glass')}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sync-circle" size={24} color={theme.colors.primaryBright} />
              <Text style={styles.sectionTitle}>Vòng Quay May Mắn (Gacha)</Text>
            </View>

            <View style={styles.wheelOuter} className={applyWebStyles('kn-neon-b2b')}>
              <LinearGradient
                colors={['#1a0f05', '#2d1f0a', '#0A1628']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.wheelDisc}
              >
                {WHEEL_PRIZES.map((label, index) => {
                  const pos = wheelLabelOffset(index, WHEEL_PRIZES.length);
                  return (
                    <View key={label} style={[styles.wheelLabel, { left: pos.left, top: pos.top }]}>
                      <Text style={styles.wheelLabelText} numberOfLines={2}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.wheelHub}>
                  <Ionicons name="gift" size={32} color={theme.colors.SignatureGold} />
                  <Text style={styles.wheelHubText}>KNG</Text>
                </View>
              </LinearGradient>
            </View>

            <Pressable
              onPress={onSpin}
              style={({ pressed }) => [styles.spinBtn, pressed && { opacity: 0.9 }, spinning && { opacity: 0.6 }]}
              disabled={spinning}
              className={applyWebStyles('kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel="Quay ngay miễn phí mỗi ngày"
            >
              <Ionicons name="shuffle" size={22} color={theme.hybrid.onSignal} />
              <Text style={styles.spinBtnText}>QUAY NGAY (Miễn phí mỗi ngày)</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  safe: { flex: 1, backgroundColor: theme.colors.backgroundDeep },
  safeWeb: { backgroundColor: 'transparent' },
  safeDesktop: { alignSelf: 'stretch' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 40 },
  screenTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl * 2,
  },
  scrollDesktop: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  headline: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subline: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  urgencyWrap: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(229, 115, 115, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.45)',
  },
  urgencyText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.bold,
    color: theme.colors.RouteError,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surfaceElevated,
    gap: theme.spacing.md,
  },
  sectionDesktop: {
    alignSelf: 'stretch',
  },
  wheelSection: {
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.tertiary,
  },
  streakRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  streakCell: {
    minWidth: 88,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    alignItems: 'center',
  },
  streakLine1: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.tertiary,
    marginBottom: 4,
  },
  streakLine2: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    textAlign: 'center',
  },
  checkInBtn: {
    marginTop: theme.spacing.sm,
    minHeight: 58,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.hybrid.signalStrong,
    borderWidth: 2,
    borderColor: theme.colors.primaryBright,
  },
  checkInBtnText: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.onSignal,
    letterSpacing: 0.6,
  },
  wheelOuter: {
    padding: theme.spacing.sm,
    borderRadius: WHEEL_SIZE / 2 + 10,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
  },
  wheelDisc: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.SignatureGold,
  },
  wheelLabel: {
    position: 'absolute',
    width: 88,
  },
  wheelLabelText: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
    textAlign: 'center',
  },
  wheelHub: {
    position: 'absolute',
    left: WHEEL_CENTER - 40,
    top: WHEEL_CENTER - 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.DeepInkNavy,
    borderWidth: 2,
    borderColor: theme.colors.SignatureGold,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  wheelHubText: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  spinBtn: {
    marginTop: theme.spacing.lg,
    minHeight: 52,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.hybrid.signalStrong,
    borderWidth: 1,
    borderColor: theme.colors.primaryBright,
  },
  spinBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.onSignal,
    textAlign: 'center',
    flexShrink: 1,
  },
});
