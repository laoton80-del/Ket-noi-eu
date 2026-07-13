import { MarketingPostStatus } from '@prisma/client';
import type { Request, Response } from 'express';

import { GLOBAL_MAX_LIST_ITEMS } from '../constants/globalPerformance';
import { getPrisma } from '../lib/prisma';
import { runMarketingDraftCronJob } from '../services/marketing/AutoPoster';
import { generateTranslations } from '../services/marketing/AIPostGenerator';
import { DEFAULT_MARKETING_POLYGLOT_TARGETS } from '../services/marketing/marketingPolyglotTargets';
import { publishToFacebookPage } from '../services/marketing/FacebookGraphAPI';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';
import {
  dispatchVionaMarketingContentRequest,
  type VionaMarketingContentDispatchRejectionReason,
} from '../services/viona/vionaMarketingContentDispatchService';

export type MarketingTranslationDto = Readonly<{
  id: string;
  postId: string;
  languageCode: string;
  translatedContent: string;
  targetAudience: string;
}>;

export type MarketingPostRowDto = Readonly<{
  id: string;
  content: string;
  approvedBaseContent: string | null;
  status: MarketingPostStatus;
  createdAt: string;
  publishedAt: string | null;
  translations?: MarketingTranslationDto[];
}>;

function translationToDto(row: {
  id: string;
  postId: string;
  languageCode: string;
  translatedContent: string;
  targetAudience: string;
}): MarketingTranslationDto {
  return {
    id: row.id,
    postId: row.postId,
    languageCode: row.languageCode,
    translatedContent: row.translatedContent,
    targetAudience: row.targetAudience,
  };
}

function toDto(
  row: {
    id: string;
    content: string;
    approvedBaseContent: string | null;
    status: MarketingPostStatus;
    createdAt: Date;
    publishedAt: Date | null;
  },
  translations?: MarketingTranslationDto[]
): MarketingPostRowDto {
  const base: MarketingPostRowDto = {
    id: row.id,
    content: row.content,
    approvedBaseContent: row.approvedBaseContent,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  };
  if (translations !== undefined) {
    return { ...base, translations };
  }
  return base;
}

function parseStatusFilter(raw: unknown): MarketingPostStatus | undefined {
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  if (raw === MarketingPostStatus.DRAFT) return MarketingPostStatus.DRAFT;
  if (raw === MarketingPostStatus.PUBLISHED) return MarketingPostStatus.PUBLISHED;
  if (raw === MarketingPostStatus.REJECTED) return MarketingPostStatus.REJECTED;
  return undefined;
}

function routePostId(req: Request): string | undefined {
  const raw = req.params['id'];
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t.length > 0 ? t : undefined;
  }
  if (Array.isArray(raw)) {
    const t = raw[0]?.trim() ?? '';
    return t.length > 0 ? t : undefined;
  }
  return undefined;
}

function parseIncludeTranslations(req: Request): boolean {
  const q = req.query['includeTranslations'];
  return q === 'true' || q === '1';
}

function parseListPagination(req: Request): { skip: number; take: number } {
  const rawPage = Number(req.query['page']);
  const rawLimit = Number(req.query['limit']);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limitRaw = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.floor(rawLimit) : GLOBAL_MAX_LIST_ITEMS;
  const take = Math.min(GLOBAL_MAX_LIST_ITEMS, limitRaw);
  const skip = (page - 1) * take;
  return { skip, take };
}

/** `GET /api/admin/marketing/posts?status=DRAFT&includeTranslations=1&page=1&limit=20` */
export async function getMarketingPosts(req: Request, res: Response): Promise<void> {
  try {
    const status = parseStatusFilter(req.query.status);
    const includeTranslations = parseIncludeTranslations(req);
    const { skip, take } = parseListPagination(req);
    const posts = await getPrisma().marketingPost.findMany({
      where: status !== undefined ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        content: true,
        approvedBaseContent: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        ...(includeTranslations
          ? {
              translations: {
                orderBy: { languageCode: 'asc' as const },
                take: GLOBAL_MAX_LIST_ITEMS,
                select: {
                  id: true,
                  postId: true,
                  languageCode: true,
                  translatedContent: true,
                  targetAudience: true,
                },
              },
            }
          : {}),
      },
    });
    const page = Math.floor(skip / take) + 1;
    jsonOk(res, {
      items: posts.map((p) => {
        if (includeTranslations && 'translations' in p && Array.isArray(p.translations)) {
          return toDto(
            p,
            p.translations.map((t) => translationToDto(t))
          );
        }
        return toDto(p);
      }),
      page,
      limit: take,
    });
  } catch (err) {
    console.error('[AdminMarketingController] getMarketingPosts', err);
    jsonFail(res, 'Failed to load marketing posts', 500);
  }
}

