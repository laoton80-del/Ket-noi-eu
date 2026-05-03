import type { SupportedLanguage } from '../i18n/strings';
import { Platform } from 'react-native';

export const VOICE_API_URL = 'https://api.ketnoieu.com/v1/voice';

export type VoicePersona = 'leona' | 'loan';

export type VoiceApiResponse = {
  text: string;
  /** URL âm thanh phản hồi từ server; thiếu thì client chỉ hiển thị `text`. */
  audioUrl: string | null;
};

function mockCopy(persona: VoicePersona, languageCode: SupportedLanguage): VoiceApiResponse {
  const teacher =
    persona === 'leona'
      ? {
          vi: 'Chào Bạn! Leona Nguyen nghe rất rõ. Hôm nay mình ôn câu chào nhẹ nhàng nhé — Bạn hãy nhắc lại sau Leona, tông điềm tĩnh, rõ từng âm.',
          en: 'Hello! Leona Nguyen heard you clearly. Today we will practice a gentle greeting — repeat after me in a calm, clear tone.',
          cs: 'Dobry den, Leona Nguyen vas slysi jasne. Dnes si nacvicime zdraveni — opakujte za mnou klidnym tonem.',
          de: 'Hallo! Leona Nguyen hat dich gut gehoert. Heute uben wir eine freundliche Begruessung — sprich mir ruhig und klar nach.',
        }
      : {
          vi: 'Xin chào Bạn, đây là CSKH Minh Khang của Kết Nối Global. Mình có thể hỗ trợ Credits, lịch hẹn và hướng dẫn tiện ích. Bạn cần gì, cứ nói nhé.',
          en: 'Hello, this is Minh Khang customer service from Kết Nối Global. I can help with Credits, appointments, and essential services. How may I help?',
          cs: 'Dobry den, jsem zakaznicka podpora Minh Khang. Pomuzu s Credits, terminy a zakladnimi sluzbami. Co potrebujete?',
          de: 'Guten Tag, hier ist der Kundenservice Minh Khang. Ich helfe bei Credits, Terminen und Services. Womit darf ich dienen?',
        };
  const text = teacher[languageCode] ?? teacher.vi;
  return { text, audioUrl: null };
}

export async function postVoiceToCenter(
  audioUri: string,
  persona: VoicePersona,
  languageCode: string
): Promise<VoiceApiResponse> {
  const lang = (languageCode.toLowerCase() as SupportedLanguage) || 'vi';
  const formData = new FormData();
  formData.append('persona', persona);
  formData.append('language', lang);
  const ext = Platform.OS === 'ios' ? 'm4a' : 'm4a';
  const mime = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
  formData.append('audio', {
    uri: audioUri,
    name: `recording.${ext}`,
    type: mime,
  } as unknown as Blob);

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(VOICE_API_URL, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      return mockCopy(persona, lang);
    }
    const data = (await res.json()) as Partial<VoiceApiResponse>;
    if (typeof data.text === 'string') {
      const url =
        typeof data.audioUrl === 'string' && data.audioUrl.length > 0 ? data.audioUrl : null;
      return { text: data.text, audioUrl: url };
    }
    return mockCopy(persona, lang);
  } catch {
    return mockCopy(persona, lang);
  }
}
