import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, Rect, Stop, G, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { AppButton } from '../components/AppButton';
import { AuthPaywallModal } from '../components/AuthPaywallModal';
import { ProactiveSuggestions } from '../components/ProactiveSuggestions';
import {
  getConfiguredAdminDebugPin,
  isAdminDebugPinConfigured,
  isAdminDebugSurfaceEnabled,
} from '../config/adminDebugGate';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { gradients } from '../theme/gradients';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMG_LOGO = require('../../assets/home/logo.png');
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;
const GOLD_GLASS_GRADIENT = gradients.goldGlass;

const BentoCard = memo(function BentoCard({
  title,
  subtitle,
  icon,
  onPress,
  tall,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tall?: boolean;
}) {
  return (
    <LinearGradient
      colors={GOLD_GLASS_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.cardBorder, tall && styles.cardBorderTall]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardInner, tall && styles.cardInnerTall, pressed && { opacity: 0.82 }]}
      >
        <View style={styles.cardIconWrap}>
          <Ionicons name={icon} size={20} color={theme.colors.primaryBright} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.cardSub}>
          {subtitle}
        </Text>
      </Pressable>
    </LinearGradient>
  );
});

const HomeBentoIconsArt = memo(function HomeBentoIconsArt() {
  const base = theme.colors.surface;
  const stroke = theme.colors.glass.border;
  const navy = theme.colors.primaryBright;
  const gold = theme.colors.primary;
  const red = theme.colors.danger;
  const tile = theme.colors.surfaceElevated;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 180">
      <Defs>
        <SvgLinearGradient id="bgBento" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={base} stopOpacity="1" />
          <Stop offset="1" stopColor={theme.colors.backgroundDeep} stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="300" height="180" rx="18" fill="url(#bgBento)" />
      <G>
        <Rect x="12" y="12" width="86" height="70" rx="14" fill={tile} stroke={stroke} />
        <Rect x="107" y="12" width="86" height="70" rx="14" fill={tile} stroke={stroke} />
        <Rect x="202" y="12" width="86" height="70" rx="14" fill={tile} stroke={stroke} />
        <Rect x="12" y="92" width="86" height="76" rx="14" fill={tile} stroke={stroke} />
        <Rect x="107" y="92" width="86" height="76" rx="14" fill={tile} stroke={stroke} />
        <Rect x="202" y="92" width="86" height="76" rx="14" fill={tile} stroke={stroke} />
      </G>
      <Path d="M40 45h30m-15-15v30" stroke={gold} strokeWidth="5" strokeLinecap="round" />
      <Path d="M132 37h34v26h-34z" fill="none" stroke={navy} strokeWidth="4" />
      <Path d="M129 66h40" stroke={gold} strokeWidth="4" strokeLinecap="round" />
      <Path d="M230 47a14 14 0 1028 0a14 14 0 10-28 0z" fill="none" stroke={navy} strokeWidth="4" />
      <Path d="M239 47l8 8l12-14" fill="none" stroke={gold} strokeWidth="4" strokeLinecap="round" />
      <Path d="M39 126h32v28H39z" fill="none" stroke={navy} strokeWidth="4" />
      <Path d="M35 122h40" stroke={gold} strokeWidth="4" strokeLinecap="round" />
      <Path d="M129 126l12-12l12 12l12-12" fill="none" stroke={navy} strokeWidth="4" strokeLinecap="round" />
      <Circle cx="247" cy="128" r="14" fill="none" stroke={gold} strokeWidth="4" />
      <Path d="M247 114v28M233 128h28" stroke={red} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
});

const HomeMicsArt = memo(function HomeMicsArt() {
  const navy = theme.colors.primaryBright;
  const gold = theme.colors.primary;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 180">
      <Defs>
        <SvgLinearGradient id="bgMics" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.colors.surface} />
          <Stop offset="1" stopColor={theme.colors.backgroundDeep} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="300" height="180" rx="18" fill="url(#bgMics)" />
      <Circle cx="86" cy="92" r="36" fill="none" stroke={gold} strokeWidth="3" opacity="0.45" />
      <Circle cx="86" cy="92" r="24" fill="none" stroke={gold} strokeWidth="2" opacity="0.6" />
      <Circle cx="214" cy="92" r="36" fill="none" stroke={gold} strokeWidth="3" opacity="0.45" />
      <Circle cx="214" cy="92" r="24" fill="none" stroke={gold} strokeWidth="2" opacity="0.6" />
      <Rect x="72" y="54" width="28" height="48" rx="14" fill="none" stroke={navy} strokeWidth="4" />
      <Path d="M86 104v20M74 124h24" stroke={navy} strokeWidth="4" strokeLinecap="round" />
      <Rect x="200" y="54" width="28" height="48" rx="14" fill="none" stroke={navy} strokeWidth="4" />
      <Path d="M214 104v20M202 124h24" stroke={navy} strokeWidth="4" strokeLinecap="round" />
      <Circle cx="150" cy="90" r="6" fill="#C62828" />
    </Svg>
  );
});

