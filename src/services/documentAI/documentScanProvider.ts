import type { DocumentScanAiResult } from '../OpenAIService';
import { scanDocumentWithAI } from '../OpenAIService';
import { readDocumentAIPocConfig } from '../../config/documentAIRuntime';
import { ensureWalletFirebaseAuth, getWalletIdToken } from '../walletFirebaseSession';
import { mergeTrustBackendHeaders } from '../../utils/trustBackendHeaders';
import { devWarn } from '../../utils/devLog';
import { normalizeDocumentAiPocResponse } from './documentAiNormalization';

type DocumentAiPocPayload = {
  docType?: string;
  confidence?: string;
  expiryDateIso?: string | null;
  merchantName?: string;
  bookingRef?: string;
  serviceDateIso?: string | null;
};

/**
 * PoC adapter for Google Document AI path.
 * Safe by design: any error/missing config falls back to existing OpenAI scan path.
 */
export async function scanDocumentWithProvider(base64Image: string, countryCode?: string): Promise<DocumentScanAiResult> {
  const cfg = readDocumentAIPocConfig();
  if (!cfg.enabled) {
    return scanDocumentWithAI(base64Image, countryCode);
  }
  if (!cfg.baseUrl) {
    devWarn('document_ai_poc', 'missing_base_url_fallback_openai');
    return scanDocumentWithAI(base64Image, countryCode);
  }

  try {
    await ensureWalletFirebaseAuth();
    const token = await getWalletIdToken();
    if (!token) throw new Error('document_ai_auth_missing');

    const headers = await mergeTrustBackendHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    const res = await fetch(`${cfg.baseUrl}/documentAiPoc/scan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        op: 'document_scan',
        imageBase64: base64Image,
        countryCode,
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`document_ai_poc_http_${res.status}`);
    let payload: DocumentAiPocPayload = {};
    try {
      payload = text ? (JSON.parse(text) as DocumentAiPocPayload) : {};
    } catch {
      throw new Error('document_ai_poc_invalid_json');
    }
    return normalizeDocumentAiPocResponse(payload);
  } catch (error) {
    devWarn('document_ai_poc', 'fallback_openai', {
      reason: error instanceof Error ? error.message : String(error),
    });
    return scanDocumentWithAI(base64Image, countryCode);
  }
}
