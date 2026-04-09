import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { VoicePersona } from '../api/voiceClient';
import { getPersonaSystemPrompt } from '../config/aiPrompts';
import type { LegalScenario } from '../config/countryPacks';
import { vaultDataExtractorPrimarySystemPrompt, vaultDataExtractorSecondarySystemPrompt } from '../config/countryPacks';
import type { AuthUser } from '../context/authTypes';
import { ensureWalletFirebaseAuth, getWalletIdToken } from './walletFirebaseSession';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { adaptResponse, buildAIIdentityPromptContext, getAIIdentity, getAIIdentityMemory } from './identity';
import { buildNetworkPromptInjection, type NetworkPromptContextInput } from './networkEffect';
import { devWarn } from '../utils/devLog';
import { mergeTrustBackendHeaders } from '../utils/trustBackendHeaders';

function throwAiProxyHttpError(res: Response, bodyText: string, label: string): never {
  let code = `${label}_${res.status}`;
  try {
    const j = JSON.parse(bodyText) as { error?: string };
    if (typeof j.error === 'string') code = j.error;
  } catch {
    /* non-json */
  }
  if (__DEV__) {
    devWarn('aiProxy', 'ai_proxy_http_error', { status: res.status, error: code, label });
  }
  throw new Error(code);
}

const BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
const TTS_CACHE_API_BASE = process.env.EXPO_PUBLIC_TTS_CACHE_API_BASE?.trim() ?? '';
const TTS_CACHE_TTL_DAYS = Number(process.env.EXPO_PUBLIC_TTS_CACHE_TTL_DAYS ?? '90');
const TTS_CACHE_VERSION = (process.env.EXPO_PUBLIC_TTS_CACHE_VERSION ?? 'v1').trim() || 'v1';
const RETRY_DELAY_MS = 450;
const AUTH_STORAGE_KEY = STORAGE_KEYS.authSession;
const TTS_CACHE_STORAGE_KEY = STORAGE_KEYS.ttsClientCache;

type OpenAIRequestOptions = {
  path: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: BodyInit | null;
};

async function backendAiHeaders(): Promise<Record<string, string>> {
  await ensureWalletFirebaseAuth();
  const token = await getWalletIdToken();
  if (!token) throw new Error('backend_ai_auth_missing');
  return mergeTrustBackendHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });
}

async function openAIRequest<T>({ path, method = 'POST', headers, body }: OpenAIRequestOptions): Promise<T> {
  if (!BACKEND_API_BASE) throw new Error('backend_api_base_missing');
  if (method !== 'POST' || path !== '/chat/completions') throw new Error('openai_proxy_unsupported');
  const parsed = typeof body === 'string' ? (JSON.parse(body) as { messages?: unknown[]; temperature?: number; max_tokens?: number }) : {};
  const baseHeaders = await backendAiHeaders();
  const res = await fetch(`${BACKEND_API_BASE}/aiProxy`, {
    method: 'POST',
    headers: { ...baseHeaders, ...(headers ?? {}) },
    body: JSON.stringify({
      op: 'chat',
      messages: parsed.messages ?? [],
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.6,
      maxTokens: typeof parsed.max_tokens === 'number' ? parsed.max_tokens : 240,
    }),
  });
  const text = await res.text();
  if (!res.ok) throwAiProxyHttpError(res, text, 'openai_proxy');
  return JSON.parse(text) as T;
}

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await sleep(RETRY_DELAY_MS);
    return fn();
  }
}

function normalizeTtsText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

function makeTtsCacheKey(text: string, voice: 'nova' | 'alloy' | 'shimmer'): string {
  return `${voice}::${normalizeTtsText(text)}`;
}

type TtsCacheEntry = {
  uri: string;
  createdAt: number;
  version: string;
};

type TtsCacheMap = Record<string, TtsCacheEntry>;

async function readTtsCacheMap(): Promise<TtsCacheMap> {
  try {
    const raw = await AsyncStorage.getItem(TTS_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const normalized: TtsCacheMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') {
        normalized[key] = { uri: value, createdAt: Date.now(), version: TTS_CACHE_VERSION };
        continue;
      }
      if (!value || typeof value !== 'object') continue;
      const candidate = value as Partial<TtsCacheEntry>;
      if (typeof candidate.uri !== 'string' || candidate.uri.trim().length === 0) continue;
      normalized[key] = {
        uri: candidate.uri.trim(),
        createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : Date.now(),
        version: typeof candidate.version === 'string' && candidate.version.trim().length > 0 ? candidate.version : 'v1',
      };
    }
    return normalized;
  } catch {
    return {};
  }
}

