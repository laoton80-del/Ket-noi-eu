import * as Notifications from 'expo-notifications';
import type { HoneymoonCheckpointDay, Merchant } from '../../types/merchant';

const DAY_MS = 24 * 60 * 60 * 1000;
const HONEYMOON_DAYS = 90;
const ALERT_CHECKPOINTS: readonly HoneymoonCheckpointDay[] = [83, 87, 89];
const PRESSURE_COPY =
  '⚠️ BÁO ĐỘNG ĐỎ: Tiệm của bạn sắp mất vị trí TOP 1 hiển thị vào ngày mai! Các đối thủ xung quanh đang chuẩn bị chiếm chỗ. Thiết lập ngân sách quảng cáo ngay để không mất khách!';
const PAYMENTS_API_BASE = process.env.EXPO_PUBLIC_PAYMENTS_API_BASE?.trim() ?? '';

const merchantRegistry = new Map<string, Merchant>();
const sentPressureCheckpoints = new Map<string, Set<HoneymoonCheckpointDay>>();

function utcMs(d: Date): number {
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  );
}

function coerceUtcDate(input?: Date): Date {
  if (input && Number.isFinite(input.getTime())) {
    return new Date(utcMs(input));
  }
  return new Date();
}

function daysElapsedUtc(createdAtUtc: Date, nowUtc: Date): number {
  return Math.floor((utcMs(nowUtc) - utcMs(createdAtUtc)) / DAY_MS);
}

function daysRemainingUtc(expiresAtUtc: Date, nowUtc: Date): number {
  const diff = utcMs(expiresAtUtc) - utcMs(nowUtc);
  if (diff <= 0) return 0;
  return Math.ceil(diff / DAY_MS);
}

export type HoneymoonPressureNotification = Readonly<{
  day: HoneymoonCheckpointDay;
  title: string;
  body: string;
  scheduled: boolean;
}>;

export type HoneymoonStatus = Readonly<{
  merchantId: string;
  nowUtc: Date;
  createdAt: Date;
  freeTopTierExpiresAt: Date;
  isFreeTopTierActive: boolean;
  daysElapsed: number;
  daysRemaining: number;
  effectiveBidPowerMajor: number;
  triggeredNotifications: readonly HoneymoonPressureNotification[];
}>;

type HoneymoonProjectionApiResponse = Readonly<{
  status?: Omit<HoneymoonStatus, 'nowUtc' | 'triggeredNotifications'> & {
    nowUtcIso?: string;
    checkpoints?: readonly HoneymoonCheckpointDay[];
  };
}>;

export type EnsureMerchantHoneymoonParams = Readonly<{
  merchantId: string;
  name?: string;
  createdAt?: Date;
}>;

export function ensureMerchantHoneymoonProfile(params: EnsureMerchantHoneymoonParams): Merchant {
  const id = params.merchantId.trim();
  const existing = merchantRegistry.get(id);
  if (existing) return existing;
  const createdAt = coerceUtcDate(params.createdAt);
  const freeTopTierExpiresAt = new Date(utcMs(createdAt) + HONEYMOON_DAYS * DAY_MS);
  const row: Merchant = {
    id,
    name: params.name?.trim() || 'Merchant',
    createdAt,
    isFreeTopTierActive: true,
    freeTopTierExpiresAt,
  };
  merchantRegistry.set(id, row);
  return row;
}

export function getMerchantHoneymoonProfile(merchantId: string): Merchant | null {
  return merchantRegistry.get(merchantId.trim()) ?? null;
}

async function maybeTriggerPressureNotifications(
  merchantId: string,
  daysElapsed: number
): Promise<readonly HoneymoonPressureNotification[]> {
  const id = merchantId.trim();
  const already = sentPressureCheckpoints.get(id) ?? new Set<HoneymoonCheckpointDay>();
  sentPressureCheckpoints.set(id, already);
  const notifications: HoneymoonPressureNotification[] = [];
  for (const day of ALERT_CHECKPOINTS) {
    if (daysElapsed < day || already.has(day)) continue;
    let scheduled = false;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Báo động vị trí TOP 1',
          body: PRESSURE_COPY,
          sound: true,
        },
        trigger: null,
      });
      scheduled = true;
    } catch {
      scheduled = false;
    }
    notifications.push({
      day,
      title: 'Báo động vị trí TOP 1',
      body: PRESSURE_COPY,
      scheduled,
    });
    already.add(day);
  }
  return notifications;
}

export async function checkHoneymoonStatus(
  merchantId: string,
  nowDateInput?: Date
): Promise<HoneymoonStatus> {
  if (PAYMENTS_API_BASE) {
    try {
      const res = await fetch(
        `${PAYMENTS_API_BASE}/b2b/merchant/honeymoon-projection?merchantId=${encodeURIComponent(merchantId.trim())}`,
        { method: 'GET', headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const data = (await res.json()) as HoneymoonProjectionApiResponse;
        const api = data.status;
        if (api) {
          return {
            merchantId: api.merchantId,
            nowUtc: new Date(api.nowUtcIso ?? new Date().toISOString()),
            createdAt: new Date(api.createdAt),
            freeTopTierExpiresAt: new Date(api.freeTopTierExpiresAt),
            isFreeTopTierActive: api.isFreeTopTierActive,
            daysElapsed: api.daysElapsed,
            daysRemaining: api.daysRemaining,
            effectiveBidPowerMajor: api.effectiveBidPowerMajor,
            triggeredNotifications: (api.checkpoints ?? []).map((day) => ({
              day,
              title: 'Báo động vị trí TOP 1',
              body: PRESSURE_COPY,
              scheduled: true,
            })),
          };
        }
      }
    } catch {
      // Fallback to local projection for offline/demo mode.
    }
  }
  const merchant = ensureMerchantHoneymoonProfile({ merchantId });
  const nowUtc = coerceUtcDate(nowDateInput);
  const daysElapsed = daysElapsedUtc(merchant.createdAt, nowUtc);
  const stillActive = utcMs(nowUtc) < utcMs(merchant.freeTopTierExpiresAt);
  const daysRemaining = daysRemainingUtc(merchant.freeTopTierExpiresAt, nowUtc);
  const next: Merchant = {
    ...merchant,
    isFreeTopTierActive: stillActive,
  };
  merchantRegistry.set(next.id, next);

  const triggeredNotifications = await maybeTriggerPressureNotifications(next.id, daysElapsed);
  const effectiveBidPowerMajor = stillActive ? 5 : 0;

  return {
    merchantId: next.id,
    nowUtc,
    createdAt: next.createdAt,
    freeTopTierExpiresAt: next.freeTopTierExpiresAt,
    isFreeTopTierActive: next.isFreeTopTierActive,
    daysElapsed,
    daysRemaining,
    effectiveBidPowerMajor,
    triggeredNotifications,
  };
}

export async function scheduleHoneymoonPressureNotificationsServerOnly(): Promise<never> {
  throw new Error('honeymoon_notifications_server_only');
}

export function getHoneymoonPressureCopy(): string {
  return PRESSURE_COPY;
}

export function getEffectiveBidPowerNow(merchantId: string, nowDateInput?: Date): number {
  const merchant = ensureMerchantHoneymoonProfile({ merchantId });
  const nowUtc = coerceUtcDate(nowDateInput);
  const stillActive = utcMs(nowUtc) < utcMs(merchant.freeTopTierExpiresAt);
  merchantRegistry.set(merchant.id, {
    ...merchant,
    isFreeTopTierActive: stillActive,
  });
  return stillActive ? 5 : 0;
}
