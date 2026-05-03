/**
 * Omni-channel messaging adapter — push / social / email-style delivery with a unified activity log.
 * Traditional carrier SMS is permanently disabled (Zero-SMS Doctrine).
 */

import { planDispatchChannels } from '../../utils/Dispatcher';

export type SocialPlatform = 'zalo' | 'whatsapp' | 'messenger';

export type OmniDeliveryChannel = 'app_push' | 'sms' | 'social';

export type OmniSkipReason =
  | 'master_switch_off'
  | 'invalid_title'
  | 'invalid_body'
  | 'invalid_phone'
  | 'invalid_user_id'
  | 'invalid_platform'
  | 'invalid_content'
  /** Zero-SMS Doctrine — carrier SMS is not routed (use push + email). */
  | 'zero_sms_policy';

export interface OmniSendReceipt {
  channel: OmniDeliveryChannel;
  ok: boolean;
  skippedReason?: OmniSkipReason;
  summary: string;
  mockProviderMessageId: string;
}

export interface OmniActivityLogEntry {
  timestampMs: number;
  channel: OmniDeliveryChannel;
  summary: string;
}

export interface OmniChannelMasterSwitches {
  appPushEnabled: boolean;
  socialEnabled: boolean;
  smsEnabled: boolean;
}

const MAX_ACTIVITY = 80;

let masterSwitches: OmniChannelMasterSwitches = {
  appPushEnabled: false,
  socialEnabled: false,
  smsEnabled: false,
};

let activityLog: OmniActivityLogEntry[] = [];

function mockId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function appendActivity(channel: OmniDeliveryChannel, summary: string): void {
  const entry: OmniActivityLogEntry = { timestampMs: Date.now(), channel, summary };
  activityLog = [entry, ...activityLog].slice(0, MAX_ACTIVITY);
}

export function getOmniChannelMasterSwitches(): OmniChannelMasterSwitches {
  return { ...masterSwitches };
}

export function setOmniChannelMasterSwitches(patch: Partial<OmniChannelMasterSwitches>): OmniChannelMasterSwitches {
  masterSwitches = { ...masterSwitches, ...patch };
  return getOmniChannelMasterSwitches();
}

export function getOmniChannelActivityLog(): readonly OmniActivityLogEntry[] {
  return activityLog;
}

export function clearOmniChannelActivityLog(): void {
  activityLog = [];
}

/** Pre-populate the admin “live tail” when the buffer is empty. */
export function seedOmniChannelDemoLogIfEmpty(): void {
  if (activityLog.length > 0) {
    return;
  }
  const t = Date.now();
  activityLog = [
    {
      timestampMs: t - 180_000,
      channel: 'sms',
      summary: 'SMS sent to Merchant #888: Rank Alert · MẤT TOP 1! Nạp tiền ngay để lấy lại khách!',
    },
    {
      timestampMs: t - 120_000,
      channel: 'social',
      summary: 'Zalo API (mock): user zalo_merch_001 · “QR pack — tải ngay trong 48h.”',
    },
    {
      timestampMs: t - 60_000,
      channel: 'app_push',
      summary: 'PUSH HIGH · Merchant #442 · Sponsored rank SOS',
    },
  ];
}

export function sendAppPush(title: string, body: string): OmniSendReceipt {
  const t = title.trim();
  const b = body.trim();
  if (!t) {
    const summary = 'App push skipped: empty title';
    appendActivity('app_push', summary);
    return { channel: 'app_push', ok: false, skippedReason: 'invalid_title', summary, mockProviderMessageId: mockId('push') };
  }
  if (!b) {
    const summary = 'App push skipped: empty body';
    appendActivity('app_push', summary);
    return { channel: 'app_push', ok: false, skippedReason: 'invalid_body', summary, mockProviderMessageId: mockId('push') };
  }
  if (!masterSwitches.appPushEnabled) {
    const summary = 'App push suppressed (Auto-Push OFF)';
    appendActivity('app_push', summary);
    return {
      channel: 'app_push',
      ok: false,
      skippedReason: 'master_switch_off',
      summary,
      mockProviderMessageId: mockId('push_off'),
    };
  }
  const summary = `App push sent · "${t.slice(0, 48)}${t.length > 48 ? '…' : ''}"`;
  appendActivity('app_push', summary);
  return { channel: 'app_push', ok: true, summary: `ExpoFCMMock · ${t} — ${b.slice(0, 120)}`, mockProviderMessageId: mockId('push') };
}

