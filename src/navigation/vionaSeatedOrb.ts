let seated = true;
const listeners = new Set<(seated: boolean) => void>();

/** True while the collapsed companion orb is actually sitting in the dock. */
export function isVionaOrbSeated(): boolean {
  return seated;
}

export function setVionaOrbSeated(next: boolean): void {
  if (seated === next) return;
  seated = next;
  listeners.forEach((listener) => listener(next));
}

export function subscribeVionaOrbSeated(listener: (seated: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
