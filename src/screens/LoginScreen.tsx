import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { useAuth } from '../context/AuthContext';
import type { RedirectTarget } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const COUNTRY_CODES = ['+420', '+421', '+48', '+49', '+33', '+44'];

function InteractiveScale({ children }: { children: ReactNode }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 150 }) }],
  }));
  return (
    <Animated.View
      style={style}
      onPointerEnter={() => {
        scale.value = 0.98;
      }}
      onPointerLeave={() => {
        scale.value = 1;
      }}
    >
      {children}
    </Animated.View>
  );
}

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { beginLogin, pendingRedirect } = useAuth();
  const [phone, setPhone] = useState('');
  const [codeIndex, setCodeIndex] = useState(0);
  const inboundPersonaName = getPersonaDisplayName('loan');

  const canContinue = useMemo(() => phone.trim().length >= 7, [phone]);

  const onContinue = () => {
    if (!canContinue) return;
    beginLogin(`${COUNTRY_CODES[codeIndex]} ${phone.trim()}`);
    navigation.navigate('Otp');
  };

  const redirectLabel: Record<RedirectTarget, string> = {
    Academy: 'Học viện',
    Concierge: 'Trợ lý',
    Wallet: 'Ví & Credits',
    AiEye: 'Mắt Thần',
    LeonaCall: `Tổng đài viên ${inboundPersonaName}`,
    Vault: 'Két Sắt Giấy Tờ',
    LiveInterpreter: 'Phiên dịch trực tiếp',
    RadarDiscovery: 'Radar dịch vụ',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Đăng nhập lười</Text>
        <Text style={styles.sub}>Nhập số điện thoại để tiếp tục. OTP dùng cho demo.</Text>
        <View style={styles.row}>
          <InteractiveScale>
            <Pressable
              onPress={() => setCodeIndex((i) => (i + 1) % COUNTRY_CODES.length)}
              style={({ pressed }) => [styles.codeBtn, pressed && styles.pressedState]}
            >
              <Text style={styles.codeText}>{COUNTRY_CODES[codeIndex]}</Text>
            </Pressable>
          </InteractiveScale>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor={theme.colors.textOnLightMuted}
          />
        </View>
        <InteractiveScale>
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [styles.cta, !canContinue && styles.ctaDisabled, pressed && styles.pressedState]}
            disabled={!canContinue}
          >
            <Text style={styles.ctaText}>Tiếp tục</Text>
          </Pressable>
        </InteractiveScale>
        {pendingRedirect ? (
          <Text style={styles.redirectHint}>
            Sau khi đăng nhập sẽ quay lại: {redirectLabel[pendingRedirect]}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.SoftMineralGrey, justifyContent: 'center', paddingHorizontal: 18 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.CeolWhite,
    padding: theme.spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { ...theme.typeScale.h1, color: theme.colors.textOnLight, fontFamily: FontFamily.bold, marginBottom: 6 },
  sub: { ...theme.typeScale.body, color: theme.colors.textOnLightMuted, fontFamily: FontFamily.regular, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  codeBtn: {
    minWidth: 76,
    height: 46,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.CeolWhite,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  codeText: { color: theme.colors.textOnLight, ...theme.typeScale.body, fontFamily: FontFamily.semibold },
  input: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.CeolWhite,
    paddingHorizontal: 12,
    color: theme.colors.textOnLight,
    fontFamily: FontFamily.medium,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cta: {
    height: 46,
    borderRadius: theme.radius.xl,
    marginTop: 14,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: theme.colors.CeolWhite, ...theme.typeScale.body, fontFamily: FontFamily.bold },
  redirectHint: { marginTop: 10, ...theme.typeScale.caption, color: theme.colors.textOnLightMuted },
  pressedState: {
    opacity: 0.9,
  },
});
