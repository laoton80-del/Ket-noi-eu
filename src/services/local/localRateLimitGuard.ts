export const LOCAL_RATE_LIMIT_TOO_MANY_MESSAGE =
  'Too many requests. Please try again shortly.' as const;

export type LocalRateLimitAction =
  | 'create_request'
  | 'merchant_confirm'
  | 'merchant_reject'
  | 'user_cancel'
  | 'ops_cancel';

export type LocalRateLimitPolicy = Readonly<{
  maxAttempts: number;
  windowMs: number;
}>;

const DEFAULT_POLICIES: Record<LocalRateLimitAction, LocalRateLimitPolicy> = {
  create_request: { maxAttempts: 30, windowMs: 60_000 },
  merchant_confirm: { maxAttempts: 25, windowMs: 60_000 },
  merchant_reject: { maxAttempts: 25, windowMs: 60_000 },
  user_cancel: { maxAttempts: 25, windowMs: 60_000 },
  ops_cancel: { maxAttempts: 25, windowMs: 60_000 },
};

let activePolicies: Record<LocalRateLimitAction, LocalRateLimitPolicy> = {
  ...DEFAULT_POLICIES,
};

const buckets = new Map<string, number[]>();

function prune(tsList: number[], now: number, windowMs: number): number[] {
  const cutoff = now - windowMs;
  return tsList.filter((t) => t > cutoff);
}

/**
 * Safe in-memory bucket key: auth user id + action (+ optional request id). No PII.
 */
export function buildLocalRateLimitKey(
  userId: string,
  action: LocalRateLimitAction,
  requestId?: string
): string {
  const uid = userId.trim();
  const rid = requestId?.trim() ?? '';
  if (rid.length > 0) {
    return `local:${uid}:${action}:${rid}`;
  }
  return `local:${uid}:${action}`;
}

function policyFor(action: LocalRateLimitAction): LocalRateLimitPolicy {
  return activePolicies[action];
}

/**
 * Sliding-window consume. Returns true if allowed (and recorded), false if rate limited.
 */
export function tryConsumeLocalRateLimit(
  userId: string,
  action: LocalRateLimitAction,
  requestId?: string
): boolean {
  const uid = userId.trim();
  if (uid.length === 0) {
    return true;
  }

  const key = buildLocalRateLimitKey(uid, action, requestId);
  const { maxAttempts, windowMs } = policyFor(action);
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const recent = prune(prev, now, windowMs);

  if (recent.length >= maxAttempts) {
    return false;
  }

  recent.push(now);
  buckets.set(key, recent);
  return true;
}

/** Test-only: tighten limits without affecting default production constants. */
export function setLocalRateLimitPoliciesForTests(
  overrides: Partial<Record<LocalRateLimitAction, LocalRateLimitPolicy>>
): void {
  activePolicies = { ...DEFAULT_POLICIES, ...overrides };
}

/** Test-only: reset buckets and restore default policies. */
export function resetLocalRateLimitGuardForTests(): void {
  buckets.clear();
  activePolicies = { ...DEFAULT_POLICIES };
}
