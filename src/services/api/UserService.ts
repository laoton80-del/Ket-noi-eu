/**
 * GDPR Article 17 — Right to Erasure (server-side).
 * Permanently removes AI audit logs, vault blobs, travel rows, and anonymizes payment identifiers.
 */

import { createHash, randomBytes } from 'node:crypto';

import { Prisma, Role } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

/** E.164-safe unique surrogate (15 digits max after `+`). */
function erasedPhoneE164(userId: string): string {
  const hex = createHash('sha256').update(`gdpr_phone:${userId}`).digest('hex');
  const digits = hex.replace(/[^0-9]/g, '').padEnd(15, '0').slice(0, 15);
  return `+${digits}`;
}

function anonymizedStripePlaceholder(userId: string): string {
  const h = createHash('sha256').update(`stripe_erase:${userId}`).digest('hex').slice(0, 24);
  return `gdpr_erased_${h}`;
}

export type WipeUserDataResult = Readonly<
  { ok: true } | { ok: false; code: 'not_found' | 'forbidden_role' | 'active_merchant' | 'error'; message: string }
>;

/**
 * Irreversible GDPR wipe for the given user id (must match authenticated subject).
 */
export async function wipeUserData(userId: string): Promise<WipeUserDataResult> {
  const uid = userId.trim();
  if (uid.length === 0) {
    return { ok: false, code: 'error', message: 'userId required' };
  }

  const prisma = getPrisma();

  try {
    return await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: uid },
          select: { id: true, role: true },
        });
        if (!user) {
          return { ok: false, code: 'not_found', message: 'User not found' } as const;
        }
        if (user.role === Role.ADMIN) {
          return { ok: false, code: 'forbidden_role', message: 'Admin accounts cannot be erased via this endpoint' } as const;
        }

        const bizCount = await tx.business.count({ where: { ownerId: uid } });
        if (bizCount > 0) {
          return {
            ok: false,
            code: 'active_merchant',
            message: 'Offboard merchant businesses before account erasure',
          } as const;
        }

        await tx.aILog.deleteMany({ where: { userId: uid } });
        await tx.secureVault.deleteMany({ where: { userId: uid } });
        await tx.travelOrder.deleteMany({ where: { userId: uid } });
        await tx.piggyBank.deleteMany({
          where: { OR: [{ parentId: uid }, { childId: uid }] },
        });
        await tx.booking.deleteMany({ where: { userId: uid } });
        await tx.tourismBooking.deleteMany({ where: { userId: uid } });

        await tx.profile.updateMany({
          where: { userId: uid },
          data: {
            fullName: 'Deleted User',
            avatarUrl: null,
            country: 'XX',
            languageCode: 'vi',
          },
        });

        await tx.wallet.updateMany({
          where: { userId: uid },
          data: { stripeCustId: anonymizedStripePlaceholder(uid) },
        });

        const newPhone = erasedPhoneE164(uid);
        await tx.user.update({
          where: { id: uid },
          data: {
            phoneNumber: newPhone,
            pinCode: createHash('sha256').update(randomBytes(32)).digest('hex'),
            gdprErasedAt: new Date(),
            businessCategory: null,
            persona: 'EXPAT',
          },
        });

        return { ok: true } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 30_000,
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'transaction_failed';
    return { ok: false, code: 'error', message: msg };
  }
}
