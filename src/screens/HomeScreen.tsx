import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { applyWebStyles } from '../utils/applyWebStyles';
import { DashboardB2CScreen } from './b2c/DashboardB2CScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMG_LOGO = require('../../assets/home/logo.png');
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;

/** Light shell — aligns with modern neutral apps; text uses hybrid cool tokens. */
const SCREEN_BG = '#F8F9FA';
const CARD_BG = '#FFFFFF';

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
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

  const layout = useMemo(() => {
    const maxShell = 720;
    const shellWidth = Math.min(width, maxShell);
    const pad = theme.spacing.lg;
    const inner = shellWidth - pad * 2;
    return { shellWidth, pad, inner };
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
    },
    [navigation, setPendingRedirect, user]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']} className={applyWebStyles('kn-glass')}>
      <View style={styles.creditPill}>
        <Ionicons name="wallet-outline" size={14} color={theme.hybrid.signalStrong} />
        <Text style={styles.creditPillText}>{wallet.credits} Credits</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layout.pad,
            paddingBottom: 120,
            width: layout.shellWidth,
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>{APP_BRAND.masterName}</Text>
          <Text style={styles.heading}>Trung tâm B2C</Text>
          <Text style={styles.heroSub}>
            Ba vũ trụ ứng dụng — Local cho đời thường, Travel cho chuyến đi cao cấp, Academy cho học tập AI.
          </Text>
        </View>

        <ProactiveSuggestions onSelect={onSelectProactive} />

        <View style={[styles.featureCard, { width: layout.inner }]} className={applyWebStyles('kn-glass')}>
          <View style={styles.featureRow}>
            <Pressable
              onPress={isAdminDebugSurfaceEnabled() ? onSecretTap : undefined}
              style={({ pressed }) => [styles.logoWrap, pressed && { opacity: 0.92 }]}
              className={applyWebStyles('kn-neon-b2b')}
            >
              <Image source={IMG_LOGO} style={styles.logoImage} accessibilityLabel="Logo" />
            </Pressable>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>Tổng đài viên {inboundPersonaName}</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Sẵn sàng hỗ trợ</Text>
              </View>
              {isAdminDebugSurfaceEnabled() && adminUnlocked ? (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={theme.hybrid.signalStrong} />
                  <Text style={styles.adminBadgeText}>Admin unlocked</Text>
                </View>
              ) : null}
              {isAdminDebugSurfaceEnabled() ? (
                <Text style={styles.debugHint}>Gợi ý: chạm nhanh logo 5 lần để mở khu vực quản trị (dev).</Text>
              ) : null}
            </View>
          </View>
        </View>

        <DashboardB2CScreen contentWidth={layout.inner} />

        <View style={[styles.utilityStrip, { width: layout.inner }]} className={applyWebStyles('kn-glass')}>
          <Text style={styles.utilityStripTitle}>Lối tắt hệ thống</Text>
          <View style={styles.utilityRow}>
            <Pressable
              onPress={() => openProtected('Vault')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>Vault</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('TravelCompanion')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="airplane-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>Đồng hành</Text>
            </Pressable>
            <Pressable
              onPress={() => openProtected('AiEye')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="scan-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>Mắt Thần</Text>
            </Pressable>
            <Pressable
              onPress={() => openProtected('Wallet')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="wallet-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>Ví</Text>
            </Pressable>
            <Pressable
              onPress={() => openProtected('LeonaCall')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="call-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>{outboundPersonaName}</Text>
            </Pressable>
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
          <View style={[styles.pinCard, { maxWidth: Math.min(width - 48, 400) }]}>
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
                  setPinError(
                    'Admin PIN chỉ hỗ trợ trong build dev và yêu cầu EXPO_PUBLIC_ADMIN_PIN >= 12 ký tự.'
                  );
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
    backgroundColor: SCREEN_BG,
  },
  scrollContent: {
    paddingTop: theme.spacing.sm,
  },
  hero: {
    marginBottom: theme.spacing.lg,
    paddingRight: 100,
  },
  heroEyebrow: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  heading: {
    fontSize: 28,
    lineHeight: 34,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.extrabold,
    marginBottom: theme.spacing.xs,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
  },
  creditPill: {
    position: 'absolute',
    top: 8,
    right: theme.spacing.lg,
    zIndex: 10,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  creditPillText: {
    fontSize: 13,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.semibold,
  },
  featureCard: {
    alignSelf: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  logoWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
  },
  logoImage: {
    width: 88,
    height: 88,
    resizeMode: 'cover',
    backgroundColor: theme.hybrid.panelCool,
  },
  featureCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    fontSize: 16,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.bold,
    marginBottom: 6,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  onlineText: {
    fontSize: 13,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.medium,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    marginBottom: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    color: theme.hybrid.signalStrong,
    fontFamily: FontFamily.semibold,
  },
  debugHint: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
  },
  utilityStrip: {
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: CARD_BG,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  utilityStripTitle: {
    fontSize: 12,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.semibold,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  utilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  utilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.hybrid.panelCool,
  },
  utilityChipText: {
    fontSize: 12,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.semibold,
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 22, 40, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pinCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: CARD_BG,
    padding: theme.spacing.lg,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  pinTitle: {
    fontSize: 20,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  pinHint: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
    marginBottom: 10,
  },
  pinInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: SCREEN_BG,
    paddingHorizontal: 12,
    color: theme.hybrid.panelCoolText,
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
