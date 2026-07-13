/**
 * Pack30D-5 — Symmetric, **unwired** OpenAI real-execution adapter (design: §4 of
 * docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md).
 *
 * Mirrors `vionaTwilioTestRealProviderAdapter.ts`'s exact gate chain — flag →
 * production hard-block → Circuit Breaker → real call → audit-bind — for a **future** Pack32
 * Tool-Registry entry that does not exist yet. This module is not called by any HTTP route, any
 * existing Tool Registry entry, or any existing screen — it is exported for unit tests only.
 *
 * Deliberately isolated from every already-shipped, already-live OpenAI call site: it never
 * imports `AIPostGenerator.ts`, `TranslationService.ts`, `AIController.ts`, or
 * `vionaIntentRouter.ts`, and it tags every `createRoutedChatCompletion()` call with the new,
 * dedicated `VIONA_REAL_EXECUTION_CONTENT` task type — never `COMPLEX_MARKETING`,
 * `SIMPLE_TRANSLATION`, `ROUTING_INQUIRY`, or `DEEP_CONTEXT` — so this adapter's usage can never
 * be mistaken for, or blended with, an existing feature's usage in any cost/spend query.
 *
 * `executeReal()` is hard-gated by `isOpenAiRealExecutionEnabled()` (default `false`,
 * hard-blocked in production — see `vionaRealProviderExecutionFlag.ts`) and unconditionally
 * writes an append-only audit-ledger row via the existing, unmodified Pack30D-1 writer
 * (`appendVionaExecutionAuditEvent`) on every exit path, exactly like the Twilio adapter.
 */

import { LlmRouterTaskType } from '@prisma/client';

import {
  appendVionaExecutionAuditEvent,
  type VionaExecutionAuditPayloadJson,
} from '../../../services/viona/vionaExecutionAuditWriteService';
import {
  evaluateVionaProviderCircuitBreaker,
  readVionaProviderSpendCapUsdCentsFromEnv,
} from '../circuitBreaker/vionaProviderSpendCircuitBreaker';
import { queryVionaOpenAiRealExecutionSpendWindow } from '../../../services/viona/vionaProviderSpendWindowQueryService';
import { isOpenAiRealExecutionEnabled } from './vionaRealProviderExecutionFlag';

export const VIONA_OPENAI_REAL_EXECUTION_TASK_TYPE = LlmRouterTaskType.VIONA_REAL_EXECUTION_CONTENT;

export type VionaOpenAiRealExecutionIntent = Readonly<{
  prompt: string;
  userId?: string | null;
}>;

export type VionaOpenAiRealExecutionOutcome =
  | Readonly<{
      outcome: 'blockedOperator';
      reason: 'flag_disabled' | 'missing_api_key' | 'circuit_breaker_open_daily_cap_exceeded';
    }>
  | Readonly<{ outcome: 'blockedPolicy'; reason: 'empty_prompt' }>
  | Readonly<{ outcome: 'succeeded'; totalTokens: number; latencyMs: number }>
  | Readonly<{ outcome: 'failedBounded'; errorClass: 'provider_rejected' | 'provider_unavailable'; latencyMs: number }>;

export type VionaOpenAiRealExecutionResult = Readonly<{
  outcome: VionaOpenAiRealExecutionOutcome;
  auditWritten: boolean;
}>;

/** Minimal chat-completion transport surface — mirrors the Twilio adapter's DI pattern exactly. */
export type VionaOpenAiChatCompletionTransport = (args: {
  prompt: string;
  userId?: string | null;
}) => Promise<Readonly<{ totalTokens: number }>>;

export type ExecuteVionaOpenAiRealExecutionInput = Readonly<{
  requestId: string;
  actionId: string;
  intent: VionaOpenAiRealExecutionIntent;
  actorUserId: string;
  actorRoleLabel: string;
}>;

export type ExecuteVionaOpenAiRealExecutionDeps = Readonly<{
  isEnabled?: () => boolean;
  hasApiKey?: () => boolean;
  transport?: VionaOpenAiChatCompletionTransport;
  auditWriter?: typeof appendVionaExecutionAuditEvent;
  nowMs?: () => number;
  /** Mirrors the Twilio adapter's `circuitBreakerCheck` DI hook — see that file's header comment. */
  circuitBreakerCheck?: () => Promise<{ state: 'closed' | 'open' }>;
}>;

async function defaultVionaOpenAiCircuitBreakerCheck(): Promise<{ state: 'closed' | 'open' }> {
  const window = await queryVionaOpenAiRealExecutionSpendWindow();
  const capUsdCents = readVionaProviderSpendCapUsdCentsFromEnv('openai');
  const decision = evaluateVionaProviderCircuitBreaker(window, capUsdCents);
  return { state: decision.state };
}

