import { INTERPRETER_SESSION_CREDITS } from '../liveInterpreterService';
import { calculateCallCreditPrice, calculateLeTanBookingPrice } from '../PaymentsService';
import type { DetectOpportunityInput, SellCTA, SellingOpportunity, SellingAction } from './sellingTypes';

function snippet(input: string): string {
  const s = input.trim().replace(/\s+/g, ' ');
  return s.length > 42 ? `${s.slice(0, 42)}...` : s;
}

function actionToPrefill(action: SellingAction, userInput: string): { prefillRequest?: string; proactiveQuestion?: string } {
  const s = snippet(userInput);
  switch (action) {
    case 'leona_booking':
      return { prefillRequest: `Gọi hỗ trợ theo nhu cầu của tôi: "${s}". Tập trung đặt lịch / xác nhận lịch ngay.` };
    case 'start_interpreter':
      return {};
    case 'leTan_assist':
      return { proactiveQuestion: `Hỗ trợ cuộc gọi/chốt lịch nhanh: "${s}".` };
    default:
      return {};
  }
}

export function generateSellCTA(
  opportunity: SellingOpportunity,
  input?: DetectOpportunityInput
): SellCTA | null {
  if (!opportunity) return null;

  const safeInput: DetectOpportunityInput =
    input ?? ({
      userInput: '',
      intent: null,
      context: {},
    } as DetectOpportunityInput);

  const userCountry = safeInput.context.userCountry;

  const bookingCost = calculateCallCreditPrice(userCountry).localAmount;
  const interpreterCost = INTERPRETER_SESSION_CREDITS;
  const leTanCost = calculateLeTanBookingPrice(userCountry).localAmount;

  switch (opportunity) {
    case 'booking_call': {
      const action: SellingAction = 'leona_booking';
      const { prefillRequest } = actionToPrefill(action, safeInput.userInput);
      return {
        action,
        creditsCost: bookingCost,
        message: `Muốn mình gọi Leona đặt lịch / gia hạn ngay không? (Cần ${bookingCost} Credits)\nTiếp theo: nếu cần, mình giúp bạn sắp lịch giấy tờ theo đúng mốc.`,
        resume: { route: 'LeonaCall', params: { prefillRequest, autoSubmit: true } },
      };
    }
    case 'interpreter': {
      const action: SellingAction = 'start_interpreter';
      return {
        action,
        creditsCost: interpreterCost,
        message: `Mình mở phiên dịch ngay để bạn nói trôi chảy hơn. (Cần ${interpreterCost} Credits/phiên)\nTiếp theo: nếu bạn muốn gọi đặt lịch, mình gợi ý chuyển sang Leona.`,
        resume: { route: 'LiveInterpreter', params: { guidedEntry: true, scenario: 'general' } },
      };
    }
    case 'call_assist': {
      const action: SellingAction = 'leTan_assist';
      const { proactiveQuestion } = actionToPrefill(action, safeInput.userInput);
      return {
        action,
        creditsCost: leTanCost,
        message: `Mình có thể chuyển bạn sang Lễ tân để hỗ trợ chốt nhanh. (Cần ${leTanCost} Credits/lượt mô phỏng)\nTiếp theo: sau khi chốt, nếu cần xác nhận cuộc gọi thật, mình đề xuất Leona.`,
        resume: {
          route: 'Tabs',
          params: {
            screen: 'LeTan',
            params: { proactiveQuestion, autoSimulate: true },
          },
        },
      };
    }
    default:
      return null;
  }
}

