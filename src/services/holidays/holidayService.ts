import * as Notifications from 'expo-notifications';
import { resolveCountryPack } from '../../config/countryPacks';
import { getEuHolidaySeed } from './euHolidays';
import { VN_HOLIDAYS, type HolidayItem } from './vnHolidays';

export type HolidayInsight = {
  holiday: HolidayItem;
  daysLeft: number;
  action: string;
};

function sameMonthDay(d: Date, month: number, day: number): boolean {
  return d.getMonth() + 1 === month && d.getDate() === day;
}

function daysUntilMonthDay(now: Date, month: number, day: number): number {
  const y = now.getFullYear();
  const target = new Date(y, month - 1, day, 0, 0, 0, 0);
  if (target.getTime() < now.getTime()) {
    target.setFullYear(y + 1);
  }
  return Math.ceil((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function actionByTags(tags: HolidayItem['tags']): string {
  if (tags.includes('administrative')) {
    return 'Ngày nghỉ hành chính sắp tới: nên xác nhận lịch giấy tờ/công việc sớm với Leona.';
  }
  if (tags.includes('closure')) {
    return 'Ngày nghỉ sắp tới: nên gọi xác nhận giờ mở cửa hoặc dời lịch hẹn.';
  }
  return 'Ngày lễ gần kề: lên kế hoạch liên hệ trước để tránh trễ việc.';
}

export function getHolidayInsightsForCountry(countryCode?: string, now = new Date()): HolidayInsight[] {
  const country = (countryCode || 'CZ').toUpperCase();
  const pack = resolveCountryPack(country);
  if (pack.holidayPack === 'global') {
    return [];
  }
  const base = pack.holidayPack === 'vn' ? VN_HOLIDAYS : getEuHolidaySeed(country);
  const list = base
    .map((h) => ({
      holiday: h,
      daysLeft: daysUntilMonthDay(now, h.month, h.day),
      action: actionByTags(h.tags),
    }))
    .filter((x) => x.daysLeft >= 0 && x.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  return list.slice(0, 2);
}

export async function scheduleHolidayNotificationsForCountry(countryCode?: string): Promise<void> {
  const now = new Date();
  const insights = getHolidayInsightsForCountry(countryCode, now);
  if (!insights.length) return;
  for (const item of insights) {
    if (item.daysLeft > 3) continue;
    const when = new Date(now.getTime() + 20_000);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Nhắc lịch dịp ${item.holiday.name}`,
          body: item.action,
          data: {
            route: 'LeonaCall',
            prefillRequest: `Ngày lễ ${item.holiday.name} sắp đến. Gọi giúp tôi xác nhận lịch/giờ mở cửa dịch vụ.`,
            autoSubmit: false,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
    } catch {
      // keep UX resilient in simulator/dev
    }
  }
}

export function isHolidayToday(countryCode?: string, now = new Date()): HolidayItem | null {
  const country = (countryCode || 'CZ').toUpperCase();
  const pack = resolveCountryPack(country);
  if (pack.holidayPack === 'global') {
    return null;
  }
  const base = pack.holidayPack === 'vn' ? VN_HOLIDAYS : getEuHolidaySeed(country);
  return base.find((h) => sameMonthDay(now, h.month, h.day)) ?? null;
}
