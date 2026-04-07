import type { VoicePersona } from '../api/voiceClient';
import { buildLocaleAiContext } from './countryPacks';
import type { LegalScenario } from './countryPacks';
import type { SupportedLanguage } from '../i18n/strings';

type PromptProfile = 'default' | 'strict';
type PersonaMode = 'inbound' | 'outbound';
export type LearningSegment = 'adult' | 'child';
export type LearningAIMode = 'roleplay' | 'coach' | 'live_interpreter';

/** Real-time interpreter scenarios (LifeOS / LeTan). */
export type InterpreterScenario = 'doctor' | 'government' | 'work' | 'general' | 'travel';

type PersonaPromptConfig = {
  displayName: string;
  mode: PersonaMode;
  prompts: Record<PromptProfile, string>;
};

export type PromptRuntimeContext = {
  countryCode?: string;
  locale?: string;
  serviceContext?: 'call' | 'interpreter' | 'vault' | 'lifeos' | 'emergency' | 'learning';
  emergencyMode?: boolean;
  activeScenario?: LegalScenario;
};

function getPromptProfile(): PromptProfile {
  const raw = process.env.EXPO_PUBLIC_AI_PROMPT_PROFILE?.trim().toLowerCase();
  return raw === 'strict' ? 'strict' : 'default';
}

const INBOUND_SYSTEM_PROMPT_DEFAULT =
  "Bạn là Minh Khang, tổng đài viên CSKH tự động trong app Kết Nối. Giọng điệu điềm tĩnh, rõ ràng, đáng tin; thân thiện, hỗ trợ tích cực, nam tính nhưng không cứng nhắc. Trả lời tiếng Việt tự nhiên, lịch sự; có thể dùng từ đệm như 'Dạ', 'Vâng', 'À', 'Để mình kiểm tra'. Nếu câu hỏi ngoài phạm vi, từ chối lịch sự: 'Dạ phần này ngoài phạm vi mình hỗ trợ được, anh/chị thông cảm nhé'.";

const INBOUND_SYSTEM_PROMPT_STRICT =
  "Bạn là Minh Khang, tổng đài viên CSKH tự động trong app Kết Nối. Chỉ trả lời các vấn đề CSKH liên quan dịch vụ của ứng dụng, ngắn gọn, lịch sự, bằng tiếng Việt tự nhiên; giữ phong thái điềm tĩnh và đáng tin. Có thể dùng từ đệm như 'Dạ', 'Vâng', 'À', 'Để mình kiểm tra'. Nếu câu hỏi ngoài phạm vi, từ chối lịch sự: 'Dạ phần này ngoài phạm vi mình hỗ trợ được, anh/chị thông cảm nhé'.";

const OUTBOUND_SYSTEM_PROMPT_DEFAULT =
  "Bạn là Leona Nguyen, trợ lý gọi điện tự động cho tác vụ đối ngoại. Khi gọi đối tác, luôn dùng ngôn ngữ bản xứ theo ngữ cảnh (de/cs/fr/en...) với văn phong chuyên nghiệp, ngắn gọn và tự nhiên. Khi được hỏi có phải AI/máy không, trả lời minh bạch: 'Tôi là trợ lý tự động Leona Nguyen, gọi thay mặt khách hàng để hỗ trợ đặt lịch.'";

const OUTBOUND_SYSTEM_PROMPT_STRICT =
  "Bạn là Leona Nguyen, trợ lý gọi điện tự động cho tác vụ đối ngoại. Chỉ tập trung vào mục tiêu cuộc gọi (đặt lịch/xác nhận lịch/xác minh hồ sơ), giao tiếp bằng ngôn ngữ bản xứ theo ngữ cảnh (de/cs/fr/en...), ưu tiên câu ngắn và lịch sự. Không mở rộng ngoài nội dung cuộc gọi. Nếu bị hỏi có phải AI/máy không, trả lời minh bạch: 'Tôi là trợ lý tự động Leona Nguyen, gọi thay mặt khách hàng để hỗ trợ đặt lịch.'";

const PERSONA_PROMPTS: Record<VoicePersona, PersonaPromptConfig> = {
  loan: {
    displayName: 'Minh Khang',
    mode: 'inbound',
    prompts: {
      default: INBOUND_SYSTEM_PROMPT_DEFAULT,
      strict: INBOUND_SYSTEM_PROMPT_STRICT,
    },
  },
  leona: {
    displayName: 'Leona Nguyen',
    mode: 'outbound',
    prompts: {
      default: OUTBOUND_SYSTEM_PROMPT_DEFAULT,
      strict: OUTBOUND_SYSTEM_PROMPT_STRICT,
    },
  },
};

export function getPersonaSystemPrompt(persona: VoicePersona, runtime?: PromptRuntimeContext): string {
  const profile = getPromptProfile();
  const base = PERSONA_PROMPTS[persona].prompts[profile];
  if (!runtime) return base;
  const localeLine = buildLocaleAiContext({
    countryCode: runtime.countryCode,
    serviceContext: runtime.serviceContext ?? 'call',
    emergencyMode: runtime.emergencyMode,
    activeScenario: runtime.activeScenario,
  });
  return `${base}\n[LOCALE_RUNTIME] ${localeLine}`;
}

export function getPersonaDisplayName(persona: VoicePersona): string {
  return PERSONA_PROMPTS[persona].displayName;
}

export function getPersonaMode(persona: VoicePersona): PersonaMode {
  return PERSONA_PROMPTS[persona].mode;
}

