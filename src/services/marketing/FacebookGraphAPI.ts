import axios, { isAxiosError } from 'axios';

const FB_GRAPH_VERSION = 'v19.0';

export type FacebookPublishOutcome =
  | { readonly success: true; readonly postId: string }
  | { readonly success: false; readonly error: string };

/**
 * Publishes a plain-text post to the configured ViGlobal Facebook Page feed.
 * Failures are swallowed into {@link FacebookPublishOutcome} — callers must check `success`.
 */
export async function publishToFacebookPage(content: string): Promise<FacebookPublishOutcome> {
  const pageId = process.env.FB_PAGE_ID?.trim();
  const accessToken = process.env.FB_PAGE_ACCESS_TOKEN?.trim();

  if (!pageId || pageId.length === 0 || !accessToken || accessToken.length === 0) {
    const msg = 'Missing FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN';
    console.error(`[FacebookGraphAPI] ${msg}`);
    return { success: false, error: msg };
  }

  const url = `https://graph.facebook.com/${FB_GRAPH_VERSION}/${encodeURIComponent(pageId)}/feed`;

  try {
    const { data } = await axios.post<unknown>(
      url,
      new URLSearchParams({
        message: content,
        access_token: accessToken,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30_000,
        validateStatus: (s) => s >= 200 && s < 300,
      }
    );

    const postId =
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      typeof (data as { id: unknown }).id === 'string'
        ? (data as { id: string }).id
        : undefined;

    if (!postId) {
      console.error('[FacebookGraphAPI] Unexpected response payload:', data);
      return { success: false, error: 'Facebook API returned no post id' };
    }

    return { success: true, postId };
  } catch (err) {
    if (isAxiosError(err)) {
      const fb = err.response?.data;
      console.error('[FacebookGraphAPI] Feed POST failed', {
        status: err.response?.status,
        data: fb ?? err.message,
      });
      const msg =
        typeof fb === 'object' && fb !== null && 'error' in fb
          ? JSON.stringify((fb as { error: unknown }).error)
          : err.message;
      return { success: false, error: msg };
    }
    console.error('[FacebookGraphAPI] Feed POST failed', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
