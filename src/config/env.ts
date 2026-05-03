/**
 * Central environment access for ViGlobal (Expo client + Node API).
 *
 * **Security model**
 * - **Never** ship `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, or SMTP secrets in the React Native bundle.
 *   Those exist only in `process.env` on the server (Express, Cloud Functions, CI) after `dotenv` or host injection.
 * - **Client-safe:** Stripe **publishable** key is exposed via `app.config.js` → `expo-constants` (`extra.stripePublishableKey`)
 *   and optionally `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Expo / Metro inlining).
 *
 * **Why not `react-native-dotenv`:** Expo loads root `.env` for `EXPO_PUBLIC_*` and we load the same file in `app.config.js`
 * with `dotenv` so build-time `extra` stays in sync with the CEO’s canonical variable names in `.env`.
 */
import Constants from 'expo-constants';

export type ServerEnv = {
  stripePublishableKey: string;
  stripeSecretKey: string;
  openaiApiKey: string;
  /** Transactional email (Zero-SMS Doctrine). Set SMTP_HOST, MAIL_FROM, SMTP_USER, SMTP_PASS. */
  smtpConfigured: boolean;
};

function trim(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

type ExpoExtra = {
  stripePublishableKey?: string;
};

function readExtra(): ExpoExtra {
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  return extra ?? {};
}

/**
 * Client-safe Stripe publishable key for `@stripe/stripe-react-native` / PaymentSheet.
 * Prefer values from `.env` → `app.config.js` `extra` at build time; Metro can also set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
 */
export function getStripePublishableKey(): string {
  const fromConfig = trim(readExtra().stripePublishableKey);
  const fromPublic = trim(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return fromConfig || fromPublic;
}

/** All values safe to reference from UI / client services (no secrets). */
export const clientPublicEnv = {
  get stripePublishableKey() {
    return getStripePublishableKey();
  },
} as const;

/**
 * **Server-only.** Read full key set from `process.env` (root `.env` via `import 'dotenv/config'` in `src/server.ts`, or EAS/CI).
 * Do **not** import this from React screens or shared client modules — secrets would still bundle if imported from client entry paths.
 */
export function getServerEnv(): ServerEnv {
  const host = trim(process.env.SMTP_HOST);
  const from = trim(process.env.MAIL_FROM) || trim(process.env.SMTP_FROM);
  return {
    stripePublishableKey: trim(process.env.STRIPE_PUBLISHABLE_KEY),
    stripeSecretKey: trim(process.env.STRIPE_SECRET_KEY),
    openaiApiKey: trim(process.env.OPENAI_API_KEY),
    smtpConfigured: Boolean(host && from),
  };
}
