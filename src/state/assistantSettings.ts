import { useSyncExternalStore } from 'react';

export type AssistantMode = 'leona' | 'loan';

/** TTS voice gender for the in-app CSKH assistant (persona `loan` / Minh Khang). */
export type LoanAssistantVoiceGender = 'female' | 'male';

export type AssistantSettingsState = {
  assistantMode: AssistantMode;
  languageCode: string;
  humanSimulation: boolean;
  /** OpenAI TTS catalog gender for Minh Khang paths (voice / interpreter). Default female preserves prior default. */
  loanAssistantVoiceGender: LoanAssistantVoiceGender;
};

let assistantSettings: AssistantSettingsState = {
  assistantMode: 'leona',
  languageCode: 'vi',
  humanSimulation: true,
  loanAssistantVoiceGender: 'female',
};
const listeners = new Set<() => void>();

export function getAssistantSettings(): AssistantSettingsState {
  return assistantSettings;
}

export function setAssistantSettings(partial: Partial<AssistantSettingsState>): AssistantSettingsState {
  assistantSettings = { ...assistantSettings, ...partial };
  listeners.forEach((listener) => listener());
  return assistantSettings;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAssistantSettings(): AssistantSettingsState {
  return useSyncExternalStore(subscribe, getAssistantSettings, getAssistantSettings);
}
