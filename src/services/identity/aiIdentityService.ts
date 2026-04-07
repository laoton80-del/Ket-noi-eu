import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AIIdentityMemory, AIIdentityProfile } from './aiIdentityTypes';
import { STORAGE_KEYS, STORAGE_KEY_BUILDERS } from '../../storage/storageKeys';

const AUTH_STORAGE_KEY = STORAGE_KEYS.authSession;
const MAX_ACTIONS = 20;

function profileKey(userId: string): string {
  return STORAGE_KEY_BUILDERS.aiIdentityProfile(userId);
}

function memoryKey(userId: string): string {
  return STORAGE_KEY_BUILDERS.aiIdentityMemory(userId);
}

async function fallbackNameFromAuth(userId: string): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return 'bạn';
    const parsed = JSON.parse(raw) as { phone?: string; name?: string };
    if (parsed.phone === userId && typeof parsed.name === 'string' && parsed.name.trim()) {
      return parsed.name.trim();
    }
    return 'bạn';
  } catch {
    return 'bạn';
  }
}

function defaultProfile(userId: string, preferredName: string): AIIdentityProfile {
  return {
    userId,
    preferredName,
    communicationStyle: 'guided',
    tonePreference: 'supportive',
    languageLevel: 'intermediate',
  };
}

const defaultMemory: AIIdentityMemory = {
  recentActions: [],
  preferences: {},
  recurringNeeds: [],
};

export async function getAIIdentity(userId: string): Promise<AIIdentityProfile> {
  try {
    const raw = await AsyncStorage.getItem(profileKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AIIdentityProfile>;
      if (parsed && typeof parsed.userId === 'string') {
        const name = typeof parsed.preferredName === 'string' && parsed.preferredName.trim() ? parsed.preferredName.trim() : 'bạn';
        return {
          userId,
          preferredName: name,
          communicationStyle:
            parsed.communicationStyle === 'concise' || parsed.communicationStyle === 'guided' || parsed.communicationStyle === 'encouraging'
              ? parsed.communicationStyle
              : 'guided',
          tonePreference:
            parsed.tonePreference === 'friendly' || parsed.tonePreference === 'supportive' || parsed.tonePreference === 'formal'
              ? parsed.tonePreference
              : 'supportive',
          languageLevel:
            parsed.languageLevel === 'beginner' || parsed.languageLevel === 'intermediate' || parsed.languageLevel === 'advanced'
              ? parsed.languageLevel
              : 'intermediate',
        };
      }
    }
  } catch {
    // fallback below
  }
  const preferredName = await fallbackNameFromAuth(userId);
  const next = defaultProfile(userId, preferredName);
  await AsyncStorage.setItem(profileKey(userId), JSON.stringify(next));
  return next;
}

export async function getAIIdentityMemory(userId: string): Promise<AIIdentityMemory> {
  try {
    const raw = await AsyncStorage.getItem(memoryKey(userId));
    if (!raw) return defaultMemory;
    const parsed = JSON.parse(raw) as Partial<AIIdentityMemory>;
    return {
      recentActions: Array.isArray(parsed.recentActions)
        ? parsed.recentActions
            .filter((x) => x && typeof x.action === 'string' && typeof x.at === 'number')
            .slice(-MAX_ACTIONS)
        : [],
      preferences: parsed.preferences ?? {},
      recurringNeeds: Array.isArray(parsed.recurringNeeds)
        ? parsed.recurringNeeds.filter((x): x is string => typeof x === 'string').slice(0, 8)
        : [],
    };
  } catch {
    return defaultMemory;
  }
}

export async function recordAIIdentityAction(userId: string, action: string): Promise<void> {
  const mem = await getAIIdentityMemory(userId);
  const next: AIIdentityMemory = {
    ...mem,
    recentActions: [...mem.recentActions, { action, at: Date.now() }].slice(-MAX_ACTIONS),
  };
  await AsyncStorage.setItem(memoryKey(userId), JSON.stringify(next));
}

export async function updateAIIdentityRecurringNeeds(userId: string, recurringNeeds: string[]): Promise<void> {
  const mem = await getAIIdentityMemory(userId);
  const next: AIIdentityMemory = {
    ...mem,
    recurringNeeds: [...new Set(recurringNeeds)].slice(0, 8),
  };
  await AsyncStorage.setItem(memoryKey(userId), JSON.stringify(next));
}

export function buildAIIdentityPromptContext(identity: AIIdentityProfile, memory: AIIdentityMemory): string {
  const recent = memory.recentActions.slice(-3).map((a) => a.action);
  return [
    `Người dùng tên ưu tiên: ${identity.preferredName}.`,
    `Phong cách giao tiếp: ${identity.communicationStyle}.`,
    `Tone ưu tiên: ${identity.tonePreference}.`,
    `Trình độ ngôn ngữ: ${identity.languageLevel}.`,
    recent.length ? `Hành động gần đây: ${recent.join(', ')}.` : '',
    memory.recurringNeeds.length ? `Nhu cầu lặp lại: ${memory.recurringNeeds.join(', ')}.` : '',
    'Giữ câu trả lời ngắn, tự nhiên, hỗ trợ, và nhất quán theo hồ sơ trên.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function adaptResponse(response: string, identity: AIIdentityProfile): string {
  const clean = response.trim();
  if (!clean) return clean;
  let out = clean;
  if (identity.languageLevel === 'beginner') {
    out = out
      .split('\n')
      .map((line) => line.replace(/,\s+/g, '. ').replace(/\s+/g, ' ').trim())
      .join('\n');
  }
  if (identity.communicationStyle === 'concise') {
    const firstTwo = out.split('\n').slice(0, 2).join('\n').trim();
    out = firstTwo || out;
  }
  if (identity.tonePreference === 'supportive' && !out.toLowerCase().includes(identity.preferredName.toLowerCase())) {
    out = `${identity.preferredName}, ${out.charAt(0).toLowerCase()}${out.slice(1)}`;
  }
  return out;
}
