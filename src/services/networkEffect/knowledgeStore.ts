import type { NetworkActionType } from './types';

const PATTERN_LIBRARY: Record<string, string> = {
  short_confirm: 'Dùng câu ngắn, xác nhận 1 bước rồi mới hỏi tiếp.',
  empathy_first: 'Mở đầu bằng một câu đồng cảm, sau đó đưa 1 hành động rõ ràng.',
  slot_first: 'Với đặt lịch, hỏi thời gian trước rồi mới chốt địa điểm.',
  translate_simple: 'Với phiên dịch, ưu tiên từ phổ thông, tránh câu ghép dài.',
};

const FLOW_LIBRARY: Record<string, string> = {
  booking_linear: 'greet -> collect_time -> confirm_place -> confirm_booking',
  interpreter_loop: 'listen -> translate_short -> confirm_understanding',
  call_triage: 'intent_check -> one_best_next_step -> confirm',
};

export function resolvePatternGuidance(patternId: string | null): string | null {
  if (!patternId) return null;
  return PATTERN_LIBRARY[patternId] ?? null;
}

export function resolveFlowGuidance(flowId: string | null): string | null {
  if (!flowId) return null;
  return FLOW_LIBRARY[flowId] ?? null;
}

export function defaultPatternIdFor(actionType: NetworkActionType): string {
  switch (actionType) {
    case 'booking':
      return 'slot_first';
    case 'interpreter':
      return 'translate_simple';
    default:
      return 'empathy_first';
  }
}
