import type { AutoCTA } from '../../services/selling';
import { resolveCountryPack } from '../../config/countryPacks';

type SuggestionInput = {
  showLowCreditBanner: boolean;
  lowCreditThreshold: number;
  showLegalWidget: boolean;
  userCountry?: string;
  userSegment: 'adult' | 'child';
  daysToExpiry: number | null;
  isLowBalance: boolean;
  showEducationWidget: boolean;
  holidayActions: string[];
  marketplaceSuggestion: string | null;
  autonomyHint: string | null;
  pricing: { leonaOutbound: number; interpreterSession: number };
  legalSellFirstLine?: string | null;
};

export function buildLifeOSSuggestionLines(input: SuggestionInput): string[] {
  const lines: string[] = [];
  const p = input.pricing;
  if (input.showLowCreditBanner) {
    lines.push(`Nạp Credits — bạn đang dưới ${input.lowCreditThreshold} (chưa đủ 1 phiên dịch / lượt CSKH tối thiểu).`);
  }
  if (input.showLegalWidget) {
    if (input.legalSellFirstLine) lines.push(input.legalSellFirstLine);
    if (typeof input.daysToExpiry === 'number' && input.daysToExpiry <= 7) {
      const emergencyNumber = resolveCountryPack(input.userCountry).emergencyConfig.primaryNumber;
      lines.push(`Nếu có tình huống khẩn cấp sức khỏe/an ninh: bấm SOS và gọi ${emergencyNumber} ngay.`);
    }
  }
  if (input.isLowBalance) lines.push('Số dư dưới 50 Credits: ưu tiên nạp trước khi gọi Leona hoặc gia hạn.');
  if (input.showEducationWidget) lines.push('Mở học tập để mở khóa — sau đó quay lại LifeOS dùng phiên dịch có trả phí.');
  if (!input.showLegalWidget) lines.push('Thêm giấy tờ vào Vault để LifeOS nhắc hạn và hiện khối gia hạn đúng lúc.');
  if (input.holidayActions.length) lines.push(...input.holidayActions.slice(0, 2));
  if (input.marketplaceSuggestion)
    lines.push(`${input.marketplaceSuggestion} Chạm "Gọi giúp tôi" để chốt lịch qua hỗ trợ.`);
  if (input.autonomyHint) lines.push(input.autonomyHint);
  lines.push(`Leona ${p.leonaOutbound}+ Credits/cuộc — chốt việc ngoài đời. Phiên dịch ${p.interpreterSession} Credits/phiên.`);
  const seen = new Set<string>();
  return lines.filter((l) => (seen.has(l) ? false : (seen.add(l), true))).slice(0, 5);
}

export function buildPredictiveLines(autoCtas: AutoCTA[]): string[] {
  return autoCtas.slice(0, 2).map((c) => {
    const primary = c.actions[0];
    if (!primary) return c.message;
    return `${c.message} → ${primary.label} (${primary.credits} Credits)`;
  });
}
