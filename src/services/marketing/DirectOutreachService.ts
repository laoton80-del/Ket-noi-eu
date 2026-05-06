/**
 * Direct outreach — digital flyers via Zalo / Messenger deep links.
 * Telesale opens native/web clients; pre-filled text reduces friction (Zalo `text=` query).
 * Messenger: standard `m.me` entry point (prefilled user message not reliably supported — keep symmetry for future clipboard).
 */

function readExpoPublicAppWebUrl(): string {
  if (typeof process === 'undefined' || process.env.EXPO_PUBLIC_APP_WEB_URL == null) {
    return '';
  }
  return String(process.env.EXPO_PUBLIC_APP_WEB_URL).trim();
}

const RESOLVED_APP_WEB_URL = readExpoPublicAppWebUrl();
const DEFAULT_APP_WEB_URL = RESOLVED_APP_WEB_URL.length > 0 ? RESOLVED_APP_WEB_URL : 'https://ketnoieu.app';

/** Public web / universal link shown in flyers (override with EXPO_PUBLIC_APP_WEB_URL). */
export function getFlyerAppUrl(): string {
  return DEFAULT_APP_WEB_URL;
}

/** Short honorific-friendly name from CRM business title (e.g. before "—"). */
export function extractFlyerRecipientName(leadName: string): string {
  const t = leadName.trim();
  if (t.length === 0) return 'anh/chị';
  const beforeDash = t.split('—')[0]?.trim() ?? t;
  const firstToken = beforeDash.split(/\s+/)[0] ?? beforeDash;
  return firstToken.length > 0 ? firstToken : 'anh/chị';
}

/** Digits-only path for `zalo.me/{...}` (VN/EU numbers; strip formatting). */
export function normalizeZaloPhoneForPath(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * High-conversion “digital flyer” body (plain text — paste-safe for Zalo/Messenger).
 * Tone: 1:1 telesale, value + social proof + single CTA link (anti-spam: one clear ask).
 */
export function generateDigitalFlyer(leadName: string, industry: string): string {
  const name = extractFlyerRecipientName(leadName);
  const ind = industry.trim() || 'doanh nghiệp';
  const appUrl = getFlyerAppUrl();
  return [
    `Chào ${name},`,
    '',
    `Tặng anh/chị bản nghe thử Lễ tân AI chốt khách tiếng Đức / Tiệc / Anh — phù hợp ngành ${ind} của mình.`,
    'Không spam: 1 link duy nhất, không đính kèm file — chỉ mời trải nghiệm 60 giây trên app.',
    '',
    `Link: ${appUrl}`,
    '',
    'Nếu không tiện, trả lời “STOP” — em gỡ khỏi danh sách ngay.',
  ].join('\n');
}

/**
 * Zalo web deep link with optional pre-filled composer text (`text` query).
 * @see https://zalo.me/ — path is typically numeric Zalo ID or phone digits.
 */
export function getZaloDeepLink(phone: string, message: string): string {
  const path = normalizeZaloPhoneForPath(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://zalo.me/${path}?text=${encodedMsg}`;
}

/**
 * Messenger Page entry (`m.me`). Prefilled outbound body is not part of the stable public contract;
 * `_message` is reserved for a future in-app clipboard step.
 */
export function getMessengerDeepLink(fbPageId: string, message: string): string {
  void message;
  const id = fbPageId.trim();
  return `https://m.me/${encodeURIComponent(id)}`;
}
