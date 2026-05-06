import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';
import { vionaTrust } from '../../components/viona/vionaTrustTokens';

/**
 * Brand hero used on auth entry (Login / onboarding modals).
 */
export function WelcomeBrandPanel(): ReactElement {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>{t('login.brandName')}</Text>
      <View style={styles.subGlass}>
        <Text style={styles.sub}>{t('login.brandTagline')}</Text>
      </View>
      <View style={styles.merchantSub}>
        <Text style={styles.merchantSubText}>{t('login.brandEcosystemLine')}</Text>
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
  subGlass: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surface,
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
  logo: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: '#1a1426',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.semibold,
    color: 'rgba(26, 20, 38, 0.88)',
    textAlign: 'center',
  },
});
