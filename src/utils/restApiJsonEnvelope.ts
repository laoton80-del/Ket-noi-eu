/**
 * Shared REST `{ success, data|error, code? }` envelope parse — no React Native deps.
 * Used by restApiFetchJson and contract tests.
 */
export type RestApiJsonSuccess<T> = Readonly<{ success: true; data: T }>;
export type RestApiJsonFailure = Readonly<{
  success: false;
  error: string;
  code?: string;
}>;
export type RestApiJsonEnvelope<T> = RestApiJsonSuccess<T> | RestApiJsonFailure;

export function parseRestApiJsonEnvelope<T>(raw: string): RestApiJsonEnvelope<T> | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== 'object' || v === null) return null;
    const success = (v as { success?: unknown }).success;
    if (success === true && 'data' in v) {
      return { success: true, data: (v as { data: T }).data };
    }
    if (success === false && typeof (v as { error?: unknown }).error === 'string') {
      const codeRaw = (v as { code?: unknown }).code;
      if (typeof codeRaw === 'string' && codeRaw.length > 0) {
        return {
          success: false,
          error: (v as { error: string }).error,
          code: codeRaw,
        };
      }
      return { success: false, error: (v as { error: string }).error };
    }
    return null;
  } catch {
    return null;
  }
}
