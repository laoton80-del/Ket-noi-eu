const COLUMN_KEYS = {
  sidebar: 'viona.home.desktop.sidebar',
  companion: 'viona.home.desktop.companion',
} as const;

export type VionaHomeColumn = keyof typeof COLUMN_KEYS;

const memory: Partial<Record<VionaHomeColumn, boolean>> = {};

function sessionStore(): Storage | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

/** Session-only. Missing value stays collapsed. No account or server write. */
export function readHomeColumnOpen(column: VionaHomeColumn): boolean {
  const stored = sessionStore()?.getItem(COLUMN_KEYS[column]);
  if (stored === '1') return true;
  if (stored === '0') return false;
  return memory[column] === true;
}

export function writeHomeColumnOpen(column: VionaHomeColumn, open: boolean): void {
  memory[column] = open;
  sessionStore()?.setItem(COLUMN_KEYS[column], open ? '1' : '0');
}
