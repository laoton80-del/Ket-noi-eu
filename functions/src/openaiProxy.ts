const OPENAI_BASE = 'https://api.openai.com/v1';
const OPENAI_KEY = process.env.OPENAI_API_KEY?.trim() ?? '';

function authHeaders() {
  if (!OPENAI_KEY) throw new Error('openai_key_missing');
  return { Authorization: `Bearer ${OPENAI_KEY}` };
}

export async function proxyChat(messages: Array<{ role: string; content: unknown }>, temperature = 0.6, maxTokens = 240) {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', temperature, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) throw new Error(`openai_chat_${res.status}`);
  return (await res.json()) as unknown;
}

export async function proxyStt(base64Audio: string, mime = 'audio/mp4') {
  const binary = Buffer.from(base64Audio, 'base64');
  const form = new FormData();
  form.append('model', 'whisper-1');
  form.append('file', new File([binary], 'recording.m4a', { type: mime }));
  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form as unknown as BodyInit,
  });
  if (!res.ok) throw new Error(`openai_stt_${res.status}`);
  return (await res.json()) as { text?: string };
}

export async function proxyTts(text: string, voice: 'nova' | 'alloy' | 'shimmer') {
  const res = await fetch(`${OPENAI_BASE}/audio/speech`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', input: text.slice(0, 4096), voice, response_format: 'mp3' }),
  });
  if (!res.ok) throw new Error(`openai_tts_${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr).toString('base64');
}
