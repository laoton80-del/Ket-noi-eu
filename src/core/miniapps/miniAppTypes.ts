import type { FeatureFlagKey } from '../feature-flags/featureFlags';

export type MiniAppId =
  | 'hub'
  | 'local'
  | 'booking'
  | 'merchant'
  | 'vio_points'
  | 'academy'
  | 'leona_assistant'
  | 'travel'
  | 'b2b_ai_receptionist'
  | 'broker'
  | 'legal_scan'
  | 'payroll'
  | 'vio_economy';

/**
 * - `lite` / `pilot`: same gating as `beta` (flag must be on); use descriptions to spell “Lite” / “Pilot”.
 * - `coming_soon`: visible in catalog as roadmap slot even when flag is false.
 */
export type MiniAppStatus = 'active' | 'beta' | 'lite' | 'pilot' | 'coming_soon' | 'frozen';

/** Who may access the mini-app shell when enabled (policy layer may refine further). */
export type MiniAppRequiredRole = 'guest' | 'user' | 'merchant' | 'broker' | 'admin';

export type MiniAppDefinition = Readonly<{
  id: MiniAppId;
  name: string;
  status: MiniAppStatus;
  /** Stable route key for future wiring (not yet bound to React Navigation). */
  route: string;
  requiredRole: MiniAppRequiredRole;
  /** Key into {@link getFeatureFlags} — must match a flag that gates this mini-app. */
  featureFlag: FeatureFlagKey;
  description: string;
  /** Sort order for registry listings (ascending). */
  order: number;
}>;
