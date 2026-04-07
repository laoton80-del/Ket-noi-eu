import type {
  B2BBookingConfirmationState,
  B2BBookingSlotState,
  B2BCallSessionIntent,
  B2BVoiceDialoguePhase,
  B2BBusinessType,
} from '../../../domain/b2b';
import {
  allBookingSlotsFilled,
  extractSlotsFromUtterance,
  mergeSlotState,
  parseConfirmationUtterance,
} from './bookingSlotExtraction';

export type BookingSlotTransitionInput = {
  intent: B2BCallSessionIntent | undefined;
  detectedIntent: B2BCallSessionIntent | undefined;
  latestUserInput: string;
  bookingSlotState: B2BBookingSlotState | undefined;
  bookingConfirmation: B2BBookingConfirmationState | undefined;
  /** Tenant vertical — drives which slots are required (stay vs nails/restaurant). */
  businessType: B2BBusinessType;
};

export type BookingSlotTransitionResult = {
  bookingSlotState: B2BBookingSlotState;
  bookingConfirmation: B2BBookingConfirmationState;
  voicePhase: B2BVoiceDialoguePhase;
};

const defaultConf = (): B2BBookingConfirmationState => ({
  awaitingConfirm: false,
  confirmed: false,
});

function isBookingLikeIntent(i: B2BCallSessionIntent | undefined): boolean {
  return i === 'booking' || i === 'stay_booking';
}

export function transitionBookingSlotState(input: BookingSlotTransitionInput): BookingSlotTransitionResult | null {
  const intent = input.detectedIntent ?? input.intent;
  if (!isBookingLikeIntent(intent)) return null;

  const slots: B2BBookingSlotState = { ...(input.bookingSlotState ?? {}) };
  const bt = input.businessType;
  let conf = input.bookingConfirmation ? { ...input.bookingConfirmation } : defaultConf();

  if (conf.awaitingConfirm && !conf.confirmed) {
    const ans = parseConfirmationUtterance(input.latestUserInput);
    if (ans === 'yes') {
      return {
        bookingSlotState: slots,
        bookingConfirmation: { awaitingConfirm: false, confirmed: true },
        voicePhase: 'booking_confirm',
      };
    }
    if (ans === 'no') {
      return {
        bookingSlotState: slots,
        bookingConfirmation: { awaitingConfirm: false, confirmed: false },
        voicePhase: 'booking_slot_fill',
      };
    }
    return {
      bookingSlotState: slots,
      bookingConfirmation: conf,
      voicePhase: 'booking_confirm',
    };
  }

  if (conf.confirmed) {
    return {
      bookingSlotState: slots,
      bookingConfirmation: conf,
      voicePhase: 'closing',
    };
  }

  const extracted = extractSlotsFromUtterance(input.latestUserInput);
  const mergedSlots = mergeSlotState(slots, extracted);

  if (!allBookingSlotsFilled(bt, mergedSlots)) {
    return {
      bookingSlotState: mergedSlots,
      bookingConfirmation: { ...conf, awaitingConfirm: false, confirmed: false },
      voicePhase: 'booking_slot_fill',
    };
  }

  return {
    bookingSlotState: mergedSlots,
    bookingConfirmation: { awaitingConfirm: true, confirmed: false },
    voicePhase: 'booking_confirm',
  };
}