export function buildPersonaUserContext(
  persona: VoicePersona,
  language: SupportedLanguage,
  transcript: string,
  runtime?: PromptRuntimeContext
): string {
  const mode = getPersonaMode(persona);
  const localeLine = runtime
    ? buildLocaleAiContext({
        countryCode: runtime.countryCode,
        serviceContext: runtime.serviceContext ?? 'call',
        emergencyMode: runtime.emergencyMode,
        activeScenario: runtime.activeScenario,
      })
    : '';
  return `Mode: ${mode}. Language: ${language}. ${localeLine} User: ${transcript.trim()}`;
}

export function getAIPrompt(
  segment: LearningSegment,
  mode: LearningAIMode,
  input: string
): string {
  const cleanInput = input.trim() || 'Đi khám bệnh';
  if (segment === 'adult' && mode === 'roleplay') {
    return [
      'Bạn là Minh Khang trong vai giáo viên luyện hội thoại thực tế cho người lớn sống tại châu Âu — giọng điệu điềm tĩnh, rõ ràng, khuyến khích tích cực.',
      `Tình huống: ${cleanInput}.`,
      'Mục tiêu: luyện phản xạ giao tiếp đời thường bằng câu ngắn, dễ nói.',
      'Hãy bắt đầu bằng 1 câu mở đầu thân thiện, sau đó đặt 1 câu hỏi để người học trả lời.',
    ].join(' ');
  }
  if (segment === 'adult' && mode === 'coach') {
    return [
      'Bạn là Minh Khang trong vai coach ngôn ngữ cho người lớn — hỗ trợ chân thành, không phán xét.',
      `Bối cảnh roleplay: ${cleanInput}.`,
      'Nhiệm vụ: sửa câu người học, đưa câu tốt hơn, giải thích ngắn, và tiếp tục hội thoại.',
      'Đồng thời đánh giá tiến bộ bằng điểm tổng, điểm ngữ pháp, điểm tự nhiên và tóm tắt phản hồi.',
      'Giữ giọng thân thiện, thực tế, dễ áp dụng ngay.',
    ].join(' ');
  }
  if (segment === 'adult' && mode === 'live_interpreter') {
    return [
      'Bạn là Minh Khang trong chế độ phiên dịch trực tiếp (live interpreter) cho người Việt tại châu Âu — chỉ phiên dịch, giữ giọng trung lập và rõ ràng.',
      `Ngữ cảnh: ${cleanInput}.`,
      'Chỉ phiên dịch ngắn gọn, tự nhiên; không thêm tư vấn CSKH hay quảng cáo.',
    ].join(' ');
  }
  return `Hãy hỗ trợ người học theo tình huống: ${cleanInput}.`;
}

function interpreterScenarioHint(scenario: InterpreterScenario): string {
  switch (scenario) {
    case 'doctor':
      return 'Phòng khám / y tế: từ ngữ lịch sự, rõ ràng, ưu tiên thông tin cần thiết.';
    case 'government':
      return 'Cơ quan nhà nước / giấy tờ: trang trọng, đúng thuật ngữ hành chính.';
    case 'work':
      return 'Công sở / phỏng vấn: chuyên nghiệp, ngắn gọn.';
    case 'travel':
      return 'Du lịch / giao tiếp nơi công cộng: ngắn gọn, lịch sự, dễ nghe — không thêm lời quảng cáo hay hứa đặt dịch vụ.';
    default:
      return 'Đời sống hằng ngày: tự nhiên, dễ hiểu.';
  }
}

function localLanguageLabel(code: string): string {
  const k = code.toLowerCase();
  if (k === 'cs') return 'Czech (Čeština)';
  if (k === 'de') return 'German (Deutsch)';
  if (k === 'fr') return 'French (Français)';
  if (k === 'pl') return 'Polish (Polski)';
  if (k === 'sk') return 'Slovak (Slovenčina)';
  if (k === 'en') return 'English';
  return 'the local language of the user';
}

export type InterpreterDirection = 'vi_to_local' | 'local_to_vi';

/**
 * User message body for interpreter translation (used with OpenAIService.getChatCompletion + persona `loan` / Minh Khang).
 * Instructs model to output ONLY the translation line(s).
 */
export function buildLiveInterpreterTranslationUserContent(
  scenario: InterpreterScenario,
  direction: InterpreterDirection,
  assistantLanguageCode: string,
  sourceText: string,
  countryCode?: string
): string {
  const scenarioLine = interpreterScenarioHint(scenario);
  const localLabel = localLanguageLabel(assistantLanguageCode);
  const modeLine =
    direction === 'vi_to_local'
      ? `Dịch sang ${localLabel} để người nghe bản địa hiểu.`
      : `Dịch sang tiếng Việt để người Việt hiểu (nguồn nói là ${localLabel}).`;
  const localeRuntime = buildLocaleAiContext({
    countryCode,
    serviceContext: 'interpreter',
    emergencyMode: false,
    activeScenario: scenario,
  });
  return [
    'INTERPRETER_MODE: live_interpreter',
    'Bỏ qua vai trò CSKH; chỉ thực hiện phiên dịch.',
    scenarioLine,
    modeLine,
    `[LOCALE_RUNTIME] ${localeRuntime}`,
    `Văn bản cần dịch: """${sourceText.trim()}"""`,
    'Chỉ trả về bản dịch, không giải thích, không tiền tố.',
  ].join('\n');
}

