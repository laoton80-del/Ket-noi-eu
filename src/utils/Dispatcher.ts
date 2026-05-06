/**
 * Zero-SMS Doctrine — central notification routing policy.
 * Execution (Expo push API, SMTP) lives in `../services/notifications/centralDispatcherExecution` (Node only).
 */

export type DispatchKind = 'marketing' | 'receipt' | 'long_form' | 'auth' | 'alert';

export type DispatchPayload = Readonly<{
  kind: DispatchKind;
  title?: string;
  body: string;
  /** Optional user id when targeting a stored push token */
  userId?: string;
  /** Optional transactional email when user email is known */
  toEmail?: string | null;
}>;

export type PlannedChannel = 'push' | 'email' | 'whatsapp_compliance';

const LONG_BODY_THRESHOLD = 320;

/**
 * Rule 1: Always plan push first ($0).
 * Rule 2: Email for receipts, long text, or critical auth.
 * Rule 3: Optional WhatsApp-style compliance fallback only when explicitly enabled — never traditional SMS.
 */
export function planDispatchChannels(payload: DispatchPayload): PlannedChannel[] {
  const channels: PlannedChannel[] = ['push'];

  const needsEmailForKind =
    payload.kind === 'receipt' || payload.kind === 'auth' || payload.kind === 'long_form';
  const longText = payload.body.trim().length > LONG_BODY_THRESHOLD;
  if (needsEmailForKind || longText) {
    channels.push('email');
  }

  if (process.env.COMPLIANCE_WHATSAPP_FALLBACK === '1') {
    channels.push('whatsapp_compliance');
  }

  return channels;
}

export function isTraditionalSmsRoutingEnabled(): boolean {
  return false;
}
