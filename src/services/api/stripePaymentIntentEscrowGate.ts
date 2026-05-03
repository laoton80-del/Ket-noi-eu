/**
 * Stripe PaymentIntent checks for broker escrow release (chargebacks / disputes).
 * Uses REST API — no `stripe` npm package required.
 */

export type StripePiEscrowGateResult = Readonly<
  | { ok: true; refunded: boolean; disputeOpen: boolean }
  | { ok: false; reason: 'missing_secret' | 'http_error' | 'invalid_response' }
>;

function readString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function readBoolean(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

/**
 * Returns whether the PI is safe to release escrow against (caller combines with `refunded` / `disputeOpen`).
 */
export async function fetchPaymentIntentEscrowGate(
  paymentIntentId: string
): Promise<StripePiEscrowGateResult> {
  const id = paymentIntentId.trim();
  if (id.length === 0) {
    return { ok: false, reason: 'invalid_response' };
  }
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  if (secret.length === 0) {
    return { ok: false, reason: 'missing_secret' };
  }

  const url = `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(id)}?expand[]=latest_charge`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  if (!res.ok) {
    return { ok: false, reason: 'http_error' };
  }

  const raw: unknown = await res.json();
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'invalid_response' };
  }
  const obj = raw as Record<string, unknown>;

  const latestCharge = obj.latest_charge;
  if (typeof latestCharge === 'object' && latestCharge !== null) {
    const ch = latestCharge as Record<string, unknown>;
    const refunded = readBoolean(ch.refunded) ?? false;
    const dispute = ch.dispute;
    const disputeOpen = typeof dispute === 'string' && dispute.length > 0;
    return { ok: true, refunded, disputeOpen };
  }

  const charges = obj.charges;
  if (typeof charges === 'object' && charges !== null) {
    const d = (charges as { data?: unknown }).data;
    if (Array.isArray(d) && d.length > 0 && typeof d[0] === 'object' && d[0] !== null) {
      const ch = d[0] as Record<string, unknown>;
      const refunded = readBoolean(ch.refunded) ?? false;
      const dispute = ch.dispute;
      const disputeOpen = typeof dispute === 'string' && dispute.length > 0;
      return { ok: true, refunded, disputeOpen };
    }
  }

  const status = readString(obj.status);
  if (status === 'canceled') {
    return { ok: true, refunded: false, disputeOpen: false };
  }

  return { ok: false, reason: 'invalid_response' };
}
