import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';
import { VionaBrandLockup } from '../../components/viona/VionaBrandLockup';
import { vionaTrust } from '../../components/viona/vionaTrustTokens';
import { vionaTokens } from '../../design';

type WelcomeBrandTone = 'light' | 'dark';

type WelcomeBrandPanelProps = Readonly<{
  tone?: WelcomeBrandTone;
}>;

const ft = vionaTokens.fashionTech;
const LUM_CYAN_EDGE = `${ft.accentCyan}ea`;
const LUM_GOLD_EDGE = `${ft.accentGold}ea`;
const LUM_GLOW_CYAN = 'rgba(128, 210, 255, 0.14)';
const LUM_GLOW_GOLD = 'rgba(238, 206, 128, 0.14)';

/**
 * Brand hero used on auth entry (Login / onboarding modals).
 */
export function WelcomeBrandPanel({ tone = 'light' }: WelcomeBrandPanelProps): ReactElement {
  const { t } = useTranslation();
  const dark = tone === 'dark';
  return (
    <View style={styles.wrap}>
      <View style={styles.logoWrap}>
        <VionaBrandLockup variant="hero" showAccentUnderline style={styles.heroLockup} />
        {dark ? (
          <View style={styles.statusChips}>
            <View style={styles.statusChipCyan}>
              <Text style={styles.statusChipTextCyan}>Global</Text>
            </View>
            <View style={styles.statusChipGold}>
              <Text style={styles.statusChipTextGold}>Vietnamese companion</Text>
            </View>
          </View>
        ) : null}
      </View>
      {dark ? (
        <View style={styles.taglineRow}>
          <View style={styles.subGlassMarker} />
          <Text style={[styles.sub, styles.subDark]}>{t('login.brandTagline')}</Text>
        </View>
      ) : (
        <View style={styles.subGlass}>
          <Text style={styles.sub}>{t('login.brandTagline')}</Text>
        </View>
      )}
      <View style={styles.merchantSub}>
        <Text style={[styles.merchantSubText, dark && styles.merchantSubTextDark]}>
          {t('login.brandEcosystemLine')}
        </Text>
      </View>
    </View>
  );
}

/** Stand-alone welcome shell — compose inside navigators if a dedicated Welcome route is added later. */
export function WelcomeScreen(): ReactElement {
  return (
    <View style={styles.screen}>
      <WelcomeBrandPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  wrap: {
    marginBottom: 14,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  heroLockup: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    maxWidth: '100%',
  },
  statusChipCyan: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: LUM_CYAN_EDGE,
    backgroundColor: 'rgba(12, 18, 28, 0.94)',
    shadowColor: LUM_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  statusChipGold: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: LUM_GOLD_EDGE,
    backgroundColor: 'rgba(12, 18, 28, 0.94)',
    shadowColor: LUM_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  statusChipTextCyan: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: 'rgba(112, 200, 255, 0.88)',
    letterSpacing: 0.3,
  },
  statusChipTextGold: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: 'rgba(233, 199, 120, 0.88)',
    letterSpacing: 0.2,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  subGlassMarker: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: ft.accentCyan,
    opacity: 0.55,
  },
  subGlass: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: LUM_CYAN_EDGE,
    backgroundColor: vionaTrust.surface,
    shadowColor: LUM_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  merchantSub: {
    marginTop: 8,
    alignItems: 'center',
  },
  merchantSubText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.semibold,
    color: 'rgba(26, 20, 38, 0.66)',
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.semibold,
    color: 'rgba(26, 20, 38, 0.88)',
    textAlign: 'center',
  },
  subDark: {
    color: ft.textPrimary,
    flex: 1,
    textAlign: 'left',
  },
  merchantSubTextDark: {
    color: ft.textSecondary,
  },
});
