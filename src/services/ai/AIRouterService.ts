/**
 * Server-only: routes chat completions to the cheapest adequate OpenAI model by task type.
 * Default tier is always `gpt-4o-mini` unless the task is classified as high-complexity.
 */

import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/resources/chat/completions';

import { LlmRouterTaskType } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import {
  assertCostGovernorReservation,
  CostGovernorDeniedError,
  estimateInputTokensUpperBound,
  getCostGovernor,
} from './CostGovernorService';
import { assertLlmProviderAdmission } from './llmProviderAdmissionGate';

/** Task taxonomy — re-exported for callers (`LlmRouterTaskType` is the Prisma / DB enum). */
export { LlmRouterTaskType as AIRouterTaskType };

export const MODEL_TIER_FAST = 'gpt-4o-mini' as const;
export const MODEL_TIER_FULL = 'gpt-4o' as const;

/**
 * Routing rules:
 * - `SIMPLE_TRANSLATION`, `ROUTING_INQUIRY` → `gpt-4o-mini`
 * - `COMPLEX_MARKETING`, `DEEP_CONTEXT` → `gpt-4o`
 * Unknown / future values default to `gpt-4o-mini` (strict cheap default).
 */
export function resolveRoutedModel(taskType: LlmRouterTaskType): string {
  switch (taskType) {
    case LlmRouterTaskType.SIMPLE_TRANSLATION:
    case LlmRouterTaskType.ROUTING_INQUIRY:
      return MODEL_TIER_FAST;
    case LlmRouterTaskType.COMPLEX_MARKETING:
    case LlmRouterTaskType.DEEP_CONTEXT:
      return MODEL_TIER_FULL;
    default:
      return MODEL_TIER_FAST;
  }
}

function logUsageToConsole(
  taskType: LlmRouterTaskType,
  model: string,
  usage: ChatCompletion['usage'] | undefined
): void {
  console.info(
    `[AIRouter] task=${taskType} model=${model} promptTokens=${usage?.prompt_tokens ?? 'n/a'} ` +
      `completionTokens=${usage?.completion_tokens ?? 'n/a'} totalTokens=${usage?.total_tokens ?? 'n/a'}`
  );
}

function persistLlmUsageLog(input: Readonly<{
  taskType: LlmRouterTaskType;
  model: string;
  usage: ChatCompletion['usage'] | undefined;
  userId?: string | null;
}>): void {
  const prisma = getPrisma();
  void prisma.llmApiUsageLog
    .create({
      data: {
        taskType: input.taskType,
        model: input.model,
        promptTokens: input.usage?.prompt_tokens ?? null,
        completionTokens: input.usage?.completion_tokens ?? null,
        totalTokens: input.usage?.total_tokens ?? null,
        userId: input.userId ?? null,
      },
    })
    .catch((err: unknown) => {
      console.error('[AIRouter] LlmApiUsageLog persist failed', err);
    });
}

export type RoutedChatCompletionInput = Readonly<{
  taskType: LlmRouterTaskType;
  /** Required by paid-provider admission; also stored for audit after a completion. */
  userId?: string | null;
  /** Server callers may supply a stable retry key; otherwise this rail generates one. */
  idempotencyKey?: string;
  params: Omit<ChatCompletionCreateParamsNonStreaming, 'model'>;
}>;

const ALLOWED_ROUTED_CHAT_PARAM_KEYS = new Set([
  'messages',
  'max_tokens',
  'temperature',
  'top_p',
  'stop',
  'seed',
  'presence_penalty',
  'frequency_penalty',
  'user',
  'n',
  'response_format',
]);

type NormalizedTextContentPart = Readonly<{
  type: 'text';
  text: string;
}>;

type NormalizedRoutedChatMessage = Readonly<{
  role: 'system' | 'user' | 'assistant';
  content: string | readonly NormalizedTextContentPart[];
}>;

type NormalizedResponseFormat = Readonly<{
  type: 'text' | 'json_object';
}>;

/**
 * This is the only caller-derived request object used after admission. It is
 * deeply copied and frozen before the first await so a caller cannot mutate a
 * request after its cost has been reserved.
 */
