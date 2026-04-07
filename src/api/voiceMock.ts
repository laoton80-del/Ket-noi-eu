import type { SupportedLanguage } from '../i18n/strings';
import type { VoicePersona } from './voiceClient';

/** MP3 mẫu ~6s — demo “giọng ấm”, dùng cho Leona (khác clip LOAN). */
export const MOCK_AUDIO_LEONA_WARM = 'https://download.samplelib.com/mp3/sample-6s.mp3';

/** MP3 mẫu ~12s — clip khác hẳn Leona, demo “lễ tân” gọn nhanh. */
export const MOCK_AUDIO_LOAN_PRO = 'https://download.samplelib.com/mp3/sample-12s.mp3';

export const MOCK_DEMO_ANALYZING_MS = 1400;
export const MOCK_DEMO_THINKING_MS = 1200;

function normalizeLang(code: string): SupportedLanguage {
  const k = code.toLowerCase() as SupportedLanguage;
  return k === 'en' || k === 'cs' || k === 'de' || k === 'vi' ? k : 'vi';
}

export function inferFirstName(displayName: string | undefined): string {
  if (!displayName?.trim()) return 'Bạn';
  const p = displayName.trim().split(/\s+/);
  return p[p.length - 1] || 'Bạn';
}

const USER_COMMANDS_LEONA: Record<SupportedLanguage, string[]> = {
  vi: [
    'Chào Leona, bài học hôm nay là gì?',
    'Cô ơi, em muốn luyện phát âm chữ R trong tiếng Pháp.',
    'Leona có thể cho em nghe ví dụ một lần nữa không ạ?',
    'Hôm nay mình ôn phần nào trước, cô?',
  ],
  en: [
    'Hi Leona, what are we studying today?',
    'Could we practice the French R sound again?',
    'Leona, can you repeat that example once more?',
    'What should I focus on first today?',
  ],
  cs: [
    'Ahoj Leono, co se dnes ucime?',
    'Muzeme si znovu nacvicit francouzske R?',
    'Leono, muzes ten priklad zopakovat?',
    'Cim mam zacit?',
  ],
  de: [
    'Hallo Leona, was lernen wir heute?',
    'Koennen wir das franzoesische R nochmal uben?',
    'Leona, kannst du das Beispiel wiederholen?',
    'Womit wollen wir heute starten?',
  ],
};

const USER_COMMANDS_LOAN: Record<SupportedLanguage, string[]> = {
  vi: [
    'Em muốn kiểm tra số dư Combo hiện tại.',
    'LOAN ơi, đăng ký Combo mới cần những bước gì?',
    'Mình cần hỗ trợ gia hạn lượt sử dụng.',
    'Có gói Combo nào cho người mới không ạ?',
  ],
  en: [
    'I’d like to check my current Combo balance.',
    'What do I need to register a new Combo?',
    'I need help extending my usage credits.',
    'Do you have a Combo plan for newcomers?',
  ],
  cs: [
    'Chtel bych zkontrolovat zustatek Combo.',
    'Co potrebuju k registraci noveho Comba?',
    'Potrebuji pomoc s prodlouzenim kreditu.',
    'Mate Combo balicek pro nove klienty?',
  ],
  de: [
    'Ich moechte meinen Combo-Kontostand pruefen.',
    'Was brauche ich fuer eine neue Combo-Registrierung?',
    'Ich brauche Hilfe bei der Verlaengerung meiner Nutzungen.',
    'Gibt es ein Combo-Paket fuer Neukundinnen?',
  ],
};

export function pickRandomMockUserCommand(persona: VoicePersona, languageCode: string): string {
  const lang = normalizeLang(languageCode);
  const pool =
    persona === 'leona'
      ? (USER_COMMANDS_LEONA[lang] ?? USER_COMMANDS_LEONA.vi)
      : (USER_COMMANDS_LOAN[lang] ?? USER_COMMANDS_LOAN.vi);
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}

export function getProfessionalMockResponse(
  persona: VoicePersona,
  languageCode: string,
  studentDisplayName: string | undefined
): { replyText: string; audioUrl: string } {
  const lang = normalizeLang(languageCode);
  const first = inferFirstName(studentDisplayName);

  if (persona === 'leona') {
    const textBy: Record<SupportedLanguage, string> = {
      vi: `Chào ${first}! Hôm nay chúng ta sẽ luyện phát âm âm "R" trong tiếng Pháp nhé.`,
      en: `Hi ${first}! Today we'll practice the French "R" sound together—nice and steady.`,
      cs: `Ahoj ${first}! Dnes si nacvicime vyslovnost francouzskeho „R“ — klidne a po kouscich.`,
      de: `Hallo ${first}! Heute uben wir die Aussprache des franzoesischen „R“ — ganz ruhig.`,
    };
    return { replyText: textBy[lang] ?? textBy.vi, audioUrl: MOCK_AUDIO_LEONA_WARM };
  }

  const loanBy: Record<SupportedLanguage, string> = {
    vi: 'Chào Bạn, LOAN đây! Bạn cần hỗ trợ kiểm tra số dư hay đăng ký Combo mới?',
    en: "Hello—LOAN here! Would you like to check your balance or register a new Combo package?",
    cs: 'Dobry den, tady LOAN! Prejete si zkontrolovat zustatek nebo zaregistrovat nove Combo?',
    de: 'Guten Tag, LOAN am Apparat! Moechten Sie Ihren Kontostand pruefen oder ein neues Combo buchen?',
  };
  return { replyText: loanBy[lang] ?? loanBy.vi, audioUrl: MOCK_AUDIO_LOAN_PRO };
}
