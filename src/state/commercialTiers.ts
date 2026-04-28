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
    subtitle: 'Ho tro co ban, vao he thong, trai nghiem nhe',
    features: ['Onboarding co ban', 'Tro ly hoi dap nhe', 'Tong quan he thong Global'],
  },
  {
    id: 'basic',
    name: 'Basic',
    subtitle: 'Ho tro ca nhan thuc dung, giay to nhe, bat dau dung AI',
    features: ['Ho tro giay to muc nhe', 'AI Copilot co ban', 'Huong dan xu ly tinh huong hang ngay'],
  },
  {
    id: 'standard',
    name: 'Standard',
    subtitle: 'Bat dau co Hoc tap that va B2C support that',
    features: ['Hoc tap thuc chien', 'Ho tro B2C nang cao', 'Theo doi tien trinh thong minh'],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Goi manh cho ca nhan nang va B2B Lite',
    features: ['AI ho tro van hanh nang', 'B2B Lite booking support', 'Uu tien xu ly va canh bao'],
  },
  {
    id: 'power',
    name: 'Power',
    subtitle: 'Goi manh nhat cho ca nhan + B2B van hanh that',
    features: ['Van hanh B2B day du', 'Tu dong hoa sau hon', 'Uu tien cao nhat trong he thong'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Thiet ke rieng cho to chuc/doanh nghiep',
    features: ['Giai phap tuy chinh theo to chuc', 'SLA va governance rieng', 'Tich hop he thong noi bo'],
  },
];

const DISPLAY_PRICE_BY_CURRENCY: Record<string, Record<CommercialTierId, string>> = {
  CZK: {
    starter: '99 CZK/thang',
    basic: '199 CZK/thang',
    standard: '299 CZK/thang',
    pro: '499 CZK/thang',
    power: '899 CZK/thang',
    enterprise: 'Lien he bao gia',
  },
  EUR: {
    starter: '4 EUR/thang',
    basic: '8 EUR/thang',
    standard: '12 EUR/thang',
    pro: '20 EUR/thang',
    power: '36 EUR/thang',
    enterprise: 'Lien he bao gia',
  },
  USD: {
    starter: '4 USD/thang',
    basic: '9 USD/thang',
    standard: '13 USD/thang',
    pro: '21 USD/thang',
    power: '39 USD/thang',
    enterprise: 'Contact pricing',
  },
};

export function getDisplayPrice(tierId: string, currency: string): string {
  const normalizedTier = (tierId ?? '').trim().toLowerCase() as CommercialTierId;
  const normalizedCurrency = (currency ?? '').trim().toUpperCase();
  const tierPricing = DISPLAY_PRICE_BY_CURRENCY[normalizedCurrency] ?? DISPLAY_PRICE_BY_CURRENCY.CZK;
  return tierPricing[normalizedTier] ?? 'Lien he tu van';
}
