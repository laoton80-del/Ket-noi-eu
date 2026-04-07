import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GrowthEvent, GrowthEventName, GrowthFunnel, GrowthSnapshot, GrowthTraits } from './types';
import { STORAGE_KEYS } from '../../storage/storageKeys';

const KEY = STORAGE_KEYS.growthSnapshot;
const MAX_EVENTS = 400;

let cache: GrowthSnapshot | null = null;
let userTraits: GrowthTraits | undefined;

function defaultSnapshot(): GrowthSnapshot {
  return {
    events: [],
    funnel: {
      installAt: null,
      firstActionAt: null,
      firstPaymentAt: null,
      repeatUsageAt: null,
    },
    totals: {
      creditsSpent: 0,
      interpreterUsed: 0,
      callUsed: 0,
      bookingSuccess: 0,
    },
  };
}

async function ensure(): Promise<GrowthSnapshot> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      cache = defaultSnapshot();
      return cache;
    }
    cache = JSON.parse(raw) as GrowthSnapshot;
    return cache;
  } catch {
    cache = defaultSnapshot();
    return cache;
  }
}

function persist(snapshot: GrowthSnapshot): void {
  cache = snapshot;
  void AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
}

function isCoreAction(name: GrowthEventName): boolean {
  return (
    name === 'interpreter_used' ||
    name === 'call_used' ||
    name === 'successful_booking' ||
    name === 'booking_success'
  );
}

export function setGrowthUserTraits(traits: GrowthTraits | undefined): void {
  userTraits = traits;
}

export async function trackGrowthEvent(
  name: GrowthEventName,
  options?: { value?: number; meta?: GrowthEvent['meta']; traits?: GrowthTraits }
): Promise<void> {
  const s = await ensure();
  const now = Date.now();
  const event: GrowthEvent = {
    name,
    at: now,
    value: options?.value,
    meta: options?.meta,
    traits: options?.traits ?? userTraits,
  };
  const nextEvents = [...s.events, event].slice(-MAX_EVENTS);
  const next: GrowthSnapshot = { ...s, events: nextEvents };
  const funnel: GrowthFunnel = { ...next.funnel };

  if (name === 'app_install' && funnel.installAt === null) funnel.installAt = now;
  if (isCoreAction(name) && funnel.firstActionAt === null) {
    funnel.firstActionAt = now;
    next.events.push({ name: 'first_action', at: now, traits: options?.traits ?? userTraits });
  }
  if (name === 'payment_completed' && funnel.firstPaymentAt === null) funnel.firstPaymentAt = now;
  if (isCoreAction(name) && funnel.firstPaymentAt !== null && funnel.repeatUsageAt === null) funnel.repeatUsageAt = now;

  next.funnel = funnel;
  if (name === 'credits_spent') next.totals.creditsSpent += Math.max(0, Number(options?.value ?? 0));
  if (name === 'interpreter_used') next.totals.interpreterUsed += 1;
  if (name === 'call_used') next.totals.callUsed += 1;
  if (name === 'successful_booking' || name === 'booking_success') next.totals.bookingSuccess += 1;
  persist(next);
}

export async function markAppInstallOnce(): Promise<void> {
  const s = await ensure();
  if (s.funnel.installAt !== null) return;
  await trackGrowthEvent('app_install');
}

export async function getGrowthSnapshot(): Promise<GrowthSnapshot> {
  return ensure();
}

export async function trackGrowthEventOnce(
  name: GrowthEventName,
  options?: { value?: number; meta?: GrowthEvent['meta']; traits?: GrowthTraits }
): Promise<void> {
  const s = await ensure();
  if (s.events.some((e) => e.name === name)) return;
  await trackGrowthEvent(name, options);
}
