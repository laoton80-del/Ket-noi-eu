import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOYALTY_REWARDS_CATALOG } from '../../config/loyaltyRewardsCatalog';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import {
  awardPointsForTransaction,
  bootstrapLoyaltyProfile,
  redeemPointsForReward,
} from '../../services/loyalty/LoyaltyService';
import { VigTokenIcon } from '../../components/ui/VigTokenIcon';
import { useKngLoyaltyStore } from '../../state/kngLoyaltyStore';
import { vigTokensRemainingToNextTier, type VipTier } from '../../types/loyalty';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function tierLabelVi(tier: VipTier): string {
  if (tier === 'DIAMOND') return 'DIAMOND';
  if (tier === 'GOLD') return 'GOLD';
  if (tier === 'SILVER') return 'SILVER';
  return 'MEMBER';
}

function tierGradient(tier: VipTier): readonly [string, string] {
  if (tier === 'DIAMOND') return ['#010a10', '#00d4ff'];
  if (tier === 'GOLD') return ['#1f1406', '#d4a24c'];
  if (tier === 'SILVER') return ['#151a22', '#9aa7b8'];
  return ['#0f1828', '#3d78d4'];
}

function tierAccent(tier: VipTier): string {
  if (tier === 'DIAMOND') return '#7ffcff';
  if (tier === 'GOLD') return '#f2d18a';
  if (tier === 'SILVER') return '#e2e8f0';
  return '#b8d4f5';
}

