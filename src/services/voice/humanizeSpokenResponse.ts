import { getRealismLanguagePack, phaseFillerWeight } from './realismLanguagePacks';
import type { HumanizeSpokenResponseInput, HumanizeSpokenResponseResult } from './realismTypes';

export function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(31, h) + input.charCodeAt(i)!;
    h |= 0;
  }
  return Math.abs(h);
}

function pickDeterministic<T>(arr: T[], seed: number): T {
  if (arr.length === 0) throw new Error('empty_pick');
  return arr[seed % arr.length]!;
}

function pickLive<T>(arr: T[], rng: () => number): T {
  if (arr.length === 0) throw new Error('empty_pick');
  return arr[Math.floor(rng() * arr.length)]!;
}

function makeRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Split into rough sentences for chunk counting / shortening. */
function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Light simplification for clarify / fallback: fewer clauses.
 */
function maybeShorten(text: string, phase: HumanizeSpokenResponseInput['dialoguePhase'], realismLevel: HumanizeSpokenResponseInput['realismLevel']): { text: string; shortened: boolean } {
  if (realismLevel === 'off' || realismLevel === 'low') return { text, shortened: false };
  if (phase !== 'clarify' && phase !== 'fallback') return { text, shortened: false };
  const s = sentencesOf(text);
  if (s.length <= 2 || text.length < 200) return { text, shortened: false };
  return { text: s.slice(0, 2).join(' '), shortened: true };
}

/**
 * Insert one micro-pause after the second comma-separated clause when text is long.
 */
function insertMicroPauses(text: string, language: string, maxMarkers: number): { text: string; count: number } {
  const pack = getRealismLanguagePack(language);
  if (maxMarkers <= 0 || text.length < 140) return { text, count: 0 };
  const parts = text.split(', ');
  if (parts.length < 3) return { text, count: 0 };
  const head = parts.slice(0, 2).join(', ');
  const tail = parts.slice(2).join(', ');
  return { text: `${head}${pack.clausePause}${tail}`, count: 1 };
}

/**
 * Post-process AI text before TTS — fillers, pauses, optional shortening.
 * Does not call network; safe on main thread.
 */
export function humanizeSpokenResponse(input: HumanizeSpokenResponseInput): HumanizeSpokenResponseResult {
  const raw = input.rawText.replace(/\s+/g, ' ').trim();
  if (!raw) {
    return {
      spokenText: '',
      humanizationMeta: {
        appliedFiller: false,
        appliedDelayMs: 0,
        appliedChunks: 0,
        pauseMarkersInserted: 0,
      },
    };
  }

  if (input.realismLevel === 'off') {
    return {
      spokenText: raw,
      humanizationMeta: {
        appliedFiller: false,
        appliedDelayMs: 0,
        appliedChunks: sentencesOf(raw).length,
        pauseMarkersInserted: 0,
      },
    };
  }

  const seedBase = input.deterministicSeed ?? `${input.dialoguePhase}|${input.tone}|${input.language}|${raw}`;
  const seed = stableHash(seedBase);
  const rng = input.engineMode === 'deterministic' ? makeRng(seed) : () => Math.random();

  const pack = getRealismLanguagePack(input.language);
  const slot = phaseFillerWeight(input.dialoguePhase);
  const pool = slot === 'hesitation' ? pack.hesitation : slot === 'softening' ? pack.softening : pack.fillers;

  let spoken = raw;
  let appliedFiller = false;
  let pauseMarkersInserted = 0;

  const short = maybeShorten(spoken, input.dialoguePhase, input.realismLevel);
  spoken = short.text;

  const maxPause = input.realismLevel === 'high' ? 2 : input.realismLevel === 'medium' ? 1 : 0;
  const paused = insertMicroPauses(spoken, input.language, maxPause);
  spoken = paused.text;
  pauseMarkersInserted = paused.count;

  const shouldLeadFiller =
    input.realismLevel !== 'low' &&
    input.dialoguePhase !== 'confirm' &&
    input.tone !== 'formal' &&
    input.tone !== 'urgent';

  if (shouldLeadFiller && pool.length > 0) {
    const filler = input.engineMode === 'deterministic' ? pickDeterministic(pool, seed) : pickLive(pool, rng);
    if (!spoken.toLowerCase().startsWith(filler.toLowerCase().slice(0, 3))) {
      spoken = `${filler} ${spoken}`.replace(/\s+/g, ' ').trim();
      appliedFiller = true;
    }
  }

  let delayMs = 0;
  if (input.dialoguePhase === 'clarify' || input.dialoguePhase === 'fallback') {
    delayMs = input.engineMode === 'deterministic' ? 120 + (seed % 80) : 120 + Math.floor(rng() * 120);
  } else if (input.dialoguePhase === 'greeting') {
    delayMs = input.engineMode === 'deterministic' ? 40 + (seed % 40) : 40 + Math.floor(rng() * 60);
  }

  const chunks = sentencesOf(spoken).length || 1;

  return {
    spokenText: spoken,
    humanizationMeta: {
      appliedFiller,
      appliedDelayMs: delayMs,
      appliedChunks: chunks,
      pauseMarkersInserted,
    },
  };
}
