import type { UserPersona } from '../context/authTypes';
import { restApiFetchJson } from './apiClient';

export type PatchPersonaApiData = Readonly<{ persona: string }>;

/**
 * Persists `User.persona` on the ViGlobal REST API (requires JWT).
 * Safe no-op when API is not configured or request fails — caller still updates local `AuthContext`.
 */
export async function patchUserPersonaOnServer(persona: UserPersona): Promise<boolean> {
  const res = await restApiFetchJson<PatchPersonaApiData>('/api/users/persona', {
    method: 'PATCH',
    body: { persona },
  });
  return res.ok;
}
