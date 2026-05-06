/**
 * Merchant-owned promo policy for Leona (device cache; server is source of truth in production).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { STORAGE_KEYS } from '../storage/storageKeys';

export type HumanTouchAlert = Readonly<{
  id: string;
  createdAtIso: string;
  summaryVi: string;
}>;

type PersistedShape = Readonly<{
  allowPreApprovedPromos: boolean;
  promoCode: string;
  discountPercent: number;
  minCartUsd: number;
  humanTouchQueue: readonly HumanTouchAlert[];
}>;

const DEFAULTS: PersistedShape = {
  allowPreApprovedPromos: false,
  promoCode: 'WELCOME10',
  discountPercent: 10,
  minCartUsd: 50,
  humanTouchQueue: [],
};

type B2bMerchantPromoSettingsState = PersistedShape & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAllowPreApprovedPromos: (value: boolean) => void;
  setPromoCode: (value: string) => void;
  setDiscountPercent: (value: number) => void;
  setMinCartUsd: (value: number) => void;
  enqueueHumanTouch: (summaryVi: string) => void;
  dismissHumanTouch: (id: string) => void;
  clearHumanTouchQueue: () => void;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(get: () => B2bMerchantPromoSettingsState): void {
  if (persistTimer != null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const s = get();
    const payload: PersistedShape = {
      allowPreApprovedPromos: s.allowPreApprovedPromos,
      promoCode: s.promoCode,
      discountPercent: s.discountPercent,
      minCartUsd: s.minCartUsd,
      humanTouchQueue: s.humanTouchQueue,
    };
    void AsyncStorage.setItem(STORAGE_KEYS.b2bMerchantPromoSettings, JSON.stringify(payload));
  }, 120);
}

export const useB2bMerchantPromoSettingsStore = create<B2bMerchantPromoSettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.b2bMerchantPromoSettings);
      if (raw) {
        const j = JSON.parse(raw) as Partial<PersistedShape>;
        set({
          allowPreApprovedPromos:
            typeof j.allowPreApprovedPromos === 'boolean' ? j.allowPreApprovedPromos : DEFAULTS.allowPreApprovedPromos,
          promoCode: typeof j.promoCode === 'string' && j.promoCode.trim().length > 0 ? j.promoCode.trim() : DEFAULTS.promoCode,
          discountPercent:
            typeof j.discountPercent === 'number' && Number.isFinite(j.discountPercent)
              ? j.discountPercent
              : DEFAULTS.discountPercent,
          minCartUsd:
            typeof j.minCartUsd === 'number' && Number.isFinite(j.minCartUsd) ? j.minCartUsd : DEFAULTS.minCartUsd,
          humanTouchQueue: Array.isArray(j.humanTouchQueue)
            ? j.humanTouchQueue
                .filter(
                  (x): x is HumanTouchAlert =>
                    typeof x === 'object' &&
                    x !== null &&
                    typeof (x as HumanTouchAlert).id === 'string' &&
                    typeof (x as HumanTouchAlert).summaryVi === 'string'
                )
                .slice(0, 30)
            : [],
          hydrated: true,
        });
        return;
      }
    } catch {
      /* fall through */
    }
    set({ hydrated: true });
  },

  setAllowPreApprovedPromos: (allowPreApprovedPromos) => {
    set({ allowPreApprovedPromos });
    schedulePersist(get);
  },

  setPromoCode: (promoCode) => {
    set({ promoCode: promoCode.trim().toUpperCase() });
    schedulePersist(get);
  },

  setDiscountPercent: (discountPercent) => {
    const n = Number.isFinite(discountPercent) ? Math.min(90, Math.max(0, discountPercent)) : 0;
    set({ discountPercent: n });
    schedulePersist(get);
  },

  setMinCartUsd: (minCartUsd) => {
    const n = Number.isFinite(minCartUsd) ? Math.max(0, minCartUsd) : DEFAULTS.minCartUsd;
    set({ minCartUsd: n });
    schedulePersist(get);
  },

  enqueueHumanTouch: (summaryVi) => {
    const id = `ht_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const row: HumanTouchAlert = {
      id,
      createdAtIso: new Date().toISOString(),
      summaryVi: summaryVi.trim().slice(0, 500),
    };
    set((s) => ({
      humanTouchQueue: [row, ...s.humanTouchQueue].slice(0, 30),
    }));
    schedulePersist(get);
  },

  dismissHumanTouch: (id) => {
    set((s) => ({
      humanTouchQueue: s.humanTouchQueue.filter((x) => x.id !== id),
    }));
    schedulePersist(get);
  },

  clearHumanTouchQueue: () => {
    set({ humanTouchQueue: [] });
    schedulePersist(get);
  },
}));
