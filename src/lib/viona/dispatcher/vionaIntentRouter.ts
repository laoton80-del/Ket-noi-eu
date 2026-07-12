/**
 * Pack32 — Agentic Autonomous Dispatcher: Viona Intent Router.
 *
 * One structured-JSON LLM classification call — nothing more. No LangChain, no LlamaIndex, no
 * agent framework, no multi-step "agent loop" or self-retry-with-a-different-prompt. Reuses the
 * existing, already-shipped `createRoutedChatCompletion()` (`AIRouterService.ts`) for the actual
 * OpenAI call; `callLlm` is always injectable so no unit test in this repo ever makes a real LLM
 * call (see docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md §3.1/§3.2).
 *
 * `defaultVionaDispatchCallLlm()` reuses the existing `LlmRouterTaskType.ROUTING_INQUIRY` value
 * rather than adding a new Prisma enum member — a deliberate, documented deviation from the
 * plan's §5.1 file allowlist (which listed an *optional* new `AGENTIC_DISPATCH_CLASSIFICATION`
 * value) to keep this implementation increment migration-free, per the plan's own §5.2 note that
 * this substitution is acceptable. See the evidence README for the explicit rationale.
 *
 * Deny-by-default, fail-closed: every branch below returns a typed rejection reason rather than
 * throwing or guessing a default tool. See plan §5 (the six-row failure-mode table).
 */

import { LlmRouterTaskType } from '@prisma/client';

import { createRoutedChatCompletion } from '../../../services/ai/AIRouterService';
import {
  VIONA_TOOL_REGISTRY,
  findVionaToolRegistryEntry,
  validateVionaToolInputAgainstSchema,
  type VionaToolRegistryEntry,
} from './vionaToolRegistry';

export type VionaDispatchIntentInput = Readonly<{
  requestId: string;
  requestStatus: string;
  actionId?: string;
  requestSafetyLabels?: readonly string[];
  /** The natural-language request/intent text the Intent Router must classify. */
  userMessage: string;
}>;

/** The exact, minimal shape the LLM is instructed to return — nothing else is ever accepted. */
export type VionaDispatchLlmResponseShape = Readonly<{
  toolName: string | null;
  toolInputRaw: Readonly<Record<string, unknown>>;
  confidence: number;
  rationale: string;
}>;

export type VionaDispatchRejectionReason =
  | 'llm_call_failed'
  | 'response_not_valid_json'
  | 'unknown_tool'
  | 'tool_input_schema_invalid'
  | 'low_confidence';

export type VionaDispatchDecision =
  | Readonly<{
      ok: true;
      toolName: string;
      toolInput: Readonly<Record<string, unknown>>;
      confidence: number;
      rationale: string;
    }>
  | Readonly<{ ok: false; reason: VionaDispatchRejectionReason }>;

/** Advisory-only threshold — the LLM's own confidence is never trusted alone (plan §3.4/§5). */
export const VIONA_DISPATCH_MIN_CONFIDENCE = 0.6;

export type VionaIntentRouterCallLlm = (prompt: string) => Promise<string>;

export type VionaIntentRouterDeps = Readonly<{
  callLlm: VionaIntentRouterCallLlm;
}>;

function describeToolForPrompt(entry: VionaToolRegistryEntry): string {
  const fields = Object.entries(entry.inputSchema)
    .map(([field, type]) => `${field}: ${type}`)
    .join(', ');
  return `- "${entry.name}": ${entry.description} (required input: { ${fields} })`;
}

/**
 * Pure prompt builder — no network, no DB. Embeds the full Tool Registry (name + description +
 * input schema) so the model is never asked to guess a tool's shape from memory.
 */
