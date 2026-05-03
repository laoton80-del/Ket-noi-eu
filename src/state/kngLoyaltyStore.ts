import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { tierFromLifetimePoints, type VipTier } from '../types/loyalty';

export type LoyaltyUserSnapshot = Readonly<{
  readonly vigTokenBalance: number;
  readonly lifetimeVigTokensEarned: number;
  readonly tier: VipTier;
}>;

type PersistShape = Readonly<{
  readonly byUser: Record<string, LoyaltyUserSnapshot>;
}>;

const EMPTY_USER: LoyaltyUserSnapshot = {
  vigTokenBalance: 0,
  lifetimeVigTokensEarned: 0,
  tier: 'MEMBER',
};

function normalizeSnapshot(raw: unknown): LoyaltyUserSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const balance = typeof o.vigTokenBalance === 'number' ? o.vigTokenBalance : o.pointsBalance;
  const life = typeof o.lifetimeVigTokensEarned === 'number' ? o.lifetimeVigTokensEarned : o.lifetimePointsEarned;
  const tier = o.tier;
  if (typeof balance !== 'number' || typeof life !== 'number' || typeof tier !== 'string') return null;
  if (!['MEMBER', 'SILVER', 'GOLD', 'DIAMOND'].includes(tier)) return null;
  const syncedTier = tierFromLifetimePoints(life);
  return {
    vigTokenBalance: Math.max(0, Math.floor(balance)),
    lifetimeVigTokensEarned: Math.max(0, Math.floor(life)),
    tier: syncedTier,
  };
}

type KngLoyaltyState = Readonly<{
  readonly byUser: Record<string, LoyaltyUserSnapshot>;
  readonly hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Replace map (used after persist). */
  replaceAll: (next: Record<string, LoyaltyUserSnapshot>) => void;
  upsertUser: (userId: string, next: LoyaltyUserSnapshot) => void;
}>;

async function persist(byUser: Record<string, LoyaltyUserSnapshot>): Promise<void> {
  const payload: PersistShape = { byUser };
  await AsyncStorage.setItem(STORAGE_KEYS.kngLoyalty, JSON.stringify(payload));
}

export const useKngLoyaltyStore = create<KngLoyaltyState>((set, get) => ({
  byUser: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.kngLoyalty);
      if (!raw) {
        set({ byUser: {}, hydrated: true });
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || !('byUser' in parsed)) {
        set({ byUser: {}, hydrated: true });
        return;
      }
      const by = (parsed as PersistShape).byUser;
      const next: Record<string, LoyaltyUserSnapshot> = {};
      for (const [uid, snap] of Object.entries(by)) {
        const n = normalizeSnapshot(snap);
        if (n) next[uid] = n;
      }
      set({ byUser: next, hydrated: true });
    } catch {
      set({ byUser: {}, hydrated: true });
    }
  },
  replaceAll: (next) => {
    set({ byUser: next, hydrated: true });
    void persist(next);
  },
  upsertUser: (userId, next) => {
    const key = userId.trim();
    if (key.length === 0) return;
    const merged = { ...get().byUser, [key]: next };
    set({ byUser: merged });
    void persist(merged);
  },
}));

export function getOrCreateLoyaltySnapshot(userId: string): LoyaltyUserSnapshot {
  const key = userId.trim();
  if (key.length === 0) return EMPTY_USER;
  return useKngLoyaltyStore.getState().byUser[key] ?? EMPTY_USER;
}
