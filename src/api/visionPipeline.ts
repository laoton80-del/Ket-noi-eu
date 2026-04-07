import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { documentLegalVisionSystemPrompt } from '../config/countryPacks';
import { analyzeImage } from '../services/OpenAIService';

export type VisionResultPayload = {
  dichDe: string;
  kienThuc: string;
  cauHoiGoiMo: string[];
};

export type DocumentVisionPayload = {
  type: 'Visa' | 'Passport' | 'Contract';
  expiry_date: string;
  holder_name: string;
  action_required: string;
};

function fallbackVisionPayload(): VisionResultPayload {
  return {
    dichDe: 'Dịch đề bài sang tiếng Việt rõ nghĩa.',
    kienThuc: 'Tóm tắt công thức/ngữ pháp trọng tâm.',
    cauHoiGoiMo: [
      'Câu hỏi 1 để bé tự tư duy?',
      'Câu hỏi 2 gợi ý bước làm?',
      'Câu hỏi 3 chốt lại vấn đề?',
    ],
  };
}

function normalizeVisionPayload(input: Partial<VisionResultPayload> | null | undefined): VisionResultPayload {
  const fallback = fallbackVisionPayload();
  const normalizedInput = (input ?? {}) as Partial<VisionResultPayload> & {
    dich_de?: string;
    kien_thuc?: string;
    cau_hoi_goi_mo?: string[];
  };
  const promptSource = normalizedInput.cauHoiGoiMo ?? normalizedInput.cau_hoi_goi_mo;
  const prompts = Array.isArray(promptSource)
    ? promptSource.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 3)
    : [];
  const dichDe = normalizedInput.dichDe ?? normalizedInput.dich_de;
  const kienThuc = normalizedInput.kienThuc ?? normalizedInput.kien_thuc;
  return {
    dichDe: typeof dichDe === 'string' && dichDe.trim() ? dichDe.trim() : fallback.dichDe,
    kienThuc: typeof kienThuc === 'string' && kienThuc.trim() ? kienThuc.trim() : fallback.kienThuc,
    cauHoiGoiMo: prompts.length === 3 ? prompts : fallback.cauHoiGoiMo,
  };
}

function tryParseJson(content: string): Partial<VisionResultPayload> | null {
  const direct = content.trim();
  try {
    return JSON.parse(direct) as Partial<VisionResultPayload>;
  } catch {
    /* noop */
  }

  const fenced = direct.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]) as Partial<VisionResultPayload>;
    } catch {
      /* noop */
    }
  }
  return null;
}

async function optimizeVisionImage(imageUri: string): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(imageUri);
    if (!info.exists) return imageUri;

    const fileSizeMb = typeof info.size === 'number' ? info.size / (1024 * 1024) : 0;
    const targetWidth = fileSizeMb > 6 ? 960 : fileSizeMb > 3 ? 1120 : 1280;
    const compress = fileSizeMb > 6 ? 0.58 : fileSizeMb > 3 ? 0.66 : 0.74;

    // Adaptive quality: anh lon nen manh hon de giam token va toc do upload
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: targetWidth } }],
      {
        compress,
        format: SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch {
    return imageUri;
  }
}

export async function processVisionFrame(imageUri: string, languageCode: string): Promise<VisionResultPayload> {
  const optimizedUri = await optimizeVisionImage(imageUri);
  const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  const content = await analyzeImage(base64);
  const parsed = tryParseJson(content);
  return normalizeVisionPayload(parsed);
}

export async function processDocumentFrame(imageUri: string, countryCode?: string): Promise<DocumentVisionPayload> {
  const optimizedUri = await optimizeVisionImage(imageUri);
  const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const content = await analyzeImage(base64, {
    systemPrompt: documentLegalVisionSystemPrompt(countryCode),
    userPrompt: 'Phân tích giấy tờ và trả JSON đúng schema bắt buộc.',
  });
  const parsed = tryParseJson(content) as Partial<DocumentVisionPayload> | null;
  return {
    type:
      parsed?.type === 'Visa' || parsed?.type === 'Passport' || parsed?.type === 'Contract'
        ? parsed.type
        : 'Contract',
    expiry_date:
      typeof parsed?.expiry_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.expiry_date)
        ? parsed.expiry_date
        : '2030-01-01',
    holder_name:
      typeof parsed?.holder_name === 'string' && parsed.holder_name.trim().length > 0
        ? parsed.holder_name.trim()
        : 'Unknown',
    action_required:
      typeof parsed?.action_required === 'string' && parsed.action_required.trim().length > 0
        ? parsed.action_required.trim()
        : 'Kiểm tra giấy tờ và chuẩn bị lịch gia hạn sớm.',
  };
}

