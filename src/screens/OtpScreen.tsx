import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppMode } from '../context/AppModeContext';
import { useAuth } from '../context/AuthContext';
import { isMerchantServerRole, normalizeServerUserRole } from '../context/authTypes';
import { MAIN_TAB, type RootStackParamList } from '../navigation/routes';
import { isRestApiConfigured } from '../services/apiClient';
import { restUserHasCompletedProfile } from '../services/auth/restSessionBridge';
import { loginRestApi } from '../services/restAuthClient';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';
import { useTranslation } from '../utils/i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEMO_OTP_LENGTH = 4;
const REST_PIN_MIN_LENGTH = 6;

export function OtpScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { pendingLogin, applyRestLoginSession } = useAuth();
  const { setMode } = useAppMode();
  const useRestLogin = isRestApiConfigured();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [pinCode, setPinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  const displayPhone = pendingLogin?.phone ?? '';

  const updateOtpDigit = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = v;
    setOtp(next);
    if (v && index < DEMO_OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const demoCanContinue = otp.every((x) => x.length === 1);
  const restCanContinue = pinCode.trim().length >= REST_PIN_MIN_LENGTH;
  const canContinue = useRestLogin ? restCanContinue : demoCanContinue;

  const restPinError = useMemo(() => {
    if (!useRestLogin || pinCode.length === 0) return null;
    if (pinCode.trim().length < REST_PIN_MIN_LENGTH) return t('auth.pinTooShort');
    return null;
  }, [pinCode, t, useRestLogin]);

  const goToMainApp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs', params: { screen: MAIN_TAB.B2C.home } }],
    });
  };

  const onDemoContinue = () => {
    if (!demoCanContinue) return;
    navigation.navigate('RoleSelection');
  };

  const onRestContinue = async () => {
    if (!restCanContinue || submitting) return;
    if (!displayPhone) {
      navigation.replace('Login');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginRestApi(displayPhone, pinCode.trim());
      if (!result.ok) {
        const message =
          result.status === 0
            ? t('auth.loginUnreachable')
            : result.status >= 500
              ? t('auth.loginMisconfigured')
              : t('auth.loginFailed');
        Alert.alert(t('auth.pinTitle'), message);
        return;
      }

      applyRestLoginSession(result.data, displayPhone);

      const restUser = result.data.user;
      if (isMerchantServerRole(normalizeServerUserRole(restUser.role))) {
        setMode('B2B_MODE');
      }

      if (restUserHasCompletedProfile(restUser)) {
        goToMainApp();
        return;
      }

      navigation.replace('RoleSelection');
    } finally {
      setSubmitting(false);
    }
  };

  const onContinue = () => {
    if (useRestLogin) {
      void onRestContinue();
      return;
    }
    onDemoContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{useRestLogin ? t('auth.pinTitle') : t('auth.otpTitle')}</Text>
        <Text style={styles.sub}>
          {useRestLogin ? t('auth.pinSubtitleRest') : t('auth.pinSubtitleDemo')}
        </Text>
        {displayPhone ? (
          <Text style={styles.phoneHint} numberOfLines={1}>
            {displayPhone}
          </Text>
        ) : null}

        {useRestLogin ? (
          <TextInput
            value={pinCode}
            onChangeText={setPinCode}
            placeholder={t('login.pin_placeholder')}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={32}
            style={styles.pinInput}
            placeholderTextColor={Colors.textSoft}
            editable={!submitting}
          />
        ) : (
          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(r) => {
                  refs.current[idx] = r;
                }}
                value={digit}
                onChangeText={(v) => updateOtpDigit(idx, v)}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.otpBox}
              />
            ))}
          </View>
        )}

        {restPinError ? <Text style={styles.errorText}>{restPinError}</Text> : null}

        <Pressable
          onPress={onContinue}
          disabled={!canContinue || submitting}
          style={({ pressed }) => [
            styles.cta,
            !canContinue && styles.ctaDisabled,
            pressed && canContinue && { opacity: 0.82 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFE9D2" />
          ) : (
            <Text style={styles.ctaText}>{useRestLogin ? t('auth.verifyBtn') : t('auth.otpVerifyBtn')}</Text>
          )}
        </Pressable>
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
  sub: { fontSize: 13, lineHeight: 20, color: Colors.textSoft, fontFamily: FontFamily.regular, marginBottom: 8 },
  phoneHint: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
    marginBottom: 12,
  },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    fontSize: 24,
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  pinInput: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: 4,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#B71C1C',
    fontFamily: FontFamily.regular,
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
});
