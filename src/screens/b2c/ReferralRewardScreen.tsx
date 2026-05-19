import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING_AUTHORITY } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const REFERRAL_CODE = 'VIONA-VIP-888';
const FRIENDS_JOINED = 12;
const PASSIVE_CREDITS_EARNED = 600;
const SHARE_URL = 'https://ketnoiglobal.com';

export function ReferralRewardScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width > 768;
  const [copyDone, setCopyDone] = useState(false);

  const onCopyCode = async () => {
    await Clipboard.setStringAsync(REFERRAL_CODE);
    setCopyDone(true);
    Alert.alert('Mã giới thiệu', 'Đã sao chép!');
  };

  const onShareReferral = async () => {
    const message = `Khám phá siêu ứng dụng VIONA! Nhập mã [${REFERRAL_CODE}] để nhận ngay ${PRICING_AUTHORITY.b2cCredits.referralBonus} Xu gọi AI Leona miễn phí! Tải app tại: ${SHARE_URL}`;
    await Share.share({ message, url: SHARE_URL, title: 'VIONA - Referral' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: '100%', maxWidth: isLargeScreen ? '100%' : 600, alignSelf: 'center', flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}>
              <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
            </Pressable>
            <Text style={styles.screenTitle}>Referral & Rewards</Text>
            <View style={styles.backSpacer} />
          </View>

          <View style={styles.heroCard} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <Text style={styles.heroKicker}>B2C Viral Loop Engine</Text>
            <Text style={styles.heroTitle}>Mời bạn bè - Nhân thu nhập thụ động</Text>
            <Text style={styles.heroSub}>Mỗi lượt tham gia hợp lệ giúp bạn nhận thưởng ngay vào ví Xu.</Text>

            <View style={styles.codePanel}>
              <Text style={styles.codeLabel}>Mã giới thiệu của bạn</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeValue}>{REFERRAL_CODE}</Text>
                <Pressable onPress={() => void onCopyCode()} style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.82 }]}>
                  <Ionicons name={copyDone ? 'checkmark' : 'copy-outline'} size={14} color={theme.hybrid.onSignal} />
                  <Text style={styles.copyBtnText}>{copyDone ? 'Đã sao chép!' : 'Sao chép'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => void onShareReferral()}
              style={({ pressed }) => [styles.inviteCta, pressed && { opacity: 0.88 }]}
              className={applyWebStyles('kn-neon-b2b')}
            >
              <Ionicons name="sparkles" size={20} color={theme.hybrid.onSignal} />
              <Text style={styles.inviteCtaText}>
                MỜI BẠN BÈ - NHẬN {PRICING_AUTHORITY.b2cCredits.referralBonus} XU
              </Text>
            </Pressable>
          </View>

          <View style={styles.ledgerCard} className={applyWebStyles('kn-glass')}>
            <Text style={styles.ledgerTitle}>Ví Thưởng Thu Nhập Thụ Động</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Bạn bè đã tham gia</Text>
                <Text style={styles.statValue}>{FRIENDS_JOINED}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Tổng thưởng tích lũy</Text>
                <Text style={styles.statValue}>{PASSIVE_CREDITS_EARNED} Xu</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('CashOut')}
            style={({ pressed }) => [styles.cashOutNav, pressed && { opacity: 0.9 }]}
            className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
            accessibilityRole="button"
            accessibilityLabel="Commission payout preview — not withdrawable cash"
          >
            <Ionicons name="cash-outline" size={22} color={theme.colors.primaryBright} />
            <View style={styles.cashOutNavTextCol}>
              <Text style={styles.cashOutNavTitle}>Xem trước quyết toán thưởng</Text>
              <Text style={styles.cashOutNavSub}>Bản xem trước — không phải tiền mặt · chưa chuyển khoản thật</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.colors.primaryBright} />
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
  },
  backSpacer: { width: 40 },
  screenTitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  heroCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  heroKicker: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...theme.typeScale.h1,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
  },
  heroSub: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  codePanel: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.executive.panelMuted,
    padding: theme.spacing.md,
    gap: 6,
  },
  codeLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  codeValue: {
    fontSize: 28,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  copyBtn: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.hybrid.signalStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  copyBtnText: {
    ...theme.typeScale.caption,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
  },
  inviteCta: {
    marginTop: theme.spacing.md,
    minHeight: 54,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: theme.hybrid.signal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  inviteCtaText: {
    ...theme.typeScale.body,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.extrabold,
  },
  ledgerCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  ledgerTitle: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statBox: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.hybrid.panelCool,
    padding: theme.spacing.md,
    gap: 6,
  },
  statLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  statValue: {
    ...theme.typeScale.h1,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
  },
  cashOutNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
  },
  cashOutNavTextCol: {
    flex: 1,
    gap: 4,
  },
  cashOutNavTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  cashOutNavSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
});
