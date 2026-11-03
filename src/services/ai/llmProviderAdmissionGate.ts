/**
 * Express AIRouter containment only; no I/O, wallet debit, budget reservation or dollar cap.
 * Server policy is read afresh for every provider attempt. A key or a client flag grants nothing.
 *
 * ALLOW requires all three server environment settings:
 * - VIONA_LLM_PROVIDER_ADMISSION_ENABLED=true (exact, case-sensitive)
 * - VIONA_LLM_PROVIDER_ALLOWED_USER_IDS=<explicit comma-separated server identities>
 * - VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES=<explicit comma-separated supported task types>
 * Missing/malformed settings, wildcards, unknown tasks and unmatched requests fail closed.
 * This gate must not be applied to free SOS Core entry points.
 */
import type { LlmRouterTaskType } from '@prisma/client';

// New task types require deliberate admission-policy review, even if routing has a default.
const SUPPORTED_TASK_TYPES = [
  'SIMPLE_TRANSLATION',
  'ROUTING_INQUIRY',
  'COMPLEX_MARKETING',
  'DEEP_CONTEXT',
  'VIONA_REAL_EXECUTION_CONTENT',
] as const satisfies readonly LlmRouterTaskType[];

export type LlmProviderAdmissionRequest = Readonly<{
  taskType: string;
  /** Trusted server identity; never read an admission grant from a request body. */
  userId?: string | null;
}>;

export type LlmProviderAdmissionDenialReason =
  | 'disabled'
  | 'invalid_policy'
  | 'identity_required'
  | 'unknown_task'
  | 'user_not_allowed'
  | 'task_not_allowed';

export type LlmProviderAdmissionDecision =
  | Readonly<{ decision: 'ALLOW' }>
  | Readonly<{ decision: 'DENY'; reason: LlmProviderAdmissionDenialReason }>;

type AdmissionEnvironment = Readonly<Record<string, string | undefined>>;

function readExactAllowlist(raw: string | undefined): readonly string[] | null {
  if (typeof raw !== 'string') return null;
  const values = raw.split(',').map((value) => value.trim());
  if (values.some((value) => value.length === 0 || value.includes('*'))) return null;
  if (new Set(values).size !== values.length) return null;
  return values;
}

export function evaluateLlmProviderAdmission(
  input: LlmProviderAdmissionRequest,
  env: AdmissionEnvironment = process.env
): LlmProviderAdmissionDecision {
  if (env.VIONA_LLM_PROVIDER_ADMISSION_ENABLED !== 'true') {
    return { decision: 'DENY', reason: 'disabled' };
  }

  const users = readExactAllowlist(env.VIONA_LLM_PROVIDER_ALLOWED_USER_IDS);
  const tasks = readExactAllowlist(env.VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES);
  const supported: readonly string[] = SUPPORTED_TASK_TYPES;
  if (!users || !tasks || tasks.some((task) => !supported.includes(task))) {
    return { decision: 'DENY', reason: 'invalid_policy' };
  }

  if (typeof input.userId !== 'string' || !input.userId || input.userId !== input.userId.trim()) {
    return { decision: 'DENY', reason: 'identity_required' };
  }
  if (!supported.includes(input.taskType)) {
    return { decision: 'DENY', reason: 'unknown_task' };
  }
  if (!users.includes(input.userId)) {
    return { decision: 'DENY', reason: 'user_not_allowed' };
  }
  if (!tasks.includes(input.taskType)) {
    return { decision: 'DENY', reason: 'task_not_allowed' };
  }
  return { decision: 'ALLOW' };
}

export class LlmProviderAdmissionDeniedError extends Error {
  readonly code = 'LLM_PROVIDER_ADMISSION_DENIED' as const;
  readonly httpStatus: 401 | 403 | 503;

  constructor(readonly reason: LlmProviderAdmissionDenialReason) {
    super('Paid AI is unavailable for this request. No provider call was made.');
    this.name = 'LlmProviderAdmissionDeniedError';
    this.httpStatus =
      reason === 'identity_required'
        ? 401
        : reason === 'user_not_allowed' || reason === 'task_not_allowed' || reason === 'unknown_task'
          ? 403
          : 503;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function assertLlmProviderAdmission(input: LlmProviderAdmissionRequest): void {
  const result = evaluateLlmProviderAdmission(input);
  if (result.decision === 'DENY') {
    throw new LlmProviderAdmissionDeniedError(result.reason);
  }
}
