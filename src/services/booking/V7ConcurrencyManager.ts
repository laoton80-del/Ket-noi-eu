/** Shared mock merchant id so Lễ Tân AI + Leona contend the same logical calendar. */
export const V7_GLOBAL_SLOT_MERCHANT_ID = 'v7-global-slot-ledger';

/**
 * **Pillar 4 — Operational resilience (ironclad seal).**
 *
 * V7 atomic slot locks — **Redis-shaped** in-memory mock for dev; swap for `SET key NX PX` in production.
 * Prevents **double-booking races** when Lễ Tân AI (B2B) and Leona (B2C) confirm the same physical slot.
 *
 * Key: `merchantId|techId|slotStartEpochMs` (stable ordering, integer timestamp).
 */

export type V7TimeSlotLockKey = string;

export type V7LockOwner = 'leona_b2c' | 'le_tan_b2b' | 'human_staff' | 'system';

export type V7SlotLockRecord = Readonly<{
  key: V7TimeSlotLockKey;
  acquiredAtMs: number;
  ttlMs: number;
  owner: V7LockOwner;
}>;

const DEFAULT_TTL_MS = 120_000;

/** In-memory stand-in for Redis; process-local only — cluster must use real Redis. */
const lockTable = new Map<V7TimeSlotLockKey, V7SlotLockRecord>();

function pruneExpired(nowMs: number): void {
  for (const [k, rec] of lockTable) {
    if (nowMs - rec.acquiredAtMs >= rec.ttlMs) {
      lockTable.delete(k);
    }
  }
}

export function buildTimeSlotLockKey(merchantId: string, techId: string, timestamp: number): V7TimeSlotLockKey {
  const m = merchantId.trim();
  const t = techId.trim();
  if (m.length === 0 || t.length === 0) {
    throw new Error('V7Concurrency: merchantId and techId required');
  }
  if (!Number.isFinite(timestamp)) {
    throw new Error('V7Concurrency: timestamp must be finite (epoch ms)');
  }
  const slot = Math.floor(timestamp);
  return `${m}|${t}|${slot}`;
}

/**
 * Attempts **SET NX**-style acquisition. Returns **true** if this caller holds the lock; **false** if already locked.
 * Lễ Tân AI / Leona **must** receive `false` and pivot to alternative slots (no silent overbook).
 */
export function acquireTimeSlotLock(
  merchantId: string,
  techId: string,
  timestamp: number,
  options?: Readonly<{ owner?: V7LockOwner; ttlMs?: number }>
): boolean {
  const now = Date.now();
  pruneExpired(now);
  const key = buildTimeSlotLockKey(merchantId, techId, timestamp);
  const existing = lockTable.get(key);
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
  const owner = options?.owner ?? 'system';

  if (existing != null && now - existing.acquiredAtMs < existing.ttlMs) {
    return false;
  }

  lockTable.set(key, {
    key,
    acquiredAtMs: now,
    ttlMs: ttl,
    owner,
  });
  return true;
}

/**
 * **AI double-booking guard** — alias for {@link acquireTimeSlotLock}. Call **before** confirming a slot from any AI persona.
 */
export const preventAiDoubleBookingAcquire = acquireTimeSlotLock;

/** Idempotent release after successful booking commit or explicit cancel. */
export function releaseTimeSlotLock(merchantId: string, techId: string, timestamp: number): void {
  lockTable.delete(buildTimeSlotLockKey(merchantId, techId, timestamp));
}

/** Test / admin — clear all locks (do not expose in production UI). */
export function __dangerClearAllV7SlotLocksForTests(): void {
  lockTable.clear();
}
