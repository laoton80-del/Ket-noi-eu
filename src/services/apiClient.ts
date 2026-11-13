import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../storage/storageKeys';
import { isDemoSandboxActive, mockRestApiRequestResult } from './ux/DemoSandbox';
import {
  parseRestApiJsonEnvelope,
  type RestApiJsonEnvelope,
} from '../utils/restApiJsonEnvelope';

export type ApiEnvelope<T> = RestApiJsonEnvelope<T>;

export type ApiRequestResult<T> =
  | Readonly<{ ok: true; status: number; data: T }>
  | Readonly<{
      ok: false;
      status: number;
      error: string;
      /** Optional machine failure code when the server envelope includes an allowlisted `code`. */
      code?: string;
      unreachable?: boolean;
    }>;

export class AiAuthRequiredError extends Error {
  readonly code = 'ai_auth_required';

  constructor() {
    super('ai_auth_required');
    this.name = 'AiAuthRequiredError';
  }
}

/** Base URL for ViGlobal Express API (`/api/*`) — no trailing slash. */
export function getRestApiBaseUrl(): string {
  const fromRest = process.env.EXPO_PUBLIC_REST_API_BASE?.trim() ?? '';
  if (fromRest.length > 0) return fromRest.replace(/\/+$/, '');
  const legacy = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
  return legacy.replace(/\/+$/, '');
}

export function isRestApiConfigured(): boolean {
  return getRestApiBaseUrl().length > 0;
}

/**
 * Runtime/session REST JWT from secure storage only.
 * Public env bearer fallbacks (including historical EXPO_PUBLIC_* JWT vars) are not used.
 */
export async function getRestApiJwt(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.restApiJwt);
  const fromStorage = stored?.trim() ?? '';
  return fromStorage.length > 0 ? fromStorage : null;
}

export async function setRestApiJwt(token: string): Promise<void> {
  const t = token.trim();
  if (t.length === 0) {
    await clearRestApiJwt();
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.restApiJwt, t);
}

export async function clearRestApiJwt(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.restApiJwt);
}

function parseJsonEnvelope<T>(raw: string): ApiEnvelope<T> | null {
  return parseRestApiJsonEnvelope<T>(raw);
}

function isExpressAiApiPath(path: string): boolean {
  const pathOnly = path.split(/[?#]/, 1)[0] ?? path;
  const normalized = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return /^\/api\/ai(?:\/|$)/i.test(normalized);
}

function decodeBase64UrlSegment(segment: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) return null;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let bits = 0;
  let buffer = 0;
  let output = '';
  for (const character of segment) {
    const value = alphabet.indexOf(character);
    if (value < 0) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return output;
}

function hasUnexpiredExpressJwt(token: string, nowMs = Date.now()): boolean {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) return false;
  const payloadText = decodeBase64UrlSegment(parts[1]);
  if (!payloadText) return false;
  try {
    const payload: unknown = JSON.parse(payloadText);
    if (typeof payload !== 'object' || payload === null) return false;
    const claims = payload as Readonly<{ sub?: unknown; exp?: unknown }>;
    return (
      typeof claims.sub === 'string' &&
      claims.sub.length > 0 &&
      typeof claims.exp === 'number' &&
      Number.isFinite(claims.exp) &&
      claims.exp * 1000 > nowMs
    );
  } catch {
    return false;
  }
}

function setHeader(headers: Record<string, string>, name: string, value: string): void {
  for (const existing of Object.keys(headers)) {
    if (existing.toLowerCase() === name.toLowerCase()) delete headers[existing];
  }
  headers[name] = value;
}

type RequestAbortControl = Readonly<{
  signal?: AbortSignal;
  didTimeout(): boolean;
  cleanup(): void;
}>;

function createRequestAbortControl(signal?: AbortSignal, timeoutMs?: number): RequestAbortControl {
  if (timeoutMs === undefined) {
    return { signal, didTimeout: () => false, cleanup: () => {} };
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('timeoutMs must be a positive finite number');
  }

  const controller = new AbortController();
  let timedOut = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const abortFromCaller = (): void => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else if (signal) {
    signal.addEventListener('abort', abortFromCaller, { once: true });
  }
  if (!controller.signal.aborted) {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      signal?.removeEventListener('abort', abortFromCaller);
    },
  };
}

export function formatNetworkFailureMessage(error: unknown): string {
  if (error instanceof TypeError && /network|fetch/i.test(error.message)) {
    return 'Không thể kết nối máy chủ. Kiểm tra mạng và địa chỉ API (EXPO_PUBLIC_REST_API_BASE).';
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
}

export async function restApiFetchJson<T>(
  path: string,
  init: Readonly<{
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    skipAuth?: boolean;
    headers?: Readonly<Record<string, string>>;
    signal?: AbortSignal;
    timeoutMs?: number;
  }> = {}
): Promise<ApiRequestResult<T>> {
  if (isDemoSandboxActive()) {
    return Promise.resolve(mockRestApiRequestResult<T>(path, init.method ?? 'GET'));
  }

  const base = getRestApiBaseUrl();
  if (!base) {
    return { ok: false, status: 0, error: 'Chưa cấu hình EXPO_PUBLIC_REST_API_BASE.' };
  }

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  for (const [name, value] of Object.entries(init.headers ?? {})) {
    setHeader(headers, name, value);
  }

  const requiresExpressJwt = isExpressAiApiPath(path);
  if (requiresExpressJwt) {
    let jwt: string | null = null;
    try {
      jwt = await getRestApiJwt();
    } catch {
      throw new AiAuthRequiredError();
    }
    if (!jwt || !hasUnexpiredExpressJwt(jwt)) throw new AiAuthRequiredError();
    setHeader(headers, 'Authorization', `Bearer ${jwt}`);
  } else if (!init.skipAuth) {
    const jwt = await getRestApiJwt();
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
  }

  let res: Response;
  let text: string;
  const abortControl = createRequestAbortControl(init.signal, init.timeoutMs);
  try {
    res = await fetch(url, {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: abortControl.signal,
    });
    if (requiresExpressJwt && res.status === 401) throw new AiAuthRequiredError();
    text = await res.text();
  } catch (e) {
    if (e instanceof AiAuthRequiredError) throw e;
    return {
      ok: false,
      status: 0,
      error: abortControl.didTimeout() ? 'request_timeout' : formatNetworkFailureMessage(e),
      unreachable: true,
    };
  } finally {
    abortControl.cleanup();
  }

  const parsed = text ? parseJsonEnvelope<T>(text) : null;
  if (parsed?.success === true) {
    return { ok: true, status: res.status, data: parsed.data };
  }
  if (parsed?.success === false) {
    return {
      ok: false,
      status: res.status,
      error: parsed.error,
      ...(typeof parsed.code === 'string' && parsed.code.length > 0
        ? { code: parsed.code }
        : {}),
    };
  }

  const fallback =
    text.length > 0 && text.length < 200 ? text : `HTTP ${res.status} — phản hồi không đúng định dạng.`;
  return { ok: false, status: res.status, error: fallback };
}
