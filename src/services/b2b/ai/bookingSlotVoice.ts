import type { B2BBookingSlotState, B2BVoiceDialogueState } from '../../../domain/b2b';
import type { B2BBusinessType } from '../../../domain/b2b/models';
import type { B2BBookingSlotKey } from '../../../domain/b2b/b2bVerticalBridge';
import type { CallVoiceResponse, GenerateCallResponseInput } from './callVoiceTypes';
import {
  allBookingSlotsFilled,
  missingBookingSlots,
  parseConfirmationUtterance,
} from './bookingSlotExtraction';

function normalizeSpoken(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\*/g, '').trim();
}

function isVi(lang?: string): boolean {
  return (lang ?? '').toLowerCase().startsWith('vi');
}

export function promptForMissingBookingSlot(slot: B2BBookingSlotKey, lang?: string): string {
  if (isVi(lang)) {
    switch (slot) {
      case 'service':
        return 'Bạn muốn đặt dịch vụ hoặc loại phòng gì ạ?';
      case 'time':
        return 'Bạn muốn đặt vào lúc nào?';
      case 'name':
        return 'Cho tôi xin tên liên hệ để ghi nhận nhé?';
      case 'stayCheckIn':
        return 'Bạn nhận phòng từ ngày nào?';
      case 'stayCheckOut':
        return 'Bạn trả phòng ngày nào?';
      case 'occupancy':
        return 'Bạn đi mấy người (người lớn / trẻ em)?';
      default:
        return '';
    }
  }
  switch (slot) {
    case 'service':
      return 'Which service or room type would you like?';
    case 'time':
      return 'What day and time work for you?';
    case 'name':
      return 'What name should I use for this request?';
    case 'stayCheckIn':
      return 'What is your check-in date?';
    case 'stayCheckOut':
      return 'What is your check-out date?';
    case 'occupancy':
      return 'How many guests (adults and children)?';
    default:
      return '';
  }
}

/** @deprecated Use `promptForMissingBookingSlot` */
export function promptForMissingSlot(
  slot: 'service' | 'time' | 'name',
  lang?: string
): string {
  return promptForMissingBookingSlot(slot, lang);
}

/** Summary + confirmation ask — hospitality uses stay fields and explicit inquiry wording. */
export function buildBookingConfirmationSummary(
  slots: B2BBookingSlotState,
  lang: string | undefined,
  businessType: B2BBusinessType
): string {
  if (businessType === 'hospitality_stay') {
    const inD = slots.stayCheckIn ?? '';
    const outD = slots.stayCheckOut ?? '';
    const occ = slots.occupancy ?? '';
    const n = slots.name ?? '';
    if (isVi(lang)) {
      return normalizeSpoken(
        `Ghi nhận yêu cầu ở: nhận ${inD}, trả ${outD}, ${occ}, liên hệ ${n}. Đúng thông tin chưa? (Lễ tân sẽ xác nhận phòng và giá.)`
      );
    }
    return normalizeSpoken(
      `I have a stay request: check-in ${inD}, check-out ${outD}, guests ${occ}, contact ${n}. Is that correct? Staff will confirm room and rate.`
    );
  }
  const s = slots.service ?? '';
  const t = slots.time ?? '';
  const n = slots.name ? (isVi(lang) ? `, tên ${slots.name}` : `, under the name ${slots.name}`) : '';
  if (isVi(lang)) {
    return normalizeSpoken(`Bạn muốn đặt ${s} lúc ${t}${n}, đúng không?`);
  }
  const namePart = slots.name ? `, under the name ${slots.name}` : '';
  return normalizeSpoken(`You'd like to book ${s} at ${t}${namePart}. Is that correct?`);
}

export function acknowledgmentAfterConfirm(lang?: string): string {
  return isVi(lang)
    ? 'Cảm ơn bạn. Bạn có thể xác nhận đặt chỗ trên màn hình hoặc tôi sẽ chuyển tiếp.'
    : 'Thank you. You can confirm the booking on your side, or I will proceed when you are ready.';
}

