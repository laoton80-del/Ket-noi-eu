import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { useAuth } from '../context/AuthContext';
import type { RedirectTarget } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const COUNTRY_CODES = ['+420', '+421', '+48', '+49', '+33', '+44'];

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
    HocTap: 'Học tập',
    LeTan: 'Lễ tân',
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
          <Pressable
            onPress={() => setCodeIndex((i) => (i + 1) % COUNTRY_CODES.length)}
            style={({ pressed }) => [styles.codeBtn, pressed && { opacity: 0.82 }]}
          >
            <Text style={styles.codeText}>{COUNTRY_CODES[codeIndex]}</Text>
          </Pressable>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor="rgba(31,26,20,0.45)"
          />
        </View>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, !canContinue && styles.ctaDisabled, pressed && { opacity: 0.82 }]}
          disabled={!canContinue}
        >
          <Text style={styles.ctaText}>Tiếp tục</Text>
        </Pressable>
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
  container: { flex: 1, backgroundColor: '#F8F6F0', justifyContent: 'center', paddingHorizontal: 18 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 16,
    shadowColor: '#8B7355',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { fontSize: 27, color: Colors.text, fontFamily: FontFamily.extrabold, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 20, color: Colors.textSoft, fontFamily: FontFamily.regular, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  codeBtn: {
    minWidth: 76,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  codeText: { color: Colors.text, fontFamily: FontFamily.semibold, fontSize: 14 },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 12,
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  cta: {
    height: 46,
    borderRadius: 12,
    marginTop: 14,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#FFE9D2', fontFamily: FontFamily.bold, fontSize: 15 },
  redirectHint: { marginTop: 10, fontSize: 12, color: Colors.textSoft, fontFamily: FontFamily.regular },
});
