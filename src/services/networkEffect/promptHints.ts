import { getNetworkPromptHints } from './aggregator';
import { resolveFlowGuidance, resolvePatternGuidance } from './knowledgeStore';
import type { NetworkPromptContextInput } from './types';

export async function buildNetworkPromptInjection(input: NetworkPromptContextInput): Promise<string | null> {
  const hints = await getNetworkPromptHints(input);
  const patternGuidance = resolvePatternGuidance(hints.bestPatternId);
  const flowGuidance = resolveFlowGuidance(hints.bestFlowId);
  if (!patternGuidance && !flowGuidance && !hints.commonFailureHint) {
    return null;
  }
  const successLine =
    typeof hints.successRate === 'number'
      ? `Mẫu tương tự có tỉ lệ thành công khoảng ${Math.round(hints.successRate * 100)}%.`
      : '';
  return [
    '[NETWORK_EFFECT]',
    successLine,
    patternGuidance ? `Pattern tốt: ${patternGuidance}` : '',
    flowGuidance ? `Flow tốt: ${flowGuidance}` : '',
    hints.commonFailureHint ? `Cảnh báo lỗi thường gặp: ${hints.commonFailureHint}` : '',
    'Chỉ dùng như chiến lược tổng quát; không suy đoán dữ liệu cá nhân.',
  ]
    .filter(Boolean)
    .join(' ');
}
