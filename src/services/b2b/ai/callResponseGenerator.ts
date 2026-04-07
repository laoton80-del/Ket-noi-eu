import type { B2BCallSessionIntent, B2BVoiceDialoguePhase, B2BVoiceDialogueState } from '../../../domain/b2b';
import type { CallResponseGenerator, CallVoiceResponse, GenerateCallResponseInput } from './callVoiceTypes';
import { generateBookingVoiceResponse } from './bookingSlotVoice';
import { maybeGenerateSellCTA } from '../../selling/sellEngine';

let customGenerator: CallResponseGenerator | null = null;

/** Swap for LLM-backed generation in production (same input/output contract). */
export function registerCallResponseGenerator(fn: CallResponseGenerator | null): void {
  customGenerator = fn;
}

function normalizeSpoken(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\*/g, '')
    .trim();
}

/** Lightweight intent hints when NLU has not yet called set_intent. */
function inferIntentFromUtterance(raw: string): B2BCallSessionIntent | null {
  const t = raw.toLowerCase();
  if (
    /\b(hotel|room|suite|stay|overnight|check[-\s]?in|check[-\s]?out|phòng|khách sạn|nhận phòng|trả phòng|đêm)\b/i.test(
      t
    )
  ) {
    return 'stay_booking';
  }
  if (/\b(wholesale|pallet|đổ hàng|bán sỉ|sỉ\b|nguyên cont|bulk)\b/i.test(t)) {
    return 'wholesale_order';
  }
  if (/\b(book|booking|appointment|reservation|reserve|table|slot|đặt|đặt chỗ|objednat|rezerv)\b/i.test(t))
    return 'booking';
  if (/\b(order|pickup|delivery|takeaway|objednáv|giao|mang)\b/i.test(t)) return 'order';
  if (/\b(transfer|human|speak to|manager|operátor)\b/i.test(t)) return 'transfer';
  if (/\b(what|when|where|hours|open|price|faq|help|question)\b/i.test(t)) return 'faq';
  return null;
}

function effectiveIntent(session: GenerateCallResponseInput['session'], latestUserInput: string): B2BCallSessionIntent {
  const fromSession = session.detectedIntent ?? session.intent;
  if (fromSession && fromSession !== 'unknown') return fromSession;
  const inferred = inferIntentFromUtterance(latestUserInput);
  return inferred ?? 'unknown';
}

function nextPhaseForIntent(intent: B2BCallSessionIntent): B2BVoiceDialoguePhase {
  switch (intent) {
    case 'booking':
    case 'stay_booking':
      return 'booking_collect';
    case 'order':
    case 'wholesale_order':
      return 'order_collect';
    case 'faq':
      return 'faq';
    case 'transfer':
      return 'confirm_handoff';
    default:
      return 'intent_clarify';
  }
}

function clarificationResponse(state: B2BVoiceDialogueState, languageHint?: string): CallVoiceResponse {
  const lang = languageHint?.slice(0, 2);
  const line =
    lang === 'vi'
      ? 'Xin lỗi, tôi không nghe rõ. Bạn nói lại giúp tôi một lần được không?'
      : lang === 'cs'
        ? 'Promiňte, nerozuměl jsem. Zopakujte to prosím jednou?'
        : "Sorry, I didn't quite catch that. Could you say that again, please?";
  return {
    spokenText: normalizeSpoken(line),
    voiceDialogueState: {
      ...state,
      turnCount: state.turnCount + 1,
      lastQuestionAsked: line,
    },
    tts: { synthesizeFromText: true, language: languageHint },
    advancedPhase: false,
    audioEncoding: 'none',
  };
}

function bookingSlotQuestion(businessType: GenerateCallResponseInput['businessType']): string {
  switch (businessType) {
    case 'hospitality_stay':
      return 'What are your check-in and check-out dates, how many guests, and the name for the reservation request?';
    case 'restaurant':
      return 'What day, time, and party size should I book?';
    case 'nails':
      return 'What service and time work best for you?';
    case 'grocery_retail':
    case 'potraviny':
      return 'What time works for pickup or delivery, and what should we prepare?';
    case 'grocery_wholesale':
      return 'For a wholesale request, what products and approximate volumes do you need, and pickup or delivery?';
    default:
      return 'What time would you like, and is there anything we should prepare in advance?';
  }
}

function maybeAppendSellCta(line: string, latestUserInput: string, intent: B2BCallSessionIntent): string {
  const out = maybeGenerateSellCTA({
    userInput: latestUserInput,
    intent,
    context: {},
  });
  if (!out.cta) return line;
  return normalizeSpoken(`${line} ${out.cta.message.split('\n')[0] ?? ''}`);
}

export function defaultGenerateCallResponse(input: GenerateCallResponseInput): CallVoiceResponse {
  const { session, latestUserInput, tenantDisplayName, businessType } = input;
  const lang = input.defaultLanguage;
  const ttsVoiceId = input.ttsVoiceId;
  const base: B2BVoiceDialogueState = session.voiceDialogueState ?? { phase: 'greeting', turnCount: 0 };
  const userLine = latestUserInput.trim();
  const intent = effectiveIntent(session, userLine);
  let phase = base.phase;

  if (intent === 'booking' || intent === 'stay_booking') {
    const bookingVoice = generateBookingVoiceResponse(input);
    if (bookingVoice) return bookingVoice;
  }

  if (!userLine) {
    if (base.phase === 'greeting' && base.turnCount === 0) {
      const line = normalizeSpoken(
        `Thanks for calling ${tenantDisplayName}. Do you need a booking, retail or wholesale order, a hotel stay request, or something else?`
      );
      return {
        spokenText: line,
        voiceDialogueState: { phase: 'intent_clarify', turnCount: 1, lastQuestionAsked: line },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: true,
        audioEncoding: 'none',
      };
    }
    return clarificationResponse(base, lang);
  }

  if (phase === 'greeting') {
    phase = intent === 'unknown' ? 'intent_clarify' : nextPhaseForIntent(intent);
  }

  if (intent === 'unknown') {
    const baseLine = normalizeSpoken(
      `Are you looking to book a visit, hotel stay, retail or wholesale order, ask a question, or speak with someone at ${tenantDisplayName}?`
    );
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: 'intent_clarify', turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  if (intent === 'booking' || intent === 'stay_booking') {
    const baseLine = normalizeSpoken(bookingSlotQuestion(businessType));
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: 'booking_slot_fill', turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  if (intent === 'order') {
    const baseLine =
      businessType === 'grocery_wholesale'
        ? normalizeSpoken(
            'For wholesale: pickup or delivery, line items with quantities or pallets, and any special handling? I will record this as a request for staff to confirm before it is final.'
          )
        : normalizeSpoken('Would you like pickup or delivery, and what should I put on the order?');
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: 'order_collect', turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  if (intent === 'wholesale_order') {
    const baseLine = normalizeSpoken(
      'I will take a wholesale order request: please list products, quantities or pallets, pickup or delivery window, and contact name. Staff must confirm stock and price — this is not a final order until they respond.'
    );
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: 'order_collect', turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  if (intent === 'faq') {
    const baseLine = normalizeSpoken(`What would you like to know about ${tenantDisplayName}?`);
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: 'faq', turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  if (intent === 'transfer') {
    const baseLine = normalizeSpoken('Connecting you with the team. Please hold for a moment.');
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: 'confirm_handoff', turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  return clarificationResponse(base, lang);
}

export function generateCallResponse(input: GenerateCallResponseInput): CallVoiceResponse {
  if (customGenerator) return customGenerator(input);
  return defaultGenerateCallResponse(input);
}
