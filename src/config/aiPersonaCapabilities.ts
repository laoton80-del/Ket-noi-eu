export type AiPersonaId = 'leona' | 'minh_khang' | 'ai_teacher' | 'b2b_receptionist';

export type AiPersonaCapability = Readonly<{
  voice: boolean;
  vision: boolean;
  bookingActions: boolean;
  legalAdjacency: boolean;
  b2bOps: boolean;
  telemetryTag: string;
}>;

export const AI_PERSONA_CAPABILITY_MAP: Readonly<Record<AiPersonaId, AiPersonaCapability>> = {
  leona: {
    voice: true,
    vision: false,
    bookingActions: true,
    legalAdjacency: false,
    b2bOps: false,
    telemetryTag: 'persona_leona',
  },
  minh_khang: {
    voice: true,
    vision: true,
    bookingActions: false,
    legalAdjacency: true,
    b2bOps: false,
    telemetryTag: 'persona_minh_khang',
  },
  ai_teacher: {
    voice: true,
    vision: true,
    bookingActions: false,
    legalAdjacency: false,
    b2bOps: false,
    telemetryTag: 'persona_ai_teacher',
  },
  b2b_receptionist: {
    voice: true,
    vision: false,
    bookingActions: true,
    legalAdjacency: false,
    b2bOps: true,
    telemetryTag: 'persona_b2b_receptionist',
  },
};

export function getPersonaCapability(persona: AiPersonaId): AiPersonaCapability {
  return AI_PERSONA_CAPABILITY_MAP[persona];
}

