let coldIntroConsumed = false;

/** One intro per JS session. Navigation back does not replay it. */
export function consumeColdIntro(): boolean {
  if (coldIntroConsumed) return false;
  coldIntroConsumed = true;
  return true;
}