async function writeTtsCacheMap(map: TtsCacheMap): Promise<void> {
  await AsyncStorage.setItem(TTS_CACHE_STORAGE_KEY, JSON.stringify(map));
}

export async function clearTtsCache(): Promise<void> {
  await AsyncStorage.removeItem(TTS_CACHE_STORAGE_KEY);
}

export type TtsCacheStats = {
  totalEntries: number;
  freshEntries: number;
  expiredEntries: number;
  versionMismatchEntries: number;
  activeVersion: string;
  ttlDays: number;
};

export async function getTtsCacheStats(): Promise<TtsCacheStats> {
  const map = await readTtsCacheMap();
  let freshEntries = 0;
  let expiredEntries = 0;
  let versionMismatchEntries = 0;

  for (const entry of Object.values(map)) {
    if (entry.version !== TTS_CACHE_VERSION) {
      versionMismatchEntries += 1;
      continue;
    }
    if (isCacheEntryFresh(entry)) {
      freshEntries += 1;
    } else {
      expiredEntries += 1;
    }
  }

  return {
    totalEntries: Object.keys(map).length,
    freshEntries,
    expiredEntries,
    versionMismatchEntries,
    activeVersion: TTS_CACHE_VERSION,
    ttlDays: TTS_CACHE_TTL_DAYS,
  };
}

function isCacheEntryFresh(entry: TtsCacheEntry): boolean {
  if (entry.version !== TTS_CACHE_VERSION) return false;
  if (!Number.isFinite(TTS_CACHE_TTL_DAYS) || TTS_CACHE_TTL_DAYS <= 0) return true;
  const ttlMs = TTS_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - entry.createdAt <= ttlMs;
}

async function resolveCachedTtsUri(cacheUri: string): Promise<string | null> {
  if (/^https?:\/\//i.test(cacheUri)) {
    return cacheUri;
  }
  try {
    const info = await FileSystem.getInfoAsync(cacheUri);
    return info.exists ? cacheUri : null;
  } catch {
    return null;
  }
}

async function fetchRemoteCachedTts(cacheKey: string): Promise<string | null> {
  if (!TTS_CACHE_API_BASE) return null;
  try {
    const res = await fetch(`${TTS_CACHE_API_BASE}/tts/cache?key=${encodeURIComponent(cacheKey)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { audioUrl?: string };
    if (typeof data.audioUrl !== 'string' || data.audioUrl.trim().length === 0) return null;
    return data.audioUrl.trim();
  } catch {
    return null;
  }
}

async function requestRemoteTtsGeneration(
  cacheKey: string,
  text: string,
  voice: 'nova' | 'alloy' | 'shimmer'
): Promise<string | null> {
  if (!TTS_CACHE_API_BASE) return null;
  try {
    const res = await fetch(`${TTS_CACHE_API_BASE}/tts/cache/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: cacheKey,
        text: text.slice(0, 4096),
        voice,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { audioUrl?: string };
    if (typeof data.audioUrl !== 'string' || data.audioUrl.trim().length === 0) return null;
    return data.audioUrl.trim();
  } catch {
    return null;
  }
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type DocumentScanAiResult = {
  documentType: string;
  expiryDate: string | null; // DD/MM/YYYY from AI
  confidence: 'high' | 'medium' | 'low';
};

export type KidsHomeworkAiResult = {
  subject: string;
  level: 'easy' | 'medium' | 'advanced';
  plainSummary: string;
  steps: string[];
};

function buildCustomerHiddenContext(user: Partial<AuthUser> | null): string | null {
  if (!user?.country || !user?.residencyStatus || !user?.visaExpiryDate) return null;
  return (
    `Thông tin khách hàng: Đang ở ${user.country}, diện ${user.residencyStatus}, Visa hết hạn vào ${user.visaExpiryDate}. ` +
    `Hãy tư vấn dựa trên luật pháp hiện hành của ${user.country}.`
  );
}

async function readAuthSnapshot(): Promise<Partial<AuthUser> | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AuthUser>;
  } catch {
    return null;
  }
}

export async function analyzeImage(
  base64Image: string,
  options?: { systemPrompt?: string; userPrompt?: string }
): Promise<string> {
  const systemPrompt =
    options?.systemPrompt ??
    "Bạn là gia sư xuất sắc. Hãy phân tích bài tập trong ảnh. BẮT BUỘC trả về định dạng JSON (response_format: { type: 'json_object' }) " +
      'với đúng 3 keys: dich_de (string), kien_thuc (string), cau_hoi_goi_mo (array of 3 strings).';
  const userPrompt = options?.userPrompt ?? 'Phân tích bài tập và trả JSON đúng schema.';
  const data = await withOneRetry(() =>
    openAIRequest<{
      choices?: { message?: { content?: string } }[];
    }>({
      path: '/chat/completions',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    })
  );
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('openai_vision_empty');
  }
  return content;
}

