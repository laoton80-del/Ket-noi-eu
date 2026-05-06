import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { createJSONStorage, persist } from '../lib/zustandPersistBridge';

import type { ServerUserRole } from '../context/authTypes';
import { isMerchantServerRole } from '../context/authTypes';

/**
 * Canonical runtime role for the super-app shell (aligned with Prisma `Role` semantics).
 * `ADMIN` = God-Eye Command Center deck (exclusive to `serverRole === 'ADMIN'`).
 */
export type ActiveRole = 'B2C' | 'B2B' | 'BROKER' | 'ADMIN';

export const ACTIVE_ROLE_LABEL: Readonly<Record<ActiveRole, string>> = {
  B2C: 'Consumer',
  B2B: 'Merchant',
  BROKER: 'Broker',
  ADMIN: 'Command Center',
};

export function eligibleActiveRoles(serverRole: ServerUserRole | undefined): readonly ActiveRole[] {
  if (!serverRole || serverRole === 'B2C') return ['B2C'] as const;
  if (serverRole === 'BROKER') return ['B2C', 'BROKER'] as const;
  if (isMerchantServerRole(serverRole)) return ['B2C', 'B2B'] as const;
  if (serverRole === 'ADMIN') return ['B2C', 'B2B', 'BROKER', 'ADMIN'] as const;
  return ['B2C'] as const;
}

function coerceActiveRole(role: ActiveRole, allowed: readonly ActiveRole[]): ActiveRole {
  return allowed.includes(role) ? role : allowed[0];
}

export type UserStoreState = Readonly<{
  currentActiveRole: ActiveRole;
  allowedRoles: readonly ActiveRole[];
  switchRole: (newRole: ActiveRole) => void;
  syncFromServerRole: (serverRole: ServerUserRole | undefined) => void;
  hasSeenMerchantVigPrompt: boolean;
  hasSeenBrokerVigPrompt: boolean;
  markMerchantVigPromptSeen: () => void;
  markBrokerVigPromptSeen: () => void;
}>;

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      currentActiveRole: 'B2C',
      allowedRoles: ['B2C'] as const,
      hasSeenMerchantVigPrompt: false,
      hasSeenBrokerVigPrompt: false,

      switchRole: (newRole: ActiveRole) => {
        const allowed = get().allowedRoles;
        if (!allowed.includes(newRole)) return;
        set({ currentActiveRole: newRole });
      },

      syncFromServerRole: (serverRole: ServerUserRole | undefined) => {
        const allowed = eligibleActiveRoles(serverRole);
        const next = coerceActiveRole(get().currentActiveRole, allowed);
        set({ allowedRoles: allowed, currentActiveRole: next });
      },

      markMerchantVigPromptSeen: () => set({ hasSeenMerchantVigPrompt: true }),
      markBrokerVigPromptSeen: () => set({ hasSeenBrokerVigPrompt: true }),
    }),
    {
      name: 'ketnoieu.superapp.activeRole.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentActiveRole: s.currentActiveRole,
        hasSeenMerchantVigPrompt: s.hasSeenMerchantVigPrompt,
        hasSeenBrokerVigPrompt: s.hasSeenBrokerVigPrompt,
      }),
    }
  )
);
