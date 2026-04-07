import { resolveVoicePersona } from './voice';
import { getAssistantSettings } from '../state/assistantSettings';

type LeonaVoicePayload = {
  assistant: 'Leona';
  user_text: string;
  locale?: string;
  country_code?: string;
  human_fillers: boolean;
  response_delay: number;
  /** Resolved persona for backend TTS / telephony (no hardcoded voice ids in callers). */
  voice_profile: {
    persona_key: string;
    gender: string;
    tone: string;
    language: string;
    voice_id: string;
    speaking_rate: number;
    pitch_style: string;
    filler_style: string;
    hesitation_style: string;
  };
};

export function buildLeonaPayload(input: {
  userText: string;
  locale?: string;
  countryCode?: string;
  humanSimulation?: boolean;
}): LeonaVoicePayload {
  const settings = getAssistantSettings();
  const humanSimulation = input.humanSimulation ?? settings.humanSimulation;
  const lang = input.locale ?? 'en';
  const vp = resolveVoicePersona({
    mode: 'leona_outbound',
    scenario: 'leona_outbound',
    language: lang,
    userGender: 'unknown',
  });

  return {
    assistant: 'Leona',
    user_text: input.userText,
    locale: input.locale,
    country_code: input.countryCode,
    // Logic "Tang hinh": bo sung fillers + delay de giong nguoi that hon.
    human_fillers: humanSimulation,
    response_delay: humanSimulation ? 700 : 0,
    voice_profile: {
      persona_key: vp.personaKey,
      gender: vp.gender,
      tone: vp.tone,
      language: vp.language,
      voice_id: vp.voiceId,
      speaking_rate: vp.speakingRate,
      pitch_style: vp.pitchStyle,
      filler_style: vp.fillerStyle,
      hesitation_style: vp.hesitationStyle,
    },
  };
}

export async function callLeonaVoiceApi(input: {
  userText: string;
  locale?: string;
  countryCode?: string;
}) {
  const payload = buildLeonaPayload(input);

  // TODO: thay endpoint that cua ban
  return fetch('https://api.example.com/voice/leona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
