import { getWalletIdToken } from '../walletFirebaseSession';
import { mergeTrustBackendHeaders } from '../../utils/trustBackendHeaders';

const BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
const REQUEST_TIMEOUT_MS = 20_000;

type AiProxyChatResponse = {
  output_text?: string;
  text?: string;
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
    text?: string;
  }>;
};

function extractTextFromChatResponse(payload: AiProxyChatResponse): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  if (typeof payload.text === 'string' && payload.text.trim()) return payload.text.trim();
  const firstChoice = payload.choices?.[0];
  if (!firstChoice) return '';
  if (typeof firstChoice.text === 'string' && firstChoice.text.trim()) return firstChoice.text.trim();
  const messageContent = firstChoice.message?.content;
  if (typeof messageContent === 'string') return messageContent.trim();
  if (Array.isArray(messageContent)) {
    return messageContent
      .filter((chunk) => chunk.type === 'text' && typeof chunk.text === 'string')
      .map((chunk) => chunk.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
      .trim();
  }
  return '';
}

export async function draftGlobalDocument(intent: string, country: string, language: string): Promise<string> {
  const normalizedIntent = intent.trim();
  const normalizedCountry = country.trim();
  const normalizedLanguage = language.trim();
  if (!normalizedIntent) throw new Error('intent_required');
  if (!normalizedCountry) throw new Error('country_required');
  if (!normalizedLanguage) throw new Error('language_required');
  if (!BACKEND_API_BASE) throw new Error('backend_api_base_missing');

  const token = await getWalletIdToken(true);
  if (!token) throw new Error('wallet_auth_token_missing');
  const headers = await mergeTrustBackendHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const systemPrompt =
    `You are a top-tier legal and business secretary for a Vietnamese expat living in ${normalizedCountry}. ` +
    `The user will give you a short intent in Vietnamese. You must write a highly professional, culturally appropriate email or document in ${normalizedLanguage}. ` +
    'Return ONLY the final text of the document, ready to be copied and pasted. No introductory or concluding remarks.';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_BASE}/aiProxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        op: 'chat',
        temperature: 0.35,
        maxTokens: 900,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: normalizedIntent },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('network_timeout');
    }
    throw new Error('network_error');
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  if (!res.ok) {
    let parsedError = '';
    try {
      parsedError = String((JSON.parse(text) as { error?: string }).error ?? '').trim();
    } catch {
      parsedError = '';
    }
    throw new Error(parsedError || `ai_proxy_${res.status}`);
  }

  let payload: AiProxyChatResponse = {};
  try {
    payload = text ? (JSON.parse(text) as AiProxyChatResponse) : {};
  } catch {
    throw new Error('ai_parse_error');
  }
  const draft = extractTextFromChatResponse(payload);
  if (!draft) throw new Error('ai_empty_output');
  return draft;
}
