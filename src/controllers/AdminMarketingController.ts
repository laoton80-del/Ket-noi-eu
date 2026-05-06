import { MarketingPostStatus } from '@prisma/client';
import type { Request, Response } from 'express';

import { GLOBAL_MAX_LIST_ITEMS } from '../constants/globalPerformance';
import { getPrisma } from '../lib/prisma';
import { runMarketingDraftCronJob } from '../services/marketing/AutoPoster';
import { generateTranslations } from '../services/marketing/AIPostGenerator';
import { DEFAULT_MARKETING_POLYGLOT_TARGETS } from '../services/marketing/marketingPolyglotTargets';
import { publishToFacebookPage } from '../services/marketing/FacebookGraphAPI';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

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
