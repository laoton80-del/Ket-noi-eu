/**
 * Debug-only logging — no-ops in production JS bundles (`__DEV__` false).
 * Use for diagnostics that must not pollute release logs or imply server-side observability.
 */
const PREFIX = '[KNGlobal]';

export function devLog(scope: string, message: string, meta?: Record<string, unknown>): void {
  if (!__DEV__) return;
  const tail = meta && Object.keys(meta).length > 0 ? ` ${safeJson(meta)}` : '';
  console.log(`${PREFIX}[${scope}] ${message}${tail}`);
}

export function devWarn(scope: string, message: string, meta?: Record<string, unknown>): void {
  if (!__DEV__) return;
  const tail = meta && Object.keys(meta).length > 0 ? ` ${safeJson(meta)}` : '';
  console.warn(`${PREFIX}[${scope}] ${message}${tail}`);
}

function safeJson(obj: Record<string, unknown>): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}
