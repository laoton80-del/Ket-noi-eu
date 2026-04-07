import type { Request } from 'firebase-functions/v2/https';

/** Total HTTPS body — protects STT base64 + chat vision payloads. */
export const AI_PROXY_MAX_BODY_BYTES = 6 * 1024 * 1024;

const CHAT_MAX_MESSAGES = 48;
const CHAT_MAX_TOTAL_TEXT_CHARS = 200_000;
const CHAT_MAX_SINGLE_STRING = 100_000;
const CHAT_MAX_IMAGE_DATA_URL_CHARS = 4_500_000;
const CHAT_MAX_IMAGE_PARTS = 8;

const STT_MAX_BASE64_CHARS = 12_000_000;
const TTS_MAX_CHARS = 4096;

const ALLOWED_TTS_VOICES = new Set(['nova', 'alloy', 'shimmer']);
const ALLOWED_STT_MIME = new Set([
  'audio/mp4',
  'audio/m4a',
  'audio/mpeg',
  'audio/webm',
  'audio/wav',
  'audio/x-m4a',
  'video/mp4',
]);

function countTextInContent(content: unknown): number {
  if (typeof content === 'string') return content.length;
  if (!Array.isArray(content)) return 0;
  let n = 0;
  for (const part of content) {
    if (!part || typeof part !== 'object') continue;
    const p = part as { type?: string; text?: string };
    if (p.type === 'text' && typeof p.text === 'string') n += p.text.length;
  }
  return n;
}

function validateImageParts(content: unknown): { ok: true } | { ok: false; error: string } {
  if (typeof content === 'string' || !Array.isArray(content)) return { ok: true };
  let images = 0;
  for (const part of content) {
    if (!part || typeof part !== 'object') continue;
    const p = part as { type?: string; image_url?: { url?: string } };
    if (p.type !== 'image_url') continue;
    images += 1;
    if (images > CHAT_MAX_IMAGE_PARTS) return { ok: false, error: 'chat_too_many_images' };
    const url = p.image_url?.url;
    if (typeof url !== 'string' || url.length === 0) return { ok: false, error: 'chat_invalid_image_url' };
    if (url.length > CHAT_MAX_IMAGE_DATA_URL_CHARS) return { ok: false, error: 'chat_image_payload_too_large' };
    const lower = url.slice(0, 32).toLowerCase();
    if (!lower.startsWith('data:image/') && !lower.startsWith('https://') && !lower.startsWith('http://')) {
      return { ok: false, error: 'chat_image_url_not_allowed' };
    }
  }
  return { ok: true };
}

export type SanitizedChatMessage = { role: 'system' | 'user' | 'assistant'; content: unknown };

export function parseAndValidateChatPayload(body: Record<string, unknown>):
  | { ok: true; messages: SanitizedChatMessage[]; temperature: number; maxTokens: number }
  | { ok: false; error: string } {
  const raw = body.messages;
  if (!Array.isArray(raw)) return { ok: false, error: 'chat_messages_required' };
  if (raw.length === 0 || raw.length > CHAT_MAX_MESSAGES) return { ok: false, error: 'chat_messages_count_invalid' };

  const messages: SanitizedChatMessage[] = [];
  let totalText = 0;
  for (const m of raw) {
    if (!m || typeof m !== 'object') return { ok: false, error: 'chat_message_invalid' };
    const role = (m as { role?: string }).role;
    if (role !== 'system' && role !== 'user' && role !== 'assistant') {
      return { ok: false, error: 'chat_role_invalid' };
    }
    const content = (m as { content?: unknown }).content;
    if (content === undefined) return { ok: false, error: 'chat_content_missing' };
    if (typeof content === 'string') {
      if (content.length > CHAT_MAX_SINGLE_STRING) return { ok: false, error: 'chat_content_too_long' };
      totalText += content.length;
    } else if (Array.isArray(content)) {
      const img = validateImageParts(content);
      if (!img.ok) return img;
      for (const part of content) {
        if (!part || typeof part !== 'object') return { ok: false, error: 'chat_part_invalid' };
        const p = part as { type?: string; text?: string };
        if (p.type === 'text') {
          if (typeof p.text !== 'string') return { ok: false, error: 'chat_text_part_invalid' };
          totalText += p.text.length;
        } else if (p.type === 'image_url') {
          // validated in validateImageParts
        } else {
          return { ok: false, error: 'chat_part_type_not_allowed' };
        }
      }
    } else {
      return { ok: false, error: 'chat_content_type_invalid' };
    }
    messages.push({ role, content });
  }
  if (totalText > CHAT_MAX_TOTAL_TEXT_CHARS) return { ok: false, error: 'chat_total_text_too_large' };

  let temperature = typeof body.temperature === 'number' ? body.temperature : 0.6;
  if (!Number.isFinite(temperature)) temperature = 0.6;
  temperature = Math.min(2, Math.max(0, temperature));

  let maxTokens = typeof body.maxTokens === 'number' ? body.maxTokens : 240;
  if (!Number.isFinite(maxTokens)) maxTokens = 240;
  maxTokens = Math.min(8192, Math.max(1, Math.floor(maxTokens)));

  return { ok: true, messages, temperature, maxTokens };
}

export function validateSttPayload(body: Record<string, unknown>): { ok: true; base64Audio: string; mime: string } | { ok: false; error: string } {
  const base64Audio = typeof body.base64Audio === 'string' ? body.base64Audio : '';
  if (!base64Audio) return { ok: false, error: 'stt_audio_missing' };
  if (base64Audio.length > STT_MAX_BASE64_CHARS) return { ok: false, error: 'stt_audio_too_large' };
  const mimeRaw = typeof body.mime === 'string' && body.mime.trim() ? body.mime.trim() : 'audio/mp4';
  const mime = mimeRaw.split(';')[0]!.trim().toLowerCase();
  if (!ALLOWED_STT_MIME.has(mime)) return { ok: false, error: 'stt_mime_not_allowed' };
  return { ok: true, base64Audio, mime: mimeRaw };
}

export function validateTtsPayload(body: Record<string, unknown>):
  | { ok: true; text: string; voice: 'nova' | 'alloy' | 'shimmer' }
  | { ok: false; error: string } {
  const text = typeof body.text === 'string' ? body.text : '';
  if (!text.trim()) return { ok: false, error: 'tts_text_missing' };
  if (text.length > TTS_MAX_CHARS) return { ok: false, error: 'tts_text_too_long' };
  const v = String(body.voice ?? 'nova');
  if (!ALLOWED_TTS_VOICES.has(v)) return { ok: false, error: 'tts_voice_invalid' };
  return { ok: true, text, voice: v as 'nova' | 'alloy' | 'shimmer' };
}

export function requestBodyByteLength(req: Request): number {
  const raw = req.rawBody;
  if (Buffer.isBuffer(raw)) return raw.length;
  if (typeof raw === 'string') return Buffer.byteLength(raw, 'utf8');
  return 0;
}
