/**
 * Server-authoritative AI billing gate (ViGlobal Blueprint).
 * Call **before** any outbound OpenAI / Twilio / upstream LLM request from Node routes.
 * Client bundles must never trust local “balances” — this module reads Prisma wallet rows only.
 */
import { tryCreditBrokerPaygShareFromAiUsage } from '../b2b/BrokerService';
import { debitSpendableVigForAiGateway, getWalletBalanceByUserId } from '../WalletService';

const VIG_EPS = 1e-6;

export type AIGatewayUpstream = 'openai_chat' | 'openai_vision' | 'openai_stt' | 'openai_tts' | 'twilio_voice';

export class AIGatewayInsufficientVigError extends Error {
  readonly code = 'INSUFFICIENT_VIG' as const;
  readonly httpStatus = 402 as const;
  readonly requiredVig: number;
  readonly availableVig: number;
  readonly upstream: AIGatewayUpstream;

  constructor(
    upstream: AIGatewayUpstream,
    requiredVig: number,
    availableVig: number,
    message = 'Insufficient VIG for this AI action — top up your wallet to continue.'
  ) {
    super(message);
    this.name = 'AIGatewayInsufficientVigError';
    this.requiredVig = requiredVig;
    this.availableVig = availableVig;
    this.upstream = upstream;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function roundVig(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

/**
 * Pre-flight: ensures **spendable** balance (not locked booking funds) covers `minimumVig`
 * before calling an external metered API. Throws {@link AIGatewayInsufficientVigError} → HTTP 402.
 */
export async function assertMinimumSpendableVig(
  userId: string,
  minimumVig: number,
  upstream: AIGatewayUpstream
): Promise<Readonly<{ balanceVIG: number }>> {
  const uid = userId.trim();
  if (uid.length === 0) {
    throw new AIGatewayInsufficientVigError(upstream, minimumVig, 0, 'userId is required for AI billing');
  }
  const min = roundVig(minimumVig);
  if (!Number.isFinite(min) || min <= VIG_EPS) {
    throw new AIGatewayInsufficientVigError(upstream, min, 0, 'minimumVig must be a positive finite amount');
  }

  const row = await getWalletBalanceByUserId(uid);
  const available = row ? roundVig(row.balanceVIG) : 0;
  if (!row || available + VIG_EPS < min) {
    throw new AIGatewayInsufficientVigError(upstream, min, available);
  }
  return { balanceVIG: available };
}

export type AiGatewayDebitInput = Readonly<{
  userId: string;
  amountVIG: number;
  /** Stable per-turn key to prevent double-charge when clients retry (optional). */
  idempotencyKey?: string;
}>;

/**
 * Sequential settlement after a completed inference round (actual billed VIG).
 * For “hold then settle” patterns: pre-flight with {@link assertMinimumSpendableVig}, run upstream,
 * then debit the **observed** cost here.
 */
export async function debitVigAfterAiInference(input: AiGatewayDebitInput): Promise<
  Readonly<{
    transactionId: string;
    balanceAfter: number;
    deduplicated: boolean;
  }>
> {
  const out = await debitSpendableVigForAiGateway({
    userId: input.userId,
    amountVIG: input.amountVIG,
    idempotencyKey: input.idempotencyKey,
  });
  if (!out.deduplicated) {
    const correlationRaw = input.idempotencyKey?.trim() ?? '';
    const correlationKey = correlationRaw.length > 0 ? correlationRaw : out.transactionId;
    try {
      await tryCreditBrokerPaygShareFromAiUsage({
        merchantOwnerUserId: input.userId,
        billedVig: input.amountVIG,
        correlationKey,
      });
    } catch (e) {
      console.error('[AIGateway] broker PAYG net-revenue share failed', e);
    }
  }
  return out;
}
