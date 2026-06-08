import type { LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';

/** Pack 62LOCALBRIGHT_TEXT_HOVER — Local Bright web-normal hero copy by activeHeroKey. */
export type LocalBrightHeroCopy = Readonly<{
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  chips: readonly [string, string, string];
}>;

export const LOCAL_BRIGHT_HERO_COPY_MAP: Readonly<Record<LocalHeroVisualKey, LocalBrightHeroCopy>> = {
  default: {
    eyebrow: 'VŨ TRỤ VIONA ĐỊA PHƯƠNG',
    title: 'Dịch vụ Việt, gần bạn hơn',
    subtitle:
      'Dịch vụ địa phương, hỗ trợ đặt lịch, pháp lý và cộng đồng — chỉ gửi yêu cầu, không hoàn tất tức thì.',
    primaryCta: 'Duyệt dịch vụ',
    secondaryCta: 'Gửi hỗ trợ đặt lịch',
    chips: ['Chỉ gửi yêu cầu · không thu phí', 'Chưa thu khoản thanh toán', 'Merchant xác nhận trước'],
  },
  myRequests: {
    eyebrow: 'THEO DÕI YÊU CẦU',
    title: 'Yêu cầu của bạn, rõ ràng hơn',
    subtitle:
      'Theo dõi yêu cầu đã gửi, trạng thái phản hồi và xác nhận từ merchant — không thu phí trước.',
    primaryCta: 'Xem yêu cầu',
    secondaryCta: 'Gửi yêu cầu mới',
    chips: ['Request-only', 'Không thu phí trước', 'Merchant phản hồi trước'],
  },
  bookingAssist: {
    eyebrow: 'HỖ TRỢ ĐẶT LỊCH',
    title: 'Gửi yêu cầu đặt lịch dễ hơn',
    subtitle:
      'Soạn yêu cầu rõ ràng cho dịch vụ địa phương, chờ xác nhận trước khi có bất kỳ thanh toán nào.',
    primaryCta: 'Gửi yêu cầu đặt lịch',
    secondaryCta: 'Duyệt dịch vụ',
    chips: ['Không đặt lịch tự động', 'Không thanh toán trước', 'Cần xác nhận từ merchant'],
  },
  legalWealth: {
    eyebrow: 'PHÁP LÝ & TÀI SẢN',
    title: 'Hỗ trợ pháp lý và tài sản rõ ràng hơn',
    subtitle:
      'Khám phá hướng dẫn pháp lý, tài sản và tư vấn ban đầu theo mô hình giới thiệu an toàn.',
    primaryCta: 'Xem hỗ trợ',
    secondaryCta: 'Lưu nhu cầu',
    chips: ['Demo / gated', 'Không tư vấn pháp lý chính thức', 'Cần xác minh chuyên gia'],
  },
  browseServices: {
    eyebrow: 'DUYỆT DỊCH VỤ',
    title: 'Tìm dịch vụ phù hợp quanh bạn',
    subtitle:
      'Duyệt danh mục dịch vụ Việt tại địa phương, xem lựa chọn phù hợp trước khi gửi yêu cầu.',
    primaryCta: 'Duyệt dịch vụ',
    secondaryCta: 'Gửi yêu cầu',
    chips: ['Lite', 'Chọn trước khi gửi', 'Không hoàn tất tức thì'],
  },
} as const;

export function resolveLocalBrightHeroCopy(key: LocalHeroVisualKey): LocalBrightHeroCopy {
  return LOCAL_BRIGHT_HERO_COPY_MAP[key];
}
