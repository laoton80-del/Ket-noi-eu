export type VionaDockStatus = Readonly<{
  displayName: string | null;
  regionLabel: string | null;
  previewMode: boolean;
  avatarUri?: string | null;
  rankLabel?: string | null;
  weather?: Readonly<{ temperatureC: number }> | null;
}>;

let current: VionaDockStatus | null = null;
const listeners = new Set<(status: VionaDockStatus | null) => void>();

function same(a: VionaDockStatus | null, b: VionaDockStatus | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.displayName === b.displayName &&
    a.regionLabel === b.regionLabel &&
    a.previewMode === b.previewMode &&
    (a.avatarUri ?? null) === (b.avatarUri ?? null) &&
    (a.rankLabel ?? null) === (b.rankLabel ?? null) &&
    (a.weather?.temperatureC ?? null) === (b.weather?.temperatureC ?? null)
  );
}

/** Home publishes the identity/place line the wide dock shows on the left. */
export function setVionaDockStatus(next: VionaDockStatus | null): void {
  if (same(current, next)) return;
  current = next;
  listeners.forEach((listener) => listener(next));
}

export function subscribeVionaDockStatus(listener: (status: VionaDockStatus | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVionaDockStatus(): VionaDockStatus | null {
  return current;
}
