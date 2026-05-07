import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import { DiasporaRestrictionModal } from '../../components/modals/DiasporaRestrictionModal';
import {
  B2BDomesticVietnamPhoneNotAllowedError,
  registerMerchant,
} from '../../services/AuthService';
import {
  assertMerchantSurfacesAllowedByGps,
  MerchantSurfacesBlockedInVietnamGpsError,
} from '../../services/context/diasporaMerchantGate';
import { trackGrowthEvent } from '../../services/growth/tracker';
import { b2cTheme } from '../../theme/appModeThemes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type PartnerVertical = 'air_tickets' | 'shipping' | 'law' | 'accounting' | 'other';

const B2C = {
  background: b2cTheme.colors.background,
  card: b2cTheme.colors.card,
  text: b2cTheme.colors.text,
  border: b2cTheme.colors.border,
  primary: b2cTheme.colors.primary,
  onPrimary: '#FFFFFF',
  textMuted: 'rgba(11, 22, 40, 0.58)',
  gold: '#C5A059',
  goldSoft: 'rgba(197, 160, 89, 0.18)',
} as const;

const VERTICAL_OPTIONS: { id: PartnerVertical; label: string }[] = [
  { id: 'air_tickets', label: 'Vé máy bay' },
  { id: 'shipping', label: 'Gửi hàng' },
  { id: 'law', label: 'Luật pháp' },
  { id: 'accounting', label: 'Kế toán' },
  { id: 'other', label: 'Khác' },
];

const VALUE_PROPS: { title: string; body: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    title: 'Tăng trưởng Doanh thu',
    body: 'Tiếp cận luồng khách hàng khổng lồ có nhu cầu thực tế.',
    icon: 'trending-up',
  },
  {
    title: 'Chi phí bằng 0',
    body: 'Chỉ chia sẻ doanh thu (Revenue Share) khi giao dịch thành công.',
    icon: 'cash-outline',
  },
  {
    title: 'Chứng nhận Uy tín',
    body: 'Được cấp tick xanh chuyên gia và ưu tiên hiển thị trên AI tìm kiếm.',
    icon: 'shield-checkmark',
  },
];

const SUCCESS_COPY = 'Đội ngũ VIONA sẽ liên hệ với bạn trong 24h!';

