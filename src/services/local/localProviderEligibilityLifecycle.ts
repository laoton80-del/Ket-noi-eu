/**
 * Lifecycle timestamp transition helpers for LocalProviderEligibility (FC-P0 Pack A1).
 * Pure functions — Pack A2 owns mutation routes that apply these.
 */
export type LocalProviderLifecycleTimestamps = Readonly<{
  activatedAt: Date | null;
  suspendedAt: Date | null;
  retiredAt: Date | null;
}>;

export type LocalProviderEligibilityStatusName =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'RETIRED';

const NULL_STAMPS: LocalProviderLifecycleTimestamps = {
  activatedAt: null,
  suspendedAt: null,
  retiredAt: null,
};

/** New DRAFT registration: all lifecycle timestamps null. */
export function draftRegistrationTimestamps(): LocalProviderLifecycleTimestamps {
  return NULL_STAMPS;
}

/**
 * Exact transition timestamp mutation table from the canonical finalization doc.
 * Returns null when the transition is forbidden (caller must not mutate).
 */
export function lifecycleTimestampsForTransition(input: {
  from: LocalProviderEligibilityStatusName;
  to: LocalProviderEligibilityStatusName;
  current: LocalProviderLifecycleTimestamps;
  now: Date;
}): LocalProviderLifecycleTimestamps | null {
  const { from, to, current, now } = input;

  if (from === to) {
    // Same-state: no lifecycle timestamp mutation.
    return { ...current };
  }

  if (from === 'DRAFT' && to === 'ACTIVE') {
    return { activatedAt: now, suspendedAt: null, retiredAt: null };
  }
  if (from === 'ACTIVE' && to === 'SUSPENDED') {
    return {
      activatedAt: current.activatedAt,
      suspendedAt: now,
      retiredAt: null,
    };
  }
  if (from === 'SUSPENDED' && to === 'ACTIVE') {
    return { activatedAt: now, suspendedAt: null, retiredAt: null };
  }
  if (from === 'DRAFT' && to === 'RETIRED') {
    return { activatedAt: null, suspendedAt: null, retiredAt: now };
  }
  if (from === 'ACTIVE' && to === 'RETIRED') {
    return {
      activatedAt: current.activatedAt,
      suspendedAt: null,
      retiredAt: now,
    };
  }
  if (from === 'SUSPENDED' && to === 'RETIRED') {
    return {
      activatedAt: current.activatedAt,
      suspendedAt: current.suspendedAt,
      retiredAt: now,
    };
  }

  // Forbidden (incl. any exit from RETIRED, ACTIVE→DRAFT, etc.).
  return null;
}