type RoutedChatParamsSnapshot = Readonly<{
  messages: readonly NormalizedRoutedChatMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stop?: string | readonly string[];
  seed?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
  n?: 1;
  response_format?: NormalizedResponseFormat;
}>;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(record: Readonly<Record<string, unknown>>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function hasOnlyAllowedKeys(record: Readonly<Record<string, unknown>>, allowed: ReadonlySet<string>): boolean {
  return Reflect.ownKeys(record).every((key) => typeof key === 'string' && allowed.has(key));
}

function denyRoutedChatPolicy(): never {
  throw new CostGovernorDeniedError('DENY_POLICY');
}

function normalizeMessageContent(value: unknown): string | readonly NormalizedTextContentPart[] {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return denyRoutedChatPolicy();

  const parts: NormalizedTextContentPart[] = [];
  for (const part of value) {
    const type = isRecord(part) && hasOwn(part, 'type') ? part.type : undefined;
    const text = isRecord(part) && hasOwn(part, 'text') ? part.text : undefined;
    if (
      !isRecord(part) ||
      !hasOwn(part, 'type') ||
      !hasOwn(part, 'text') ||
      !hasOnlyAllowedKeys(part, new Set(['type', 'text'])) ||
      type !== 'text' ||
      typeof text !== 'string'
    ) {
      return denyRoutedChatPolicy();
    }
    parts.push(Object.freeze({ type: 'text' as const, text }));
  }
  return Object.freeze(parts);
}

function normalizeMessages(value: unknown): readonly NormalizedRoutedChatMessage[] {
  if (!Array.isArray(value)) return denyRoutedChatPolicy();
  const messages: NormalizedRoutedChatMessage[] = [];
  for (const message of value) {
    const role = isRecord(message) && hasOwn(message, 'role') ? message.role : undefined;
    const content = isRecord(message) && hasOwn(message, 'content') ? message.content : undefined;
    if (
      !isRecord(message) ||
      !hasOwn(message, 'role') ||
      !hasOwn(message, 'content') ||
      !hasOnlyAllowedKeys(message, new Set(['role', 'content'])) ||
      (role !== 'system' && role !== 'user' && role !== 'assistant')
    ) {
      return denyRoutedChatPolicy();
    }
    messages.push(Object.freeze({
      role,
      content: normalizeMessageContent(content),
    }));
  }
  return Object.freeze(messages);
}

function normalizeOptionalFiniteNumber(raw: Readonly<Record<string, unknown>>, key: string): number | undefined {
  if (!hasOwn(raw, key)) return undefined;
  const value = raw[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || Object.is(value, -0)) return denyRoutedChatPolicy();
  return value;
}

function normalizeStop(value: unknown): string | readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return denyRoutedChatPolicy();
  const stop: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') return denyRoutedChatPolicy();
    stop.push(entry);
  }
  return Object.freeze(stop);
}

function normalizeResponseFormat(value: unknown): NormalizedResponseFormat | undefined {
  if (value === undefined) return undefined;
  const type = isRecord(value) && hasOwn(value, 'type') ? value.type : undefined;
  if (
    !isRecord(value) ||
    !hasOwn(value, 'type') ||
    !hasOnlyAllowedKeys(value, new Set(['type'])) ||
    (type !== 'text' && type !== 'json_object')
  ) {
    return denyRoutedChatPolicy();
  }
  // Neither accepted form carries caller-provided schema/prompt material.
  return Object.freeze({ type });
}

function normalizeRoutedChatParams(params: RoutedChatCompletionInput['params']): RoutedChatParamsSnapshot {
  const raw = params as unknown;
  if (!isRecord(raw) || !hasOnlyAllowedKeys(raw, ALLOWED_ROUTED_CHAT_PARAM_KEYS)) return denyRoutedChatPolicy();
  if (!hasOwn(raw, 'messages') || !hasOwn(raw, 'max_tokens')) return denyRoutedChatPolicy();

  const maxTokens = raw.max_tokens;
  if (typeof maxTokens !== 'number' || !Number.isSafeInteger(maxTokens) || maxTokens <= 0) {
    return denyRoutedChatPolicy();
  }
  const n = hasOwn(raw, 'n') ? raw.n : undefined;
  if (n !== undefined && n !== 1) return denyRoutedChatPolicy();
  const rawSeed = hasOwn(raw, 'seed') ? raw.seed : undefined;
  if (
    rawSeed !== undefined &&
    (typeof rawSeed !== 'number' || !Number.isSafeInteger(rawSeed) || Object.is(rawSeed, -0))
  ) {
    return denyRoutedChatPolicy();
  }
  const seed = rawSeed as number | undefined;
  const user = hasOwn(raw, 'user') ? raw.user : undefined;
  if (user !== undefined && typeof user !== 'string') return denyRoutedChatPolicy();
  const messages = raw.messages;
  const rawStop = hasOwn(raw, 'stop') ? raw.stop : undefined;
  const rawResponseFormat = hasOwn(raw, 'response_format') ? raw.response_format : undefined;

  const snapshot: {
    messages: readonly NormalizedRoutedChatMessage[];
    max_tokens: number;
    temperature?: number;
    top_p?: number;
    stop?: string | readonly string[];
    seed?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    user?: string;
    n?: 1;
    response_format?: NormalizedResponseFormat;
  } = {
    messages: normalizeMessages(messages),
    max_tokens: maxTokens,
  };
  const temperature = normalizeOptionalFiniteNumber(raw, 'temperature');
  const topP = normalizeOptionalFiniteNumber(raw, 'top_p');
  const presencePenalty = normalizeOptionalFiniteNumber(raw, 'presence_penalty');
  const frequencyPenalty = normalizeOptionalFiniteNumber(raw, 'frequency_penalty');
  const stop = normalizeStop(rawStop);
  const responseFormat = normalizeResponseFormat(rawResponseFormat);
  if (temperature !== undefined) snapshot.temperature = temperature;
  if (topP !== undefined) snapshot.top_p = topP;
  if (presencePenalty !== undefined) snapshot.presence_penalty = presencePenalty;
  if (frequencyPenalty !== undefined) snapshot.frequency_penalty = frequencyPenalty;
  if (stop !== undefined) snapshot.stop = stop;
  if (seed !== undefined) snapshot.seed = seed;
  if (user !== undefined) snapshot.user = user;
  if (n !== undefined) snapshot.n = 1;
  if (responseFormat !== undefined) snapshot.response_format = responseFormat;
  return Object.freeze(snapshot);
}

