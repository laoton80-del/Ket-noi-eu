import type { Request, Response } from 'express';
import { LlmRouterTaskType, Prisma, TxStatus, TxType } from '@prisma/client';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import {
  countWordsInDocument,
  estimateLegalScanPages,
  legalScanPriceVig,
} from '../domain/legalScanPricing';
import { getPrisma } from '../lib/prisma';
import { AIGatewayInsufficientVigError, assertMinimumSpendableVig } from '../services/ai/AIGateway';
import { createRoutedChatCompletion } from '../services/ai/AIRouterService';
import { translateTravelPhraseToVietnamese } from '../services/ai/TranslationService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

export type LegalScanAlertLevel = 'CRITICAL' | 'SAFE';

export type LegalScanResponseData = Readonly<{
  persona: 'AI_TRANG_SU';
  summary: readonly string[];
  alertLevel: LegalScanAlertLevel;
  chargedVIG: number;
  estimatedPages: number;
  wordCount: number;
}>;

const CRITICAL_KEYWORDS: readonly string[] = [
  'court',
  'penalty',
  'eviction',
  'strafe',
  'kündigung',
  'kundigung',
];

const AI_LEDGER_PARTY = 'ViGlobalAI';

/**
 * Future OpenAI (or other LLM) integration for legal-scan / AI routes:
 * MUST set `max_tokens: 500` (or equivalent output cap) on the API call to prevent response token
 * draining and runaway cost — never rely on model defaults alone.
 */
const MAX_LEGAL_SCAN_DOCUMENT_CHARS = 10_000;
const MAX_TRANSLATION_REQUEST_CHARS = 14_000;

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function containsCriticalKeyword(documentText: string): boolean {
  const lower = documentText.toLowerCase();
  return CRITICAL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Mock “AI Trạng Sư” — replace with OpenAI / vision pipeline later.
 */
function mockLegalScan(documentText: string): Readonly<{
  summary: readonly string[];
  alertLevel: LegalScanAlertLevel;
}> {
  if (containsCriticalKeyword(documentText)) {
    return {
      summary: ['You are facing a severe penalty.', 'Deadline is approaching.'],
      alertLevel: 'CRITICAL',
    };
  }
  return {
    summary: [
      'No urgent legal risk keywords detected in this excerpt.',
      'Still have a licensed attorney review official documents before you act.',
    ],
    alertLevel: 'SAFE',
  };
}

class LegalScanPaymentError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'LegalScanPaymentError';
  }
}

const LEGAL_SCAN_DISABLED_MESSAGE = 'Legal scan is not available in this MVP.' as const;

export async function postLegalScan(req: Request, res: Response): Promise<void> {
  try {
    if (!getFeatureFlags().legalScanEnabled) {
      res.status(403).json({
        success: false,
        code: 'FEATURE_DISABLED',
        message: LEGAL_SCAN_DISABLED_MESSAGE,
        error: LEGAL_SCAN_DISABLED_MESSAGE,
      });
      return;
    }

    const userId = readAuthUserId(req);
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const documentText =
      'documentText' in body && typeof (body as { documentText?: unknown }).documentText === 'string'
        ? (body as { documentText: string }).documentText
        : null;

    if (!documentText || documentText.trim().length === 0) {
      jsonFail(res, 'documentText is required', 400);
      return;
    }

    if (documentText.length > MAX_LEGAL_SCAN_DOCUMENT_CHARS) {
      jsonFail(
        res,
        `documentText exceeds maximum length of ${MAX_LEGAL_SCAN_DOCUMENT_CHARS} characters`,
        400
      );
      return;
    }

    const wordCount = countWordsInDocument(documentText);
    const estimatedPages = estimateLegalScanPages(wordCount);
    const chargedVIG = legalScanPriceVig(documentText);

    if (chargedVIG > 0) {
      try {
        await assertMinimumSpendableVig(userId, chargedVIG, 'openai_chat');
      } catch (gate) {
        if (gate instanceof AIGatewayInsufficientVigError) {
          jsonFail(res, gate.message, gate.httpStatus);
          return;
        }
        throw gate;
      }
    }

    const scan = mockLegalScan(documentText);

    await getPrisma().$transaction(
      async (tx) => {
        if (chargedVIG <= 0) return;

        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          throw new LegalScanPaymentError(404, 'Wallet not found');
        }

        const dec = await tx.wallet.updateMany({
          where: {
            id: wallet.id,
            balanceVIG: { gte: chargedVIG },
          },
          data: { balanceVIG: { decrement: chargedVIG } },
        });
        if (dec.count !== 1) {
          throw new LegalScanPaymentError(402, 'Insufficient VIG for AI legal scan');
        }

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            senderId: userId,
            receiverId: AI_LEDGER_PARTY,
            amountVIG: chargedVIG,
            feeAmount: 0,
            type: TxType.AI_LEGAL_SCAN,
            status: TxStatus.SUCCESS,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      }
    );

    const out: LegalScanResponseData = {
      persona: 'AI_TRANG_SU',
      summary: scan.summary,
      alertLevel: scan.alertLevel,
      chargedVIG,
      estimatedPages,
      wordCount,
    };
    jsonOk(res, out);
  } catch (e) {
    if (e instanceof AIGatewayInsufficientVigError) {
      jsonFail(res, e.message, e.httpStatus);
      return;
    }
    if (e instanceof LegalScanPaymentError) {
      jsonFail(res, e.message, e.statusCode);
      return;
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      jsonFail(res, 'Serialization conflict; please retry.', 409);
      return;
    }
    jsonFail(res, 'Unexpected error', 500);
  }
}

