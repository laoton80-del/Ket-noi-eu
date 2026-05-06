/**
 * Product analytics via PostHog (generous free tier). Client-only — lazy-loads native SDK so web bundles stay safe.
 *
 * Privacy: never send passwords, PINs, card/bank fields, raw transcripts, or free-text chat. Properties are sanitized.
 * Offline: `persistence: 'file'` queues events until connectivity (PostHog RN default behavior).
 */

import { Platform } from 'react-native';

import type { PostHog } from 'posthog-react-native';

let posthogClient: PostHog | null = null;
let initAttempted = false;

const SENSITIVE_KEY_RE =
  /(password|pincode|pin|secret|token|authorization|bearer|cardnumber|cvv|cvc|iban|accountnumber|routing|ssn|transcript|chatlog|messagebody|plaintext|banking|email|phone|e164)/i;

function isSafeKey(key: string): boolean {
  if (SENSITIVE_KEY_RE.test(key)) return false;
  if (key.startsWith('$') && key !== '$screen_name') return false;
  return true;
}

/** Flat properties only — drops nested objects/arrays (no PII blobs). */
export function sanitizeAnalyticsProperties(
  input: Record<string, unknown> | null | undefined
): Record<string, string | number | boolean | null> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [rawKey, rawVal] of Object.entries(input)) {
    if (!isSafeKey(rawKey)) continue;
    if (rawVal === null || typeof rawVal === 'boolean' || typeof rawVal === 'number') {
      if (typeof rawVal === 'number' && !Number.isFinite(rawVal)) continue;
      out[rawKey] = rawVal;
      continue;
    }
    if (typeof rawVal === 'string') {
      if (rawVal.length > 120) continue;
      out[rawKey] = rawVal;
      continue;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function loadPostHogConstructor(): (new (apiKey: string, options?: ConstructorParameters<typeof PostHog>[1]) => PostHog) | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('posthog-react-native').default as new (
      apiKey: string,
      options?: ConstructorParameters<typeof PostHog>[1]
    ) => PostHog;
  } catch {
    return null;
  }
}

/**
 * Call once at app startup (e.g. `App.tsx`). No-op without `EXPO_PUBLIC_POSTHOG_KEY` or on web.
 */
export function initProductAnalytics(): void {
  if (initAttempted) return;
  initAttempted = true;
  if (Platform.OS === 'web') return;

  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim() ?? '';
  if (!apiKey) return;

  const hostRaw = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
  const host = hostRaw.replace(/\/+$/, '');

  const PostHog = loadPostHogConstructor();
  if (!PostHog) return;

  try {
    posthogClient = new PostHog(apiKey, {
      host,
      persistence: 'file',
      captureAppLifecycleEvents: true,
    });
  } catch (e) {
    console.warn('[Analytics] PostHog init failed', e);
    posthogClient = null;
  }
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (!posthogClient || !eventName || eventName.length > 120) return;
  const safe = sanitizeAnalyticsProperties(properties);
  try {
    posthogClient.capture(eventName, safe ?? {});
  } catch (e) {
    console.warn('[Analytics] capture failed', e);
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (!posthogClient || !userId || userId.length > 128) return;
  const safe = sanitizeAnalyticsProperties(traits);
  try {
    posthogClient.identify(userId, safe ?? {});
  } catch (e) {
    console.warn('[Analytics] identify failed', e);
  }
}

export function resetUser(): void {
  if (!posthogClient) return;
  try {
    posthogClient.reset();
  } catch (e) {
    console.warn('[Analytics] reset failed', e);
  }
}
