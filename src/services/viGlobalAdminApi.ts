import { restApiFetchJson, type ApiRequestResult } from './apiClient';

export type MarketingPostStatusDto = 'DRAFT' | 'PUBLISHED' | 'REJECTED';

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
  status: MarketingPostStatusDto;
  createdAt: string;
  publishedAt: string | null;
  translations?: MarketingTranslationDto[];
}>;

export type AdminMarketingDraftTriggerPayload = Readonly<{
  stats: unknown;
  draft: Readonly<{
    id: string;
    content: string;
    status: 'DRAFT';
    createdAt: string;
  }>;
}>;

export type AdminTourismStatsPayload = Readonly<{
  totalTourismRevenueVIG: number;
  platformRevenueCutVIG: number;
  activeVNBusinesses: number;
  bookingStatusSplit: Readonly<
    Record<'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED', number>
  >;
  topPerformingServices: ReadonlyArray<
    Readonly<{
      serviceId: string;
      title: string;
      businessId: string;
      businessName: string;
      businessCategory: string;
      bookingCount: number;
    }>
  >;
}>;

/** `GET /api/admin/tourism-stats` — requires JWT + server `Role.ADMIN`. */
export async function fetchAdminTourismStats(): Promise<
  ApiRequestResult<AdminTourismStatsPayload>
> {
  return restApiFetchJson<AdminTourismStatsPayload>('/api/admin/tourism-stats', {
    method: 'GET',
  });
}

export type AdminMarketingPostsPageDto = Readonly<{
  items: readonly MarketingPostRowDto[];
  page: number;
  limit: number;
}>;

/** `GET /api/admin/marketing/posts` — optional `status`, `includeTranslations=1`, `page`, `limit` (max 20). */
export async function fetchAdminMarketingPosts(
  status?: MarketingPostStatusDto,
  includeTranslations = false,
  page = 1
): Promise<ApiRequestResult<AdminMarketingPostsPageDto>> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (includeTranslations) params.set('includeTranslations', '1');
  if (page >= 1) params.set('page', String(page));
  const qs = params.toString();
  return restApiFetchJson<AdminMarketingPostsPageDto>(
    `/api/admin/marketing/posts${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  );
}

/** Lock `approvedBaseContent`, OpenAI polyglot pack → `MarketingTranslation` rows (no Facebook groups API). */
export async function postAdminMarketingApproveAndTranslate(
  id: string,
  body?: Readonly<{ content?: string }>
): Promise<ApiRequestResult<{ post: MarketingPostRowDto }>> {
  return restApiFetchJson<{ post: MarketingPostRowDto }>(
    `/api/admin/marketing/posts/${encodeURIComponent(id)}/approve-and-translate`,
    { method: 'POST', body: body ?? {} }
  );
}

/** `PUT /api/admin/marketing/posts/:id` — edit draft body. */
export async function putAdminMarketingPost(
  id: string,
  body: Readonly<{ content: string }>
): Promise<ApiRequestResult<MarketingPostRowDto>> {
  return restApiFetchJson<MarketingPostRowDto>(`/api/admin/marketing/posts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
}

/** `POST /api/admin/marketing/posts/:id/publish` — Facebook Graph publish + DB `PUBLISHED`. */
export async function publishAdminMarketingPost(
  id: string
): Promise<ApiRequestResult<{ post: MarketingPostRowDto; facebookPostId: string }>> {
  return restApiFetchJson<{ post: MarketingPostRowDto; facebookPostId: string }>(
    `/api/admin/marketing/posts/${encodeURIComponent(id)}/publish`,
    { method: 'POST' }
  );
}

/** `DELETE /api/admin/marketing/posts/:id` — discard a `DRAFT`. */
export async function deleteAdminMarketingDraft(
  id: string
): Promise<ApiRequestResult<{ deleted: boolean; id: string }>> {
  return restApiFetchJson<{ deleted: boolean; id: string }>(
    `/api/admin/marketing/posts/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );
}

/** `POST /api/admin/trigger-auto-post` — OpenAI → new `DRAFT` (same as cron; no Facebook). */
export async function triggerAdminMarketingDraft(): Promise<
  ApiRequestResult<AdminMarketingDraftTriggerPayload>
> {
  return restApiFetchJson<AdminMarketingDraftTriggerPayload>('/api/admin/trigger-auto-post', {
    method: 'POST',
  });
}
