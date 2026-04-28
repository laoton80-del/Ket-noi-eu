import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AuthPaywallModal } from '../components/AuthPaywallModal';
import { ProactiveSuggestions } from '../components/ProactiveSuggestions';
import {
  getConfiguredAdminDebugPin,
  isAdminDebugPinConfigured,
  isAdminDebugSurfaceEnabled,
} from '../config/adminDebugGate';
import { APP_BRAND } from '../config/appBrand';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMG_LOGO = require('../../assets/home/logo.png');
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;

const CARD_RADIUS = 16;

const ActionCard = memo(function ActionCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={22} color={theme.hybrid.signalStrong} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text numberOfLines={3} style={styles.cardSub}>
        {subtitle}
      </Text>
    </Pressable>
  );
});

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, setPendingRedirect } = useAuth();
  const wallet = useWalletState();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [showPaywall, setShowPaywall] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const tapsRef = useRef<number[]>([]);

  const inboundPersonaName = getPersonaDisplayName('loan');
  const outboundPersonaName = getPersonaDisplayName('leona');

  const layout = useMemo(() => {
    const isWide = width >= 720;
    const maxContent = isWide ? 720 : width;
    const columns = isWide ? 2 : 1;
    return { isWide, maxContent, columns };
  }, [width]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (!isAdminDebugSurfaceEnabled()) {
          await AsyncStorage.removeItem(ADMIN_UNLOCK_KEY);
          setAdminUnlocked(false);
          return;
        }
        const raw = await AsyncStorage.getItem(ADMIN_UNLOCK_KEY);
        setAdminUnlocked(raw === '1');
      })();
    }, [])
  );

  const openProtected = useCallback(
    (target: 'Wallet' | 'AiEye' | 'LeonaCall' | 'Vault') => {
      if (!user) {
        setPendingRedirect(target);
        setShowPaywall(true);
        return;
      }
      navigation.navigate(target);
    },
    [navigation, setPendingRedirect, user]
  );

  const onSecretTap = useCallback(() => {
    if (!isAdminDebugSurfaceEnabled()) return;
    const now = Date.now();
    const recent = [...tapsRef.current, now].filter((t) => now - t <= 3000);
    tapsRef.current = recent;
    if (recent.length >= 5) {
      tapsRef.current = [];
      if (adminUnlocked) {
        navigation.navigate('AdminDashboard');
        return;
      }
      setPinInput('');
      setPinError('');
      setShowPin(true);
    }
  }, [adminUnlocked, navigation]);

  const onSelectProactive = useCallback(
    (question: string, persona: 'leona' | 'loan') => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!user) {
        setPendingRedirect(persona === 'loan' ? 'Concierge' : 'LeonaCall');
        setShowPaywall(true);
        return;
      }
      if (persona === 'loan') {
        navigation.navigate('Tabs', {
          screen: 'Concierge',
          params: { proactiveQuestion: question, autoSimulate: true },
        });
        return;
      }
      navigation.navigate('LeonaCall', { prefillRequest: question, autoSubmit: true });
    },
    [navigation, setPendingRedirect, user]
  );

  const cards = useMemo(
    () => [
      {
        key: 'vault',
        title: 'Két sắt giấy tờ',
        subtitle: 'Lưu & nhắc hạn giấy tờ — chạm để mở.',
        icon: 'shield-checkmark-outline' as const,
        onPress: () => openProtected('Vault'),
      },
      {
        key: 'travel',
        title: 'Đồng hành du lịch',
        subtitle: 'Phiên dịch, Leona, SOS — so sánh chuyến bay ngoài app.',
        icon: 'airplane-outline' as const,
        onPress: () => navigation.navigate('TravelCompanion'),
      },
      {
        key: 'aiEye',
        title: 'Mắt Thần · Quét bài',
        subtitle: 'Quét bài, tóm tắt, ôn nhanh (cần đăng nhập).',
        icon: 'scan-circle-outline' as const,
        onPress: () => openProtected('AiEye'),
      },
      {
        key: 'wallet',
        title: 'Ví Credits',
        subtitle: 'Nạp gói Global — giá hiển thị theo quốc gia hồ sơ.',
        icon: 'wallet-outline' as const,
        onPress: () => openProtected('Wallet'),
      },
      {
        key: 'leona',
        title: `Gọi hỗ trợ · ${outboundPersonaName}`,
        subtitle: `${inboundPersonaName} hỗ trợ trong app; Leona gọi đối ngoại khi Bạn yêu cầu.`,
        icon: 'call-outline' as const,
        onPress: () => openProtected('LeonaCall'),
      },
    ],
    [inboundPersonaName, navigation, openProtected, outboundPersonaName]
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, theme.spacing.sm) }]}>
        <View style={styles.brandRow}>
          <Image source={APP_BRAND.iconAsset} style={styles.brandMark} resizeMode="cover" />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandName}>Kết Nối Global</Text>
            <Text style={styles.brandTagline}>Home</Text>
          </View>
        </View>
        <View style={styles.creditPill}>
          <Ionicons name="wallet-outline" size={14} color={theme.hybrid.signalStrong} />
          <Text style={styles.creditPillText}>{wallet.credits} Credits</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom, maxWidth: layout.maxContent, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Operations hub</Text>
          <Text style={styles.heroTitle}>Chào mừng trở lại</Text>
          <Text style={styles.heroBody}>
            Truy cập nhanh các năng lực cốt lõi — gọn, rõ, tập trung vào việc Bạn cần làm tiếp theo.
          </Text>
        </View>

        <ProactiveSuggestions onSelect={onSelectProactive} />

        <View style={[styles.grid, layout.columns === 2 && styles.gridTwoCol]}>
          {cards.map((c) => (
            <View key={c.key} style={layout.columns === 2 ? styles.gridItemHalf : styles.gridItemFull}>
              <ActionCard title={c.title} subtitle={c.subtitle} icon={c.icon} onPress={c.onPress} />
            </View>
          ))}
        </View>

        <Pressable
          onPress={isAdminDebugSurfaceEnabled() ? onSecretTap : undefined}
          style={({ pressed }) => [styles.logoCard, pressed && { opacity: 0.92 }]}
        >
          <Image source={IMG_LOGO} style={styles.logoImage} resizeMode="cover" />
          <View style={styles.logoMeta}>
            <Text style={styles.logoTitle}>Navigator Bird</Text>
            <Text style={styles.logoHint}>Nhấn nhanh 5 lần để mở Admin (chỉ build nội bộ)</Text>
          </View>
        </Pressable>

        {isAdminDebugSurfaceEnabled() && adminUnlocked ? (
          <View style={styles.adminPill}>
            <Ionicons name="shield-checkmark" size={14} color={theme.hybrid.onSignal} />
            <Text style={styles.adminPillText}>Admin unlocked</Text>
          </View>
        ) : null}
      </ScrollView>

      <AuthPaywallModal
        visible={showPaywall}
        title="Đăng nhập để tiếp tục"
        description="Ví, quét bài, gọi hỗ trợ và các tính năng chính cần xác thực số điện thoại."
        onClose={() => setShowPaywall(false)}
        onContinue={() => {
          setShowPaywall(false);
          navigation.navigate('Login');
        }}
      />

      {isAdminDebugSurfaceEnabled() && showPin ? (
        <View style={styles.pinOverlay}>
          <View style={styles.pinCard}>
            <Text style={styles.pinTitle}>Super Admin</Text>
            <Text style={styles.pinHint}>
              Nhập mã PIN cấu hình qua biến môi trường build (không dùng mặc định trong mã nguồn).
            </Text>
            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="PIN"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={64}
              secureTextEntry
              style={styles.pinInput}
              placeholderTextColor={theme.hybrid.panelCoolTextMuted}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <AppButton
              label="Mở Dashboard"
              variant="danger"
              onPress={() => {
                if (!isAdminDebugPinConfigured()) {
                  setPinError('Admin PIN chỉ hỗ trợ trong build dev và yêu cầu EXPO_PUBLIC_ADMIN_PIN >= 12 ký tự.');
                  return;
                }
                const expected = getConfiguredAdminDebugPin();
                if (pinInput === expected) {
                  setShowPin(false);
                  setAdminUnlocked(true);
                  void AsyncStorage.setItem(ADMIN_UNLOCK_KEY, '1');
                  navigation.navigate('AdminDashboard');
                  return;
                }
                setPinError('Sai PIN');
              }}
            />
            <AppButton label="Hủy" variant="ghost" onPress={() => setShowPin(false)} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.SoftMineralGrey,
  },
  topBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.CeolWhite,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    overflow: 'hidden',
  },
  brandTextCol: {
    flex: 1,
  },
  brandName: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.panelCoolText,
  },
  brandTagline: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.hybrid.panelCoolTextMuted,
    marginTop: 2,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.CeolWhite,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  creditPillText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.panelCoolText,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  hero: {
    marginBottom: theme.spacing.lg,
  },
  heroEyebrow: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.hybrid.signalStrong,
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    ...theme.typeScale.h1,
    color: theme.hybrid.panelCoolText,
    marginBottom: theme.spacing.sm,
  },
  heroBody: {
    ...theme.typeScale.body,
    color: theme.hybrid.panelCoolTextMuted,
  },
  grid: {
    gap: theme.spacing.md,
  },
  gridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.md,
    columnGap: theme.spacing.md,
  },
  gridItemFull: {
    width: '100%',
  },
  gridItemHalf: {
    width: '48%',
  },
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: theme.colors.CeolWhite,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
    minHeight: 132,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.typeScale.h2,
    color: theme.hybrid.panelCoolText,
    marginBottom: 6,
  },
  cardSub: {
    ...theme.typeScale.body,
    color: theme.hybrid.panelCoolTextMuted,
  },
  logoCard: {
    marginTop: theme.spacing.lg,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: theme.colors.CeolWhite,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: 140,
    backgroundColor: theme.hybrid.panelCool,
  },
  logoMeta: {
    padding: theme.spacing.lg,
    gap: 6,
  },
  logoTitle: {
    ...theme.typeScale.h2,
    color: theme.hybrid.panelCoolText,
  },
  logoHint: {
    ...theme.typeScale.caption,
    color: theme.hybrid.panelCoolTextMuted,
  },
  adminPill: {
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.signalStrong,
  },
  adminPillText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.onSignal,
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay.dim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pinCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
    padding: theme.spacing.lg,
  },
  pinTitle: {
    ...theme.typeScale.h2,
    color: theme.hybrid.panelCoolText,
    marginBottom: 6,
  },
  pinHint: {
    ...theme.typeScale.caption,
    color: theme.hybrid.panelCoolTextMuted,
    marginBottom: theme.spacing.md,
  },
  pinInput: {
    height: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.SoftMineralGrey,
    paddingHorizontal: 12,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  pinError: {
    ...theme.typeScale.caption,
    color: theme.colors.danger,
    marginBottom: 8,
  },
});
