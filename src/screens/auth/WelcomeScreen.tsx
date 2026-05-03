import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BRAND_CONFIG } from '../../config/brandConfig';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

const MERCHANT_SUBLABEL = `${BRAND_CONFIG.publicName} - Powered by ${BRAND_CONFIG.internalName} Ecosystem` as const;

/**
 * Brand hero used on auth entry (Login / onboarding modals).
 */
export function WelcomeBrandPanel(): ReactElement {
  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>{BRAND_CONFIG.publicName}</Text>
      <View style={styles.subGlass} className={applyWebStyles('kn-glass kn-neon-b2b')}>
        <Text style={styles.sub}>{BRAND_CONFIG.tagline}</Text>
      </View>
      <View style={styles.merchantSub}>
        <Text style={styles.merchantSubText}>{MERCHANT_SUBLABEL}</Text>
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(197, 160, 89, 0.35)',
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
