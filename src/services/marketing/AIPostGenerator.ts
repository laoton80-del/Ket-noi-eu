import { BizType, LlmRouterTaskType, MarketingPostStatus, TourismBookingStatus } from '@prisma/client';

import { GLOBAL_MAX_LIST_ITEMS } from '../../constants/globalPerformance';
import { getPrisma } from '../../lib/prisma';
import { createRoutedChatCompletion } from '../ai/AIRouterService';

/** Snapshot of “exciting daily stats” for social copy — all counts are best-effort aggregates. */
export interface MarketingDailyStats {
  readonly dateIsoUtc: string;
  readonly newMerchantsToday: number;
  readonly newHotelsToday: number;
  readonly totalActiveUsers: number;
  readonly tourismBookingsPendingOrConfirmed: number;
  readonly tourismTripsCompletedLast7DaysUtc: number;
  readonly totalTourismServiceListings: number;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addUtcDays(d: Date, days: number): Date {
  const t = new Date(d);
  t.setUTCDate(t.getUTCDate() + days);
  return t;
}

export async function fetchMarketingDailyStats(now: Date = new Date()): Promise<MarketingDailyStats> {
  const prisma = getPrisma();
  const dayStart = startOfUtcDay(now);
  const sevenDaysAgo = addUtcDays(startOfUtcDay(now), -7);

  const [
    newMerchantsToday,
    newHotelsToday,
    totalActiveUsers,
    tourismBookingsPendingOrConfirmed,
    tourismTripsCompletedLast7DaysUtc,
    totalTourismServiceListings,
  ] = await Promise.all([
    prisma.business.count({ where: { joinedAt: { gte: dayStart } } }),
    prisma.business.count({
      where: { joinedAt: { gte: dayStart }, category: BizType.HOTEL },
    }),
    prisma.user.count({ where: { gdprErasedAt: null } }),
    prisma.tourismBooking.count({
      where: { status: { in: [TourismBookingStatus.PENDING, TourismBookingStatus.CONFIRMED] } },
    }),
    prisma.tourismBooking.count({
      where: {
        status: TourismBookingStatus.COMPLETED,
        startDate: { gte: sevenDaysAgo, lte: now },
      },
    }),
    prisma.tourismService.count(),
  ]);

  return {
    dateIsoUtc: now.toISOString(),
    newMerchantsToday,
    newHotelsToday,
    totalActiveUsers,
    tourismBookingsPendingOrConfirmed,
    tourismTripsCompletedLast7DaysUtc,
    totalTourismServiceListings,
  };
}

const SYSTEM_PROMPT =
  'You are the witty and engaging Social Media Manager for VIONA Super App. ' +
  'Write a short, viral Facebook post in Vietnamese (with emojis and hashtags like #VIONA #InboundTourism) ' +
  'announcing these daily stats or welcoming new merchants. Keep it high-energy.';

export async function generateViGlobalFacebookPost(stats: MarketingDailyStats): Promise<string> {
  const userPayload = [
    'Dữ liệu thống kê nội bộ (JSON):',
    JSON.stringify(stats, null, 2),
    '',
    'Yêu cầu: một bài đăng Facebook duy nhất, tiếng Việt, ngắn gọn, có emoji và hashtag #VIONA #InboundTourism (có thể thêm hashtag phù hợp).',
  ].join('\n');

  const completion = await createRoutedChatCompletion({
    taskType: LlmRouterTaskType.COMPLEX_MARKETING,
    params: {
      temperature: 0.85,
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPayload },
      ],
    },
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text || text.length === 0) {
    throw new Error('OpenAI returned an empty message');
  }
  return text;
}

/** Cron / manual trigger: generate copy from live stats and persist as `DRAFT` (no Facebook). */
export async function createMarketingDraftFromOpenAI(): Promise<{
  readonly draft: {
    readonly id: string;
    readonly content: string;
    readonly status: MarketingPostStatus;
    readonly createdAt: Date;
  };
  readonly stats: MarketingDailyStats;
}> {
  const stats = await fetchMarketingDailyStats();
  const content = await generateViGlobalFacebookPost(stats);
  const row = await getPrisma().marketingPost.create({
    data: { content, status: MarketingPostStatus.DRAFT },
    select: { id: true, content: true, status: true, createdAt: true },
  });
  return { draft: row, stats };
}

