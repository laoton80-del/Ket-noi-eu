import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { persistUserLanguage, useTranslation } from '../utils/i18n';
import { DemoTriggerButton } from '../components/onboarding/DemoTriggerButton';
import { WelcomeBrandPanel } from './auth/WelcomeScreen';
import { FontFamily } from '../theme/typography';
import { vionaHybrid } from '../components/viona/vionaTrustTokens';
import { vionaTokens } from '../design';

type Nav = NativeStackNavigationProp<RootStackParamList>;
/** Ordering: Vietnam / major EU dial codes first — avoid +420 as the default-first option. */
const COUNTRY_CODES = ['+84', '+49', '+33', '+44', '+48', '+421', '+420'];

const LOGIN_INK = '#1a1426';
const LOGIN_INK_SOFT = 'rgba(26, 20, 38, 0.72)';
const LOGIN_TRUST_CTA = vionaHybrid.trustBlue;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { beginLogin, pendingRedirect } = useAuth();
  const [phone, setPhone] = useState('');
  const [codeIndex, setCodeIndex] = useState(0);
  const canContinue = useMemo(() => phone.trim().length >= 7, [phone]);

  const primaryLang = (i18n.language ?? 'en').split('-')[0] ?? 'en';
  const vnActive = primaryLang === 'vi';
  const enActive = primaryLang === 'en' || primaryLang === 'cs' || primaryLang === 'de';

  const onContinue = () => {
    if (!canContinue) return;
    beginLogin(`${COUNTRY_CODES[codeIndex]} ${phone.trim()}`);
    navigation.navigate('Otp');
  };

  const onPickLanguage = (code: 'vi' | 'en') => {
    void persistUserLanguage(code);
  };

  const redirectFeatureName = pendingRedirect ? t(`login.redirects.${pendingRedirect}`) : '';

  const onPreLoginSos = () => {
    Alert.alert(t('sos.preLoginTitle'), `${t('sos.preLoginBody')}\n\n${t('sos.disclaimer')}`, [
      { text: t('sos.preLoginAck'), style: 'default' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.langBar}>
        <Pressable
          onPress={onPreLoginSos}
          style={({ pressed }) => [styles.sosPreLogin, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('sos.a11yChip')}
        >
          <Text style={styles.sosPreLoginText}>{t('sos.chip')}</Text>
        </Pressable>
        <View style={styles.langBarSpacer} />
        <View style={styles.langSwitcher}>
          <Pressable
            onPress={() => onPickLanguage('vi')}
            style={({ pressed }) => [styles.langChip, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Tiếng Việt"
          >
            <Text style={[styles.langChipText, vnActive && styles.langChipTextActive]} numberOfLines={1}>
              🇻🇳 VN
            </Text>
          </Pressable>
          <Text style={styles.langSep}>|</Text>
          <Pressable
            onPress={() => onPickLanguage('en')}
            style={({ pressed }) => [styles.langChip, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="English"
          >
            <Text style={[styles.langChipText, enActive && styles.langChipTextActive]} numberOfLines={1}>
              🇬🇧 EN
            </Text>
          </Pressable>
        </View>
      </View>

      <WelcomeBrandPanel />
      <View style={styles.card}>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
          {t('login.welcome')}
        </Text>
        <Text style={styles.sub} numberOfLines={4}>
          {t('login.subtitle')}
        </Text>
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
            placeholder={t('login.phone_placeholder')}
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
          <Text style={styles.ctaText} numberOfLines={1}>
            {t('login.login_btn')}
          </Text>
        </Pressable>

        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt} numberOfLines={2}>
            {t('login.register_prompt')}{' '}
          </Text>
          <Pressable
            onPress={() => Alert.alert(t('login.register_link'), t('login.register_toast'))}
            hitSlop={8}
          >
            <Text style={styles.registerLink} numberOfLines={2}>
              {t('login.register_link')}
            </Text>
          </Pressable>
        </View>

        {pendingRedirect ? (
          <Text style={styles.redirectHint} numberOfLines={3}>
            {t('login.redirect_intro')} {redirectFeatureName}
          </Text>
        ) : null}

        <DemoTriggerButton navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vionaHybrid.background, justifyContent: 'center', paddingHorizontal: 18 },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 36,
  },
  sosPreLogin: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.sosNeonGlow,
    backgroundColor: 'rgba(40, 10, 14, 0.55)',
    shadowColor: vionaTokens.fashionTech.sosNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  sosPreLoginText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: vionaTokens.fashionTech.sosNeon,
  },
  langBarSpacer: { flex: 1 },
  langSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  langChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.75)',
    maxWidth: 120,
  },
  langChipText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: 'rgba(31,26,20,0.55)',
  },
  langChipTextActive: {
    color: '#B8860B',
  },
  langSep: {
    fontSize: 13,
    color: 'rgba(31,26,20,0.35)',
    fontFamily: FontFamily.regular,
  },
  pressed: { opacity: 0.85 },
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
  title: {
    fontSize: 27,
    color: LOGIN_INK,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
    flexShrink: 1,
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    color: LOGIN_INK_SOFT,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
    flexShrink: 1,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
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
  codeText: { color: LOGIN_INK, fontFamily: FontFamily.semibold, fontSize: 14 },
  input: {
    flex: 1,
    minWidth: 120,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 12,
    color: LOGIN_INK,
    fontFamily: FontFamily.medium,
  },
  cta: {
    height: 46,
    borderRadius: 12,
    marginTop: 14,
    backgroundColor: LOGIN_TRUST_CTA,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#FFFFFF', fontFamily: FontFamily.bold, fontSize: 15, textAlign: 'center' },
  registerRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  registerPrompt: {
    fontSize: 13,
    color: LOGIN_INK_SOFT,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
  },
  registerLink: {
    fontSize: 13,
    color: '#B8860B',
    fontFamily: FontFamily.semibold,
    textDecorationLine: 'underline',
    flexShrink: 1,
  },
  redirectHint: {
    marginTop: 10,
    fontSize: 12,
    color: LOGIN_INK_SOFT,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
  },
});