const HomeAiAvatarArt = memo(function HomeAiAvatarArt() {
  const navy = theme.colors.primaryBright;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 132 132">
      <Defs>
        <SvgLinearGradient id="bgAvatar" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.colors.surface} />
          <Stop offset="1" stopColor={theme.colors.surfaceElevated} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="132" height="132" rx="66" fill="url(#bgAvatar)" />
      <Circle cx="66" cy="50" r="20" fill="none" stroke={navy} strokeWidth="4" />
      <Path d="M32 104c8-18 20-26 34-26s26 8 34 26" fill="none" stroke={theme.colors.primary} strokeWidth="5" strokeLinecap="round" />
      <Circle cx="58" cy="48" r="3" fill={navy} />
      <Circle cx="74" cy="48" r="3" fill={navy} />
      <Path d="M58 60c4 4 12 4 16 0" fill="none" stroke={navy} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
});

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, setPendingRedirect } = useAuth();
  const wallet = useWalletState();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const tapsRef = useRef<number[]>([]);
  const inboundPersonaName = getPersonaDisplayName('loan');
  const outboundPersonaName = getPersonaDisplayName('leona');

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

  const openProtected = useCallback((target: 'Wallet' | 'AiEye' | 'LeonaCall' | 'Vault') => {
    if (!user) {
      setPendingRedirect(target);
      setShowPaywall(true);
      return;
    }
    navigation.navigate(target);
  }, [navigation, setPendingRedirect, user]);

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

  const onSelectProactive = useCallback((question: string, persona: 'leona' | 'loan') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!user) {
      setPendingRedirect(persona === 'loan' ? 'LeTan' : 'LeonaCall');
      setShowPaywall(true);
      return;
    }
    if (persona === 'loan') {
      navigation.navigate('Tabs', {
        screen: 'LeTan',
        params: { proactiveQuestion: question, autoSimulate: true },
      });
      return;
    }
    navigation.navigate('LeonaCall', { prefillRequest: question, autoSubmit: true });
  }, [navigation, setPendingRedirect, user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.creditPill}>
        <Ionicons name="wallet" size={12} color={theme.colors.primary} />
        <Text style={styles.creditPillText}>{wallet.credits} Credits</Text>
      </View>
      <View style={styles.dongSonRing} />
      <View style={styles.dongSonCore} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBlock}>
          <Text style={styles.heroEyebrow}>Kết Nối Global</Text>
          <Text style={styles.heading}>Home Operations Hub</Text>
          <Text style={styles.heroSub}>Điều hướng nhanh các năng lực cốt lõi với bố cục ưu tiên mobile-first.</Text>
        </View>
        <ProactiveSuggestions onSelect={onSelectProactive} />

        <View style={styles.bentoGrid}>
          <View style={styles.colLeft}>
            <LinearGradient colors={GOLD_GLASS_GRADIENT} style={styles.imageCardBorder}>
              <View style={styles.imageCardInner}>
                <View style={styles.refImage}>
                  <HomeBentoIconsArt />
                </View>
              </View>
            </LinearGradient>
            <BentoCard
              title="Két sắt giấy tờ"
              subtitle="Lưu & nhắc hạn giấy tờ — chạm để mở."
              icon="shield-checkmark-outline"
              onPress={() => openProtected('Vault')}
            />
            <BentoCard
              title="Đồng hành du lịch"
              subtitle="Phiên dịch, Leona, SOS — so sánh chuyến bay ngoài app."
              icon="airplane-outline"
              onPress={() => navigation.navigate('TravelCompanion')}
            />
          </View>

          <View style={styles.colCenter}>
            <LinearGradient
              colors={GOLD_GLASS_GRADIENT}
              style={styles.avatarBorder}
            >
              <View style={styles.avatarGlow} />
              <View style={styles.avatar}>
                <HomeAiAvatarArt />
              </View>
              <View style={styles.onlineBadge}>
                <Ionicons name="pulse" size={14} color={theme.colors.success} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </LinearGradient>
            <Text style={styles.centerCaption}>Tổng đài viên {inboundPersonaName}</Text>
            {isAdminDebugSurfaceEnabled() && adminUnlocked ? (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={theme.colors.surface} />
                <Text style={styles.adminBadgeText}>Admin unlocked</Text>
              </View>
            ) : null}
            <Pressable
              onPress={isAdminDebugSurfaceEnabled() ? onSecretTap : undefined}
              style={({ pressed }) => [styles.logoTapArea, pressed && { opacity: 0.9 }]}
            >
              <LinearGradient colors={GOLD_GLASS_GRADIENT} style={styles.logoCardBorder}>
                <View style={styles.logoCardInner}>
                  <Image source={IMG_LOGO} style={styles.logoImage} />
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.colRight}>
            <LinearGradient colors={GOLD_GLASS_GRADIENT} style={styles.imageCardBorder}>
              <View style={styles.imageCardInner}>
                <View style={styles.refImage}>
                  <HomeMicsArt />
                </View>
              </View>
            </LinearGradient>
            <BentoCard
              title="Mắt Thần · Quét bài"
              subtitle="Quét bài, tóm tắt, ôn nhanh (cần đăng nhập)."
              icon="scan-circle-outline"
              onPress={() => openProtected('AiEye')}
              tall
            />
            <BentoCard
              title="Ví Credits"
              subtitle="Nạp gói Global — giá hiển thị theo quốc gia hồ sơ."
              icon="wallet-outline"
              onPress={() => openProtected('Wallet')}
            />
            <BentoCard
              title={`Gọi hỗ trợ · ${outboundPersonaName}`}
              subtitle={`${inboundPersonaName} hỗ trợ trong app; Leona gọi đối ngoại khi Bạn yêu cầu.`}
              icon="call-outline"
              onPress={() => openProtected('LeonaCall')}
            />
          </View>
        </View>
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
              placeholderTextColor={theme.colors.text.secondary}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: 120,
  },
  heroBlock: {
    marginBottom: theme.spacing.md,
  },
  heroEyebrow: {
    fontSize: 12,
    letterSpacing: 0.6,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  creditPill: {
    position: 'absolute',
    top: 8,
    right: 14,
    zIndex: 10,
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.glass.surfaceStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditPillText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  heading: {
    fontSize: 26,
    lineHeight: 34,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
    marginBottom: theme.spacing.xs,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  dongSonRing: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    borderWidth: 1.2,
    borderColor: theme.colors.overlay.ringSoft,
    top: -120,
    left: -90,
  },
  dongSonCore: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: theme.colors.overlay.ringCore,
    right: -80,
    top: 180,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  colLeft: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  colCenter: {
    width: 150,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.sm,
  },
  colRight: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  cardBorder: {
    borderRadius: theme.radius.lg,
    padding: 1,
  },
  cardBorderTall: {
    minHeight: 210,
  },
  imageCardBorder: {
    borderRadius: theme.radius.lg,
    padding: 1,
  },
  imageCardInner: {
    borderRadius: theme.radius.md,
    minHeight: 100,
    backgroundColor: theme.colors.glass.surface,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
    overflow: 'hidden',
  },
  refImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardInner: {
    borderRadius: theme.radius.md,
    minHeight: 100,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.glass.surface,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
  },
  cardInnerTall: {
    minHeight: 208,
    justifyContent: 'flex-end',
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.glass.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  avatarBorder: {
    width: 146,
    height: 184,
    borderRadius: theme.radius.lg,
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
  },
  avatarGlow: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: theme.colors.glass.goldGlow,
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.glass.surfaceStrong,
  },
  onlineBadge: {
    marginTop: 12,
    minWidth: 84,
    height: 30,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(129, 199, 132, 0.22)',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  onlineText: {
    fontSize: 11,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.medium,
  },
  centerCaption: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  adminBadge: {
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 11,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.medium,
  },
  logoCardBorder: {
    borderRadius: theme.radius.md,
    padding: 1,
    width: 146,
  },
  logoTapArea: {
    borderRadius: theme.radius.md,
  },
  logoCardInner: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.glass.surface,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: 96,
    resizeMode: 'cover',
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
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surfaceMuted,
    padding: 16,
  },
  pinTitle: {
    fontSize: 20,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  pinHint: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 10,
  },
  pinInput: {
    height: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surfaceStrong,
    paddingHorizontal: 12,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  pinError: {
    fontSize: 12,
    color: theme.colors.danger,
    fontFamily: FontFamily.regular,
    marginBottom: 8,
  },
});
