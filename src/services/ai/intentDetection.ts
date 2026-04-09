export type IntentType = 'booking' | 'service_search' | 'normal';

export type BookingData = {
  service: string | null;
  location: string | null;
  time: string | null;
  selectedPlace: string | null;
};

const BOOKING_KEYWORDS = [
  'đặt lịch',
  'dat lich',
  'book',
  'booking',
  'hẹn',
  'hen',
  'appointment',
];

const SEARCH_KEYWORDS = [
  'tìm tiệm',
  'tim tiem',
  'tìm quán',
  'tim quan',
  'gần đây',
  'gan day',
  'nearby',
  'near me',
];

const SERVICE_HINTS: { keywords: string[]; value: string }[] = [
  { keywords: ['khám', 'kham', 'bác sĩ', 'bac si', 'doctor', 'clinic'], value: 'Khám bệnh' },
  { keywords: ['làm móng', 'lam mong', 'nails', 'nail'], value: 'Làm móng' },
  { keywords: ['nhà hàng', 'nha hang', 'quán ăn', 'quan an', 'restaurant'], value: 'Nhà hàng' },
];

const YES_CONFIRM = ['đồng ý', 'xac nhan', 'xác nhận', 'ok', 'oke', 'yes', 'đặt giúp', 'goi giup', 'gọi giúp'];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function includesAny(source: string, words: string[]): boolean {
  return words.some((word) => source.includes(word));
}

export function detectIntent(input: string): IntentType {
  const raw = normalize(input);
  if (!raw) return 'normal';
  if (includesAny(raw, BOOKING_KEYWORDS)) return 'booking';
  if (includesAny(raw, SEARCH_KEYWORDS)) return 'service_search';
  return 'normal';
}

export function isBookingConfirmation(input: string): boolean {
  const raw = normalize(input);
  return includesAny(raw, YES_CONFIRM);
}

export function extractBookingData(input: string, prev?: BookingData): BookingData {
  const raw = normalize(input);
  const next: BookingData = {
    service: prev?.service ?? null,
    location: prev?.location ?? null,
    time: prev?.time ?? null,
    selectedPlace: prev?.selectedPlace ?? null,
  };

  for (const item of SERVICE_HINTS) {
    if (includesAny(raw, item.keywords)) {
      next.service = item.value;
      break;
    }
  }

  const locationMatch = raw.match(/(?:ở|o|tại|tai|near|gần)\s+([^\n,.!?]{2,48})/i);
  if (locationMatch?.[1]) {
    next.location = locationMatch[1].trim();
  }

  const timeMatch = raw.match(
    /(\d{1,2}\s*(?:h|:)\s*\d{0,2}|\d{1,2}\s*(?:am|pm)|sáng mai|chiều nay|tối nay|ngày mai|mai)/i
  );
  if (timeMatch?.[1]) {
    next.time = timeMatch[1].trim();
  }

  return next;
}

export function hasEnoughBookingData(data: BookingData): boolean {
  return Boolean(data.service && data.location && data.time);
}