export function buildVionaDispatchClassificationPrompt(input: VionaDispatchIntentInput): string {
  const toolLines = VIONA_TOOL_REGISTRY.map(describeToolForPrompt).join('\n');
  const contextLines = [
    `Request ID: ${input.requestId}`,
    `Request status: ${input.requestStatus}`,
    input.actionId ? `Action ID hint: ${input.actionId}` : null,
    input.requestSafetyLabels && input.requestSafetyLabels.length > 0
      ? `Safety labels present: ${input.requestSafetyLabels.join(', ')}`
      : null,
  ].filter((line): line is string => line != null);

  return [
    'You are a strict JSON classifier for the VIONA request-execution dispatcher.',
    'You may ONLY choose a tool name that is EXACTLY, character-for-character, one of the names',
    'listed below. Never invent, abbreviate, or "correct" a tool name. If no listed tool clearly',
    'and unambiguously applies to the user message, you MUST respond with "toolName": null.',
    '',
    'Available tools:',
    toolLines,
    '',
    ...contextLines,
    `User message: ${input.userMessage}`,
    '',
    'Respond with ONLY this exact JSON object — no prose, no markdown code fences, no extra keys:',
    '{"toolName": <string or null>, "toolInputRaw": <object>, "confidence": <number 0..1>, "rationale": <short string>}',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Strict parse + shape validation of the raw LLM response text. Returns `null` for anything that
 * is not valid JSON or does not match `VionaDispatchLlmResponseShape` exactly — never partially
 * accepted, never coerced.
 */
function parseVionaDispatchLlmResponse(raw: string): VionaDispatchLlmResponseShape | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;

  const { toolName, toolInputRaw, confidence, rationale } = parsed;

  if (toolName !== null && typeof toolName !== 'string') return null;
  if (!isPlainObject(toolInputRaw)) return null;
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return null;
  if (typeof rationale !== 'string') return null;

  const normalizedToolName = typeof toolName === 'string' && toolName.trim().length > 0 ? toolName : null;

  return {
    toolName: normalizedToolName,
    toolInputRaw,
    confidence,
    rationale,
  };
}

/**
 * Pure classification + validation function — no network, no DB of its own (the network call
 * happens only inside the injected `deps.callLlm`). Given an intent, returns either a validated,
 * registry-matched dispatch decision, or one of the five typed rejection reasons. Never throws —
 * every failure path (including an injected `callLlm` throwing) is converted into a typed
 * `ok: false` result.
 */
export async function routeVionaDispatchIntent(
  input: VionaDispatchIntentInput,
  deps: VionaIntentRouterDeps,
): Promise<VionaDispatchDecision> {
  let raw: string;
  try {
    raw = await deps.callLlm(buildVionaDispatchClassificationPrompt(input));
  } catch {
    return { ok: false, reason: 'llm_call_failed' };
  }

  const parsed = parseVionaDispatchLlmResponse(raw);
  if (!parsed) {
    return { ok: false, reason: 'response_not_valid_json' };
  }

  // The model itself declined to pick a tool — treated as "not confident enough to act", one of
  // the plan's six documented failure modes, never a separate "no-op success".
  if (parsed.toolName === null) {
    return { ok: false, reason: 'low_confidence' };
  }

  if (parsed.confidence < VIONA_DISPATCH_MIN_CONFIDENCE) {
    return { ok: false, reason: 'low_confidence' };
  }

  const entry = findVionaToolRegistryEntry(parsed.toolName);
  if (!entry) {
    return { ok: false, reason: 'unknown_tool' };
  }

  const schemaCheck = validateVionaToolInputAgainstSchema(entry, parsed.toolInputRaw);
  if (!schemaCheck.ok) {
    return { ok: false, reason: 'tool_input_schema_invalid' };
  }

  return {
    ok: true,
    toolName: entry.name,
    toolInput: parsed.toolInputRaw,
    confidence: parsed.confidence,
    rationale: parsed.rationale,
  };
}

/**
 * The one real LLM call path for Pack32 — reuses `createRoutedChatCompletion()` unmodified, with
 * JSON-mode response formatting and the existing `ROUTING_INQUIRY` task type (see module header
 * for why no new Prisma enum value is introduced). Never called by any unit test in this repo —
 * every test injects a fake `callLlm` instead (plan §6, test cases 1–7).
 */
export const defaultVionaDispatchCallLlm: VionaIntentRouterCallLlm = async (prompt: string): Promise<string> => {
  const completion = await createRoutedChatCompletion({
    taskType: LlmRouterTaskType.ROUTING_INQUIRY,
    params: {
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: prompt }],
    },
  });
  return completion.choices[0]?.message?.content ?? '';
};
