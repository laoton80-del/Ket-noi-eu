import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../storage/storageKeys';
import { isDemoSandboxActive, mockRestApiRequestResult } from './ux/DemoSandbox';

export type ApiEnvelope<T> =
  | Readonly<{ success: true; data: T }>
  | Readonly<{ success: false; error: string }>;

export type ApiRequestResult<T> =
  | Readonly<{ ok: true; status: number; data: T }>
  | Readonly<{ ok: false; status: number; error: string; unreachable?: boolean }>;

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

/** Dev-only: bypass storage when set (never ship real JWTs in client env). */
function getDevJwtOverride(): string | null {
  const t = process.env.EXPO_PUBLIC_DEV_REST_JWT?.trim() ?? '';
  return t.length > 0 ? t : null;
}

export async function getRestApiJwt(): Promise<string | null> {
  const dev = getDevJwtOverride();
  if (dev) return dev;
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.restApiJwt);
  const t = stored?.trim() ?? '';
  return t.length > 0 ? t : null;
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
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== 'object' || v === null) return null;
    const success = (v as { success?: unknown }).success;
    if (success === true && 'data' in v) {
      return { success: true, data: (v as { data: T }).data };
    }
    if (success === false && typeof (v as { error?: unknown }).error === 'string') {
      return { success: false, error: (v as { error: string }).error };
    }
    return null;
  } catch {
    return null;
  }
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

  if (!init.skipAuth) {
    const jwt = await getRestApiJwt();
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: formatNetworkFailureMessage(e),
      unreachable: true,
    };
  }

  const text = await res.text();
  const parsed = text ? parseJsonEnvelope<T>(text) : null;
  if (parsed?.success === true) {
    return { ok: true, status: res.status, data: parsed.data };
  }
  if (parsed?.success === false) {
    return { ok: false, status: res.status, error: parsed.error };
  }

  const fallback =
    text.length > 0 && text.length < 200 ? text : `HTTP ${res.status} — phản hồi không đúng định dạng.`;
  return { ok: false, status: res.status, error: fallback };
}
