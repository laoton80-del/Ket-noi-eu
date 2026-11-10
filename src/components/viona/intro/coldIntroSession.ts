let coldIntroConsumed = false;
let coldIntroActive = false;
const listeners = new Set<(active: boolean) => void>();

/** One intro per JS session. Navigation back does not replay it. */
export function consumeColdIntro(): boolean {
  if (coldIntroConsumed) return false;
  coldIntroConsumed = true;
  coldIntroActive = true;
  return true;
}

export function isColdIntroActive(): boolean {
  return coldIntroActive;
}

export function setColdIntroActive(active: boolean): void {
  coldIntroActive = active;
  listeners.forEach((listener) => listener(active));
}

export function subscribeColdIntro(listener: (active: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
