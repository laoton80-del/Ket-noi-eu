/**
 * **Monitoring Radar** — Sentry for React Native / Expo. Initializes once from `EXPO_PUBLIC_SENTRY_DSN`.
 * Safe for local dev when DSN is unset (no network, no crash).
 */
import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initMonitoringRadar(): void {
  if (initialized) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';
  if (!dsn) {
    return;
  }

  try {
    Sentry.init({
      dsn,
      enabled: true,
      environment: __DEV__ ? 'development' : 'production',
      debug: __DEV__,
      enableAutoSessionTracking: true,
      tracesSampleRate: __DEV__ ? 1.0 : 0.12,
    });
    initialized = true;
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[MonitoringRadar] Sentry init failed (app continues):', e);
    }
  }
}