type VionaOpenAiAuditableEvent = Readonly<{ outcome: 'attempted' }> | VionaOpenAiRealExecutionOutcome;

function buildOutcomeAuditPayload(
  input: ExecuteVionaOpenAiRealExecutionInput,
  outcome: VionaOpenAiAuditableEvent,
): VionaExecutionAuditPayloadJson {
  return {
    provider: 'openai_real_execution_content',
    actionId: input.actionId,
    taskType: VIONA_OPENAI_REAL_EXECUTION_TASK_TYPE,
    outcome: outcome.outcome,
    detail: outcome,
  };
}

async function writeOutcomeAudit(
  input: ExecuteVionaOpenAiRealExecutionInput,
  eventType: 'executionRealAttempted' | 'executionRealSucceeded' | 'executionRealFailedBounded' | 'executionBlockedOperator' | 'executionBlockedPolicy',
  outcome: VionaOpenAiAuditableEvent,
  auditWriter: typeof appendVionaExecutionAuditEvent,
): Promise<boolean> {
  const result = await auditWriter({
    requestId: input.requestId,
    eventType,
    actorUserId: input.actorUserId,
    actorRoleLabel: input.actorRoleLabel,
    message: `Pack30D-5 unwired OpenAI real-execution adapter: ${eventType}.`,
    payloadJson: buildOutcomeAuditPayload(input, outcome),
  });
  return result.ok;
}

/**
 * Not called by any route, Tool Registry entry, or screen in this pack — exported for unit tests
 * only, so its gate chain (flag → circuit breaker → policy → transport → audit-bind) can be
 * verified in isolation ahead of any future pack that wires it up.
 */
export async function executeVionaOpenAiRealExecution(
  input: ExecuteVionaOpenAiRealExecutionInput,
  deps: ExecuteVionaOpenAiRealExecutionDeps = {},
): Promise<VionaOpenAiRealExecutionResult> {
  const isEnabled = deps.isEnabled ?? isOpenAiRealExecutionEnabled;
  const auditWriter = deps.auditWriter ?? appendVionaExecutionAuditEvent;
  const nowMs = deps.nowMs ?? (() => Date.now());

  if (!isEnabled()) {
    const outcome: VionaOpenAiRealExecutionOutcome = { outcome: 'blockedOperator', reason: 'flag_disabled' };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedOperator', outcome, auditWriter);
    return { outcome, auditWritten };
  }

  const circuitBreakerCheck = deps.circuitBreakerCheck ?? defaultVionaOpenAiCircuitBreakerCheck;
  const breakerResult = await circuitBreakerCheck();
  if (breakerResult.state === 'open') {
    const outcome: VionaOpenAiRealExecutionOutcome = {
      outcome: 'blockedOperator',
      reason: 'circuit_breaker_open_daily_cap_exceeded',
    };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedOperator', outcome, auditWriter);
    return { outcome, auditWritten };
  }

  if (input.intent.prompt.trim().length === 0) {
    const outcome: VionaOpenAiRealExecutionOutcome = { outcome: 'blockedPolicy', reason: 'empty_prompt' };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedPolicy', outcome, auditWriter);
    return { outcome, auditWritten };
  }

  const hasApiKey = deps.hasApiKey ?? (() => Boolean(process.env.OPENAI_API_KEY?.trim()));
  if (!hasApiKey()) {
    const outcome: VionaOpenAiRealExecutionOutcome = { outcome: 'blockedOperator', reason: 'missing_api_key' };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedOperator', outcome, auditWriter);
    return { outcome, auditWritten };
  }

  await writeOutcomeAudit(input, 'executionRealAttempted', { outcome: 'attempted' }, auditWriter).catch(
    () => false,
  );

  const startedAtMs = nowMs();
  const transport =
    deps.transport ??
    (async () => {
      throw new Error(
        'vionaOpenAiRealProviderAdapter: no transport injected — this module is unwired and must ' +
          'never call a real OpenAI endpoint without an explicit, future, separately authorized ' +
          'transport implementation.',
      );
    });

  try {
    const transportResult = await transport({ prompt: input.intent.prompt, userId: input.actorUserId });
    const outcome: VionaOpenAiRealExecutionOutcome = {
      outcome: 'succeeded',
      totalTokens: transportResult.totalTokens,
      latencyMs: nowMs() - startedAtMs,
    };
    const auditWritten = await writeOutcomeAudit(input, 'executionRealSucceeded', outcome, auditWriter);
    return { outcome, auditWritten };
  } catch {
    const outcome: VionaOpenAiRealExecutionOutcome = {
      outcome: 'failedBounded',
      errorClass: 'provider_unavailable',
      latencyMs: nowMs() - startedAtMs,
    };
    const auditWritten = await writeOutcomeAudit(input, 'executionRealFailedBounded', outcome, auditWriter);
    return { outcome, auditWritten };
  }
}
