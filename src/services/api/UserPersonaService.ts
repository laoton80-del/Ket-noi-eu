import { getPrisma } from '../../lib/prisma';

const ALLOWED = new Set(['EXPAT', 'TOURIST']);

export type PatchPersonaResult =
  | Readonly<{ ok: true; persona: string }>
  | Readonly<{ ok: false; reason: 'invalid_persona' | 'not_found' }>;

export async function patchUserPersona(userId: string, personaRaw: string): Promise<PatchPersonaResult> {
  const persona = personaRaw.trim().toUpperCase();
  if (!ALLOWED.has(persona)) {
    return { ok: false, reason: 'invalid_persona' };
  }
  try {
    await getPrisma().user.update({
      where: { id: userId },
      data: { persona },
    });
    return { ok: true, persona };
  } catch {
    return { ok: false, reason: 'not_found' };
  }
}
