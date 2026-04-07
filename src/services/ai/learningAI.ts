import { getAIPrompt } from '../../config/aiPrompts';
import { getChatCompletion } from '../OpenAIService';
import { trackNetworkEffectEvent } from '../networkEffect';

export type AdultRoleplayParams = {
  aiMode: 'roleplay';
  scenario: string;
  initialPrompt: string;
};

export type AdultCoachTurn = {
  correctedSentence: string;
  improvedSentence: string;
  shortExplanation: string;
  nextRoleplayResponse: string;
  score: number | null;
  grammarScore: number | null;
  naturalnessScore: number | null;
  feedbackSummary: string;
  rawText: string;
};

const FALLBACK_SCENARIO = 'Đi khám bệnh';

export function resolveAdultScenario(selectedSituation?: string | null): string {
  const value = selectedSituation?.trim();
  return value || FALLBACK_SCENARIO;
}

export async function createAdultRoleplaySession(
  selectedSituation?: string | null,
  userId?: string
): Promise<AdultRoleplayParams> {
  const scenario = resolveAdultScenario(selectedSituation);
  const basePrompt = getAIPrompt('adult', 'roleplay', scenario);
  const openingLine = await getChatCompletion(
    [
      {
        role: 'user',
        content: `${basePrompt} Trả về lời mở đầu roleplay ngắn gọn dưới 35 từ, tiếng Việt tự nhiên.`,
      },
    ],
    'loan',
    {
      ...(userId ? { userId } : {}),
      serviceContext: 'learning',
      networkContext: { actionType: 'booking', language: 'vi', scenario },
    }
  );

  return {
    aiMode: 'roleplay',
    scenario,
    initialPrompt: openingLine.trim() || basePrompt,
  };
}

const TURN_FALLBACK: AdultCoachTurn = {
  correctedSentence: 'Mình chưa nhận rõ câu của bạn.',
  improvedSentence: 'Bạn có thể nói lại một câu ngắn hơn không?',
  shortExplanation: 'Kết nối tạm gián đoạn; mình giữ buổi học tiếp tục.',
  nextRoleplayResponse: 'Trong tình huống này, bạn thử nói: "Xin chào, tôi cần hỗ trợ."',
  score: null,
  grammarScore: null,
  naturalnessScore: null,
  feedbackSummary: '',
  rawText: '',
};

function clampScore(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseCoachTurn(raw: string): AdultCoachTurn {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new Error('json_not_found');
    }
    const obj = JSON.parse(raw.slice(start, end + 1)) as Partial<AdultCoachTurn>;
    return {
      correctedSentence: (obj.correctedSentence ?? '').trim() || TURN_FALLBACK.correctedSentence,
      improvedSentence: (obj.improvedSentence ?? '').trim() || TURN_FALLBACK.improvedSentence,
      shortExplanation: (obj.shortExplanation ?? '').trim() || TURN_FALLBACK.shortExplanation,
      nextRoleplayResponse:
        (obj.nextRoleplayResponse ?? '').trim() || TURN_FALLBACK.nextRoleplayResponse,
      score: clampScore(obj.score),
      grammarScore: clampScore(obj.grammarScore),
      naturalnessScore: clampScore(obj.naturalnessScore),
      feedbackSummary: (obj.feedbackSummary ?? '').trim(),
      rawText: raw.trim(),
    };
  } catch {
    return { ...TURN_FALLBACK, rawText: raw.trim() };
  }
}

export async function handleAdultConversationTurn(
  userInput: string,
  scenarioInput?: string | null,
  userId?: string
): Promise<AdultCoachTurn> {
  const scenario = resolveAdultScenario(scenarioInput);
  const cleanUserInput = userInput.trim();
  if (!cleanUserInput) {
    return TURN_FALLBACK;
  }

  try {
    const coachPrompt = getAIPrompt('adult', 'coach', scenario);
    const startedAt = Date.now();
    const raw = await getChatCompletion(
      [
        {
          role: 'user',
          content: [
            coachPrompt,
            `Người học vừa nói: "${cleanUserInput}"`,
            'Trả về JSON hợp lệ với đúng 8 key: correctedSentence, improvedSentence, shortExplanation, nextRoleplayResponse, score, grammarScore, naturalnessScore, feedbackSummary.',
            'Các điểm là số nguyên từ 0-100.',
            'Mỗi key tối đa 1-2 câu, tiếng Việt tự nhiên.',
          ].join(' '),
        },
      ],
      'loan',
      {
        ...(userId ? { userId } : {}),
        serviceContext: 'learning',
        networkContext: { actionType: 'booking', language: 'vi', scenario },
      }
    );
    void trackNetworkEffectEvent({
      actionType: 'booking',
      success: true,
      durationMs: Date.now() - startedAt,
      language: 'vi',
      scenario,
      responsePatternId: 'slot_first',
      flowId: 'booking_linear',
    });
    return parseCoachTurn(raw);
  } catch {
    void trackNetworkEffectEvent({
      actionType: 'booking',
      success: false,
      durationMs: 0,
      language: 'vi',
      scenario,
      responsePatternId: 'slot_first',
      flowId: 'booking_linear',
    });
    return TURN_FALLBACK;
  }
}
