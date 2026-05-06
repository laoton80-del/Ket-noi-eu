import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING_AUTHORITY } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DESKTOP_BREAKPOINT = 768;
const MOCK_MERCHANT_REF = 'KN-PROMO-DEMO-7F3A';

/** Stylized pseudo–QR tiles (decorative; not scannable). */
function MockQrPattern() {
  const size = 10;
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i += 1) {
    const row = Math.floor(i / size);
    const col = i % size;
    const corner = (row < 3 && col < 3) || (row < 3 && col >= size - 3) || (row >= size - 3 && col < 3);
    const hash = (row * 17 + col * 31 + row * col) % 3 !== 0;
    cells.push(corner || hash);
  }
  return (
    <View style={qrStyles.patternWrap} accessibilityLabel="Mã QR minh họa">
      {cells.map((on, idx) => (
        <View
          key={`cell-${idx}`}
          style={[qrStyles.cell, on ? qrStyles.cellOn : qrStyles.cellOff]}
        />
      ))}
    </View>
  );
}

const qrStyles = StyleSheet.create({
  patternWrap: {
    width: 110,
    height: 110,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.sm,
  },
  cell: { width: 9, height: 9, margin: 0.5, borderRadius: 1 },
  cellOn: { backgroundColor: '#0A1628' },
  cellOff: { backgroundColor: '#E8ECF2' },
});

export function PromoToolsScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isDesktop = width > DESKTOP_BREAKPOINT;
  const isDesktopWeb = Platform.OS === 'web' && isDesktop;

  const welcomeXu = PRICING_AUTHORITY.b2cCredits.referralBonus;

  const onDownloadQr = () => {
    Alert.alert(
      'Tải xuống mã QR',
      `Bản demo — file PNG/SVG có ref ${MOCK_MERCHANT_REF} sẽ được tạo khi backend Growth sẵn sàng.`,
      [{ text: 'Đã hiểu' }]
    );
  };

  const onPrintQr = () => {
    if (Platform.OS === 'web') {
      const g = globalThis as typeof globalThis & { print?: () => void };
      g.print?.();
    }
    Alert.alert(
      'In mã QR',
      'Luồng in PDF / máy in vật lý đang được tích hợp. Hiện tại bạn có thể dùng tải xuống (demo) hoặc chụp màn hình khung QR.',
      [{ text: 'Đóng' }]
    );
  };

  return (
    <View
      style={[styles.shell, { backgroundColor: theme.colors.background }]}
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
          <Text style={styles.screenTitle}>Promo Tools</Text>
          <View style={styles.backSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>Trung Tâm Thu Hút Khách Hàng (Promo Tools)</Text>
          <Text style={styles.subKicker}>Chiến lược “Trojan Horse” — B2C vào Super App, B2B được ưu tiên hiển thị.</Text>

          <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
            <View style={[styles.column, styles.columnHook, isDesktop && styles.columnDesktop]}>
              <View style={styles.hookBadge}>
                <Ionicons name="sparkles" size={16} color={theme.colors.primaryBright} />
                <Text style={styles.hookBadgeText}>Ưu đãi chào mừng</Text>
              </View>
              <Text style={styles.hookTitle}>Tại sao nên dán mã này?</Text>
              <Text style={styles.hookBody}>
                In mã QR này dán tại tiệm. Khách hàng quét mã tải App sẽ nhận {welcomeXu} Xu, và tiệm của bạn sẽ được ưu tiên hiển thị trên máy của họ!
              </Text>
              <Text style={styles.hookFoot}>
                Mỗi lượt quét gắn ref định danh đối tác (demo: {MOCK_MERCHANT_REF}) — báo cáo attribution trong Merchant Dashboard (sắp mở).
              </Text>
            </View>

            <View style={[styles.column, styles.columnQr, isDesktop && styles.columnDesktop]} className={applyWebStyles('kn-glass')}>
              <View style={styles.qrFrameOuter} className={applyWebStyles('kn-neon-b2b')}>
                <View style={styles.qrFrameInner}>
                  <View style={styles.qrIconRow}>
                    <Ionicons name="qr-code" size={56} color={theme.colors.DeepInkNavy} />
                  </View>
                  <MockQrPattern />
                  <Text style={styles.scanBold}>QUÉT MÃ NHẬN {welcomeXu} XU</Text>
                  <Text style={styles.refHint}>Ref: {MOCK_MERCHANT_REF}</Text>
                </View>
              </View>

              <Pressable
                onPress={onDownloadQr}
                style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.9 }]}
                className={applyWebStyles('kn-neon-b2b')}
                accessibilityRole="button"
                accessibilityLabel="Tải xuống mã QR"
              >
                <Ionicons name="download-outline" size={22} color={theme.hybrid.onSignal} />
                <Text style={styles.btnPrimaryText}>TẢI XUỐNG MÃ QR</Text>
              </Pressable>

              <Pressable
                onPress={onPrintQr}
                style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
                accessibilityLabel="In mã QR"
              >
                <Ionicons name="print-outline" size={20} color={theme.colors.primaryBright} />
                <Text style={styles.btnSecondaryText}>IN MÃ QR</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeWeb: {
    backgroundColor: 'transparent',
  },
  safeDesktop: {
    alignSelf: 'stretch',
  },
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
    paddingHorizontal: theme.spacing.xxl,
    maxWidth: 1120,
    alignSelf: 'center',
    width: '100%',
  },
  headline: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subKicker: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.sm,
  },
  columns: {
    gap: theme.spacing.xl,
  },
  columnsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.xxl,
  },
  column: {
    gap: theme.spacing.md,
  },
  columnDesktop: {
    flex: 1,
    minWidth: 0,
  },
  columnHook: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
  },
  columnQr: {
    alignItems: 'stretch',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surfaceElevated,
    gap: theme.spacing.lg,
  },
  hookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  hookBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  hookTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  hookBody: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  hookFoot: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
    marginTop: theme.spacing.xs,
  },
  qrFrameOuter: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 2,
    borderColor: theme.colors.glass.border,
  },
  qrFrameInner: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.CeolWhite,
    gap: theme.spacing.md,
  },
  qrIconRow: {
    marginBottom: theme.spacing.xs,
  },
  scanBold: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.DeepInkNavy,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: theme.spacing.sm,
  },
  refHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.textOnLightMuted,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 52,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.hybrid.signalStrong,
    borderWidth: 1,
    borderColor: theme.colors.primaryBright,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.onSignal,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 48,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryBright,
    backgroundColor: 'transparent',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.4,
  },
});
