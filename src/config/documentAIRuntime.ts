/**
 * Google Document AI PoC switchboard.
 * Default OFF to preserve current production path.
 */
const DOCUMENT_AI_POC_ENABLED = process.env.EXPO_PUBLIC_DOCUMENT_AI_POC_ENABLED === '1';
const DOCUMENT_AI_POC_BASE = (process.env.EXPO_PUBLIC_DOCUMENT_AI_POC_BASE ?? '').trim();

export function readDocumentAIPocConfig() {
  return {
    enabled: DOCUMENT_AI_POC_ENABLED,
    baseUrl: DOCUMENT_AI_POC_BASE,
  };
}