/**
 * Pack32.1 — Marketing Content Generator Tool Expansion (see
 * docs/internal-ops/VIONA_PACK32_1_MARKETING_CONTENT_POC_PLAN.md §3.4). A narrow,
 * topic/tone/language-parameterized sibling of `generateViGlobalFacebookPost()` above — same
 * `LlmRouterTaskType.COMPLEX_MARKETING` task type (no new Prisma enum), same `MarketingPost`
 * model, same `DRAFT` status default. Never calls Facebook/any social API; only ever persists a
 * `DRAFT` row. Never persists a row for a failed/empty generation — the Prisma write only happens
 * after the generated text is confirmed non-empty.
 */
export type GenerateVionaMarketingContentDraftInput = Readonly<{
  topic: string;
  tone: string;
  targetLanguageCode: string;
}>;

export type GenerateVionaMarketingContentDraftResult = Readonly<{
  marketingPostId: string;
  content: string;
}>;

function buildVionaMarketingContentDraftSystemPrompt(targetLanguageCode: string): string {
  return [
    'You are a marketing copywriter for VIONA, a European inbound-tourism/local-services super-app.',
    `Write a short, engaging social/marketing post in the language identified by ISO code "${targetLanguageCode}".`,
    'Match the requested tone exactly. Keep it concise (2-4 sentences), no more than one hashtag block at the end.',
    'This is an internal DRAFT for human review only — never claim it has been published anywhere.',
  ].join(' ');
}

/**
 * Generates one topic/tone/language-parameterized marketing draft and persists it as a `DRAFT`
 * `MarketingPost` row. Throws (never persists a row) if `topic`/`tone`/`targetLanguageCode` is
 * empty, or if the underlying LLM call fails or returns an empty message — callers (see
 * `vionaMarketingContentDispatchService.ts`) are expected to catch and map this to a typed
 * `content_generation_failed` result rather than let it propagate as an unhandled rejection.
 */
export async function generateVionaMarketingContentDraft(
  input: GenerateVionaMarketingContentDraftInput
): Promise<GenerateVionaMarketingContentDraftResult> {
  const topic = input.topic.trim();
  const tone = input.tone.trim();
  const targetLanguageCode = input.targetLanguageCode.trim();
  if (topic.length === 0 || tone.length === 0 || targetLanguageCode.length === 0) {
    throw new Error(
      'generateVionaMarketingContentDraft: topic, tone, and targetLanguageCode are all required'
    );
  }

  const systemPrompt = buildVionaMarketingContentDraftSystemPrompt(targetLanguageCode);
  const userPayload = [`Topic: ${topic}`, `Tone: ${tone}`, `Target language (ISO code): ${targetLanguageCode}`].join(
    '\n'
  );

  const completion = await createRoutedChatCompletion({
    taskType: LlmRouterTaskType.COMPLEX_MARKETING,
    params: {
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPayload },
      ],
    },
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text || text.length === 0) {
    throw new Error('generateVionaMarketingContentDraft: OpenAI returned an empty message');
  }

  const row = await getPrisma().marketingPost.create({
    data: { content: text, status: MarketingPostStatus.DRAFT },
    select: { id: true, content: true },
  });

  return { marketingPostId: row.id, content: row.content };
}

const TRANSLATION_JSON_INSTRUCTION = [
  'You are a senior social media localization lead for VIONA (inbound tourism super-app).',
  'Translate and culturally adapt the base Facebook post for each target market.',
  'Keep energy, emojis, and hashtags where natural; avoid spam tone; respect Meta community standards.',
  'Return STRICT JSON only with shape:',
  '{"translations":[{"languageCode":"vi","translatedContent":"...","targetAudience":"..."}]}',
  'Include exactly one entry per requested target; languageCode must match the ISO 639-1 code given.',
].join(' ');

