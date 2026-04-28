import type { DocumentScanAiResult } from '../OpenAIService';

type DocumentAiPocResponse = {
  docType?: string;
  confidence?: string;
  expiryDateIso?: string | null;
  merchantName?: string;
  bookingRef?: string;
  serviceDateIso?: string | null;
};

function toDdMmYyyy(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeConfidence(input?: string): 'high' | 'medium' | 'low' {
  const value = (input ?? '').toLowerCase().trim();
  if (value === 'high') return 'high';
  if (value === 'medium') return 'medium';
  return 'low';
}

/**
 * Map PoC response to current app shape used by Vault flow.
 * Priority doc types:
 * - visa / residency
 * - booking / merchant / service confirmation
 */
export function normalizeDocumentAiPocResponse(input: DocumentAiPocResponse): DocumentScanAiResult {
  const docTypeRaw = (input.docType ?? '').toLowerCase().trim();
  const isVisaResidency =
    docTypeRaw.includes('visa') || docTypeRaw.includes('residency') || docTypeRaw.includes('cu_tru') || docTypeRaw.includes('cư trú');
  const isBookingConfirmation =
    docTypeRaw.includes('booking') || docTypeRaw.includes('merchant') || docTypeRaw.includes('service_confirmation');

  if (isVisaResidency) {
    return {
      documentType: 'Thẻ cư trú (Visa)',
      expiryDate: toDdMmYyyy(input.expiryDateIso),
      confidence: normalizeConfidence(input.confidence),
    };
  }

  if (isBookingConfirmation) {
    const merchant = typeof input.merchantName === 'string' && input.merchantName.trim() ? ` (${input.merchantName.trim()})` : '';
    return {
      documentType: `Xác nhận dịch vụ${merchant}`,
      expiryDate: toDdMmYyyy(input.serviceDateIso),
      confidence: normalizeConfidence(input.confidence),
    };
  }

  return {
    documentType: 'Hộ chiếu',
    expiryDate: toDdMmYyyy(input.expiryDateIso),
    confidence: normalizeConfidence(input.confidence),
  };
}
