import { create } from 'zustand';

/**
 * B2B merchant console — zero-touch ops (audio dispatch + auto-print queue).
 * Persist to device storage in a later iteration.
 */
export type B2bConsolePreferencesState = {
  /** Merchant hears Vietnamese TTS pings when AI secures bookings/orders. */
  audioAlertsEnabled: boolean;
  /** Wholesale slips queued to print station (mock until hardware bridge). */
  wholesaleAutoPrint: boolean;
  setAudioAlertsEnabled: (value: boolean) => void;
  setWholesaleAutoPrint: (value: boolean) => void;
};

export const useB2bConsolePreferencesStore = create<B2bConsolePreferencesState>((set) => ({
  audioAlertsEnabled: true,
  wholesaleAutoPrint: false,
  setAudioAlertsEnabled: (audioAlertsEnabled) => set({ audioAlertsEnabled }),
  setWholesaleAutoPrint: (wholesaleAutoPrint) => set({ wholesaleAutoPrint }),
}));
