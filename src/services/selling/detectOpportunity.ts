import type { DetectOpportunityInput, SellingOpportunity } from './sellingTypes';

const BOOKING_KEYWORDS = [
  'đặt lịch',
  'dat lich',
  'book',
  'booking',
  'hẹn',
  'hen',
  'appointment',
  'gia hạn',
  'renew',
];

const LANGUAGE_CONFUSION_KEYWORDS = [
  'không hiểu',
  'khong hieu',
  'không hiểu tiếng',
  'dịch',
  'dich',
  'translate',
  'i dont understand',
  'i do not understand',
  "don't understand",
];

const SERVICE_SEARCH_KEYWORDS = [
  'tìm',
  'tim',
  'tìm tiệm',
  'tim tiem',
  'tìm quán',
  'tim quan',
  'gần',
  'gan',
  'nearby',
  'near me',
  'dịch vụ',
  'dich vu',
];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function includesAny(source: string, words: string[]): boolean {
  return words.some((word) => source.includes(word));
}

export function detectOpportunity(input: DetectOpportunityInput): Exclude<SellingOpportunity, null> | null {
  const raw = normalize(input.userInput);

  if (
    includesAny(raw, LANGUAGE_CONFUSION_KEYWORDS) ||
    input.context.scenario === 'language_confusion' ||
    input.intent === 'language_confusion'
  ) {
    return 'interpreter';
  }

  const isBookingIntent = input.intent === 'booking' || includesAny(raw, BOOKING_KEYWORDS);
  if (isBookingIntent) return 'booking_call';

  const isCallAssistIntent = input.intent === 'service_search' || includesAny(raw, SERVICE_SEARCH_KEYWORDS);
  if (isCallAssistIntent) return 'call_assist';

  return null;
}