function stripJsonFence(raw: string): string {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t);
  if (fence?.[1]) return fence[1].trim();
  return t;
}

function parseTranslationPayload(
  raw: string,
  targets: ReadonlyArray<{ lang: string; audience: string }>
): ReadonlyArray<{ languageCode: string; translatedContent: string; targetAudience: string }> {
  const text = stripJsonFence(raw);
  const parsed = JSON.parse(text) as unknown;
  const root =
    typeof parsed === 'object' && parsed !== null && 'translations' in parsed
      ? (parsed as { translations: unknown }).translations
      : parsed;
  if (!Array.isArray(root)) {
    throw new Error('OpenAI JSON: expected translations array');
  }
  if (root.length !== targets.length) {
    throw new Error(`OpenAI JSON: expected ${targets.length} translations, got ${root.length}`);
  }
  const out: { languageCode: string; translatedContent: string; targetAudience: string }[] = [];
  for (let i = 0; i < targets.length; i++) {
    const rowRaw = root[i];
    if (!rowRaw || typeof rowRaw !== 'object') {
      throw new Error(`OpenAI JSON: missing translation object at index ${i}`);
    }
    const row = rowRaw as Record<string, unknown>;
    const fallback = targets[i]!;
    const languageCode =
      typeof row?.languageCode === 'string' && row.languageCode.length > 0
        ? row.languageCode
        : fallback.lang;
    const translatedContent =
      typeof row?.translatedContent === 'string' && row.translatedContent.trim().length > 0
        ? row.translatedContent.trim()
        : '';
    const targetAudience =
      typeof row?.targetAudience === 'string' && row.targetAudience.length > 0
        ? row.targetAudience
        : fallback.audience;
    if (translatedContent.length === 0) {
      throw new Error(`OpenAI returned empty translation for ${languageCode}`);
    }
    out.push({ languageCode, translatedContent, targetAudience });
  }
  return out;
}

/**
 * Polyglot pack: OpenAI translates `baseContent` for each target, persists `MarketingTranslation` rows.
 * Does **not** call Facebook — safe for Meta limits; groups use manual paste from admin UI.
 */
export async function generateTranslations(
  postId: string,
  baseContent: string,
  targets: ReadonlyArray<{ lang: string; audience: string }>
): Promise<
  ReadonlyArray<{
    id: string;
    postId: string;
    languageCode: string;
    translatedContent: string;
    targetAudience: string;
  }>
> {
  if (targets.length === 0) {
    throw new Error('At least one translation target is required');
  }
  const userPayload = [
    TRANSLATION_JSON_INSTRUCTION,
    '',
    'Base post:',
    baseContent.trim(),
    '',
    'Targets (translate for each):',
    JSON.stringify(
      targets.map((t) => ({ languageCode: t.lang, audienceHint: t.audience })),
      null,
      2
    ),
  ].join('\n');

  const completion = await createRoutedChatCompletion({
    taskType: LlmRouterTaskType.COMPLEX_MARKETING,
    params: {
      temperature: 0.35,
      max_tokens: 2_500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: TRANSLATION_JSON_INSTRUCTION },
        { role: 'user', content: userPayload },
      ],
    },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw || raw.length === 0) {
    throw new Error('OpenAI returned an empty translation payload');
  }

  const parsedRows = parseTranslationPayload(raw, targets);
  const prisma = getPrisma();

  await prisma.$transaction([
    prisma.marketingTranslation.deleteMany({ where: { postId } }),
    prisma.marketingTranslation.createMany({
      data: parsedRows.map((r) => ({
        postId,
        languageCode: r.languageCode,
        translatedContent: r.translatedContent,
        targetAudience: r.targetAudience,
      })),
    }),
  ]);

  return prisma.marketingTranslation.findMany({
    where: { postId },
    orderBy: { languageCode: 'asc' },
    take: GLOBAL_MAX_LIST_ITEMS,
    select: {
      id: true,
      postId: true,
      languageCode: true,
      translatedContent: true,
      targetAudience: true,
    },
  });
}
