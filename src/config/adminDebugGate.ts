/**
 * Super-admin / QA surfaces (e.g. `AdminDashboard`) must stay **off** for external pilot builds.
 *
 * **Production / controlled external pilot:** leave `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG` unset or not `1`.
 * No secret tap, no PIN, no `AdminDashboard` route — removes discoverable client backdoors.
 *
 * **Internal engineering builds only:** set at build time:
 * - `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1`
 * - `EXPO_PUBLIC_ADMIN_PIN=<min 8 chars>` (never commit; use EAS/CI secrets)
 *
 * @see `docs/PILOT_TRUST_ENV.md`
 */
const RELEASE_DEBUG_ACK = 'I_UNDERSTAND_INSECURE_CLIENT_DEBUG_SURFACE';

function isAdminDebugRequested(): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_ADMIN_DEBUG?.trim() === '1';
}

function hasReleaseDebugAck(): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_ADMIN_DEBUG_RELEASE_ACK?.trim() === RELEASE_DEBUG_ACK;
}

export function isAdminDebugSurfaceEnabled(): boolean {
  if (!isAdminDebugRequested()) return false;
  if (__DEV__) return true;
  // Release bundles require explicit risk acknowledgment to expose discoverable debug surfaces.
  return hasReleaseDebugAck();
}

/**
 * Returns null when PIN prompt must not be used.
 * Security posture: never rely on EXPO_PUBLIC_* PIN in release bundles (client-extractable).
 */
export function getConfiguredAdminDebugPin(): string | null {
  if (!__DEV__) return null;
  const p = process.env.EXPO_PUBLIC_ADMIN_PIN?.trim() ?? '';
  return p.length >= 12 ? p : null;
}

export function isAdminDebugPinConfigured(): boolean {
  return getConfiguredAdminDebugPin() !== null;
}

/**
 * Logs once per cold start if admin debug is enabled on a non-dev bundle (e.g. internal APK/TestFlight).
 * Does not block the app — reminder to strip `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG` before store / external pilot.
 */
export function warnIfAdminDebugInReleaseBuild(): void {
  if (__DEV__) return;
  if (!isAdminDebugRequested()) return;
  if (!hasReleaseDebugAck()) {
    console.error(
      '[ketnoieu] Admin debug requested on release build but blocked (missing EXPO_PUBLIC_ENABLE_ADMIN_DEBUG_RELEASE_ACK).'
    );
    return;
  }
  console.warn('[ketnoieu] Admin debug enabled on release build with explicit risk acknowledgment. Use internal-only.');
}