export async function scanDocumentWithAI(base64Image: string, countryCode?: string): Promise<DocumentScanAiResult> {
  const data = await withOneRetry(() =>
    openAIRequest<{
      choices?: { message?: { content?: string } }[];
    }>({
      path: '/chat/completions',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: vaultDataExtractorPrimarySystemPrompt(countryCode),
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Trích xuất documentType và expiryDate từ ảnh giấy tờ.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 220,
      }),
    })
  );

  const content = data.choices?.[0]?.message?.content?.trim();
  const parseResult = (raw: string | undefined): Omit<DocumentScanAiResult, 'confidence'> => {
    if (!raw) return { documentType: 'Hộ chiếu', expiryDate: null };
    try {
      const parsed = JSON.parse(raw) as Partial<DocumentScanAiResult>;
      return {
        documentType:
          typeof parsed.documentType === 'string' && parsed.documentType.trim() ? parsed.documentType.trim() : 'Hộ chiếu',
        expiryDate:
          typeof parsed.expiryDate === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(parsed.expiryDate.trim())
            ? parsed.expiryDate.trim()
            : null,
      };
    } catch {
      return { documentType: 'Hộ chiếu', expiryDate: null };
    }
  };

  const firstPass = parseResult(content);
  if (firstPass.expiryDate) {
    return { ...firstPass, confidence: 'high' };
  }

  // Re-check pass: focus extracting expiry only when first pass is uncertain.
  const second = await withOneRetry(() =>
    openAIRequest<{
      choices?: { message?: { content?: string } }[];
    }>({
      path: '/chat/completions',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: vaultDataExtractorSecondarySystemPrompt(countryCode),
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Kiểm tra lại duy nhất ngày hết hạn.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 100,
      }),
    })
  );
  const secondContent = second.choices?.[0]?.message?.content?.trim();
  const secondPass = parseResult(secondContent);
  if (secondPass.expiryDate) {
    return { documentType: firstPass.documentType, expiryDate: secondPass.expiryDate, confidence: 'medium' };
  }
  return { documentType: firstPass.documentType, expiryDate: null, confidence: 'low' };
}

