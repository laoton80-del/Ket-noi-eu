/** V6.3 dynamic AI Trạng Sư pricing — shared by API + client preview. */
const WORDS_PER_PAGE = 500;
const BASE_VIG = 3;
const PER_EXTRA_PAGE_VIG = 1;

export function countWordsInDocument(documentText: string): number {
  const parts = documentText.trim().split(/\s+/);
  if (parts.length === 1 && parts[0] === '') return 0;
  return parts.filter((w) => w.length > 0).length;
}

export function estimateLegalScanPages(wordCount: number): number {
  if (wordCount <= 0) return 1;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE));
}

/** Base 3 VIG for first “page” (≤500 words), +1 VIG per additional page. */
export function legalScanPriceVigFromWordCount(wordCount: number): number {
  const pages = estimateLegalScanPages(wordCount);
  return BASE_VIG + Math.max(0, pages - 1) * PER_EXTRA_PAGE_VIG;
}

export function legalScanPriceVig(documentText: string): number {
  return legalScanPriceVigFromWordCount(countWordsInDocument(documentText));
}