export function LoyaltyRewardsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const userId = user?.phone?.trim() ?? '';

  const snap = useKngLoyaltyStore((s) => (userId.length > 0 ? s.byUser[userId] : undefined));

  useEffect(() => {
    void (async () => {
      if (!userId) return;
      await bootstrapLoyaltyProfile(userId);
    })();
  }, [userId]);

  const summary = useMemo(() => {
    if (!userId) {
      return { vigTokens: 0, tier: 'MEMBER' as const, toNext: null as number | null, lifetimeVigTokens: 0 };
    }
    const tier = snap?.tier ?? 'MEMBER';
    const lifetimeVigTokens = snap?.lifetimeVigTokensEarned ?? 0;
    const vigTokens = snap?.vigTokenBalance ?? 0;
    return {
      vigTokens,
      tier,
      lifetimeVigTokens,
      toNext: snap ? vigTokensRemainingToNextTier(lifetimeVigTokens, tier) : null,
    };
  }, [userId, snap]);

  const cardGradient = useMemo(() => tierGradient(summary.tier), [summary.tier]);
  const accent = useMemo(() => tierAccent(summary.tier), [summary.tier]);
  const toNextLine =
    summary.toNext === null
      ? 'Bạn đã ở cấp tối đa — cảm ơn bạn đã đồng hành cùng ViGlobal!'
      : `Còn ${summary.toNext} VIG Token để lên hạng tiếp theo.`;

  const onRedeem = useCallback(
    (rewardId: string) => {
      if (!userId) {
      Alert.alert('ViGlobal Rewards', 'Đăng nhập để đổi quà.');
        return;
      }
      const res = redeemPointsForReward(userId, rewardId);
      if (!res.ok) {
        Alert.alert('ViGlobal Rewards', res.message);
        return;
      }
      Alert.alert('Đổi quà thành công', `${res.perkLabel} đã được mở khóa (demo). Số dư: ${res.remainingVigTokens} VIG Token.`);
    },
    [userId]
  );

  const simulateSpend = useCallback(() => {
    if (!userId) return;
    const r = awardPointsForTransaction(userId, 18.5);
    const tierUp = r.newTier !== r.previousTier;
    Alert.alert(
      'Đã tích điểm (demo)',
      `+${r.vigTokensAdded} VIG Token từ 18,5 EUR chi tiêu mock.${tierUp ? ` Chúc mừng lên hạng ${tierLabelVi(r.newTier)}!` : ''}`
    );
  }, [userId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={theme.hybrid.panelCoolText} />
        </Pressable>
        <Text style={styles.topTitle}>VIG Token · Đổi quà</Text>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card3dWrap}>
          <LinearGradient colors={[...cardGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGrad} />
          <View style={[styles.cardGlass, { borderColor: accent }]} className={applyWebStyles('kn-glass')}>
            <View style={styles.cardChipRow}>
              <View style={[styles.chip, { borderColor: accent }]}>
                <Text style={[styles.chipText, { color: accent }]}>VIG TOKEN</Text>
              </View>
              <VigTokenIcon size={24} />
            </View>
            <Text style={[styles.tierHuge, { color: '#FAFAFA' }]}>{tierLabelVi(summary.tier)}</Text>
            <Text style={styles.pointsLine}>
              <Text style={[styles.pointsVal, { color: accent }]}>{summary.vigTokens}</Text>
              <Text style={styles.pointsSuffix}> VIG Token</Text>
            </Text>
            <Text style={styles.nextTier}>{toNextLine}</Text>
            <Text style={styles.ruleHint}>1 EUR chi tiêu hợp lệ = 10 VIG Token (chính sách — nối hóa đơn sau).</Text>
            {__DEV__ ? (
              <Pressable onPress={simulateSpend} style={styles.devSim}>
                <Text style={styles.devSimText}>+ Demo 18,5 EUR chi tiêu</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Đổi Quà Tặng</Text>
        <Text style={styles.sectionSub}>Đổi VIG Token lấy quà ngay — giữ chân bạn trong hệ sinh thái ViGlobal.</Text>

        {LOYALTY_REWARDS_CATALOG.map((r) => (
          <View key={r.id} style={styles.rewardCard} className={applyWebStyles('kn-glass')}>
            <View style={styles.rewardTop}>
              <View style={styles.rewardIcon}>
                <Ionicons name="gift" size={22} color={theme.hybrid.signalStrong} />
              </View>
              <View style={styles.rewardBody}>
                <Text style={styles.rewardTitle}>{r.titleVi}</Text>
                <Text style={styles.rewardSub}>{r.subtitleVi}</Text>
              </View>
            </View>
            <View style={styles.rewardFooter}>
              <View style={styles.costPill}>
                <VigTokenIcon size={16} />
                <Text style={styles.costPillText}>{r.vigTokenCost} VIG Token</Text>
              </View>
              <Pressable
                onPress={() => onRedeem(r.id)}
                style={({ pressed }) => [styles.redeemBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.redeemBtnText}>Đổi ngay</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.hybrid.panelCool,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.hybrid.panelCoolBorder,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 44 },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
  },
  scroll: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  card3dWrap: {
    marginBottom: theme.spacing.xl,
    borderRadius: 22,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 14,
  },
  cardGrad: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  cardGlass: {
    borderRadius: 22,
    padding: theme.spacing.lg,
    borderWidth: 2,
    backgroundColor: 'rgba(10, 18, 32, 0.42)',
  },
  cardChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  chipText: {
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: FontFamily.extrabold,
  },
  tierHuge: {
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 2,
    marginBottom: 6,
  },
  pointsLine: {
    marginBottom: 10,
  },
  pointsVal: {
    fontSize: 36,
    fontFamily: FontFamily.extrabold,
  },
  pointsSuffix: {
    fontSize: 18,
    color: 'rgba(250,250,250,0.85)',
    fontFamily: FontFamily.semibold,
  },
  nextTier: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(250,250,250,0.82)',
    fontFamily: FontFamily.medium,
    marginBottom: 8,
  },
  ruleHint: {
    fontSize: 12,
    color: 'rgba(250,250,250,0.65)',
    fontFamily: FontFamily.regular,
  },
  devSim: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  devSimText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: FontFamily.semibold,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 14,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.lg,
  },
  rewardCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: '#FFFFFF',
  },
  rewardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.hybrid.signalMutedBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBody: {
    flex: 1,
    minWidth: 0,
  },
  rewardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
    marginBottom: 6,
  },
  rewardSub: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(197, 160, 89, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.35)',
  },
  costPillText: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: '#5c451f',
  },
  redeemBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.hybrid.signalStrong,
  },
  redeemBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.onSignal,
  },
});
