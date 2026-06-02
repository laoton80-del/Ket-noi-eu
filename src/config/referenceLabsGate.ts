/**
 * Master gate for VIONA Wave 3B reference visual labs (dev/capture only).
 *
 * Production / default builds: leave `EXPO_PUBLIC_VIONA_REFERENCE_LABS_ENABLED` unset.
 * Internal capture: set `EXPO_PUBLIC_VIONA_REFERENCE_LABS_ENABLED=true` at Expo start (see Pack 59A scripts).
 *
 * Per-lab screen gates (`EXPO_PUBLIC_VIONA_REFERENCE_*_LAB`) still apply when routes are registered.
 */
export function isReferenceLabsEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_REFERENCE_LABS_ENABLED?.trim();
  return v === '1' || v === 'true';
}
