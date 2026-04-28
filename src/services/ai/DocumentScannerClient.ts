export interface DocumentParseResult {
  title: string;
  summary: string;
  urgency: 'Low' | 'Medium' | 'High';
  actionItems: string[];
}

import { getWalletIdToken } from '../walletFirebaseSession';
import { mergeTrustBackendHeaders } from '../../utils/trustBackendHeaders';
import { logEvent } from '../../utils/telemetry';

const BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';

type ProxyResponse = Partial<DocumentParseResult> & {
  ok?: boolean;
  error?: string;
};

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;
const RETRYABLE_HTTP_STATUSES = new Set([502, 503, 504]);

function isRetryableErrorCode(code: string): boolean {
  return code === 'network_timeout' || code === 'network_error';
}

async function requestDocumentAnalysis(
  normalizedImage: string,
  normalizedCountry: string,
  headers: Record<string, string>
): Promise<{ status: number; payload: ProxyResponse }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_API_BASE}/analyzeDocumentProxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base64Image: normalizedImage,
        countryContext: normalizedCountry,
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    let payload: ProxyResponse = {};
    try {
      if (text) payload = JSON.parse(text) as ProxyResponse;
    } catch {
      throw new Error('ai_parse_error');
    }
    return { status: res.status, payload };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('network_timeout');
    }
    throw new Error('network_error');
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanDocumentWithAI(base64Image: string, countryContext: string): Promise<DocumentParseResult> {
  const normalizedImage = base64Image.trim();
  const normalizedCountry = countryContext.trim();
  if (!normalizedImage) {
    logEvent('ai_scanner_failed', { errorCode: 'image_required' });
    throw new Error('image_required');
  }
  if (!normalizedCountry) {
    logEvent('ai_scanner_failed', { errorCode: 'country_context_required' });
    throw new Error('country_context_required');
  }
  if (!BACKEND_API_BASE) {
    logEvent('ai_scanner_failed', { errorCode: 'backend_api_base_missing' });
    throw new Error('backend_api_base_missing');
  }

  const token = await getWalletIdToken(true);
  if (!token) {
    logEvent('ai_scanner_failed', { errorCode: 'wallet_auth_token_missing' });
    throw new Error('wallet_auth_token_missing');
  }

  const headers = await mergeTrustBackendHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });
  logEvent('ai_scanner_started', { countryContext: normalizedCountry });

  let status = 0;
  let payload: ProxyResponse = {};
  let lastError: Error | null = null;
  let retryAttempted = false;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const out = await requestDocumentAnalysis(normalizedImage, normalizedCountry, headers);
      status = out.status;
      payload = out.payload;
      if (status >= 200 && status < 300) {
        if (retryAttempted) {
          logEvent('ai_scanner_retry_succeeded');
        }
        break;
      }
      if (RETRYABLE_HTTP_STATUSES.has(status) && attempt < MAX_RETRIES) {
        retryAttempted = true;
        logEvent('ai_scanner_retry_attempted', {
          attempt: attempt + 1,
          error: `http_${status}`,
        });
        continue;
      }
      break;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('network_error');
      lastError = err;
      if (isRetryableErrorCode(err.message) && attempt < MAX_RETRIES) {
        retryAttempted = true;
        logEvent('ai_scanner_retry_attempted', {
          attempt: attempt + 1,
          error: err.message,
        });
        continue;
      }
      logEvent('ai_scanner_failed', { errorCode: err.message });
      throw err;
    }
  }
  if (lastError && status === 0) {
    logEvent('ai_scanner_failed', { errorCode: lastError.message });
    throw lastError;
  }

  if (status < 200 || status >= 300) {
    const code = payload.error ?? `document_proxy_${status}`;
    if (code === 'image_too_large') {
      logEvent('ai_scanner_failed', { errorCode: 'image_too_large' });
      throw new Error('image_too_large');
    }
    if (code === 'gemini_upstream_http') {
      logEvent('ai_scanner_failed', { errorCode: 'ai_upstream_unavailable' });
      throw new Error('ai_upstream_unavailable');
    }
    if (code === 'gemini_empty_output' || code === 'ai_parse_invalid_json' || code === 'ai_parse_schema_mismatch') {
      logEvent('ai_scanner_failed', { errorCode: 'ai_parse_error' });
      throw new Error('ai_parse_error');
    }
    logEvent('ai_scanner_failed', { errorCode: code });
    throw new Error(code);
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
  const urgency = payload.urgency;
  const actionItems = Array.isArray(payload.actionItems)
    ? payload.actionItems.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];
  if (!title || !summary || (urgency !== 'Low' && urgency !== 'Medium' && urgency !== 'High') || actionItems.length === 0) {
    logEvent('ai_scanner_failed', { errorCode: 'ai_parse_error' });
    throw new Error('ai_parse_error');
  }
  logEvent('ai_scanner_success', { urgency });
  return { title, summary, urgency, actionItems };
}
