/**
 * AI Ad Factory — deterministic high-conversion templates for Facebook / Google (mock MarTech layer).
 * Vertical-specific angles: missed appointments (Nails), 24/7 wholesale + i18n, OTA-free hospitality.
 */

export const AD_VERTICAL = {
  NAILS_SPA: 'NAILS_SPA',
  WHOLESALE: 'WHOLESALE',
  HOSPITALITY: 'HOSPITALITY',
} as const;

export type AdVertical = (typeof AD_VERTICAL)[keyof typeof AD_VERTICAL];

export type GeneratedAdTemplate = {
  readonly vertical: AdVertical;
  readonly platform: 'facebook' | 'google' | 'both';
  /** Primary scroll-stopping headline (feed / RSA). */
  readonly headline: string;
  readonly headlineAlt: string;
  readonly subheadline: string;
  /** Long-form primary body (advantage + proof framing). */
  readonly bodyPrimary: string;
  /** Explicit FOMO / urgency layer (ethical scarcity — mock). */
  readonly bodyFomo: string;
  readonly cta: string;
  /** Google Ads description-line style (≤90 chars each, mock-trimmed). */
  readonly googleDescriptionLine1: string;
  readonly googleDescriptionLine2: string;
  /** RSA-style extra headlines for Google. */
  readonly rsaHeadlines: readonly string[];
  readonly suggestedHashtags: readonly string[];
};

function trim90(s: string): string {
  if (s.length <= 90) return s;
  return `${s.slice(0, 87)}…`;
}

function nailsSpaPack(): GeneratedAdTemplate {
  return {
    vertical: AD_VERTICAL.NAILS_SPA,
    platform: 'both',
    headline: 'Khách gọi lúc bạn đang làm móng? Đừng để lỡ hẹn.',
    headlineAlt: 'Lễ tân AI trả lời 24/7 — bạn tập trung làm đẹp.',
    subheadline: 'Voice AI giữ slot, nhắc lịch, dịch CS/DE/EN tự động cho khách kiều bào.',
    bodyPrimary:
      'Salon bận tay: cuộc gọi nhỡ = doanh thu mất. Lễ tân AI của Kết Nối Global bắt máy VoIP, đặt lịch vào lịch, ' +
      'ghi chú yêu cầu gel/đính đá — bạn không cần dừng giữa giờ cao điểm.',
    bodyFomo:
      'FOMO: Đối thủ cùng phố đã bật AI receptionist — khách book nối đuôi trong khi bạn còn để máy nhảy voicemail. ' +
      'Ưu đãi pilot: kích hoạt trước 30/06 để giữ vị trí TOP “Salon có AI” trên app.',
    cta: 'Nhận bản demo 60 giây — không cần thẻ',
    googleDescriptionLine1: trim90(
      'Lễ tân AI cho nail/spa: trả lời cuộc gọi khi bạn đang phục vụ. Đặt lịch tự động, nhắc hẹn, đa ngôn ngữ.'
    ),
    googleDescriptionLine2: trim90(
      'Giảm no-show & cuộc gọi nhỡ. Tích hợp nhanh. Thử nghiệm Freemium 7 ngày — xem dashboard merchant.'
    ),
    rsaHeadlines: [
      'Không bỏ lỡ cuộc gọi đặt lịch',
      'AI trả lời khi bạn đang làm nail',
      'Salon bận — lịch vẫn đầy',
      'Đặt lịch tự động 24/7',
      'Giảm no-show hôm nay',
    ] as const,
    suggestedHashtags: ['#NailSalonAI', '#SpaReceptionist', '#ZeroMissedCalls', '#B2BVietnamEU'] as const,
  };
}

function wholesalePack(): GeneratedAdTemplate {
  return {
    vertical: AD_VERTICAL.WHOLESALE,
    platform: 'both',
    headline: 'Đơn sỉ lúc 2h sáng? AI chốt đơn đa ngôn ngữ — bạn ngủ, kho vẫn chạy.',
    headlineAlt: 'Wholesale 24/7: Czech · German · English · Vietnamese — một lễ tân AI.',
    subheadline: 'Khách bulk order qua điện thoại; AI ghi SKU, địa chỉ giao, bắn ticket kho — không cần phiên ca đêm.',
    bodyPrimary:
      'Kho hàng và đại lý không theo giờ hành chính: Lễ tân AI nhận diện ngôn ngữ, tóm tắt đơn tiếng Việt cho ' +
      'counter, đồng bộ đơn mua sỉ (mock) — giảm sai lệch thủ công và nhỡ máy khi team đang xếp container.',
    bodyFomo:
      'FOMO: Mùa Tết / Black Friday — đối thủ đã bật voice bot wholesale. Slot onboarding pilot đang chật: ' +
      'đăng ký tuần này để khóa mức hoa hồng AI-chốt-đơn ưu đãi (điều khoản áp dụng).',
    cta: 'Xem kịch bản đơn sỉ — Shock Demo qua Zalo',
    googleDescriptionLine1: trim90(
      'Wholesale Voice AI: đặt hàng 24/7, đa ngôn ngữ, ticket tự động cho kho. Giảm lỡ đơn ban đêm.'
    ),
    googleDescriptionLine2: trim90(
      'B2B EU-VN: AI receptionist + đồng bộ đơn sỉ. Pilot 7 ngày — book demo telesale trong 1 chạm.'
    ),
    rsaHeadlines: [
      'Wholesale AI 24/7',
      'Đơn sỉ ban đêm không lo nhỡ',
      'Đa ngôn ngữ — một pipeline',
      'AI chốt đơn bulk',
      'Kho + voice — cùng hệ',
    ] as const,
    suggestedHashtags: ['#WholesaleAI', '#B2BVoice', '#ImportExportEU', '#MultilingualOrders'] as const,
  };
}

