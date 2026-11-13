const MICRO_USD_PER_MILLION_TOKENS = 1_000_000n;

export type CostModelPrices = Readonly<{
  inputMicrousdPerMillionTokens: bigint;
  outputMicrousdPerMillionTokens: bigint;
  audioInputMicrousdPerSecond: bigint;
  audioOutputMicrousdPerSecond: bigint;
  imageMicrousdPerUnit: bigint;
}>;

export type CostModelUsage = Readonly<{
  model: string;
  inputTokens: bigint;
  outputTokens: bigint;
  audioSeconds?: bigint;
  prices: CostModelPrices;
}>;

export type CostModelUnit = 'token-bidirectional' | 'token-input' | 'audio-second' | null;

/** Resolves only the operation kinds whose billing units are explicitly defined. */
export function costModelUnit(operationKind: string, model: string): CostModelUnit {
  if (operationKind === 'STT') return model === 'gpt-4o-transcribe' ? 'audio-second' : null;
  if (operationKind === 'TTS') return model === 'gpt-4o-mini-tts' ? 'token-input' : null;
  if (
    operationKind === 'ROUTED_CHAT_COMPLETION' ||
    operationKind === 'VIRAL_WRAP' ||
    operationKind === 'CHAT' ||
    operationKind === 'VISION' ||
    operationKind === 'DOC'
  ) return 'token-bidirectional';
  return null;
}

function ceilTokenCost(tokens: bigint, microusdPerMillionTokens: bigint): bigint {
  const numerator = tokens * microusdPerMillionTokens;
  return (numerator + MICRO_USD_PER_MILLION_TOKENS - 1n) / MICRO_USD_PER_MILLION_TOKENS;
}

/** Returns null for an unknown unit, missing rate, or invalid quantity (fail-closed). */
export function costMicrousd(operationKind: string, usage: CostModelUsage): bigint | null {
  const { model, inputTokens, outputTokens, audioSeconds, prices } = usage;
  if (
    typeof inputTokens !== 'bigint' ||
    typeof outputTokens !== 'bigint' ||
    inputTokens < 0n ||
    outputTokens < 0n
  ) return null;
  if (
    typeof prices.inputMicrousdPerMillionTokens !== 'bigint' ||
    typeof prices.outputMicrousdPerMillionTokens !== 'bigint' ||
    typeof prices.audioInputMicrousdPerSecond !== 'bigint' ||
    typeof prices.audioOutputMicrousdPerSecond !== 'bigint' ||
    typeof prices.imageMicrousdPerUnit !== 'bigint' ||
    prices.inputMicrousdPerMillionTokens < 0n ||
    prices.outputMicrousdPerMillionTokens < 0n ||
    prices.audioInputMicrousdPerSecond < 0n ||
    prices.audioOutputMicrousdPerSecond < 0n ||
    prices.imageMicrousdPerUnit < 0n
  ) return null;

  switch (costModelUnit(operationKind, model)) {
    case 'audio-second':
      if (
        audioSeconds === undefined ||
        typeof audioSeconds !== 'bigint' ||
        audioSeconds < 0n ||
        inputTokens !== 0n ||
        outputTokens !== 0n ||
        prices.audioInputMicrousdPerSecond <= 0n
      ) return null;
      return audioSeconds * prices.audioInputMicrousdPerSecond;
    case 'token-input':
      if (outputTokens !== 0n || prices.inputMicrousdPerMillionTokens <= 0n) return null;
      return ceilTokenCost(inputTokens, prices.inputMicrousdPerMillionTokens);
    case 'token-bidirectional':
      if (
        prices.inputMicrousdPerMillionTokens <= 0n ||
        prices.outputMicrousdPerMillionTokens <= 0n
      ) return null;
      return (
        inputTokens * prices.inputMicrousdPerMillionTokens +
        outputTokens * prices.outputMicrousdPerMillionTokens +
        MICRO_USD_PER_MILLION_TOKENS - 1n
      ) / MICRO_USD_PER_MILLION_TOKENS;
    default:
      return null;
  }
}
