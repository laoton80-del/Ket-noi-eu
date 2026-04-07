import type { GrowthEvent, GrowthEventName } from './types';
import { getGrowthSnapshot } from './tracker';

/**
 * Events the pilot treats as launch-critical for export / server ingestion.
 * All are appended via `trackGrowthEvent` / `trackGrowthEventOnce` into the local growth snapshot.
 */
export const LAUNCH_CRITICAL_ANALYTICS_EVENTS = [
  'app_open',
  'onboarding_complete',
  'first_interpreter',
  'first_call_attempt',
  'successful_credit_topup',
  'successful_booking',
  /** Legacy alias; still counted in funnel totals — keep in launch-critical set for export/debug parity. */
  'booking_success',
  'ocr_success',
  'ocr_fail',
] as const satisfies readonly GrowthEventName[];

export type LaunchCriticalAnalyticsEvent = (typeof LAUNCH_CRITICAL_ANALYTICS_EVENTS)[number];

export function isLaunchCriticalAnalyticsEvent(name: GrowthEventName): name is LaunchCriticalAnalyticsEvent {
  return (LAUNCH_CRITICAL_ANALYTICS_EVENTS as readonly string[]).includes(name);
}

/** Admin/debug: last N launch-critical rows from the local growth snapshot (AsyncStorage). */
export async function getLastLaunchCriticalGrowthEventsForDebug(limit: number): Promise<GrowthEvent[]> {
  const cap = Math.min(200, Math.max(1, Math.floor(limit)));
  const snap = await getGrowthSnapshot();
  const critical = snap.events.filter((e) => isLaunchCriticalAnalyticsEvent(e.name));
  return critical.slice(-cap);
}
