import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MerchantDependencySnapshot } from './types';

import { STORAGE_KEYS } from '../../storage/storageKeys';

const KEY = STORAGE_KEYS.moatB2bLockIn;
type Store = Record<string, MerchantDependencySnapshot>;

async function load(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function save(data: Store): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

function computeDependencyScore(s: MerchantDependencySnapshot): number {
  const bookingStrength = Math.min(1, s.successfulBookings / 20);
  const callStrength = Math.min(1, s.outboundCallsTriggered / 20);
  const analyticsStrength = Math.min(1, s.analyticsTouches / 40);
  const feeStrength = Math.min(1, s.feeCreditsTotal / 2000);
  return Math.round((bookingStrength * 0.35 + callStrength * 0.25 + analyticsStrength * 0.2 + feeStrength * 0.2) * 1000) / 1000;
}

export async function trackMerchantDependency(input: {
  merchantId: string;
  bookingSuccess: boolean;
  outboundCallTriggered: boolean;
  feeCredits: number;
}): Promise<void> {
  const data = await load();
  const prev = data[input.merchantId];
  const base: MerchantDependencySnapshot =
    prev ??
    {
      merchantId: input.merchantId,
      bookings: 0,
      successfulBookings: 0,
      outboundCallsTriggered: 0,
      analyticsTouches: 0,
      feeCreditsTotal: 0,
      dependencyScore: 0,
      updatedAt: Date.now(),
    };
  const next: MerchantDependencySnapshot = {
    ...base,
    bookings: base.bookings + 1,
    successfulBookings: base.successfulBookings + (input.bookingSuccess ? 1 : 0),
    outboundCallsTriggered: base.outboundCallsTriggered + (input.outboundCallTriggered ? 1 : 0),
    analyticsTouches: base.analyticsTouches + 1,
    feeCreditsTotal: base.feeCreditsTotal + Math.max(0, input.feeCredits),
    updatedAt: Date.now(),
    dependencyScore: 0,
  };
  next.dependencyScore = computeDependencyScore(next);
  data[input.merchantId] = next;
  await save(data);
}
