/**
 * V7.0 Omniverse — interactive **zero-friction demo** choreography (Navy / Imperial Gold / Platinum).
 * Coordinates copy, spotlight hints, and optional navigation targets for {@link DemoTourOverlay}.
 */

import * as Speech from 'expo-speech';

export type V7DemoStepId = 'welcome_hub' | 'local_b2b' | 'travel_platinum' | 'academy_audio';

export type V7DemoStep = Readonly<{
  id: V7DemoStepId;
  title: string;
  subtitle: string;
  /** Normalized spotlight center (0–1) — bottom tab wallet/SOS region vs map region, etc. */
  pulse: Readonly<{ x: number; y: number; r: number }>;
  /** Optional tab to focus when step becomes active (B2C shell). */
  tabTarget?: 'TabHome' | 'TabLocal' | 'TabTravel' | 'TabAi';
}>;

/**
 * Cinematic storyboard — 4 beats across Hub, Local B2B, Travel (Platinum aura), Academy.
 */
export const V7_DEMO_SEQUENCE: readonly V7DemoStep[] = [
  {
    id: 'welcome_hub',
    title: 'Welcome to VIONA Hub',
    subtitle:
      'Your Wallet (VIO Credits) and the SOS Shield live here — tap Wallet for balance, hold the lifeline for emergency.',
    pulse: { x: 0.5, y: 0.88, r: 0.14 },
    tabTarget: 'TabHome',
  },
  {
    id: 'local_b2b',
    title: 'Explore Local B2B',
    subtitle: 'Discover a mock Nail Salon — Leona AI can hold the conversation and lock a booking slot for guests.',
    pulse: { x: 0.35, y: 0.42, r: 0.16 },
    tabTarget: 'TabLocal',
  },
  {
    id: 'travel_platinum',
    title: 'Travel Universe',
    subtitle: 'Platinum Light Mode — immersive 3D map aura for your journey. Feel the cool neon + gold navigation shell.',
    pulse: { x: 0.5, y: 0.35, r: 0.2 },
    tabTarget: 'TabTravel',
  },
  {
    id: 'academy_audio',
    title: 'Academy',
    subtitle: 'Cô Giáo AI — a short voice sample (offline TTS) introduces the learning lane.',
    pulse: { x: 0.72, y: 0.88, r: 0.12 },
    tabTarget: 'TabAi',
  },
];

const ACADEMY_MOCK_LINE_VI =
  'Xin chào! Tôi là Cô Giáo AI VIONA. Chào mừng bạn đến Học viện — đây là bản demo năm giây.';

let academySpeechToken = 0;

/**
 * Plays a ~5s Academy cue using on-device TTS (no cloud). Safe to call multiple times; previous speech is cancelled.
 */
export function playAcademyMockAudio(): Promise<void> {
  return new Promise((resolve) => {
    academySpeechToken += 1;
    const token = academySpeechToken;
    try {
      Speech.stop();
    } catch {
      /* noop */
    }
    Speech.speak(ACADEMY_MOCK_LINE_VI, {
      language: 'vi-VN',
      pitch: 1.0,
      rate: 0.92,
      onDone: () => {
        if (token === academySpeechToken) resolve();
      },
      onStopped: () => {
        if (token === academySpeechToken) resolve();
      },
      onError: () => {
        if (token === academySpeechToken) resolve();
      },
    });
    /** Failsafe: resolve after 5s even if TTS stalls (device policy). */
    setTimeout(() => {
      if (token === academySpeechToken) resolve();
    }, 5_200);
  });
}

export function stopAcademyMockAudio(): void {
  academySpeechToken += 1;
  try {
    Speech.stop();
  } catch {
    /* noop */
  }
}
