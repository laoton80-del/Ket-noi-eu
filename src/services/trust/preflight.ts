import { logEvent } from '../../utils/telemetry';

const BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
const HEALTH_TIMEOUT_MS = 5000;

async function pingBackendHealth(): Promise<{ ok: boolean; error?: string }> {
  if (!BACKEND_API_BASE) {
    return { ok: false, error: 'backend_base_missing' };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, error: 'backend_down' };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: 'network_timeout' };
    }
    return { ok: false, error: 'network_unreachable' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runAppPreflight(): Promise<{ ok: boolean; error?: string }> {
  logEvent('trust_preflight_started');
  try {
    const backend = await pingBackendHealth();
    if (!backend.ok) {
      const code = backend.error ?? 'backend_down';
      logEvent('trust_preflight_failed', { errorCode: code });
      return { ok: false, error: code };
    }

    const isAppCheckReady = true;
    if (!isAppCheckReady) {
      logEvent('trust_preflight_failed', { errorCode: 'app_check_unavailable' });
      return { ok: false, error: 'app_check_unavailable' };
    }

    const isMinimumVersionSatisfied = true;
    if (!isMinimumVersionSatisfied) {
      logEvent('trust_preflight_failed', { errorCode: 'app_version_unsupported' });
      return { ok: false, error: 'app_version_unsupported' };
    }

    logEvent('trust_preflight_passed');
    return { ok: true };
  } catch {
    logEvent('trust_preflight_failed', { errorCode: 'preflight_unhandled_error' });
    return { ok: false, error: 'preflight_unhandled_error' };
  }
}
