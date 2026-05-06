/**
 * Deterministic “Leona” scheduling rules for the B2B booking dashboard (no raw LLM JSON in UI).
 */
import type { ServiceTagId, TimelineBlock, WaitlistEntry } from '../../../screens/b2b/b2bBookingTypes';

export type InboundBookingIntent = Readonly<{
  id: string;
  clientName: string;
  tag: ServiceTagId;
  priceLabel: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}>;

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function intervalsOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

/**
 * First tech column (0→2) with no overlap for `[start,end)`; `null` if all busy.
 */
export function findFirstFreeTech(
  blocks: readonly TimelineBlock[],
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): 0 | 1 | 2 | null {
  const ns = toMinutes(startHour, startMinute);
  const ne = toMinutes(endHour, endMinute);
  if (ne <= ns) return null;

  for (const tech of [0, 1, 2] as const) {
    const onTech = blocks.filter((b) => b.techIndex === tech);
    const clash = onTech.some((b) => {
      const bs = toMinutes(b.startHour, b.startMinute);
      const be = toMinutes(b.endHour, b.endMinute);
      return intervalsOverlap(ns, ne, bs, be);
    });
    if (!clash) return tech;
  }
  return null;
}

export type LeonaRoutingResult =
  | Readonly<{
      kind: 'confirmed';
      techIndex: 0 | 1 | 2;
      timeline: TimelineBlock;
      waitlist: WaitlistEntry;
      staffNoticeVi: string;
    }>
  | Readonly<{
      kind: 'waiting';
      waitlist: WaitlistEntry;
      staffNoticeVi: string;
    }>;

/** Polite Vietnamese line for staff HUD — never includes JSON. */
export function routeInboundIntent(
  intent: InboundBookingIntent,
  existingBlocks: readonly TimelineBlock[]
): LeonaRoutingResult {
  const tech = findFirstFreeTech(
    existingBlocks,
    intent.startHour,
    intent.startMinute,
    intent.endHour,
    intent.endMinute
  );

  if (tech != null) {
    const timeline: TimelineBlock = {
      id: `tl_${intent.id}`,
      techIndex: tech,
      clientName: intent.clientName.split(/\s+/).pop() ?? intent.clientName,
      status: 'confirmed',
      tag: intent.tag,
      startHour: intent.startHour,
      startMinute: intent.startMinute,
      endHour: intent.endHour,
      endMinute: intent.endMinute,
    };
    const waitlist: WaitlistEntry = {
      id: `wl_${intent.id}`,
      clientName: intent.clientName,
      status: 'confirmed',
      tags: [intent.tag],
      priceLabel: intent.priceLabel,
    };
    return {
      kind: 'confirmed',
      techIndex: tech,
      timeline,
      waitlist,
      staffNoticeVi: `Leona: Đã xếp ${intent.clientName} vào Tech ${tech + 1} — đã xác nhận.`,
    };
  }

  const waitlist: WaitlistEntry = {
    id: `wl_${intent.id}`,
    clientName: intent.clientName,
    status: 'waiting',
    tags: [intent.tag],
    priceLabel: intent.priceLabel,
  };
  return {
    kind: 'waiting',
    waitlist,
    staffNoticeVi: `Leona: ${intent.clientName} đang chờ — khung giờ trùng toàn bộ kỹ thuật viên.`,
  };
}
