import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { persistUserLanguage, useTranslation } from '../utils/i18n';
import { DemoTriggerButton } from '../components/onboarding/DemoTriggerButton';
import { WelcomeBrandPanel } from './auth/WelcomeScreen';
import { FontFamily } from '../theme/typography';
import { vionaTokens } from '../design';
import {
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from '../components/viona/fashionHomeDesktopShell';
import { SOS_PLUS_PROFILE_UI_ENABLED } from '../config/sosPlusProduction';
import { SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED } from '../config/sosPlusSurface';
import { VionaSosHoldGateModal, VionaSosPlusInfoModal } from '../components/viona';

type Nav = NativeStackNavigationProp<RootStackParamList>;
/** Ordering: Vietnam / major EU dial codes first — avoid +420 as the default-first option. */
const COUNTRY_CODES = ['+84', '+49', '+33', '+44', '+48', '+421', '+420'];

const ft = vionaTokens.fashionTech;
const LUM_PANEL_BORDER = 'rgba(148, 172, 198, 0.44)';
const LUM_CYAN_EDGE = `${ft.accentCyan}ea`;
const LUM_GOLD_EDGE = `${ft.accentGold}ea`;
const LUM_GLOW_CYAN = 'rgba(128, 210, 255, 0.14)';
const LUM_GLOW_GOLD = 'rgba(238, 206, 128, 0.14)';
const LUM_INNER_HIGHLIGHT = 'rgba(255, 232, 188, 0.2)';
const IMG_LOGIN_CONSTELLATION = require('../../assets/UI/viona-login-global-net-bg-v2.png');
const constellationImageWebFit =
  Platform.OS === 'web'
    ? ({ objectFit: 'cover' as const, objectPosition: '58% 22%' as const } as const)
    : null;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { beginLogin, pendingRedirect } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const constellationImageSize = useMemo(
    () => ({
      maxWidth: Math.min(windowWidth, 1672),
    }),
    [windowWidth],
  );
  const [phone, setPhone] = useState('');
  const [codeIndex, setCodeIndex] = useState(0);
  const [preLoginSosOpen, setPreLoginSosOpen] = useState(false);
  const [preLoginPlusInfoOpen, setPreLoginPlusInfoOpen] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
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
    setPreLoginPlusInfoOpen(false);
    setPreLoginSosOpen(true);
  };

  const onPreLoginHoldComplete = () => {
    setPreLoginSosOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backdrop} pointerEvents="none">
        <View style={styles.constellationFrame}>
          <Image
            source={IMG_LOGIN_CONSTELLATION}
            style={[styles.constellationImage, constellationImageSize, constellationImageWebFit]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
        <View style={styles.constellationOverlay} />
      </View>
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
            style={({ pressed }) => [
              styles.langChip,
              vnActive && styles.langChipActiveCyan,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tiếng Việt"
          >
            <Text
              style={[styles.langChipText, vnActive && styles.langChipTextActiveCyan]}
              numberOfLines={1}
            >
              🇻🇳 VN
            </Text>
          </Pressable>
          <Text style={styles.langSep}>|</Text>
          <Pressable
            onPress={() => onPickLanguage('en')}
            style={({ pressed }) => [
              styles.langChip,
              enActive && styles.langChipActiveGold,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="English"
          >
            <Text
              style={[styles.langChipText, enActive && styles.langChipTextActiveGold]}
              numberOfLines={1}
            >
              🇬🇧 EN
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.brandStage}>
        <WelcomeBrandPanel tone="dark" />
      </View>
      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <View style={styles.cardInnerVeil} pointerEvents="none" />
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
          <View style={styles.phoneField}>
            {phoneFocused ? <View style={styles.phoneMarker} /> : null}
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={t('login.phone_placeholder')}
              keyboardType="phone-pad"
              style={[styles.input, phoneFocused && styles.inputFocused]}
              placeholderTextColor="rgba(244, 246, 250, 0.72)"
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
            />
          </View>
        </View>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.cta,
            canContinue && styles.ctaEnabled,
            !canContinue && styles.ctaDisabled,
            pressed && { opacity: 0.82 },
          ]}
          disabled={!canContinue}
        >
          <Text
            style={[styles.ctaText, canContinue && styles.ctaTextEnabled, !canContinue && styles.ctaTextDisabled]}
            numberOfLines={1}
          >
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
        <View
          pointerEvents="none"
          style={[styles.cardEdgeOverlay, premiumFrameEdgeOverlay(22), premiumCrispEdgeStroke(LUM_PANEL_BORDER)]}
        />
        <View pointerEvents="none" style={styles.cardTopHighlight} />
      </View>

      <VionaSosHoldGateModal
        visible={preLoginSosOpen}
        variant="preLogin"
        onRequestClose={() => setPreLoginSosOpen(false)}
        onHoldComplete={onPreLoginHoldComplete}
        onOpenPlusInfo={
          SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED ? () => setPreLoginPlusInfoOpen(true) : undefined
        }
      />
      {SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED ? (
        <VionaSosPlusInfoModal
          visible={preLoginPlusInfoOpen}
          onRequestClose={() => setPreLoginPlusInfoOpen(false)}
          onPressOpenProfile={
            SOS_PLUS_PROFILE_UI_ENABLED
              ? () => {
                  setPreLoginPlusInfoOpen(false);
                  navigation.navigate('SosPlusProfile');
                }
              : undefined
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ft.canvas,
    justifyContent: 'center',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: ft.canvas,
    overflow: 'hidden',
  },
  constellationFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  constellationImage: {
    width: '100%',
    height: '100%',
    opacity: 0.64,
  },
  constellationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 9, 14, 0.24)',
  },
  brandStage: {
    position: 'relative',
    marginBottom: 2,
    zIndex: 1,
  },
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
    shadowColor: 'rgba(255, 92, 108, 0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
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
    borderColor: 'rgba(136, 218, 255, 0.4)',
    backgroundColor: ft.surface,
    maxWidth: 120,
  },
  langChipText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: ft.mutedOnDark,
  },
  langChipActiveCyan: {
    borderWidth: 1,
    borderColor: LUM_CYAN_EDGE,
    backgroundColor: 'rgba(112, 200, 255, 0.12)',
    shadowColor: LUM_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  langChipActiveGold: {
    borderWidth: 1,
    borderColor: LUM_GOLD_EDGE,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    shadowColor: LUM_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  langChipTextActiveCyan: {
    color: ft.accentCyan,
  },
  langChipTextActiveGold: {
    color: '#e8c97a',
  },
  langSep: {
    fontSize: 13,
    color: ft.mutedOnDark,
    fontFamily: FontFamily.regular,
  },
  pressed: { opacity: 0.85 },
  cardWrap: {
    position: 'relative',
    zIndex: 1,
    borderRadius: 22,
    shadowColor: LUM_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    borderRadius: 22,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    padding: 16,
    paddingTop: 18,
    overflow: 'hidden',
  },
  cardEdgeOverlay: {
    pointerEvents: 'none',
  },
  cardInnerVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 72,
    backgroundColor: 'rgba(112, 200, 255, 0.07)',
  },
  cardTopHighlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    height: 1,
    backgroundColor: LUM_INNER_HIGHLIGHT,
  },
  title: {
    fontSize: 27,
    color: ft.textPrimary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
    flexShrink: 1,
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    color: ft.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
    flexShrink: 1,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  codeBtn: {
    minWidth: 76,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    borderWidth: 1,
    borderColor: LUM_GOLD_EDGE,
    shadowColor: LUM_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  codeText: { color: ft.champagne, fontFamily: FontFamily.semibold, fontSize: 14, opacity: 0.94 },
  phoneField: {
    flex: 1,
    minWidth: 120,
    position: 'relative',
    justifyContent: 'center',
  },
  phoneMarker: {
    position: 'absolute',
    left: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ft.accentCyan,
    opacity: 0.88,
    zIndex: 1,
  },
  input: {
    flex: 1,
    minWidth: 120,
    minHeight: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(136, 218, 255, 0.4)',
    backgroundColor: 'rgba(10, 14, 22, 0.96)',
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    color: ft.textPrimary,
    fontFamily: FontFamily.medium,
  },
  inputFocused: {
    borderColor: LUM_CYAN_EDGE,
    backgroundColor: 'rgba(10, 14, 22, 1)',
    paddingLeft: 26,
    shadowColor: LUM_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  cta: {
    height: 46,
    borderRadius: 12,
    marginTop: 14,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(244, 214, 144, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  ctaEnabled: {
    backgroundColor: '#e8c97a',
    borderColor: LUM_GOLD_EDGE,
    borderWidth: 1,
    shadowColor: LUM_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  ctaDisabled: {
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    borderColor: 'rgba(244, 214, 144, 0.34)',
  },
  ctaText: { fontFamily: FontFamily.bold, fontSize: 15, textAlign: 'center' },
  ctaTextEnabled: { color: ft.canvas },
  ctaTextDisabled: { color: 'rgba(201, 169, 98, 0.62)' },
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
    color: ft.textSecondary,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
  },
  registerLink: {
    fontSize: 13,
    color: ft.champagne,
    fontFamily: FontFamily.semibold,
    textDecorationLine: 'underline',
    flexShrink: 1,
  },
  redirectHint: {
    marginTop: 10,
    fontSize: 12,
    color: ft.textSecondary,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
  },
});
