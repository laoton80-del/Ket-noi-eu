/**
 * Merchant **audio dispatch** — hands-free alerts on the B2B floor.
 *
 * Mock: logs and retains last utterance for QA. Production: native TTS / PA endpoint / Bluetooth receipt printer bell.
 */

let lastMockUtterance: string | null = null;

function devLogMockTts(message: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const c = globalThis.console;
  if (c && typeof c.log === 'function') {
    c.log('[AudioDispatch mock TTS]', message);
  }
}

function rememberMockUtterance(message: string): void {
  lastMockUtterance = message;
  devLogMockTts(message);
}

export type AudioDispatchServiceApi = {
  /** Simulates firing a Vietnamese TTS alert (e.g. after AI function-calling). */
  playVietnameseAlert: (message: string) => void;
};

export const audioDispatchService: AudioDispatchServiceApi = {
  playVietnameseAlert(message: string) {
    const trimmed = message.trim();
    if (trimmed.length === 0) return;
    rememberMockUtterance(trimmed);
  },
};

/** Test hook: read and clear last mock phrase (strict TS; no `any`). */
export function consumeLastMockAudioUtteranceForTests(): string | null {
  const v = lastMockUtterance;
  lastMockUtterance = null;
  return v;
}

/**
 * Mock print queue — when **Tự động in phiếu** is ON for wholesale AI orders.
 */
export function queueMockWholesalePrintSlip(orderId: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const c = globalThis.console;
  if (c && typeof c.log === 'function') {
    c.log('[Auto-print mock] wholesale slip queued:', orderId);
  }
}
