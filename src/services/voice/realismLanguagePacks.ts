import type { DialoguePhase } from './realismTypes';

export type LanguagePackId = 'vi' | 'de' | 'cs' | 'en';

export type RealismLanguagePack = {
  id: LanguagePackId;
  fillers: string[];
  hesitation: string[];
  softening: string[];
  /** Prefer shorter sentences in formal contexts */
  formalityNote: 'compact' | 'standard' | 'deferential';
  /** Suggested pause token between clauses (TTS may strip or interpret). */
  clausePause: string;
};

const packs: Record<LanguagePackId, RealismLanguagePack> = {
  vi: {
    id: 'vi',
    fillers: ['à', 'ừm', 'để tôi xem', 'một chút nhé'],
    hesitation: ['ừm…', 'à…', 'để tôi…'],
    softening: ['xin lỗi nhé', 'bạn chờ chút', 'để mình kiểm tra'],
    formalityNote: 'deferential',
    clausePause: '… ',
  },
  de: {
    id: 'de',
    fillers: ['äh', 'also', 'genau', 'einen Moment'],
    hesitation: ['äh…', 'also…', 'moment…'],
    softening: ['einen Moment bitte', 'kurz', 'sorry'],
    formalityNote: 'standard',
    clausePause: ' — ',
  },
  cs: {
    id: 'cs',
    fillers: ['ehm', 'tak', 'jo', 'chvilku'],
    hesitation: ['ehm…', 'tak…', 'moment…'],
    softening: ['chvilku prosím', 'jen krátce', 'pardon'],
    formalityNote: 'compact',
    clausePause: ' … ',
  },
  en: {
    id: 'en',
    fillers: ['uh', 'hmm', 'well', 'let me check'],
    hesitation: ['uh…', 'hmm…', 'one moment…'],
    softening: ['sorry', 'one sec', 'just a moment'],
    formalityNote: 'standard',
    clausePause: ' … ',
  },
};

export function languageToPackId(language: string): LanguagePackId {
  const base = language.trim().toLowerCase().split(/[-_]/)[0] ?? 'en';
  if (base === 'vi') return 'vi';
  if (base === 'de') return 'de';
  if (base === 'cs' || base === 'sk') return 'cs';
  return 'en';
}

export function getRealismLanguagePack(language: string): RealismLanguagePack {
  return packs[languageToPackId(language)];
}

/** Phase-specific bias: which pack slot to prefer */
export function phaseFillerWeight(phase: DialoguePhase): 'hesitation' | 'softening' | 'fillers' {
  switch (phase) {
    case 'clarify':
    case 'fallback':
      return 'hesitation';
    case 'confirm':
    case 'close':
      return 'softening';
    default:
      return 'fillers';
  }
}
