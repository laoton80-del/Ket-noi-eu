/**
 * **Demo sandbox** — when {@link isDemoSandboxActive} is true, outbound REST, OpenAI-compatible calls,
 * and similar pipes return **instant static mocks** (no fees, no tokens, no PII).
 *
 * *Supabase:* the mobile shell talks to the REST bridge via {@link restApiFetchJson}; there is no direct
 * Supabase client here — the same flag applies to all `/api/*` traffic. Server-side Supabase remains unchanged.
 *
 * *Stripe:* native SDK may still initialize; payment surfaces should short-circuit when demo is active
 * (see checkout sheets). No `stripe.com` HTTP from this module.
 */

import type { ApiRequestResult } from '../apiClient';
import { getDemoModeSnapshot } from '../../store/demoModeStore';

export function isDemoSandboxActive(): boolean {
  return getDemoModeSnapshot().isDemoMode === true;
}

/** Deterministic mock for REST envelope `{ success, data }` shape used by {@link restApiFetchJson}. */
export function mockRestApiEnvelopeForPath<T>(
  path: string,
  method: string = 'GET'
): { data: T; status: number } {
  const p = path.replace(/\?.*$/, '').replace(/\/+$/, '');
  const m = method.toUpperCase();
  const includeMarketingTranslations = /[?&]includeTranslations=1(?:&|$)/.test(path);
  if (/\/api\/wallet\/balance$/i.test(p)) {
    return {
      status: 200,
      data: {
        balanceVIG: 12_840,
        lockedBalanceVIG: 0,
        walletId: 'v7-demo-wallet-sandbox',
      } as T,
    };
  }
  if (/\/api\/wallet\/transfer$/i.test(p)) {
    return {
      status: 200,
      data: {
        senderWalletId: 'v7-demo-wallet-sandbox',
        receiverWalletId: 'demo-receiver',
        amountVIG: 0,
        feeVIG: 0,
        senderTransactionId: 'demo-tx-sender',
        receiverTransactionId: 'demo-tx-receiver',
      } as T,
    };
  }
  if (/\/api\/admin\/marketing\/posts\/[^/]+\/approve-and-translate$/i.test(p) && m === 'POST') {
    return {
      status: 200,
      data: {
        post: {
          id: 'demo-marketing-draft-1',
          content: 'Demo approved base — ViGlobal polyglot sandbox',
          approvedBaseContent: 'Demo approved base — ViGlobal polyglot sandbox',
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          publishedAt: null,
          translations: [
            {
              id: 'demo-tr-vi',
              postId: 'demo-marketing-draft-1',
              languageCode: 'vi',
              translatedContent: '🔥 [DEMO VI] ViGlobal — dán thủ công vào nhóm, không spam API.',
              targetAudience: 'Vietnam domestic & Vietnamese diaspora',
            },
            {
              id: 'demo-tr-en',
              postId: 'demo-marketing-draft-1',
              languageCode: 'en',
              translatedContent: '🔥 [DEMO EN] ViGlobal — paste manually into groups.',
              targetAudience: 'US & English-speaking inbound tourists',
            },
            {
              id: 'demo-tr-ko',
              postId: 'demo-marketing-draft-1',
              languageCode: 'ko',
              translatedContent: '🔥 [DEMO KO] ViGlobal — 클립보드에 복사 후 그룹에 붙여넣기.',
              targetAudience: 'Korea — travelers interested in Vietnam',
            },
            {
              id: 'demo-tr-de',
              postId: 'demo-marketing-draft-1',
              languageCode: 'de',
              translatedContent: '🔥 [DEMO DE] ViGlobal — manuell in Gruppen einfügen.',
              targetAudience: 'Germany — Vietnamese community & EU corridor',
            },
          ],
        },
      } as T,
    };
  }
  if (/\/api\/admin\/marketing\/posts$/i.test(p)) {
    return {
      status: 200,
      data: [
        {
          id: 'demo-marketing-draft-1',
          content:
            '🔥 Demo sandbox — ViGlobal đang bứt phá! #ViGlobal #InboundTourism ✨ (không gọi Facebook/OpenAI thật)',
          approvedBaseContent: includeMarketingTranslations ? 'Demo approved base' : null,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          publishedAt: null,
          ...(includeMarketingTranslations
            ? {
                translations: [
                  {
                    id: 'demo-tr-vi',
                    postId: 'demo-marketing-draft-1',
                    languageCode: 'vi',
                    translatedContent: '🔥 [DEMO VI] ViGlobal — dán thủ công vào nhóm.',
                    targetAudience: 'Vietnam domestic & Vietnamese diaspora',
                  },
                  {
                    id: 'demo-tr-en',
                    postId: 'demo-marketing-draft-1',
                    languageCode: 'en',
                    translatedContent: '🔥 [DEMO EN] ViGlobal — paste manually.',
                    targetAudience: 'US & English-speaking inbound tourists',
                  },
                  {
                    id: 'demo-tr-ko',
                    postId: 'demo-marketing-draft-1',
                    languageCode: 'ko',
                    translatedContent: '🔥 [DEMO KO] ViGlobal',
                    targetAudience: 'Korea — travelers interested in Vietnam',
                  },
                  {
                    id: 'demo-tr-de',
                    postId: 'demo-marketing-draft-1',
                    languageCode: 'de',
                    translatedContent: '🔥 [DEMO DE] ViGlobal',
                    targetAudience: 'Germany — Vietnamese community & EU corridor',
                  },
                ],
              }
            : {}),
        },
      ] as T,
    };
  }
  if (/\/api\/admin\/marketing\/posts\/[^/]+\/publish$/i.test(p)) {
    return {
      status: 200,
      data: {
        post: {
          id: 'demo-marketing-published',
          content: 'Demo published post',
          approvedBaseContent: 'Demo published post',
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
        },
        facebookPostId: 'demo_fb_post_id',
      } as T,
    };
  }
  if (/\/api\/admin\/marketing\/posts\/[^/]+$/i.test(p) && !p.endsWith('/publish')) {
    const idMatch = /\/marketing\/posts\/([^/]+)$/.exec(p);
    const id = idMatch?.[1] ?? 'demo-marketing-draft-1';
    if (m === 'DELETE') {
      return {
        status: 200,
        data: { deleted: true, id } as T,
      };
    }
    if (m === 'PUT') {
      return {
        status: 200,
        data: {
          id,
          content: '[demo sandbox] Đã lưu bản nháp',
          approvedBaseContent: null,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          publishedAt: null,
        } as T,
      };
    }
  }
  if (/\/api\/tourism\/wrap\/[^/]+$/i.test(p) && m === 'GET') {
    return {
      status: 200,
      data: {
        bookingId: 'demo-wrap-booking',
        tripVigSpent: 4200,
        completedTourismBookings: 3,
        estimatedMoneySavedUsd: 48.5,
        aiVoiceTranslationSessions: 12,
        destinationLabel: 'Demo Homestay · Ha Long Bay Escape',
        tripStartIso: new Date().toISOString(),
        tripEndIso: new Date().toISOString(),
        languageCode: 'vi',
        viralTagline:
          'Bạn vượt qua giao thông Hà Nội và vẫn kịp 10 bát phở — ViGlobal đồng hành không tăng xông!',
        downloadUrl: 'https://ketnoiglobal.com/download',
      } as T,
    };
  }
  if (/\/api\/admin\/trigger-auto-post$/i.test(p) && m === 'POST') {
    return {
      status: 200,
      data: {
        stats: { demo: true },
        draft: {
          id: `demo-draft-${Date.now()}`,
          content: '🔥 Demo cron — ViGlobal #ViGlobal #InboundTourism',
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
        },
      } as T,
    };
  }
  if (/\/api\/ai\/translate\/travel-phrase$/i.test(p) && m === 'POST') {
    return {
      status: 200,
      data: {
        translatedText: '[DEMO] Bản dịch sandbox — không tốn OpenAI.',
        fromCache: true,
      } as T,
    };
  }
  return {
    status: 200,
    data: {
      ok: true,
      demo: true,
      message: 'V7 demo sandbox — no backend mutation performed.',
      path: p,
    } as T,
  };
}

export function mockRestApiRequestResult<T>(path: string, method = 'GET'): ApiRequestResult<T> {
  const { data, status } = mockRestApiEnvelopeForPath<T>(path, method);
  return { ok: true, status, data };
}

/** Short, safe assistant copy for salon / Leona paths during demo. */
export function mockOpenAiUserVisibleReply(userContent: string): string {
  const t = userContent.slice(0, 120);
  return `Demo Leona: I would confirm this booking in production. You said: “${t}”. No payment or AI tokens were used.`;
}
