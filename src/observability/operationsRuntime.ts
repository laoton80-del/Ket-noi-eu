import AsyncStorage from '@react-native-async-storage/async-storage';

const OPS_PREFIX = '[kn-ops]';
const OPS_CONFIG_CACHE_KEY = 'kn_ops_remote_config_v1';
const OPS_SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

type LogLevel = 'info' | 'warn' | 'error';
type OpsConfigSource = 'env_only' | 'remote_cached' | 'remote_fresh';

export type OpsRuntimeConfig = {
  killSwitch: boolean;
  readOnlyMode: boolean;
  disabledFeatures: string[];
  source: OpsConfigSource;
  fetchedAt: number | null;
};

type OpsRemotePayload = {
  killSwitch?: boolean;
  readOnlyMode?: boolean;
  disabledFeatures?: string[];
};

type OpsTelemetryEnvelope = {
  event: string;
  level: LogLevel;
  at: string;
  appEnv: string;
  sessionId: string;
  payload?: Record<string, unknown>;
};

function appEnv(): string {
  return (process.env.EXPO_PUBLIC_APP_ENV ?? 'development').trim() || 'development';
}

function boolEnv(name: string): boolean {
  return process.env[name]?.trim() === '1';
}

function listEnv(name: string): string[] {
  const raw = process.env[name]?.trim() ?? '';
  if (!raw) return [];
  return raw
    .split(',')
    .map((v: string) => v.trim())
    .filter((v: string) => v.length > 0);
}

function baseConfig(): OpsRuntimeConfig {
  return {
    killSwitch: boolEnv('EXPO_PUBLIC_OPS_KILL_SWITCH'),
    readOnlyMode: boolEnv('EXPO_PUBLIC_OPS_READ_ONLY_MODE'),
    disabledFeatures: listEnv('EXPO_PUBLIC_OPS_DISABLED_FEATURES'),
    source: 'env_only',
    fetchedAt: null,
  };
}

function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 8).join('\n'),
    };
  }
  return { message: String(error) };
}

function print(level: LogLevel, event: string, payload?: Record<string, unknown>): void {
  const tail = payload && Object.keys(payload).length > 0 ? ` ${JSON.stringify(payload)}` : '';
  const line = `${OPS_PREFIX}[${appEnv()}][${event}]${tail}`;
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

async function postTelemetry(event: OpsTelemetryEnvelope): Promise<void> {
  const endpoint = process.env.EXPO_PUBLIC_OBS_INGEST_URL?.trim() ?? '';
  if (!endpoint) return;
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch {
    // Never throw from telemetry transport.
  }
}

export function emitOperationalSignal(level: LogLevel, event: string, payload?: Record<string, unknown>): void {
  print(level, event, payload);
  void postTelemetry({
    event,
    level,
    at: new Date().toISOString(),
    appEnv: appEnv(),
    sessionId: OPS_SESSION_ID,
    payload,
  });
}

function mergeRemote(base: OpsRuntimeConfig, payload: OpsRemotePayload, source: OpsConfigSource): OpsRuntimeConfig {
  return {
    killSwitch: typeof payload.killSwitch === 'boolean' ? payload.killSwitch : base.killSwitch,
    readOnlyMode: typeof payload.readOnlyMode === 'boolean' ? payload.readOnlyMode : base.readOnlyMode,
    disabledFeatures: Array.isArray(payload.disabledFeatures)
      ? payload.disabledFeatures.filter((v: unknown): v is string => typeof v === 'string' && v.trim().length > 0)
      : base.disabledFeatures,
    source,
    fetchedAt: Date.now(),
  };
}

async function readCachedRemoteConfig(): Promise<OpsRemotePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(OPS_CONFIG_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OpsRemotePayload;
  } catch {
    return null;
  }
}

async function writeCachedRemoteConfig(payload: OpsRemotePayload): Promise<void> {
  try {
    await AsyncStorage.setItem(OPS_CONFIG_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // best effort only
  }
}

async function fetchRemoteConfig(): Promise<OpsRemotePayload | null> {
  const endpoint = process.env.EXPO_PUBLIC_OPS_CONFIG_URL?.trim() ?? '';
  if (!endpoint) return null;
  const timeoutMs = Math.max(500, Number.parseInt(process.env.EXPO_PUBLIC_OPS_CONFIG_TIMEOUT_MS ?? '2500', 10) || 2500);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OpsRemotePayload;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

let handlersInstalled = false;

export function installGlobalErrorHandlers(): void {
  if (handlersInstalled) return;
  handlersInstalled = true;

  const globalAny = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
      setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
    onUnhandledRejection?: ((event: { reason?: unknown }) => void) | null;
  };

  const prev = globalAny.ErrorUtils?.getGlobalHandler?.();
  globalAny.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    emitOperationalSignal('error', 'js_fatal_exception', {
      isFatal: isFatal === true,
      error: sanitizeError(error),
    });
    prev?.(error, isFatal);
  });

  if (typeof globalAny.onUnhandledRejection === 'function') {
    const prevUnhandled = globalAny.onUnhandledRejection;
    globalAny.onUnhandledRejection = (event) => {
      emitOperationalSignal('error', 'promise_unhandled_rejection', {
        error: sanitizeError(event?.reason),
      });
      prevUnhandled(event);
    };
  }
}

export async function resolveOpsRuntimeConfig(): Promise<OpsRuntimeConfig> {
  const base = baseConfig();
  const remote = await fetchRemoteConfig();
  if (remote) {
    await writeCachedRemoteConfig(remote);
    const merged = mergeRemote(base, remote, 'remote_fresh');
    emitOperationalSignal('info', 'ops_config_loaded', {
      source: merged.source,
      killSwitch: merged.killSwitch,
      readOnlyMode: merged.readOnlyMode,
      disabledFeatureCount: merged.disabledFeatures.length,
    });
    return merged;
  }

  const cached = await readCachedRemoteConfig();
  if (cached) {
    const merged = mergeRemote(base, cached, 'remote_cached');
    emitOperationalSignal('warn', 'ops_config_fallback_cached', {
      source: merged.source,
      killSwitch: merged.killSwitch,
      readOnlyMode: merged.readOnlyMode,
      disabledFeatureCount: merged.disabledFeatures.length,
    });
    return merged;
  }

  emitOperationalSignal('info', 'ops_config_env_only', {
    source: base.source,
    killSwitch: base.killSwitch,
    readOnlyMode: base.readOnlyMode,
    disabledFeatureCount: base.disabledFeatures.length,
  });
  return base;
}

export async function measureOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    const out = await fn();
    emitOperationalSignal('info', 'perf_operation_ok', {
      operation,
      durationMs: Date.now() - t0,
    });
    return out;
  } catch (error) {
    emitOperationalSignal('error', 'perf_operation_error', {
      operation,
      durationMs: Date.now() - t0,
      error: sanitizeError(error),
    });
    throw error;
  }
}