function hospitalityPack(): GeneratedAdTemplate {
  return {
    vertical: AD_VERTICAL.HOSPITALITY,
    platform: 'both',
    headline: 'Phòng trống vì OTA ăn margin? Chuyển booking thẳng — không phí 15–25%.',
    headlineAlt: 'Direct booking AI: giữ giá tốt nhất trên site & điện thoại của bạn.',
    subheadline: 'Lễ tân AI trả lời gọi đặt phòng, upsell late checkout, xác nhận bằng ngôn ngữ khách — OTA chỉ còn kênh phụ.',
    bodyPrimary:
      'Khách sạn & homestay: mỗi đêm bán qua OTA là margin mất. Kênh thoại + web với AI receptionist chốt ' +
      'direct rate, gửi xác nhận, đồng bộ lịch phòng (mock) — tăng ADR thực thu về chủ nhà.',
    bodyFomo:
      'FOMO: Mùa du lịch EU đang bật — listing của bạn đang cạnh tranh bid với OTA. Bật direct-booking AI trước ' +
      'kỳ nghỉ lễ để giữ khách “gọi trực tiếp” không bị redirect sang meta-search.',
    cta: 'Nhận kịch bản “Direct only” + demo giọng',
    googleDescriptionLine1: trim90(
      'Giảm phụ thuộc OTA: AI đặt phòng trực tiếp 24/7, đa ngôn ngữ, xác nhận ngay. Giữ margin cho chủ stay.'
    ),
    googleDescriptionLine2: trim90(
      'Homestay & boutique hotel EU. Freemium 7 ngày — đo tỷ lệ direct call-to-book (mock dashboard).'
    ),
    rsaHeadlines: [
      'Direct booking không OTA fee',
      'AI giữ phòng qua điện thoại',
      'Giảm phụ thuộc Booking meta',
      'Upsell late checkout tự động',
      'Xác nhận đa ngôn ngữ',
    ] as const,
    suggestedHashtags: ['#HotelAI', '#DirectBooking', '#NoOTAfee', '#HospitalityVoiceAI'] as const,
  };
}

/** Returns the canonical ad pack for a vertical (deterministic; swap for LLM later). */
export function generateFacebookGoogleAdPack(vertical: AdVertical): GeneratedAdTemplate {
  if (vertical === AD_VERTICAL.NAILS_SPA) return nailsSpaPack();
  if (vertical === AD_VERTICAL.WHOLESALE) return wholesalePack();
  return hospitalityPack();
}

/** All verticals — batch export for ops / CSV glue. */
export function generateAllVerticalPacks(): readonly GeneratedAdTemplate[] {
  return [
    generateFacebookGoogleAdPack(AD_VERTICAL.NAILS_SPA),
    generateFacebookGoogleAdPack(AD_VERTICAL.WHOLESALE),
    generateFacebookGoogleAdPack(AD_VERTICAL.HOSPITALITY),
  ] as const;
}

/**
 * Single markdown-ish block for clipboard / Notion / Meta Business Suite notes.
 * Keeps FOMO blocks visually separated for creative review.
 */
export function formatAdExportMarkdown(pack: GeneratedAdTemplate): string {
  const tags = pack.suggestedHashtags.join(' ');
  const rsa = pack.rsaHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n');
  return [
    `## ${pack.vertical} · ${pack.platform}`,
    '',
    '### HEADLINE',
    pack.headline,
    '',
    '### HEADLINE (ALT)',
    pack.headlineAlt,
    '',
    '### SUBHEAD',
    pack.subheadline,
    '',
    '### BODY',
    pack.bodyPrimary,
    '',
    '### FOMO / URGENCY',
    pack.bodyFomo,
    '',
    '### CTA',
    pack.cta,
    '',
    '### GOOGLE DESCRIPTIONS',
    pack.googleDescriptionLine1,
    pack.googleDescriptionLine2,
    '',
    '### RSA HEADLINES',
    rsa,
    '',
    '### HASHTAGS',
    tags,
    '',
  ].join('\n');
}
