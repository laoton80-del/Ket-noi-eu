import { formatCurrency } from '../utils/formatters';

export type CommercialTierId = 'starter' | 'basic' | 'standard' | 'pro' | 'power' | 'enterprise';

export type CommercialTier = {
  id: CommercialTierId;
  name: string;
  subtitle: string;
  features: string[];
};

export const GLOBAL_COMMERCIAL_TIERS: CommercialTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Hỗ trợ cơ bản, vào hệ thống, trải nghiệm nhẹ',
    features: ['Onboarding cơ bản', 'Trợ lý hỏi đáp nhẹ', 'Tổng quan hệ thống Global'],
  },
  {
    id: 'basic',
    name: 'Basic',
    subtitle: 'Hỗ trợ cá nhân thực dụng, giấy tờ nhẹ, bắt đầu dùng AI',
    features: ['Hỗ trợ giấy tờ mức nhẹ', 'AI Copilot cơ bản', 'Hướng dẫn xử lý tình huống hằng ngày'],
  },
  {
    id: 'standard',
    name: 'Standard',
    subtitle: 'Bắt đầu có học tập thật và B2C support thật',
    features: ['Học tập thực chiến', 'Hỗ trợ B2C nâng cao', 'Theo dõi tiến trình thông minh'],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Gói mạnh cho cá nhân nâng và B2B Lite',
    features: ['AI hỗ trợ vận hành nâng', 'B2B Lite booking support', 'Ưu tiên xử lý và cảnh báo'],
  },
  {
    id: 'power',
    name: 'Power',
    subtitle: 'Gói mạnh nhất cho cá nhân + B2B vận hành thật',
    features: ['Vận hành B2B đầy đủ', 'Tự động hóa sâu hơn', 'Ưu tiên cao nhất trong hệ thống'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Thiết kế riêng cho tổ chức/doanh nghiệp',
    features: ['Giải pháp tùy chỉnh theo tổ chức', 'SLA và governance riêng', 'Tích hợp hệ thống nội bộ'],
  },
];

const MONTHLY_PRICE_BY_CURRENCY: Record<string, Partial<Record<CommercialTierId, number>>> = {
  CZK: {
    starter: 99,
    basic: 199,
    standard: 299,
    pro: 499,
    power: 899,
  },
  EUR: {
    starter: 4,
    basic: 8,
    standard: 12,
    pro: 20,
    power: 36,
  },
  USD: {
    starter: 4,
    basic: 9,
    standard: 13,
    pro: 21,
    power: 39,
  },
};

export function getDisplayPrice(tierId: string, currency: string): string {
  const normalizedTier = (tierId ?? '').trim().toLowerCase() as CommercialTierId;
  const normalizedCurrency = (currency ?? '').trim().toUpperCase();
  const tierPricing = MONTHLY_PRICE_BY_CURRENCY[normalizedCurrency] ?? MONTHLY_PRICE_BY_CURRENCY.CZK;
  const amount = tierPricing[normalizedTier];
  if (typeof amount !== 'number') return 'Liên hệ tư vấn';
  return `${formatCurrency(amount, normalizedCurrency)}/tháng`;
}
