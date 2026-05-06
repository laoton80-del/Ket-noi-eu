import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import { voiceReceptionistService } from '../../services/ai/VoiceReceptionistService';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { resolveCurrencyForRegion } from '../../config/globalLocalization';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MerchantRoute = RouteProp<RootStackParamList, 'MerchantDetail'>;

function industryLabel(kindOrIndustry: string | undefined): string {
  if (!kindOrIndustry) return 'Dịch vụ địa phương';
  if (kindOrIndustry === 'HOSPITALITY') return 'Lưu trú & Homestay';
  if (kindOrIndustry === 'nails') return 'Nail & làm đẹp';
  if (kindOrIndustry === 'pho') return 'Ẩm thực (F&B)';
  if (kindOrIndustry === 'service') return 'Dịch vụ chuyên môn';
  if (kindOrIndustry === 'Restaurant') return 'Nhà hàng & ẩm thực';
  return kindOrIndustry;
}

export function MerchantDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<MerchantRoute>();
  const { user } = useAuth();
  const { merchantId, merchantName, industry } = route.params;
  const [calling, setCalling] = useState(false);

  const industryDisplay = useMemo(() => industryLabel(industry), [industry]);

  const onPressAiReceptionist = useCallback(async () => {
    if (calling) return;
    setCalling(true);
    try {
      const b2cId = user?.phone?.trim().length ? user.phone : 'b2c-guest';
      const init = await voiceReceptionistService.initiateCall(b2cId, merchantId);
      if (!init.ok) {
        Alert.alert('Lễ tân AI', init.message);
        return;
      }
      const demoTranscript =
        'Cho mình đặt lịch làm nail chiều mai qua điện thoại, xin giữ slot lịch sự ạ.';
      const pipeline = await voiceReceptionistService.simulateFunctionCallingPipeline({
        merchantId,
        merchantIndustry: industryDisplay,
        transcript: demoTranscript,
        customerName: user?.name?.trim().length ? user.name : 'Khách Voice AI',
      });
      const toolSummary =
        pipeline.tools.length === 0
          ? 'Không kích hoạt tool (mock — intent chưa đủ hoặc không khớp).'
          : pipeline.tools
              .map((t) => {
                if (t.ok && t.tool === 'executeBooking') return `executeBooking → ${t.bookingId}`;
                if (t.ok && t.tool === 'executeWholesaleOrder') {
                  const cur = resolveCurrencyForRegion(user?.country);
                  const gmv = formatCurrency(t.orderValueMajorUsd, cur);
                  const comm = formatCurrency(t.commissionMajorUsd, cur);
                  return `executeWholesaleOrder → ${t.orderId} (GMV ${gmv}, hoa hồng ${comm})`;
                }
                return `${t.tool}: ${t.error}`;
              })
              .join('\n');
      Alert.alert(
        'Lễ tân AI (mock)',
        `Phiên: ${init.sessionId}\n` +
          `Gói merchant: ${init.merchantPackage} — còn ${init.remainingIncludedMinutes}/${init.includedVoiceMinutesMonthly} phút.\n` +
          `Phí vượt (merchant): ${formatCurrency(init.overageMajorPerMinute, resolveCurrencyForRegion(user?.country))}/phút.\n\n` +
          `Prompt (rút gọn): ${pipeline.systemPrompt.slice(0, 140)}…\n\n` +
          `Ngôn ngữ (mock LID): ${pipeline.detectedLanguage}\n` +
          `Intent: ${pipeline.intent.intent} (${Math.round(pipeline.intent.confidence * 100)}%)\n\n` +
          `Function calling:\n${toolSummary}`
      );
    } finally {
      setCalling(false);
    }
  }, [calling, industryDisplay, merchantId, user?.name, user?.phone]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Cửa hàng
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={styles.merchantName}>{merchantName}</Text>
        <Text style={styles.merchantMeta}>Mã đối tác: {merchantId}</Text>
        <Text style={styles.merchantIndustry}>{industryDisplay}</Text>

        <Text style={styles.callSubtitle}>
          Nói chuyện trực tiếp để đặt lịch/mua hàng 24/7
        </Text>

        <Pressable
          onPress={() =>
            navigation.navigate('MerchantStorefront', {
              merchantId,
              merchantName,
              merchantCountryCode: user?.country ?? 'US',
            })
          }
          style={({ pressed }) => [styles.storefrontBtn, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass')}
          accessibilityRole="button"
          accessibilityLabel="Mở trang đặt lịch storefront"
        >
          <Ionicons name="storefront-outline" size={18} color={theme.hybrid.signalStrong} />
          <Text style={styles.storefrontBtnText}>Mở Storefront đặt lịch (Smart Trio)</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
        </Pressable>

        <Pressable
          onPress={() => void onPressAiReceptionist()}
          disabled={calling}
          style={({ pressed }) => [
            styles.aiCallBtn,
            pressed && !calling && { opacity: 0.92 },
            calling && { opacity: 0.72 },
          ]}
          className={applyWebStyles('kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Gọi lễ tân AI miễn phí"
        >
          {calling ? (
            <ActivityIndicator color="#0B1628" />
          ) : (
            <>
              <Ionicons name="call" size={28} color="#0B1628" />
              <Text style={styles.aiCallBtnText}>📞 GỌI LỄ TÂN AI (Miễn phí)</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.billingHint}>
          Cuộc gọi VoIP do AI trả lời theo thời gian thực; chi phí phút thoại tính vào đối tác B2B theo gói — bạn không
          mất Xu cho tính năng này.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const GOLD = '#C5A059';
const GOLD_DEEP = '#8A6A1A';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 8,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  topSpacer: {
    width: 40,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  merchantName: {
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  merchantMeta: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  merchantIndustry: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.signalStrong,
  },
  callSubtitle: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  aiCallBtn: {
    marginTop: 20,
    minHeight: 72,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    backgroundColor: GOLD,
    borderWidth: 2,
    borderColor: GOLD_DEEP,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 22,
    elevation: 14,
  },
  aiCallBtnText: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: '#0B1628',
    letterSpacing: 0.3,
  },
  storefrontBtn: {
    marginTop: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storefrontBtnText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  billingHint: {
    marginTop: 18,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    textAlign: 'center',
  },
});

