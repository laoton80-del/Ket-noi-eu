/**
 * Mock receptionist transport (polling) + Leona routing + hesitation / promo policy.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ServiceTagId, TimelineBlock, WaitlistEntry } from '../screens/b2b/b2bBookingTypes';
import {
  type InboundBookingIntent,
  routeInboundIntent,
} from '../services/ai/b2b/leonaScheduleEngine';
import { resolveLeonaHesitation } from '../services/ai/b2b/leonaPromotionGate';
import { useB2bMerchantPromoSettingsStore } from '../state/b2bMerchantPromoSettings';

const POLL_MS = 13_000;

const MOCK_NAMES = [
  'Hoàng Như Ý',
  'Đặng Quốc An',
  'Vũ Khánh Linh',
  'Bùi Gia Hân',
  'Ngô Bảo Châu',
] as const;

const MOCK_TAGS: readonly ServiceTagId[] = ['manicure', 'gel_x', 'pedicure'];

function randomId(): string {
  return `in_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function buildMockIntent(): InboundBookingIntent {
  const startH = 12 + Math.floor(Math.random() * 6);
  const startM = Math.random() < 0.5 ? 0 : 30;
  const durMin = 30 + Math.floor(Math.random() * 3) * 30;
  const startTotal = startH * 60 + startM;
  const endTotal = startTotal + durMin;
  const endH = Math.floor(endTotal / 60);
  const endM = endTotal % 60;
  const tag = pick(MOCK_TAGS);
  const price =
    tag === 'gel_x'
      ? '480.000 ₫'
      : tag === 'pedicure'
        ? '310.000 ₫'
        : '260.000 ₫';

  return {
    id: randomId(),
    clientName: pick([...MOCK_NAMES]),
    tag,
    priceLabel: price,
    startHour: startH,
    startMinute: startM,
    endHour: endH,
    endMinute: endM,
  };
}

function randomCartUsd(): number {
  return 25 + Math.random() * 95;
}

export type AIReceptionistConnection = 'mock_polling';

export type UseAIReceptionistResult = Readonly<{
  connection: AIReceptionistConnection;
  /** Transport listening (mock poll armed). */
  isListening: boolean;
  /** Short Vietnamese line for staff — never JSON. */
  lastPoliteNotice: string | null;
  waitlist: readonly WaitlistEntry[];
  timeline: readonly TimelineBlock[];
  /** Pending “Needs Human Touch” items (merchant SOS queue). */
  humanTouchPendingCount: number;
}>;

type InitialSeed = Readonly<{
  waitlist: readonly WaitlistEntry[];
  timeline: readonly TimelineBlock[];
}>;

export function useAIReceptionist(seed: InitialSeed): UseAIReceptionistResult {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => [...seed.waitlist]);
  const [timeline, setTimeline] = useState<TimelineBlock[]>(() => [...seed.timeline]);
  const [lastPoliteNotice, setLastPoliteNotice] = useState<string | null>(null);
  const [isListening] = useState(true);

  const waitlistRef = useRef(waitlist);
  const timelineRef = useRef(timeline);
  waitlistRef.current = waitlist;
  timelineRef.current = timeline;

  const hydrate = useB2bMerchantPromoSettingsStore((s) => s.hydrate);
  const humanTouchPendingCount = useB2bMerchantPromoSettingsStore((s) => s.humanTouchQueue.length);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const applyBookingRouting = useCallback(() => {
    const intent = buildMockIntent();
    const result = routeInboundIntent(intent, timelineRef.current);

    setLastPoliteNotice(result.staffNoticeVi);

    if (result.kind === 'confirmed') {
      setTimeline((prev) => [...prev, result.timeline]);
      setWaitlist((prev) => {
        const next = [result.waitlist, ...prev];
        return next.slice(0, 24);
      });
    } else {
      setWaitlist((prev) => {
        const next = [result.waitlist, ...prev];
        return next.slice(0, 24);
      });
    }
  }, []);

  const applyHesitationFlow = useCallback(() => {
    const cart = randomCartUsd();
    const st = useB2bMerchantPromoSettingsStore.getState();
    const outcome = resolveLeonaHesitation({
      estimatedCartUsd: cart,
      allowPreApprovedPromos: st.allowPreApprovedPromos,
      minCartUsd: st.minCartUsd,
      promoCode: st.promoCode,
      discountPercent: st.discountPercent,
    });

    setLastPoliteNotice(outcome.staffNoticeVi);

    if (outcome.kind === 'needs_human_touch') {
      st.enqueueHumanTouch(outcome.staffNoticeVi);
    }
  }, []);

  const applyCycle = useCallback(() => {
    const branch = Math.random();
    if (branch < 0.36) {
      applyHesitationFlow();
    } else {
      applyBookingRouting();
    }
  }, [applyBookingRouting, applyHesitationFlow]);

  useEffect(() => {
    const first = setTimeout(() => {
      applyCycle();
    }, 2_000);
    const t = setInterval(() => {
      applyCycle();
    }, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [applyCycle]);

  return {
    connection: 'mock_polling',
    isListening,
    lastPoliteNotice,
    waitlist,
    timeline,
    humanTouchPendingCount,
  };
}
