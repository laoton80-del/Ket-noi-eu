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
  /** When present (e.g. authenticated API route), stored for audit. */
  userId?: string | null;
  params: Omit<ChatCompletionCreateParamsNonStreaming, 'model'>;
}>;

/**
 * Single entry for routed chat completions — injects `model` from {@link resolveRoutedModel}, logs tokens.
 */
export async function createRoutedChatCompletion(
  input: RoutedChatCompletionInput
): Promise<ChatCompletion> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const model = resolveRoutedModel(input.taskType);
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    ...input.params,
    model,
  });

  logUsageToConsole(input.taskType, model, completion.usage);
  persistLlmUsageLog({
    taskType: input.taskType,
    model,
    usage: completion.usage,
    userId: input.userId,
  });

  return completion;
}
