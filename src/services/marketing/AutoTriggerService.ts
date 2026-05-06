/**
 * Auto-Pilot Marketing Engine — mock automation for growth tiers (QR, Ads, KOL, Gacha).
 * Returns structured dispatch results so UI or job runners can map to Alert / push / in-app modals.
 */

/** Local wall-clock hour for the simulated global B2C gacha push blast (Vietnam-centric product default). */
export const B2C_GACHA_GLOBAL_PUSH_LOCAL_HOUR = 20 as const;

export interface AutoPilotMarketingConfig {
  /** Tier QR — remind B2B merchants who have not pulled their storefront QR pack. */
  b2bQrReminders: boolean;
  /** Tier Ads — SOS when sponsored placement is under competitive pressure (outbid narrative). */
  b2bRankDropAlerts: boolean;
  /** Tier KOL — instant ping when passive commission accrues. */
  kolCommissionAlerts: boolean;
  /** Tier Gacha — scheduled daily engagement push (mock: 8 PM local). */
  b2cDailyGacha8pm: boolean;
}

export type AutoPilotStrategyKey = keyof AutoPilotMarketingConfig;

let autoPilotConfig: AutoPilotMarketingConfig = {
  b2bQrReminders: false,
  b2bRankDropAlerts: false,
  kolCommissionAlerts: false,
  b2cDailyGacha8pm: false,
};

export function getAutoPilotMarketingConfig(): AutoPilotMarketingConfig {
  return { ...autoPilotConfig };
}

export function setAutoPilotMarketingConfig(patch: Partial<AutoPilotMarketingConfig>): AutoPilotMarketingConfig {
  autoPilotConfig = { ...autoPilotConfig, ...patch };
  return getAutoPilotMarketingConfig();
}

export function setAutoPilotStrategy<K extends AutoPilotStrategyKey>(key: K, enabled: boolean): AutoPilotMarketingConfig {
  autoPilotConfig = { ...autoPilotConfig, [key]: enabled };
  return getAutoPilotMarketingConfig();
}

interface B2bMerchantMarketingMock {
  hasQrPackDownloaded: boolean;
  /** `null` = not in sponsored rotation; `1` = top slot mock. */
  sponsoredSlot: number | null;
  /** Epoch ms when merchant was first tracked (QR not yet pulled) — used for 48h omni enforcement. */
  onboardedAtMs?: number;
}

const b2bMerchantMocks = new Map<string, B2bMerchantMarketingMock>();

function ensureB2bMerchant(merchantId: string): B2bMerchantMarketingMock {
  const trimmed = merchantId.trim();
  const existing = b2bMerchantMocks.get(trimmed);
  if (existing) {
    if (existing.onboardedAtMs === undefined) {
      existing.onboardedAtMs = Date.now();
    }
    return existing;
  }
  const created: B2bMerchantMarketingMock = {
    hasQrPackDownloaded: false,
    sponsoredSlot: 1,
    onboardedAtMs: Date.now(),
  };
  b2bMerchantMocks.set(trimmed, created);
  return created;
}

const FORTY_EIGHT_H_MS = 48 * 60 * 60 * 1000;

/** True when merchant exists, has no QR pack, and ≥48h since first tracked onboarding. */
export function isB2bQrEnforcementDue(merchantId: string): boolean {
  const id = merchantId.trim();
  if (!id) return false;
  const m = b2bMerchantMocks.get(id);
  if (!m || m.hasQrPackDownloaded) return false;
  if (m.onboardedAtMs === undefined) return false;
  return Date.now() - m.onboardedAtMs >= FORTY_EIGHT_H_MS;
}

/** Shift onboarding time into the past (hours) for demos / QA. */
export function mockSetB2bMerchantOnboardedHoursAgo(merchantId: string, hoursAgo: number): void {
  const m = ensureB2bMerchant(merchantId.trim());
  const h = Math.max(0, hoursAgo);
  m.onboardedAtMs = Date.now() - h * 60 * 60 * 1000;
}

/** Test hook: mark QR as downloaded so QR reminder stops firing. */
export function mockMarkB2bMerchantQrDownloaded(merchantId: string, downloaded: boolean): void {
  const m = ensureB2bMerchant(merchantId.trim());
  m.hasQrPackDownloaded = downloaded;
}

/** Test hook: set sponsored slot or exit rotation. */
export function mockSetB2bMerchantSponsoredSlot(merchantId: string, slot: number | null): void {
  const m = ensureB2bMerchant(merchantId.trim());
  m.sponsoredSlot = slot;
}

export type B2bQrReminderSkipReason = 'strategy_disabled' | 'already_downloaded' | 'invalid_merchant_id';

export type B2bQrReminderResult =
  | {
      dispatched: true;
      channel: 'in_app_popup';
      title: string;
      body: string;
      merchantId: string;
    }
  | { dispatched: false; reason: B2bQrReminderSkipReason };

/**
 * Simulated in-app popup when a merchant has not downloaded their QR growth pack.
 */
