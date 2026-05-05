import { getFeatureFlags, type FeatureFlags } from '../feature-flags/featureFlags';
import type { MiniAppDefinition, MiniAppId, MiniAppStatus } from './miniAppTypes';

function isGatedLaunchStatus(status: MiniAppStatus): boolean {
  return status === 'active' || status === 'beta' || status === 'lite' || status === 'pilot';
}

const REGISTRY: readonly MiniAppDefinition[] = [
  {
    id: 'hub',
    name: 'Hub',
    status: 'active',
    route: 'hub',
    requiredRole: 'user',
    featureFlag: 'hubEnabled',
    description: 'Life OS / command center — Super App Lite core.',
    order: 10,
  },
  {
    id: 'local',
    name: 'Local',
    status: 'active',
    route: 'local',
    requiredRole: 'user',
    featureFlag: 'localEnabled',
    description: 'Local discovery & merchant booking — primary business engine.',
    order: 20,
  },
  {
    id: 'booking',
    name: 'Booking',
    status: 'active',
    route: 'booking',
    requiredRole: 'user',
    featureFlag: 'bookingEnabled',
    description: 'Bookings and completion flows — Super App Lite core.',
    order: 30,
  },
  {
    id: 'merchant',
    name: 'Merchant Dashboard',
    status: 'beta',
    route: 'merchant',
    requiredRole: 'merchant',
    featureFlag: 'merchantDashboardEnabled',
    description: 'Merchant workspace (basic) — beta; tenant-isolated.',
    order: 40,
  },
  {
    id: 'vio_points',
    name: 'VIO Points',
    status: 'lite',
    route: 'vio_points',
    requiredRole: 'user',
    featureFlag: 'vioPointsDisplayEnabled',
    description:
      'VIO Points / VIO Credits display (loyalty & in-app credits). Full on-chain-style token economy stays frozen.',
    order: 45,
  },
  {
    id: 'academy',
    name: 'Academy',
    status: 'beta',
    route: 'academy',
    requiredRole: 'user',
    featureFlag: 'academyLiteEnabled',
    description: 'Academy Lite — Vietnamese learning & family modes; label non-prod AI as Lite/Beta.',
    order: 50,
  },
  {
    id: 'leona_assistant',
    name: 'Leona Assistant',
    status: 'beta',
    route: 'leona_assistant',
    requiredRole: 'user',
    featureFlag: 'leonaAssistantEnabled',
    description: 'Leona Assistant Lite — concierge / survival help; not lawyer/doctor replacement.',
    order: 55,
  },
  {
    id: 'travel',
    name: 'Travel',
    status: 'beta',
    route: 'travel',
    requiredRole: 'user',
    featureFlag: 'travelLiteEnabled',
    description: 'Travel Lite — safety, translation, fixer; premium paid legs stay gated until providers are real.',
    order: 60,
  },
  {
    id: 'b2b_ai_receptionist',
    name: 'B2B AI Receptionist',
    status: 'pilot',
    route: 'b2b_ai_receptionist',
    requiredRole: 'merchant',
    featureFlag: 'b2bAiReceptionistDemoEnabled',
    description:
      'B2B AI Receptionist — Demo/Pilot; production voice, auto-booking, inventory, bill, payment require separate env cutover flags.',
    order: 70,
  },
  {
    id: 'broker',
    name: 'Broker QR',
    status: 'frozen',
    route: 'broker',
    requiredRole: 'broker',
    featureFlag: 'brokerQrEnabled',
    description:
      'Broker QR & full commission engine — frozen until ledger + settlement gates; thaw only with EXPO_PUBLIC_FEATURE_BROKER_QR=true.',
    order: 80,
  },
  {
    id: 'legal_scan',
    name: 'Legal Scan',
    status: 'frozen',
    route: 'legal_scan',
    requiredRole: 'user',
    featureFlag: 'legalScanEnabled',
    description: 'Paid legal scan — frozen while output may be mock; kill-switch stays off by default.',
    order: 90,
  },
  {
    id: 'payroll',
    name: 'Payroll',
    status: 'frozen',
    route: 'payroll',
    requiredRole: 'merchant',
    featureFlag: 'payrollEnabled',
    description: 'Payroll automation — frozen until payroll production gate & policy pack.',
    order: 100,
  },
  {
    id: 'vio_economy',
    name: 'VIO Token Economy',
    status: 'frozen',
    route: 'vio_economy',
    requiredRole: 'user',
    featureFlag: 'vigTokenEconomyEnabled',
    description:
      'Withdrawable / tradable token economy — frozen in MVP; VIO Points display is separate (vio_points mini-app).',
    order: 110,
  },
];

function isFlagOn(flags: FeatureFlags, key: MiniAppDefinition['featureFlag']): boolean {
  return flags[key] === true;
}

/** Full catalog including frozen (for tooling/docs). */
export function getAllMiniApps(): readonly MiniAppDefinition[] {
  return REGISTRY;
}

/**
 * Mini-apps that may appear in a shell or picker.
 * - Excludes `frozen`.
 * - `active` / `beta` / `lite` / `pilot`: included only if their feature flag is true.
 * - `coming_soon`: included even when flag is false (teaser / roadmap slot).
 */
export function getVisibleMiniApps(): readonly MiniAppDefinition[] {
  const flags = getFeatureFlags();
  return REGISTRY.filter((app) => {
    if (app.status === 'frozen') {
      return false;
    }
    if (app.status === 'coming_soon') {
      return true;
    }
    if (isGatedLaunchStatus(app.status)) {
      return isFlagOn(flags, app.featureFlag);
    }
    return false;
  });
}

/** Subset that is both active status and flag-enabled (usable surfaces). */
export function getActiveMiniApps(): readonly MiniAppDefinition[] {
  const flags = getFeatureFlags();
  return REGISTRY.filter((app) => app.status === 'active' && isFlagOn(flags, app.featureFlag));
}

/**
 * True when the mini-app can be treated as enabled for real use:
 * not frozen, not coming_soon, launch status (active/beta/lite/pilot), and feature flag on.
 */
export function isMiniAppEnabled(id: MiniAppId): boolean {
  const flags = getFeatureFlags();
  const app = REGISTRY.find((a) => a.id === id);
  if (app == null) {
    return false;
  }
  if (app.status === 'frozen' || app.status === 'coming_soon') {
    return false;
  }
  if (!isGatedLaunchStatus(app.status)) {
    return false;
  }
  return isFlagOn(flags, app.featureFlag);
}

export function getMiniAppById(id: MiniAppId): MiniAppDefinition | undefined {
  return REGISTRY.find((a) => a.id === id);
}

export type { MiniAppStatus };