function outputTokenUpperBound(params: Pick<RoutedChatParamsSnapshot, 'max_tokens'>): bigint {
  const maxTokens = params.max_tokens;
  if (typeof maxTokens !== 'number' || !Number.isSafeInteger(maxTokens) || maxTokens <= 0) {
    return denyRoutedChatPolicy();
  }
  return BigInt(maxTokens);
}

function hasUsableProviderCompletion(completion: ChatCompletion): boolean {
  return completion.choices.some((choice) => {
    const content = choice.message?.content;
    return typeof content === 'string' && content.trim().length > 0;
  });
}

function isClearProviderFourXx(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('status' in error)) return false;
  const status = (error as Readonly<{ status?: unknown }>).status;
  return typeof status === 'number' && Number.isInteger(status) && status >= 400 && status < 500 && status !== 408 && status !== 409;
}

function usageForSettlement(completion: ChatCompletion): Readonly<{
  inputTokens?: number | null;
  outputTokens?: number | null;
}> | null {
  if (!completion.usage) return null;
  return {
    inputTokens: completion.usage.prompt_tokens,
    outputTokens: completion.usage.completion_tokens,
  };
}

/**
 * Admission precedes key access, SDK construction and every routed provider attempt.
 * Denial throws; callers may use an honest local fallback, never a fabricated completion.
 * Token logging after success is telemetry, not a budget reservation or hard-dollar cap.
 */
export async function createRoutedChatCompletion(
  input: RoutedChatCompletionInput
): Promise<ChatCompletion> {
  assertLlmProviderAdmission({ taskType: input.taskType, userId: input.userId });
  const paramsSnapshot = normalizeRoutedChatParams(input.params);

  const model = resolveRoutedModel(input.taskType);
  const governor = getCostGovernor();
  const reservation = await governor.reserve({
    subjectId: input.userId,
    idempotencyKey: input.idempotencyKey ?? governor.createServerIdempotencyKey(),
    rail: 'EXPRESS',
    provider: 'openai',
    model,
    operationKind: 'ROUTED_CHAT_COMPLETION',
    inputTokensUpperBound: estimateInputTokensUpperBound(paramsSnapshot.messages),
    outputTokens: outputTokenUpperBound(paramsSnapshot),
  });
  assertCostGovernorReservation(reservation);

  let client: OpenAI;
  let timeoutSignal: AbortSignal;
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
      throw new CostGovernorDeniedError('DENY_LEDGER_UNAVAILABLE');
    }
    timeoutSignal = AbortSignal.timeout(reservation.providerTimeoutMs);
    client = new OpenAI({ apiKey, maxRetries: 0 });
  } catch (error) {
    await governor.release({ operationId: reservation.operation.id, reason: 'reserved_not_dispatched' });
    throw error;
  }

  try {
    const dispatched = await governor.markDispatching(reservation.operation.id);
    if (!dispatched) {
      throw new CostGovernorDeniedError('DUPLICATE_IN_PROGRESS');
    }
  } catch (error) {
    await governor.release({ operationId: reservation.operation.id, reason: 'reserved_not_dispatched' });
    throw error;
  }

  let completion: ChatCompletion;
  try {
    completion = await client.chat.completions.create(
      {
        ...paramsSnapshot,
        model,
      } as unknown as ChatCompletionCreateParamsNonStreaming,
      { signal: timeoutSignal }
    );
  } catch (error) {
    if (isClearProviderFourXx(error)) {
      await governor.release({ operationId: reservation.operation.id, reason: 'provider_http_4xx' });
    } else {
      await governor.markOutcomeUnknown(reservation.operation.id);
    }
    throw error;
  }

  try {
    await governor.settle({
      operationId: reservation.operation.id,
      providerRequestId: completion.id,
      usage: usageForSettlement(completion),
    });
  } catch (error) {
    try {
      await governor.markOutcomeUnknown(reservation.operation.id);
    } catch {
      // The original settlement failure remains the honest result; no retry or fallback is attempted.
    }
    throw error;
  }

  logUsageToConsole(input.taskType, model, completion.usage);
  persistLlmUsageLog({
    taskType: input.taskType,
    model,
    usage: completion.usage,
    userId: input.userId,
  });

  if (!hasUsableProviderCompletion(completion)) {
    throw new Error('OpenAI accepted the request but returned an unusable completion');
  }

  return completion;
}
