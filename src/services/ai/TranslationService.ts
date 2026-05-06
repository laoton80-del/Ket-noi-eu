/**
 * Server-only: hash-indexed Prisma translation cache + OpenAI on miss.
 * Import from Express controllers only — do not bundle into the Expo client.
 */

import { createHash } from 'node:crypto';

import { LlmRouterTaskType } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { createRoutedChatCompletion } from './AIRouterService';

const TARGET_VI = 'vi' as const;
const MAX_CACHED_SOURCE_CHARS = 12_000;
const OPENAI_MAX_TOKENS = 500;

export type TranslationCacheLookup = Readonly<{
  translatedText: string;
  fromCache: boolean;
}>;

function normalizeSourceKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function normalizeTargetLanguage(lang: string): string {
  return lang.trim().toLowerCase();
}

/** Deterministic cache key: normalized source + target language → SHA-256 hex. */
function computeTranslationCacheHash(sourceText: string, targetLanguage: string): string {
  const src = normalizeSourceKey(sourceText);
  const lang = normalizeTargetLanguage(targetLanguage);
  return createHash('sha256').update(`${src}\u0000${lang}`, 'utf8').digest('hex');
}

function persistCacheEntry(input: Readonly<{
  hash: string;
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
}>): void {
  const prisma = getPrisma();
  void prisma.translationCache
    .upsert({
      where: { hash: input.hash },
      create: {
        hash: input.hash,
        sourceText: input.sourceText,
        targetLanguage: input.targetLanguage,
        translatedText: input.translatedText,
      },
      update: {
        translatedText: input.translatedText,
        sourceText: input.sourceText,
        targetLanguage: input.targetLanguage,
      },
    })
    .catch((err: unknown) => {
      console.error('[TranslationCache] persist failed', err);
    });
}

/**
 * Minh Khang travel phrase → Vietnamese (matches client prompt contract).
 * Cache: hash(normalized source + `vi`) → DB lookup; miss → OpenAI then async persist.
 */
export async function translateTravelPhraseToVietnamese(
  rawText: string,
  sourceLangHint: string,
  options?: Readonly<{ userId?: string }>
): Promise<TranslationCacheLookup> {
  const normalized = normalizeSourceKey(rawText);
  if (normalized.length === 0) {
    return { translatedText: '', fromCache: false };
  }

  const targetLanguage = TARGET_VI;
  const prisma = getPrisma();

  if (normalized.length <= MAX_CACHED_SOURCE_CHARS) {
    const hash = computeTranslationCacheHash(normalized, targetLanguage);
    const hit = await prisma.translationCache.findUnique({
      where: { hash },
      select: { translatedText: true },
    });
    if (hit) {
      return { translatedText: hit.translatedText, fromCache: true };
    }
  }

  const userContent =
    `Minh Khang — chỉ trả về bản dịch tiếng Việt thuần (một đoạn), không tiền tố hay giải thích. ` +
    `Ngôn ngữ nguồn gợi ý: ${sourceLangHint}.\n\n${normalized}`;

  const completion = await createRoutedChatCompletion({
    taskType: LlmRouterTaskType.SIMPLE_TRANSLATION,
    userId: options?.userId,
    params: {
      temperature: 0.3,
      max_tokens: OPENAI_MAX_TOKENS,
      messages: [{ role: 'user', content: userContent }],
    },
  });

  const out = completion.choices[0]?.message?.content?.trim() ?? '';
  if (out.length === 0) {
    throw new Error('openai_translation_empty');
  }

  if (normalized.length <= MAX_CACHED_SOURCE_CHARS) {
    const hash = computeTranslationCacheHash(normalized, targetLanguage);
    persistCacheEntry({
      hash,
      sourceText: normalized,
      targetLanguage,
      translatedText: out,
    });
  }

  return { translatedText: out, fromCache: false };
}