/** `PUT /api/admin/marketing/posts/:id` — edit `content` while post is `DRAFT`. */
export async function putMarketingPost(req: Request, res: Response): Promise<void> {
  try {
    const id = routePostId(req);
    if (!id) {
      jsonFail(res, 'Missing id', 400);
      return;
    }
    const body = req.body as { content?: unknown };
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      jsonFail(res, 'content (non-empty string) required', 400);
      return;
    }
    const content = body.content.trim();
    const existing = await getPrisma().marketingPost.findUnique({ where: { id } });
    if (!existing) {
      jsonFail(res, 'Post not found', 404);
      return;
    }
    if (existing.status !== MarketingPostStatus.DRAFT) {
      jsonFail(res, 'Only DRAFT posts can be edited', 409);
      return;
    }
    const updated = await getPrisma().marketingPost.update({
      where: { id },
      data: { content },
    });
    jsonOk(res, toDto(updated));
  } catch (err) {
    console.error('[AdminMarketingController] putMarketingPost', err);
    jsonFail(res, 'Failed to update post', 500);
  }
}

/**
 * `POST /api/admin/marketing/posts/:id/publish` — **only** server path that calls Facebook Graph API (official Page).
 * Uses `approvedBaseContent` when set, else `content`.
 */
export async function postMarketingPostPublish(req: Request, res: Response): Promise<void> {
  const id = routePostId(req);
  if (!id) {
    jsonFail(res, 'Missing id', 400);
    return;
  }
  try {
    const existing = await getPrisma().marketingPost.findUnique({ where: { id } });
    if (!existing) {
      jsonFail(res, 'Post not found', 404);
      return;
    }
    if (existing.status !== MarketingPostStatus.DRAFT) {
      jsonFail(res, 'Only DRAFT posts can be published', 409);
      return;
    }
    const messageText = (existing.approvedBaseContent?.trim() || existing.content.trim());
    if (messageText.length === 0) {
      jsonFail(res, 'Post has no text to publish', 400);
      return;
    }
    const fb = await publishToFacebookPage(messageText);
    if (!fb.success) {
      console.error('[AdminMarketingController] Facebook publish failed', fb.error);
      jsonFail(res, fb.error, 502);
      return;
    }
    const updated = await getPrisma().marketingPost.update({
      where: { id },
      data: {
        status: MarketingPostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    jsonOk(res, { post: toDto(updated), facebookPostId: fb.postId });
  } catch (err) {
    console.error('[AdminMarketingController] postMarketingPostPublish', err);
    jsonFail(res, err instanceof Error ? err.message : 'Publish failed', 500);
  }
}

/** `DELETE /api/admin/marketing/posts/:id` — remove a `DRAFT` (reject / discard). */
export async function deleteMarketingDraft(req: Request, res: Response): Promise<void> {
  try {
    const id = routePostId(req);
    if (!id) {
      jsonFail(res, 'Missing id', 400);
      return;
    }
    const existing = await getPrisma().marketingPost.findUnique({ where: { id } });
    if (!existing) {
      jsonFail(res, 'Post not found', 404);
      return;
    }
    if (existing.status !== MarketingPostStatus.DRAFT) {
      jsonFail(res, 'Only DRAFT posts can be deleted', 409);
      return;
    }
    await getPrisma().marketingPost.delete({ where: { id } });
    jsonOk(res, { deleted: true, id });
  } catch (err) {
    console.error('[AdminMarketingController] deleteMarketingDraft', err);
    jsonFail(res, 'Failed to delete draft', 500);
  }
}

/**
 * `POST /api/admin/marketing/posts/:id/approve-and-translate`
 * Locks `approvedBaseContent`, runs OpenAI polyglot pack, persists `MarketingTranslation` rows. No Facebook group APIs.
 */
export async function postMarketingApproveAndTranslate(req: Request, res: Response): Promise<void> {
  const id = routePostId(req);
  if (!id) {
    jsonFail(res, 'Missing id', 400);
    return;
  }
  try {
    const existing = await getPrisma().marketingPost.findUnique({ where: { id } });
    if (!existing) {
      jsonFail(res, 'Post not found', 404);
      return;
    }
    if (existing.status !== MarketingPostStatus.DRAFT) {
      jsonFail(res, 'Only DRAFT posts can be approved for translation', 409);
      return;
    }
    const body = req.body as { content?: unknown };
    const fromBody = typeof body.content === 'string' ? body.content.trim() : '';
    const base = fromBody.length > 0 ? fromBody : existing.content.trim();
    if (base.length === 0) {
      jsonFail(res, 'Base content is empty', 400);
      return;
    }

    await getPrisma().marketingPost.update({
      where: { id },
      data: {
        approvedBaseContent: base,
        content: base,
      },
    });

    await generateTranslations(id, base, DEFAULT_MARKETING_POLYGLOT_TARGETS);

    const post = await getPrisma().marketingPost.findUniqueOrThrow({
      where: { id },
      include: { translations: { orderBy: { languageCode: 'asc' } } },
    });

    jsonOk(res, {
      post: toDto(post, post.translations.map((t) => translationToDto(t))),
    });
  } catch (err) {
    console.error('[AdminMarketingController] approve-and-translate', err);
    jsonFail(res, err instanceof Error ? err.message : 'Translation failed', 500);
  }
}

/**
 * `POST /api/admin/trigger-auto-post` — same as cron: OpenAI → new `DRAFT` row (no Facebook).
 */
export async function postTriggerAutoPost(_req: Request, res: Response): Promise<void> {
  try {
    const out = await runMarketingDraftCronJob();
    jsonOk(res, out);
  } catch (err) {
    console.error('[AdminMarketingController] trigger-auto-post failed:', err);
    jsonFail(res, err instanceof Error ? err.message : 'Draft generation failed', 500);
  }
}

/** HTTP status mapping for the 4 rejection-reason buckets — see plan §3.2. */
const CONTENT_GENERATOR_CLASSIFICATION_REJECTION_REASONS: ReadonlySet<VionaMarketingContentDispatchRejectionReason> =
  new Set(['unknown_tool', 'tool_input_schema_invalid', 'low_confidence', 'wrong_tool_category']);
const CONTENT_GENERATOR_UPSTREAM_REJECTION_REASONS: ReadonlySet<VionaMarketingContentDispatchRejectionReason> =
  new Set(['llm_call_failed', 'response_not_valid_json', 'content_generation_failed']);

function requiredTrimmedStringField(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

/**
 * Pack32.3 — Marketing Content API Route Wiring (see
 * docs/internal-ops/VIONA_PACK32_3_MARKETING_ROUTE_PLAN.md §3/§4). A thin Controller wrapper
 * ONLY — `dispatchVionaMarketingContentRequest()` itself (Pack32.1, PR #312) is never modified;
 * this function only (a) validates the structured `{topic, tone, targetLanguageCode}` request
 * body, (b) builds a deterministic, templated `userMessage` string for the existing, unmodified
 * Intent Router to classify, and (c) maps the existing, unmodified dispatch result onto the
 * existing `jsonOk`/`jsonFail` HTTP envelope. `deps.dispatch` is injectable for tests only —
 * production callers (see `adminRoutes.ts`) never pass it, so production always uses the real,
 * unmodified `dispatchVionaMarketingContentRequest`.
 *
 * `POST /api/admin/marketing/generate-draft` — mounted on `adminRouter`, behind the existing,
 * unmodified `authMiddleware` + `superAdminMiddleware` (`Role.ADMIN` required) chain applied to
 * every route in that router. Never posts anywhere — the only possible side effect is exactly the
 * one Pack32.1 already guarantees: one `MarketingPost` row with status `DRAFT`, awaiting the
 * existing, separate, human-operated `publish`/`approve-and-translate`/`delete` actions above.
 */
export async function postAdminMarketingGenerateDraft(
  req: Request,
  res: Response,
  deps: Readonly<{ dispatch?: typeof dispatchVionaMarketingContentRequest }> = {}
): Promise<void> {
  try {
    const body = req.body as { topic?: unknown; tone?: unknown; targetLanguageCode?: unknown };
    const topic = requiredTrimmedStringField(body.topic, 500);
    const tone = requiredTrimmedStringField(body.tone, 100);
    const targetLanguageCode = requiredTrimmedStringField(body.targetLanguageCode, 10);
    if (topic === null || tone === null || targetLanguageCode === null) {
      jsonFail(res, 'topic, tone, and targetLanguageCode are all required', 400);
      return;
    }

    const userMessage = `Draft a ${tone} marketing/social post about "${topic}" in the language identified by ISO code "${targetLanguageCode}".`;

    const dispatch = deps.dispatch ?? dispatchVionaMarketingContentRequest;
    const result = await dispatch({ userMessage });

    if (!result.ok) {
      if (result.reason === 'invalid_input') {
        jsonFail(res, 'Invalid marketing content generation request', 400);
        return;
      }
      if (CONTENT_GENERATOR_CLASSIFICATION_REJECTION_REASONS.has(result.reason)) {
        jsonFail(res, `Marketing content generation request could not be classified (${result.reason})`, 422);
        return;
      }
      if (CONTENT_GENERATOR_UPSTREAM_REJECTION_REASONS.has(result.reason)) {
        jsonFail(res, `Marketing content generation upstream failure (${result.reason})`, 502);
        return;
      }
      // Defensive, never-expected-to-trigger fallback — a future new rejection reason added to
      // the dispatcher without a matching branch here fails closed as 422, never a silent 200.
      jsonFail(res, `Marketing content generation request rejected (${result.reason})`, 422);
      return;
    }

    jsonOk(res, {
      marketingPostId: result.marketingPostId,
      content: result.content,
      toolName: result.toolName,
      confidence: result.confidence,
    });
  } catch (err) {
    console.error('[AdminMarketingController] postAdminMarketingGenerateDraft', err);
    jsonFail(res, 'Internal server error', 500);
  }
}