export function triggerB2bQrReminder(merchantId: string): B2bQrReminderResult {
  if (!autoPilotConfig.b2bQrReminders) {
    return { dispatched: false, reason: 'strategy_disabled' };
  }
  const id = merchantId.trim();
  if (!id) {
    return { dispatched: false, reason: 'invalid_merchant_id' };
  }
  const m = ensureB2bMerchant(id);
  if (m.hasQrPackDownloaded) {
    return { dispatched: false, reason: 'already_downloaded' };
  }
  return {
    dispatched: true,
    channel: 'in_app_popup',
    title: 'QR cửa hàng chưa kích hoạt',
    body: `Merchant ${id}: Tải bộ QR Kết Nối ngay — khách quét là vào menu & booking. Bạn đang để trống kênh viral miễn phí.`,
    merchantId: id,
  };
}

export type B2bRankDropSkipReason = 'strategy_disabled' | 'not_in_sponsored_ads' | 'invalid_merchant_id';

export type B2bRankDropAlertResult =
  | {
      dispatched: true;
      channel: 'sos_push';
      title: string;
      body: string;
      merchantId: string;
      previousSlot: number;
      newSlot: number;
    }
  | { dispatched: false; reason: B2bRankDropSkipReason };

/**
 * Simulated SOS push when the merchant is outbid on sponsored placement (mock state mutates one step).
 */
export function triggerB2bRankDropAlert(merchantId: string): B2bRankDropAlertResult {
  if (!autoPilotConfig.b2bRankDropAlerts) {
    return { dispatched: false, reason: 'strategy_disabled' };
  }
  const id = merchantId.trim();
  if (!id) {
    return { dispatched: false, reason: 'invalid_merchant_id' };
  }
  const m = ensureB2bMerchant(id);
  if (m.sponsoredSlot === null) {
    return { dispatched: false, reason: 'not_in_sponsored_ads' };
  }
  const previousSlot = m.sponsoredSlot;
  const newSlot = Math.min(previousSlot + 2, 8);
  m.sponsoredSlot = newSlot;
  return {
    dispatched: true,
    channel: 'sos_push',
    title: 'SOS · Đối thủ đang qua mặt bạn',
    body: `Merchant ${id}: Vị trí Sponsored của bạn vừa tụt từ #${previousSlot} → #${newSlot}. Tăng bid ngay để giữ top funnel.`,
    merchantId: id,
    previousSlot,
    newSlot,
  };
}

export type KolCommissionSkipReason = 'strategy_disabled' | 'invalid_amount';

export type KolCommissionAlertResult =
  | {
      dispatched: true;
      channel: 'push';
      title: string;
      body: string;
      kolId: string;
      amountMajorUsd: number;
    }
  | { dispatched: false; reason: KolCommissionSkipReason };

/**
 * Simulated dopamine-hit push when KOL passive commission lands.
 */
export function triggerKolCommissionAlert(kolId: string, amount: number): KolCommissionAlertResult {
  if (!autoPilotConfig.kolCommissionAlerts) {
    return { dispatched: false, reason: 'strategy_disabled' };
  }
  const id = kolId.trim();
  if (!id || !Number.isFinite(amount) || amount <= 0) {
    return { dispatched: false, reason: 'invalid_amount' };
  }
  const rounded = Math.round(amount * 100) / 100;
  return {
    dispatched: true,
    channel: 'push',
    title: 'Thu nhập thụ động mới',
    body: `KOL ${id}: +${rounded.toFixed(2)} USD hoa hồng vừa về ví. Hệ thống đang bán hộ bạn 24/7.`,
    kolId: id,
    amountMajorUsd: rounded,
  };
}

export type B2cGachaReminderSkipReason = 'strategy_disabled';

export type B2cDailyGachaReminderResult =
  | {
      dispatched: true;
      channel: 'push';
      title: string;
      body: string;
      scheduledLocalHour: typeof B2C_GACHA_GLOBAL_PUSH_LOCAL_HOUR;
      audience: 'global_b2c';
    }
  | { dispatched: false; reason: B2cGachaReminderSkipReason };

/**
 * Simulated global 8 PM push for daily gacha / streak loop (cron would call this at schedule).
 */
export function triggerB2cDailyGachaReminder(): B2cDailyGachaReminderResult {
  if (!autoPilotConfig.b2cDailyGacha8pm) {
    return { dispatched: false, reason: 'strategy_disabled' };
  }
  return {
    dispatched: true,
    channel: 'push',
    title: '20:00 — Vòng quay & điểm danh',
    body: `Push toàn cục ${B2C_GACHA_GLOBAL_PUSH_LOCAL_HOUR}:00: Mở app nhận Xu, quay Gacha miễn phí — đừng đứt chuỗi.`,
    scheduledLocalHour: B2C_GACHA_GLOBAL_PUSH_LOCAL_HOUR,
    audience: 'global_b2c',
  };
}

/** Reset mock merchant registry (dev / admin demos only). */
export function resetMarketingAutoPilotMocks(): void {
  b2bMerchantMocks.clear();
}
