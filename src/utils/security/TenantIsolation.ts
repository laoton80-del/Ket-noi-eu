/**
 * ## Multi-tenant isolation — **mandatory read for every backend and webhook author**
 *
 * **WARNING — DATA BLEED RISK:** No backend service, Edge Function, Supabase RPC, scheduled job, or **Stripe
 * webhook** may execute database mutations (insert/update/delete), transfer funds, or alter subscription state
 * without validating that the **authenticated tenant** (`merchantId` / `stripe_account_id` / JWT subject) **exactly
 * correlates** to the row or Stripe object being modified. **Tenant A must never mutate Tenant B’s rows** — including
 * via predictable IDs, missing `WHERE merchant_id = $1`, or trusting client-supplied IDs without server-side lookup.
 *
 * Webhooks must resolve Stripe `metadata.merchantId` (or Connect account id) against your registry **before** any write.
 *
 * The client-side {@link withTenantIsolation} wrapper is a **discipline aid** only; **real enforcement is server-side.**
 */

export class TenantIsolationError extends Error {
  readonly code: 'MERCHANT_ID_REQUIRED' | 'ACTION_REJECTED';

  constructor(code: TenantIsolationError['code'], message?: string) {
    super(message ?? code);
    this.name = 'TenantIsolationError';
    this.code = code;
  }
}

/**
 * Runs `action` with a **trimmed, non-empty** `merchantId`. Use to keep tenant id explicit in async flows.
 * **Does not** replace server-side authorization — callers must still verify the session owns this merchant.
 */
export async function withTenantIsolation<T>(
  merchantId: string,
  action: (scopedMerchantId: string) => Promise<T> | T
): Promise<T> {
  const id = merchantId.trim();
  if (id.length === 0) {
    throw new TenantIsolationError('MERCHANT_ID_REQUIRED', 'merchantId is required for tenant-scoped actions');
  }
  return await action(id);
}
