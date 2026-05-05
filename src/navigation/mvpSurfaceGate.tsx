import type { ComponentType, ReactElement } from 'react';

import type { FeatureFlags } from '../core/feature-flags/featureFlags';
import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type MvpSurfaceDisabledScreenProps = Readonly<{
  title?: string;
  message: string;
}>;

/**
 * Minimal full-screen placeholder when a surface is gated off for MVP (no heavy UI).
 */
export function MvpSurfaceDisabledScreen({ title, message }: MvpSurfaceDisabledScreenProps): ReactElement {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.box}>
        {title != null && title.length > 0 ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.body}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  box: { flex: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

/** Academy Lite (learning / AI coach) — not production certification or camera grading. */
export const MVP_ACADEMY_LITE_OFF_MSG =
  'Academy Lite is not available in this build. Certification, camera grading, and other production academy flows stay off until enabled.' as const;

/** Travel Lite hub (discovery, guides) — paid checkout is gated separately. */
export const MVP_TRAVEL_LITE_OFF_MSG = 'Travel Lite is not available in this build.' as const;

/** Consumer Leona Assistant Lite — not B2B receptionist production or merchant vision. */
export const MVP_LEONA_LITE_OFF_MSG =
  'Leona Assistant Lite is not available in this build. When enabled, Leona provides AI guidance only — not legal, medical, emergency, or human-operator service.' as const;

/** B2B AI Receptionist demo / merchant intake — not consumer Leona. */
export const MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG =
  'B2B AI Receptionist demo is not available in this build. Merchant vision and intake use a separate flag from Leona Assistant Lite.' as const;

/** Live card / production checkout for travel commerce. */
export const MVP_LIVE_PAYMENT_OFF_MSG =
  'Live paid checkout (flights, hospitality, fixer checkout) is not enabled. Travel Lite discovery remains available; production payments require verified live Stripe.' as const;

/** Withdrawals / tradable token paths — VIO Points display can stay on. */
export const MVP_TOKEN_ECONOMY_OFF_MSG =
  'Cash-out and tradable token flows are not enabled. VIO Points and in-app Credits stay display-only in this build.' as const;

/** B2B AI Receptionist production shell (phone automation) must be explicitly enabled. */
export const MVP_B2B_AI_RECEPTIONIST_PRODUCTION_OFF_MSG =
  'B2B AI Receptionist production automation is not enabled. Demo and pilot surfaces may be visible, but production call automation stays blocked.' as const;

/** Auto-booking is guarded independently from demo/pilot availability. */
export const MVP_B2B_AUTO_BOOKING_OFF_MSG =
  'B2B auto-booking is disabled. Enable EXPO_PUBLIC_FEATURE_B2B_AUTO_BOOKING=true for production automation.' as const;

/** Auto-inventory is guarded independently from demo/pilot availability. */
export const MVP_B2B_AUTO_INVENTORY_OFF_MSG =
  'B2B auto-inventory sync is disabled. Enable EXPO_PUBLIC_FEATURE_B2B_AUTO_INVENTORY=true for production automation.' as const;

/** Auto bill print is guarded independently from demo/pilot availability. */
export const MVP_B2B_AUTO_BILL_PRINT_OFF_MSG =
  'B2B auto bill print is disabled. Enable EXPO_PUBLIC_FEATURE_B2B_AUTO_BILL_PRINT=true for production automation.' as const;

/** Auto payment is guarded independently from demo/pilot availability. */
export const MVP_B2B_AUTO_PAYMENT_OFF_MSG =
  'B2B auto payment is disabled. Enable EXPO_PUBLIC_FEATURE_B2B_AUTO_PAYMENT=true for production automation.' as const;

/** Omni demo surfaces should not appear unless explicitly enabled. */
export const MVP_OMNI_DEMO_OFF_MSG =
  'Omni demo surfaces are disabled in this build. Enable EXPO_PUBLIC_FEATURE_OMNI_DEMO=true to access demo metrics.' as const;

/**
 * Generic fallback when a control still checks the combined legacy gate.
 * Prefer {@link MVP_LEONA_LITE_OFF_MSG} or {@link MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG} for new code.
 */
export const MVP_AI_RECEPTIONIST_OFF_MSG =
  'AI assistant and B2B receptionist demo entrypoints are not available in this build.' as const;

/**
 * Wraps a screen so it only mounts when the given feature flag is true; otherwise shows MVP disabled copy.
 */
export function mvpGateByFlag<P extends object>(
  flag: keyof FeatureFlags,
  whenOffTitle: string,
  whenOffMessage: string,
  Inner: ComponentType<P>
): React.FC<P> {
  const Gated: React.FC<P> = (props) => {
    const flags = getFeatureFlags();
    if (!flags[flag]) {
      return <MvpSurfaceDisabledScreen title={whenOffTitle} message={whenOffMessage} />;
    }
    return <Inner {...props} />;
  };
  const innerName = Inner.displayName ?? Inner.name ?? 'Screen';
  Gated.displayName = `MvpGated(${innerName})`;
  return Gated;
}
