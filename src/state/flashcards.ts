import { useSyncExternalStore } from 'react';
import type { VisionResultPayload } from '../api/visionPipeline';

export type FlashcardItem = {
  id: string;
  prompt: string;
  meaning: string;
  knowledge: string;
  createdAt: string;
};

type FlashcardState = {
  cards: FlashcardItem[];
};

let state: FlashcardState = {
  cards: [],
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): FlashcardState {
  return state;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addFlashcardFromVision(payload: VisionResultPayload): FlashcardItem {
  const next: FlashcardItem = {
    id: makeId(),
    prompt: payload.dichDe,
    meaning: payload.dichDe,
    knowledge: payload.kienThuc,
    createdAt: new Date().toISOString(),
  };
  state = { ...state, cards: [next, ...state.cards] };
  emit();
  return next;
}

export function useFlashcardState(): FlashcardState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