export function PartnerOnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const isThreeCol = width >= 1024;

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [vertical, setVertical] = useState<PartnerVertical | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [diasporaRestrictionOpen, setDiasporaRestrictionOpen] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const verticalLabel = vertical ? VERTICAL_OPTIONS.find((o) => o.id === vertical)?.label ?? 'Chọn lĩnh vực' : 'Chọn lĩnh vực';

  const showSuccess = useCallback(() => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(SUCCESS_COPY, ToastAndroid.LONG);
    } else {
      setSuccessVisible(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setSuccessVisible(false), 4000);
    }
  }, []);

  const onSubmit = useCallback(async () => {
    const name = businessName.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (name.length < 2) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên doanh nghiệp hoặc chuyên gia.');
      return;
    }
    if (!vertical) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn lĩnh vực.');
      return;
    }
    if (phoneDigits.length < 8) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại liên hệ hợp lệ.');
      return;
    }
    try {
      registerMerchant(phone);
      await assertMerchantSurfacesAllowedByGps();
    } catch (e) {
      if (e instanceof MerchantSurfacesBlockedInVietnamGpsError) {
        Alert.alert('VIONA', e.message);
        return;
      }
      if (e instanceof B2BDomesticVietnamPhoneNotAllowedError) {
        setDiasporaRestrictionOpen(true);
        return;
      }
      throw e;
    }
    setSubmitting(true);
    try {
      await trackGrowthEvent('partner_lead_submitted', {
        meta: {
          businessName: name,
          vertical,
          phoneDigits,
        },
      });
      showSuccess();
      setBusinessName('');
      setPhone('');
      setVertical(null);
    } finally {
      setSubmitting(false);
    }
  }, [businessName, phone, vertical, showSuccess]);

  return (
    <View style={[styles.shell, { backgroundColor: B2C.background }]} className={applyWebStyles('kn-glass kn-neon-b2b')}>
      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && styles.safeWeb]} edges={['top', 'left', 'right']}>
        {successVisible ? (
          <View style={styles.successToast} accessibilityLiveRegion="polite">
            <Ionicons name="checkmark-circle" size={20} color={B2C.onPrimary} />
            <Text style={styles.successToastText}>{SUCCESS_COPY}</Text>
          </View>
        ) : null}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={[styles.topBar, { borderBottomColor: B2C.border }]}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}>
              <Ionicons name="chevron-back" size={22} color={B2C.text} />
            </Pressable>
            <View style={styles.topBarTitleWrap}>
              <View style={styles.trustSeal}>
                <Ionicons name="shield-checkmark" size={16} color={B2C.gold} />
              </View>
              <Text style={[styles.topBarTitle, { color: B2C.textMuted }]}>Partner Portal</Text>
            </View>
            <View style={styles.backSpacer} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.heroTrust}>
              <Ionicons name="ribbon-outline" size={24} color={B2C.primary} />
              <Text style={[styles.heroKicker, { color: B2C.primary }]}>Đối tác chứng nhận</Text>
            </View>
            <Text style={[styles.headline, { color: B2C.text }]}>
              Trở thành Đối Tác Toàn Cầu - Tiếp cận 100.000+ Kiều bào
            </Text>
            <Text style={[styles.lead, { color: B2C.textMuted }]}>
              Luật sư, hãng bay, logistics và dịch vụ chuyên nghiệp — đăng ký để trở thành Đối tác được chứng nhận, chia sẻ
              doanh thu minh bạch trên nền tảng VIONA.
            </Text>

            <View style={[styles.valueGrid, isWide && styles.valueGridWide, isThreeCol && styles.valueGridThree]}>
              {VALUE_PROPS.map((item) => (
                <View
                  key={item.title}
                  style={[
                    styles.valueCard,
                    { backgroundColor: B2C.card, borderColor: B2C.gold },
                  ]}
                  className={applyWebStyles('kn-glass')}
                >
                  <View style={[styles.valueIconRing, { borderColor: B2C.gold, backgroundColor: B2C.goldSoft }]}>
                    <Ionicons name={item.icon} size={22} color={B2C.primary} />
                  </View>
                  <Text style={[styles.valueTitle, { color: B2C.text }]}>{item.title}</Text>
                  <Text style={[styles.valueBody, { color: B2C.textMuted }]}>{item.body}</Text>
                </View>
              ))}
            </View>

            <View
              style={[styles.formCard, { backgroundColor: B2C.card, borderColor: B2C.gold }]}
              className={applyWebStyles('kn-glass')}
            >
              <View style={styles.formTitleRow}>
                <Ionicons name="document-text-outline" size={22} color={B2C.primary} />
                <Text style={[styles.formTitle, { color: B2C.text }]}>Đăng ký hợp tác</Text>
              </View>
              <Text style={[styles.label, { color: B2C.text }]}>Tên Doanh nghiệp / Chuyên gia</Text>
              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Ví dụ: Công ty Luật Minh Anh EU"
                placeholderTextColor={B2C.textMuted}
                style={[styles.input, { borderColor: B2C.border, color: B2C.text, backgroundColor: B2C.background }]}
              />

              <Text style={[styles.label, { color: B2C.text }]}>Lĩnh vực</Text>
              <Pressable onPress={() => setPickerOpen(true)} style={({ pressed }) => [styles.select, { borderColor: B2C.border, backgroundColor: B2C.background }, pressed && { opacity: 0.88 }]}>
                <Text style={[styles.selectText, { color: vertical ? B2C.text : B2C.textMuted }]}>{verticalLabel}</Text>
                <Ionicons name="chevron-down" size={18} color={B2C.textMuted} />
              </Pressable>

              <Text style={[styles.label, { color: B2C.text }]}>Số điện thoại liên hệ</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+420… hoặc số trong nước"
                keyboardType="phone-pad"
                placeholderTextColor={B2C.textMuted}
                style={[styles.input, { borderColor: B2C.border, color: B2C.text, backgroundColor: B2C.background }]}
              />

              <Pressable
                onPress={() => void onSubmit()}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Gửi yêu cầu hợp tác đối tác"
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: B2C.primary },
                  (pressed || submitting) && { opacity: 0.88 },
                ]}
              >
                <Ionicons name="paper-plane" size={18} color={B2C.onPrimary} />
                <Text style={[styles.ctaText, { color: B2C.onPrimary }]}>{submitting ? 'Đang gửi…' : 'Gửi Yêu Cầu Hợp Tác'}</Text>
              </Pressable>
            </View>
          </ScrollView>

          <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
              <Pressable style={[styles.modalCard, { backgroundColor: B2C.card, borderColor: B2C.border }]} onPress={() => undefined}>
                <Text style={[styles.modalTitle, { color: B2C.text, borderBottomColor: B2C.border }]}>Chọn lĩnh vực</Text>
                {VERTICAL_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      setVertical(opt.id);
                      setPickerOpen(false);
                    }}
                    style={({ pressed }) => [styles.modalRow, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={[styles.modalRowText, { color: B2C.text }]}>{opt.label}</Text>
                    {vertical === opt.id ? <Ionicons name="checkmark-circle" size={20} color={B2C.primary} /> : null}
                  </Pressable>
                ))}
              </Pressable>
            </Pressable>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <DiasporaRestrictionModal visible={diasporaRestrictionOpen} onClose={() => setDiasporaRestrictionOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  safe: {
    flex: 1,
  },
  safeWeb: {
    backgroundColor: 'transparent',
  },
  flex: { flex: 1 },
  successToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 12,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: '#2E7D32',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  successToastText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 40 },
  topBarTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trustSeal: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: B2C.gold,
    backgroundColor: B2C.goldSoft,
  },
  topBarTitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
  },
  heroTrust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  heroKicker: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headline: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.extrabold,
    marginBottom: theme.spacing.sm,
  },
  lead: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typeScale.body.lineHeight * 1.2,
  },
  valueGrid: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  valueGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  valueGridThree: {
    justifyContent: 'space-between',
  },
  valueCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    flexGrow: 1,
    minWidth: 200,
  },
  valueIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: theme.spacing.sm,
  },
  valueTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  valueBody: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    lineHeight: theme.typeScale.caption.lineHeight * 1.3,
  },
  formCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  formTitle: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
  },
  label: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    marginTop: theme.spacing.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: theme.typeScale.body.fontSize,
  },
  select: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: theme.typeScale.body.fontSize,
    fontFamily: FontFamily.medium,
  },
  cta: {
    marginTop: theme.spacing.md,
    minHeight: theme.components.button.height.lg,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  ctaText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.55)',
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  modalCard: {
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    maxHeight: '70%',
  },
  modalTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  modalRowText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.medium,
  },
});
