import type { RedirectTarget } from '../context/AuthContext';

/**
 * Launch rollout switchboard for **public** surfaces.
 *
 * ## In scope (launch-ready flows)
 * - Live Interpreter (`LiveInterpreter`)
 * - Leona legal / booking assist (`LeonaCall`)
 * - Vault + OCR + expiry reminders (`Vault`, `DocumentAlarmService`)
 * - LifeOS hub (`LifeOSDashboard`)
 * - Wallet / top-up (`Wallet` / `ComboWalletScreen`)
 * - Emergency SOS (`EmergencySOS`)
 * - Le Tan reception tab (AI concierge — launch core)
 *
 * ## Deprioritized / off by default
 * - **Community** (`CongDong`): tab hidden; if opened for testing, show pre-launch notice
 * - **Kết Nối Yêu Thương**: utility-tile only when explicitly enabled (keeps launch scope off monetized paths)
 * - **Radar**: preview-only; stack entry redirects to Leona when off
 * - **Marketplace auto-book** suggestions / LifeOS marketplace CTA: off until real merchant UX ships
 *
 * Toggle only one place: flip flags below after QA sign-off per surface.
 */
export const LAUNCH_PILOT_CONFIG = {
  enableCommunitySurface: false,
  enableYeuThuongSurface: false,
  enableRadarSurface: false,
  enableMarketplaceSurface: false,
} as const;

/** Prefill when Radar routes are rewritten to Leona during launch rollout. */
export const PILOT_LEONA_SERVICES_FALLBACK_PREFILL = 'Tôi cần tìm dịch vụ phù hợp gần khu vực của tôi.';

/** When Radar is off, stack redirects that targeted Radar should land on Leona instead. */
export function resolvePilotAwareRedirectTarget(target: RedirectTarget): RedirectTarget {
  if (!LAUNCH_PILOT_CONFIG.enableRadarSurface && target === 'RadarDiscovery') {
    return 'LeonaCall';
  }
  return target;
}