/**
 * Cached Vietnamese translation for travel phrases (Minh Khang) — DB hit avoids OpenAI spend.
 */
export async function postTranslateTravelPhrase(req: Request, res: Response): Promise<void> {
  try {
    const userId = readAuthUserId(req);
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const text =
      'text' in body && typeof (body as { text?: unknown }).text === 'string'
        ? (body as { text: string }).text
        : '';
    const sourceLangHint =
      'sourceLangHint' in body && typeof (body as { sourceLangHint?: unknown }).sourceLangHint === 'string'
        ? (body as { sourceLangHint: string }).sourceLangHint.trim()
        : 'auto';

    const trimmed = text.trim();
    if (!trimmed) {
      jsonFail(res, 'text is required', 400);
      return;
    }
    if (trimmed.length > MAX_TRANSLATION_REQUEST_CHARS) {
      jsonFail(res, `text exceeds maximum length of ${MAX_TRANSLATION_REQUEST_CHARS} characters`, 400);
      return;
    }

    const result = await translateTravelPhraseToVietnamese(trimmed, sourceLangHint, { userId });
    jsonOk(res, { translatedText: result.translatedText, fromCache: result.fromCache });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('OPENAI_API_KEY')) {
      jsonFail(res, 'Translation service unavailable', 503);
      return;
    }
    console.error('[AIController] postTranslateTravelPhrase', e);
    jsonFail(res, 'Unexpected error', 500);
  }
}

const MAX_CHAT_COMPLETION_MESSAGES = 32;
const MAX_CHAT_COMPLETION_CHARS_PER_MESSAGE = 14_000;
const MAX_CHAT_COMPLETION_OUTPUT_TOKENS = 512;

type ChatWireMessage = Readonly<{ role?: unknown; content?: unknown }>;

function parseChatCompletionMessages(body: unknown): ChatCompletionMessageParam[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw)) return null;
  const out: ChatCompletionMessageParam[] = [];
  for (const item of raw.slice(0, MAX_CHAT_COMPLETION_MESSAGES)) {
    if (typeof item !== 'object' || item === null) continue;
    const m = item as ChatWireMessage;
    const role = m.role;
    const content = m.content;
    if (role !== 'system' && role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string' || content.length === 0) continue;
    out.push({ role, content: content.slice(0, MAX_CHAT_COMPLETION_CHARS_PER_MESSAGE) });
  }
  return out.length > 0 ? out : null;
}

/**
 * Authenticated OpenAI chat proxy for mobile `AIEngine` — **no** client-side API keys.
 */
export async function postChatCompletion(req: Request, res: Response): Promise<void> {
  try {
    const userId = readAuthUserId(req);
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const messages = parseChatCompletionMessages(req.body);
    if (!messages) {
      jsonFail(res, 'messages (non-empty array of {role, content}) is required', 400);
      return;
    }

    const bodyObj = typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const temperatureRaw = bodyObj.temperature;
    const maxTokensRaw = bodyObj.maxTokens;
    const temperature =
      typeof temperatureRaw === 'number' && Number.isFinite(temperatureRaw)
        ? Math.min(2, Math.max(0, temperatureRaw))
        : 0.45;
    const max_tokens =
      typeof maxTokensRaw === 'number' && Number.isFinite(maxTokensRaw)
        ? Math.min(MAX_CHAT_COMPLETION_OUTPUT_TOKENS, Math.max(1, Math.trunc(maxTokensRaw)))
        : 320;

    const completion = await createRoutedChatCompletion({
      taskType: LlmRouterTaskType.ROUTING_INQUIRY,
      userId,
      params: {
        messages,
        temperature,
        max_tokens,
      },
    });

    jsonOk(res, completion);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('OPENAI_API_KEY')) {
      jsonFail(res, 'AI chat service unavailable', 503);
      return;
    }
    console.error('[AIController] postChatCompletion', e);
    jsonFail(res, 'Unexpected error', 500);
  }
}
