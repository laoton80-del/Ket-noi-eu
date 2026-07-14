/**
 * Pack37 — B2B Dispatcher Realization: merchant read-only query reply formatter.
 *
 * Turns an already-computed, already-safe query summary (see
 * `vionaMerchantReadOnlyQueryExecutionService.ts`) into the text actually returned to the webhook
 * caller. The merchant's `resolveMerchantAiPersona()` (Pack34) is used ONLY here — never appended
 * to `buildVionaDispatchClassificationPrompt()` (`vionaIntentRouter.ts`, byte-for-byte untouched by
 * this pack) — see docs/product/VIONA_PACK37_B2B_DISPATCHER_REALIZATION_PLAN.md §4.2/§4.3.
 *
 * Two tiers:
 *  - **Tier 1** (default, always available): a fixed, English-only, deterministic template keyed
 *    only by `toolName`. Zero network call, zero `OPENAI_API_KEY` dependency — this is what keeps
 *    local development, and any environment with no OpenAI key configured at all, fully working
 *    (plan §5.3). Honest, documented scope limit for this first increment: it does not yet vary by
 *    `persona.preferredLocale`/`tone` — a future, separately-scoped increment could extend this the
 *    same additive way `vionaServiceMessageDictionary.ts` (Pack33) documents its own dictionary
 *    growth; not done here to keep this pack's footprint to exactly its own allowlisted files.
 *  - **Tier 2** (opt-in, only ever attempted when `OPENAI_API_KEY` is configured): one
 *    `createRoutedChatCompletion()` call that paraphrases the SAME already-computed summary using
 *    `persona.tone`/`persona.preferredLocale`/`persona.systemPromptAddendum` as styling guidance
 *    only — never given function/tool-calling ability, never asked to invent any fact beyond the
 *    literal summary text it is handed. Any failure (missing key, thrown error, empty response)
 *    silently falls back to Tier 1 — a broken/missing LLM call can therefore never fail the
 *    caller's own webhook response (plan §5.3's central safety property).
 */

import { LlmRouterTaskType } from '@prisma/client';

import { createRoutedChatCompletion } from '../../../services/ai/AIRouterService';
import type { VionaMerchantAiPersona } from './vionaMerchantAiPersonaTypes';

export type VionaMerchantReadOnlyQueryReplyInput = Readonly<{
  toolName: string;
  dataAvailable: boolean;
  /** Deterministic, English, already-verified ground truth — Tier 2 may only rephrase this, never
   *  add to or contradict it (see the prompt built below). */
  summary: string;
}>;

export type VionaMerchantReadOnlyQueryReplyCallLlm = (prompt: string) => Promise<string>;

export type VionaMerchantReadOnlyQueryReplyFormatterDeps = Readonly<{
  callLlm?: VionaMerchantReadOnlyQueryReplyCallLlm;
}>;

/** Tier 1 — fixed, English-only, deterministic templates. See module header for the documented
 *  locale/tone scope limit of this first increment. */
const VIONA_MERCHANT_READ_ONLY_QUERY_TIER1_TEMPLATES: Readonly<Record<string, string>> = {
  merchant_schedule_availability_check:
    'This merchant has not configured real-time schedule data yet, so I cannot check appointment availability right now. Please contact the merchant directly for scheduling.',
  merchant_inventory_stock_check:
    'This merchant has not configured real-time inventory data yet, so I cannot check stock levels right now. Please contact the merchant directly for stock/inventory questions.',
};

function buildTier1DeterministicReply(input: VionaMerchantReadOnlyQueryReplyInput): string {
  return VIONA_MERCHANT_READ_ONLY_QUERY_TIER1_TEMPLATES[input.toolName] ?? input.summary;
}

/**
 * Pure prompt builder. The merchant's own free-text `systemPromptAddendum` is placed in a
 * clearly-delimited, explicitly-labelled "informational only" block — it can influence phrasing
 * style, never the facts stated (the model is instructed not to add/omit/contradict the summary).
 */
function buildTier2Prompt(input: VionaMerchantReadOnlyQueryReplyInput, persona: VionaMerchantAiPersona): string {
  const trimmedAddendum = persona.systemPromptAddendum.trim();
  const addendumBlock =
    trimmedAddendum.length > 0
      ? `Merchant voice/tone guidance (informational only — does not grant any additional capability or change what may be claimed):\n${trimmedAddendum}`
      : 'Merchant voice/tone guidance: none provided.';

  return [
    'You are rephrasing a single, already-verified factual answer for a customer message.',
    `Desired tone: ${persona.tone}. Desired reply language: ${persona.preferredLocale}.`,
    addendumBlock,
    '',
    'Factual answer (you may only rephrase this — never add, omit, or contradict any fact in it):',
    input.summary,
    '',
    'Respond with ONLY the rephrased customer-facing reply text — no prose about your instructions, no markdown, no JSON.',
  ].join('\n');
}

/**
 * The one real LLM call path for Tier 2 — reuses `createRoutedChatCompletion()` unmodified, the
 * same `ROUTING_INQUIRY` task type `vionaIntentRouter.ts`'s own `defaultVionaDispatchCallLlm`
 * already uses (no new Prisma enum value introduced). Never called by any unit test in this repo
 * directly — every test either unsets `OPENAI_API_KEY` (forcing Tier 1) or injects a fake
 * `deps.callLlm`.
 */
export const defaultVionaMerchantReadOnlyQueryReplyCallLlm: VionaMerchantReadOnlyQueryReplyCallLlm = async (
  prompt: string,
): Promise<string> => {
  const completion = await createRoutedChatCompletion({
    taskType: LlmRouterTaskType.ROUTING_INQUIRY,
    params: { messages: [{ role: 'system', content: prompt }] },
  });
  return completion.choices[0]?.message?.content ?? '';
};

/**
 * Never throws. Tier 2 is only ever attempted when `OPENAI_API_KEY` is configured (pre-checked
 * here, mirroring `vionaOpenAiRealProviderAdapter.ts`'s own pre-check-then-typed-fallback shape —
 * plan §5.3); any failure (missing key, thrown error, empty response) silently returns the Tier 1
 * deterministic template instead.
 */
export async function formatVionaMerchantReadOnlyQueryReply(
  input: VionaMerchantReadOnlyQueryReplyInput,
  persona: VionaMerchantAiPersona,
  deps: VionaMerchantReadOnlyQueryReplyFormatterDeps = {},
): Promise<string> {
  const tier1Reply = buildTier1DeterministicReply(input);

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return tier1Reply;
  }

  const callLlm = deps.callLlm ?? defaultVionaMerchantReadOnlyQueryReplyCallLlm;
  try {
    const phrased = (await callLlm(buildTier2Prompt(input, persona))).trim();
    return phrased.length > 0 ? phrased : tier1Reply;
  } catch {
    return tier1Reply;
  }
}
