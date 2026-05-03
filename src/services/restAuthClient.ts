import { identifyUser, trackEvent } from './AnalyticsService';
import { restApiFetchJson, setRestApiJwt } from './apiClient';

export type RestAuthUser = Readonly<{
  id: string;
  phoneNumber: string;
  role: string;
  tier: string;
  persona?: string;
  isKYCVerified?: boolean;
  businessCategory?: string | null;
  profile: null | {
    fullName: string;
    avatarUrl: string | null;
    country: string;
    languageCode: string;
  };
}>;

export type RestLoginData = Readonly<{
  token: string;
  user: RestAuthUser;
}>;

export type RestLoginResult =
  | Readonly<{ ok: true; data: RestLoginData }>
  | Readonly<{ ok: false; error: string; status: number }>;

/**
 * POST `/api/auth/login` and persist JWT for subsequent `apiClient` calls.
 */
export async function loginRestApi(phoneNumber: string, pinCode: string): Promise<RestLoginResult> {
  const res = await restApiFetchJson<RestLoginData>('/api/auth/login', {
    method: 'POST',
    body: { phoneNumber, pinCode },
    skipAuth: true,
  });

  if (!res.ok) {
    trackEvent('auth_login_failed', { httpStatus: res.status });
    return { ok: false, error: res.error, status: res.status };
  }

  if (typeof res.data.token !== 'string' || res.data.token.length < 8) {
    trackEvent('auth_login_failed', { httpStatus: res.status, reason: 'invalid_token_shape' });
    return { ok: false, error: 'Token không hợp lệ từ máy chủ.', status: res.status };
  }

  await setRestApiJwt(res.data.token);
  const u = res.data.user;
  identifyUser(u.id, {
    role: String(u.role),
    tier: String(u.tier),
    persona: String(u.persona ?? 'unknown'),
  });
  trackEvent('auth_login_succeeded', {
    role: String(u.role),
    tier: String(u.tier),
  });
  return { ok: true, data: res.data };
}
