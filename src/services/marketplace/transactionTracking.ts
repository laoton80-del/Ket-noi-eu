import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MarketplaceTransactionEvent } from './types';
import { trackMerchantDependency } from '../moat';

import { STORAGE_KEYS } from '../../storage/storageKeys';

const KEY = STORAGE_KEYS.marketplaceTransactions;
const MAX_EVENTS = 120;

export async function loadMarketplaceTransactions(): Promise<MarketplaceTransactionEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MarketplaceTransactionEvent[];
    return Array.isArray(parsed) ? parsed.slice(-MAX_EVENTS) : [];
  } catch {
    return [];
  }
}

export async function trackMarketplaceTransaction(event: MarketplaceTransactionEvent): Promise<void> {
  const prev = await loadMarketplaceTransactions();
  const next = [...prev, event].slice(-MAX_EVENTS);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  void trackMerchantDependency({
    merchantId: event.merchantId,
    bookingSuccess: event.status === 'confirmed',
    outboundCallTriggered: event.status === 'confirmed',
    feeCredits: event.feeCredits,
  });
}

export async function summarizeMarketplaceConversion(): Promise<{
  bookings: number;
  conversions: number;
  conversionRate: number;
  totalFees: number;
}> {
  const events = await loadMarketplaceTransactions();
  const bookings = events.length;
  const conversions = events.filter((e) => e.status === 'confirmed').length;
  const totalFees = events.reduce((sum, e) => sum + e.feeCredits, 0);
  return {
    bookings,
    conversions,
    conversionRate: bookings > 0 ? conversions / bookings : 0,
    totalFees,
  };
}