const MIN_PHONE_LEN = 8;

/**
 * @deprecated Carrier SMS — Zero-SMS Doctrine. Returns a blocked receipt and logs planned data channels (push → email).
 * Use {@link sendAppPush} or server {@link executeCentralDispatchForUser} instead.
 */
export function sendSMS(phone: string, message: string): OmniSendReceipt {
  const p = phone.trim();
  const m = message.trim();
  if (p.length < MIN_PHONE_LEN) {
    const summary = 'SMS skipped: invalid destination';
    appendActivity('app_push', summary);
    return { channel: 'sms', ok: false, skippedReason: 'invalid_phone', summary, mockProviderMessageId: mockId('sms') };
  }
  if (!m) {
    const summary = 'SMS skipped: empty body';
    appendActivity('app_push', summary);
    return { channel: 'sms', ok: false, skippedReason: 'invalid_content', summary, mockProviderMessageId: mockId('sms') };
  }
  const kind = m.length > 320 ? 'long_form' : 'marketing';
  const plan = planDispatchChannels({ kind, body: m });
  const summary = `Zero-SMS: carrier SMS disabled · planned [${plan.join(', ')}] · hint ${p.slice(0, 8)}…`;
  appendActivity('app_push', summary);
  return {
    channel: 'sms',
    ok: false,
    skippedReason: 'zero_sms_policy',
    summary,
    mockProviderMessageId: mockId('sms_zero_sms'),
  };
}

const SOCIAL_PLATFORMS: ReadonlySet<SocialPlatform> = new Set(['zalo', 'whatsapp', 'messenger']);

export function sendSocialMessage(userId: string, platform: SocialPlatform, content: string): OmniSendReceipt {
  const uid = userId.trim();
  const c = content.trim();
  if (!uid) {
    const summary = 'Social send skipped: empty userId';
    appendActivity('social', summary);
    return { channel: 'social', ok: false, skippedReason: 'invalid_user_id', summary, mockProviderMessageId: mockId('soc') };
  }
  if (!SOCIAL_PLATFORMS.has(platform)) {
    const summary = 'Social send skipped: unknown platform';
    appendActivity('social', summary);
    return { channel: 'social', ok: false, skippedReason: 'invalid_platform', summary, mockProviderMessageId: mockId('soc') };
  }
  if (!c) {
    const summary = 'Social send skipped: empty content';
    appendActivity('social', summary);
    return { channel: 'social', ok: false, skippedReason: 'invalid_content', summary, mockProviderMessageId: mockId('soc') };
  }
  if (!masterSwitches.socialEnabled) {
    const summary = `${platform.toUpperCase()} message suppressed (Auto-Social OFF) — ${uid}`;
    appendActivity('social', summary);
    return {
      channel: 'social',
      ok: false,
      skippedReason: 'master_switch_off',
      summary,
      mockProviderMessageId: mockId('soc_off'),
    };
  }
  const summary = `${platform.toUpperCase()} sent to ${uid}: ${c.slice(0, 64)}${c.length > 64 ? '…' : ''}`;
  appendActivity('social', summary);
  return {
    channel: 'social',
    ok: true,
    summary: `SocialGraphMock/${platform} · ${uid} · ${c.slice(0, 200)}`,
    mockProviderMessageId: mockId('soc'),
  };
}