/** After caller confirms summary — stay/inquiry tenants must not imply a firm paid reservation. */
export function acknowledgmentAfterConfirmForBusinessType(lang: string | undefined, businessType: B2BBusinessType): string {
  if (businessType === 'hospitality_stay') {
    return isVi(lang)
      ? 'Cảm ơn bạn. Tôi đã ghi nhận yêu cầu lưu trú để lễ tân xác nhận phòng và giá — đây chưa phải xác nhận cuối cùng hay đã thanh toán.'
      : 'Thank you. I have recorded your stay request for staff to confirm room and rate — this is not a final reservation or payment confirmation yet.';
  }
  return acknowledgmentAfterConfirm(lang);
}

function followUpWhenClosing(lang?: string): string {
  return isVi(lang) ? 'Bạn cần hỗ trợ thêm gì không ạ?' : 'Anything else I can help with?';
}

/**
 * Booking / stay voice turns: slot prompts, summary line, confirmation ack.
 */
export function generateBookingVoiceResponse(input: GenerateCallResponseInput): CallVoiceResponse | null {
  const lang = input.defaultLanguage;
  const ttsVoiceId = input.ttsVoiceId;
  const userLine = input.latestUserInput.trim();
  const base: B2BVoiceDialogueState = input.session.voiceDialogueState ?? { phase: 'greeting', turnCount: 0 };
  const slots = input.session.bookingSlotState ?? {};
  const conf = input.session.bookingConfirmation ?? { awaitingConfirm: false, confirmed: false };
  const bt = input.businessType;

  if (!userLine && conf.awaitingConfirm && allBookingSlotsFilled(bt, slots)) {
    const line = normalizeSpoken(
      isVi(lang)
        ? 'Mình chưa nghe rõ. Bạn nói đúng hay không ạ?'
        : "I didn't catch that. Was that a yes or a no?"
    );
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: 'booking_confirm',
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line,
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: false,
      audioEncoding: 'none',
    };
  }
  if (!userLine) {
    return null;
  }

  if (conf.confirmed) {
    if (base.phase === 'closing') {
      const line = normalizeSpoken(followUpWhenClosing(lang));
      return {
        spokenText: line,
        voiceDialogueState: { ...base, phase: 'closing', turnCount: base.turnCount + 1, lastQuestionAsked: line },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: true,
        audioEncoding: 'none',
      };
    }
    const line = normalizeSpoken(acknowledgmentAfterConfirmForBusinessType(lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: { ...base, phase: 'closing', turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  if (conf.awaitingConfirm && allBookingSlotsFilled(bt, slots)) {
    const askedSummary =
      /\b(đúng không|phải không)\b/i.test(base.lastQuestionAsked ?? '') ||
      /\bis that correct\b/i.test(base.lastQuestionAsked ?? '');
    const unclear =
      !userLine ||
      (userLine && parseConfirmationUtterance(userLine) === 'unknown' && askedSummary);
    if (askedSummary && unclear) {
      const line = normalizeSpoken(
        isVi(lang) ? 'Bạn vui lòng nói đúng hoặc không để tôi xác nhận nhé.' : 'Please say yes or no so I can confirm.'
      );
      return {
        spokenText: line,
        voiceDialogueState: {
          ...base,
          phase: 'booking_confirm',
          turnCount: base.turnCount + 1,
          lastQuestionAsked: line,
        },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: false,
        audioEncoding: 'none',
      };
    }
    const line = normalizeSpoken(buildBookingConfirmationSummary(slots, lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: 'booking_confirm',
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line,
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  const miss = missingBookingSlots(bt, slots);
  if (miss.length > 0) {
    const line = normalizeSpoken(promptForMissingBookingSlot(miss[0], lang));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: 'booking_slot_fill',
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line,
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  if (allBookingSlotsFilled(bt, slots) && !conf.awaitingConfirm && !conf.confirmed) {
    const line = normalizeSpoken(buildBookingConfirmationSummary(slots, lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: 'booking_confirm',
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line,
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: 'none',
    };
  }

  return null;
}