export async function analyzeKidsHomeworkWithAI(base64Image: string): Promise<KidsHomeworkAiResult> {
  const data = await withOneRetry(() =>
    openAIRequest<{
      choices?: { message?: { content?: string } }[];
    }>({
      path: '/chat/completions',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý làm bài tập cho trẻ em. Đọc ảnh bài tập, rồi trả JSON chuẩn với subject, level (easy|medium|advanced), plainSummary, steps (mảng các bước ngắn, dễ hiểu cho trẻ). Không thêm trường khác.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Giải thích bài tập này theo từng bước đơn giản cho trẻ.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 420,
      }),
    })
  );
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('openai_homework_empty');
  }
  try {
    const parsed = JSON.parse(content) as Partial<KidsHomeworkAiResult>;
    const steps = Array.isArray(parsed.steps) ? parsed.steps.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, 8) : [];
    return {
      subject: typeof parsed.subject === 'string' && parsed.subject.trim() ? parsed.subject.trim() : 'Tong quat',
      level:
        parsed.level === 'easy' || parsed.level === 'medium' || parsed.level === 'advanced'
          ? parsed.level
          : 'medium',
      plainSummary:
        typeof parsed.plainSummary === 'string' && parsed.plainSummary.trim()
          ? parsed.plainSummary.trim()
          : 'Minh se huong dan be theo tung buoc ngan, de hieu.',
      steps: steps.length ? steps : ['Doc ky de bai.', 'Xac dinh du kien quan trong.', 'Lam tung buoc nho va kiem tra ket qua.'],
    };
  } catch {
    return {
      subject: 'Tong quat',
      level: 'medium',
      plainSummary: 'Minh se huong dan be giai bai theo tung buoc don gian.',
      steps: ['Doc ky de bai.', 'Tim du kien quan trong.', 'Lam tung buoc nho va kiem tra ket qua.'],
    };
  }
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const mime = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
  if (!BACKEND_API_BASE) throw new Error('backend_api_base_missing');
  const base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
  const data = await withOneRetry(async () => {
    const res = await fetch(`${BACKEND_API_BASE}/aiProxy`, {
      method: 'POST',
      headers: await backendAiHeaders(),
      body: JSON.stringify({ op: 'stt', base64Audio, mime }),
    });
    const sttText = await res.text();
    if (!res.ok) throwAiProxyHttpError(res, sttText, 'openai_stt');
    return JSON.parse(sttText) as { text?: string };
  });
  const text = data.text?.trim();
  if (!text) {
    throw new Error('openai_whisper_empty');
  }
  return text;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  persona: VoicePersona,
  options?: {
    userId?: string;
    networkContext?: NetworkPromptContextInput;
    serviceContext?: 'call' | 'interpreter' | 'vault' | 'lifeos' | 'emergency' | 'learning';
    emergencyMode?: boolean;
    activeScenario?: LegalScenario;
  }
): Promise<string> {
  const authSnapshot = await readAuthSnapshot();
  const systemPrompt = getPersonaSystemPrompt(persona, {
    countryCode: authSnapshot?.country,
    serviceContext: options?.serviceContext ?? 'call',
    emergencyMode: options?.emergencyMode,
    activeScenario: options?.activeScenario,
  });
  const identityUserId = options?.userId ?? authSnapshot?.phone ?? null;
  const identity = identityUserId ? await getAIIdentity(identityUserId) : null;
  const identityMemory = identityUserId ? await getAIIdentityMemory(identityUserId) : null;
  const identityContext =
    identity && identityMemory ? buildAIIdentityPromptContext(identity, identityMemory) : null;
  const hiddenContext = buildCustomerHiddenContext(authSnapshot);
  const networkContext = options?.networkContext
    ? await buildNetworkPromptInjection(options.networkContext)
    : null;
  const injectedMessages = hiddenContext ? [{ role: 'user' as const, content: `[CONTEXT ẨN] ${hiddenContext}` }, ...messages] : messages;

  const data = await withOneRetry(() =>
    openAIRequest<{
      choices?: { message?: { content?: string } }[];
    }>({
      path: '/chat/completions',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 240,
        messages: [
          { role: 'system', content: systemPrompt },
          ...(identityContext ? [{ role: 'system', content: `[AI_IDENTITY] ${identityContext}` }] : []),
          ...(networkContext ? [{ role: 'system', content: networkContext }] : []),
          ...injectedMessages,
        ],
      }),
    })
  );

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('openai_chat_empty');
  }
  return identity ? adaptResponse(content, identity) : content;
}

export async function generateSpeech(
  text: string,
  voice: 'nova' | 'alloy' | 'shimmer'
): Promise<string> {
  const cacheKey = makeTtsCacheKey(text, voice);

  // Prefer server-side shared cache first (backend-ready mode).
  const remoteCached = await fetchRemoteCachedTts(cacheKey);
  if (remoteCached) {
    return remoteCached;
  }

  const cacheMap = await readTtsCacheMap();
  const cachedEntry = cacheMap[cacheKey];
  if (cachedEntry && isCacheEntryFresh(cachedEntry)) {
    const reusableUri = await resolveCachedTtsUri(cachedEntry.uri);
    if (reusableUri) {
      return reusableUri;
    }
  }

  // Ask backend to generate+cache centrally if available.
  const remoteGenerated = await requestRemoteTtsGeneration(cacheKey, text, voice);
  if (remoteGenerated) {
    cacheMap[cacheKey] = {
      uri: remoteGenerated,
      createdAt: Date.now(),
      version: TTS_CACHE_VERSION,
    };
    await writeTtsCacheMap(cacheMap);
    return remoteGenerated;
  }

  if (!BACKEND_API_BASE) throw new Error('backend_api_base_missing');
  const base64 = await withOneRetry(async () => {
    const res = await fetch(`${BACKEND_API_BASE}/aiProxy`, {
      method: 'POST',
      headers: await backendAiHeaders(),
      body: JSON.stringify({ op: 'tts', text: text.slice(0, 4096), voice }),
    });
    const ttsText = await res.text();
    if (!res.ok) throwAiProxyHttpError(res, ttsText, 'openai_tts');
    const data = JSON.parse(ttsText) as { audioBase64?: string };
    if (!data.audioBase64) throw new Error('openai_tts_empty');
    return data.audioBase64;
  });
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) {
    throw new Error('openai_no_cache');
  }
  const path = `${base}tts-${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  cacheMap[cacheKey] = {
    uri: path,
    createdAt: Date.now(),
    version: TTS_CACHE_VERSION,
  };
  await writeTtsCacheMap(cacheMap);
  return path;
}

