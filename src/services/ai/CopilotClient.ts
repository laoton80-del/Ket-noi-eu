import { restApiFetchJson } from '../apiClient';

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

function createIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof cryptoApi?.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function draftGlobalDocument(intent: string, country: string, language: string): Promise<string> {
  const normalizedIntent = intent.trim();
  const normalizedCountry = country.trim();
  const normalizedLanguage = language.trim();
  if (!normalizedIntent) throw new Error('intent_required');
  if (!normalizedCountry) throw new Error('country_required');
  if (!normalizedLanguage) throw new Error('language_required');

  const systemPrompt =
    `You are a top-tier legal and business secretary for a Vietnamese expat living in ${normalizedCountry}. ` +
    `The user will give you a short intent in Vietnamese. You must write a highly professional, culturally appropriate email or document in ${normalizedLanguage}. ` +
    'Return ONLY the final text of the document, ready to be copied and pasted. No introductory or concluding remarks.';

  const result = await restApiFetchJson<AiProxyChatResponse>('/api/ai/chat-completion', {
    method: 'POST',
    body: {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: normalizedIntent },
      ],
      temperature: 0.35,
      maxTokens: 900,
    },
    headers: { 'Idempotency-Key': createIdempotencyKey() },
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  if (!result.ok) throw new Error(result.code || result.error || `ai_proxy_${result.status}`);

  const draft = extractTextFromChatResponse(result.data);
  if (!draft) throw new Error('ai_empty_output');
  return draft;
}
