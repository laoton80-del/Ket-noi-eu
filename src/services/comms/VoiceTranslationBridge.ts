/**
 * Hook points for the future AI Voice Translator: tap local/remote MediaStreams
 * before they reach the peer or speaker — no server-side audio relay (P2P preserved).
 */

import type { MediaStream } from 'react-native-webrtc';

export type VoiceTranslationBridge = Readonly<{
  attachLocalStream: (stream: MediaStream) => void;
  attachRemoteStream: (stream: MediaStream) => void;
  dispose: () => void;
}>;

/** Default no-op bridge; replace with STT/translate/TTS pipeline when product-ready. */
export function createVoiceTranslationBridge(): VoiceTranslationBridge {
  let local: MediaStream | null = null;
  let remote: MediaStream | null = null;

  return {
    attachLocalStream(stream: MediaStream) {
      local = stream;
      if (__DEV__) {
        const n = stream.getTracks().length;
        console.info('[VoiceTranslationBridge] local stream attached', { tracks: n });
      }
    },
    attachRemoteStream(stream: MediaStream) {
      remote = stream;
      if (__DEV__) {
        const n = stream.getTracks().length;
        console.info('[VoiceTranslationBridge] remote stream attached', { tracks: n });
      }
    },
    dispose() {
      local = null;
      remote = null;
    },
  };
}
