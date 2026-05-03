import { legalScanPriceVig } from '../domain/legalScanPricing';
import type { ServiceResult } from '../types/serviceResult';
import { restApiFetchJson } from './apiClient';

export type LegalScanAlertLevel = 'CRITICAL' | 'SAFE';

export type LegalScanResultData = Readonly<{
  persona: 'AI_TRANG_SU';
  summary: readonly string[];
  alertLevel: LegalScanAlertLevel;
  chargedVIG: number;
  estimatedPages: number;
  wordCount: number;
}>;

/**
 * AI Trạng Sư — legal document text scan (JWT required; server charges V6.3 dynamic pricing).
 */
export async function scanLegalDocument(text: string): Promise<ServiceResult<LegalScanResultData>> {
  const documentText = text.trim();
  if (documentText.length === 0) {
    return { ok: false, error: 'documentText is empty.', status: 400 };
  }

  const res = await restApiFetchJson<LegalScanResultData>('/api/ai/legal-scan', {
    method: 'POST',
    body: { documentText },
  });

  if (!res.ok) {
    return { ok: false, error: res.error, status: res.status, unreachable: res.unreachable };
  }
  return { ok: true, data: res.data };
}

/** Client-side preview (must match `src/domain/legalScanPricing.ts` + API). */
export function previewLegalScanCostVig(documentText: string): number {
  return legalScanPriceVig(documentText);
}
