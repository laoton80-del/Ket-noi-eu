import { create } from 'zustand';

import { V7_DEMO_SEQUENCE } from '../services/ux/AppTourService';

export type DemoModeState = {
  isDemoMode: boolean;
  tourActive: boolean;
  tourStepIndex: number;
  setDemoMode: (next: boolean) => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
};

export const useDemoModeStore = create<DemoModeState>((set, get) => ({
  isDemoMode: false,
  tourActive: false,
  tourStepIndex: 0,

  setDemoMode: (next) =>
    set(() =>
      next
        ? { isDemoMode: true, tourActive: true, tourStepIndex: 0 }
        : { isDemoMode: false, tourActive: false, tourStepIndex: 0 }
    ),

  startTour: () => set({ tourActive: true, tourStepIndex: 0 }),

  nextTourStep: () => {
    const max = Math.max(0, V7_DEMO_SEQUENCE.length - 1);
    const i = get().tourStepIndex;
    if (i < max) set({ tourStepIndex: i + 1 });
  },

  prevTourStep: () => {
    set({ tourStepIndex: Math.max(0, get().tourStepIndex - 1) });
  },

  endTour: () => set({ isDemoMode: false, tourActive: false, tourStepIndex: 0 }),
}));

/** Non-React access for services (API / AI sandbox). */
export function getDemoModeSnapshot(): Readonly<{ isDemoMode: boolean }> {
  return { isDemoMode: useDemoModeStore.getState().isDemoMode };
}
