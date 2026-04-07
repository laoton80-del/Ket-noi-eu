import type { B2BBookingSlotState } from '../../../domain/b2b';
import type { B2BBusinessType } from '../../../domain/b2b/models';
import { requiredBookingSlotKeys, type B2BBookingSlotKey } from '../../../domain/b2b/b2bVerticalBridge';

/** Strip caller/assistant labels from STT bridge lines. */
export function stripRolePrefix(line: string): string {
  return line.replace(/^\s*Caller:\s*/i, '').replace(/^\s*Assistant:\s*/i, '').trim();
}

function mergeField(prev: string | undefined, next: string | undefined): string | undefined {
  if (next != null && String(next).trim().length > 0) return String(next).trim();
  return prev;
}

export function mergeSlotState(prev: B2BBookingSlotState, patch: Partial<B2BBookingSlotState>): B2BBookingSlotState {
  return {
    service: mergeField(prev.service, patch.service),
    time: mergeField(prev.time, patch.time),
    name: mergeField(prev.name, patch.name),
    stayCheckIn: mergeField(prev.stayCheckIn, patch.stayCheckIn),
    stayCheckOut: mergeField(prev.stayCheckOut, patch.stayCheckOut),
    occupancy: mergeField(prev.occupancy, patch.occupancy),
  };
}

function slotValue(s: B2BBookingSlotState, key: B2BBookingSlotKey): string | undefined {
  switch (key) {
    case 'service':
      return s.service;
    case 'time':
      return s.time;
    case 'name':
      return s.name;
    case 'stayCheckIn':
      return s.stayCheckIn;
    case 'stayCheckOut':
      return s.stayCheckOut;
    case 'occupancy':
      return s.occupancy;
  }
}

export function missingBookingSlots(bt: B2BBusinessType, s: B2BBookingSlotState): B2BBookingSlotKey[] {
  return requiredBookingSlotKeys(bt).filter((k) => !String(slotValue(s, k) ?? '').trim());
}

export function allBookingSlotsFilled(bt: B2BBusinessType, s: B2BBookingSlotState): boolean {
  return missingBookingSlots(bt, s).length === 0;
}

/** Deterministic extraction — conservative; NLU can pre-fill via session.extractedPayload elsewhere. */
export function extractSlotsFromUtterance(raw: string): Partial<B2BBookingSlotState> {
  const text = stripRolePrefix(raw).trim();
  if (!text) return {};

  const out: Partial<B2BBookingSlotState> = {};

  const namePatterns: RegExp[] = [
    /(?:my name is|i'?m\s+called|i am|call me|tên\s*(?:là|of|is))\s*[:\-]?\s*([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s'.-]{1,48})/iu,
    /(?:jmenuji se|jméno je)\s+([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s'.-]{1,48})/iu,
  ];
  for (const re of namePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      out.name = m[1].trim();
      break;
    }
  }

  const timePatterns: RegExp[] = [
    /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/i,
    /\b(\d{1,2}\s*(?:am|pm))\b/i,
    /\b(?:tomorrow|today|tonight|mai|hôm nay|ngày mai)\b[^.!?]*(?:\d{1,2}\s*(?:giờ|h|:))?\s*/iu,
    /\b(?:lúc|at|@)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|giờ)?)\b/iu,
    /\b(?:morning|afternoon|evening|chiều|sáng|tối)\b/iu,
  ];
  for (const re of timePatterns) {
    const m = text.match(re);
    if (m?.[0]) {
      out.time = m[0].replace(/\s+/g, ' ').trim();
      break;
    }
  }
  if (!out.time && /\b\d{1,2}:\d{2}\b/.test(text)) {
    const m = text.match(/\b\d{1,2}:\d{2}\b/);
    if (m) out.time = m[0];
  }

  const servicePatterns: RegExp[] = [
    /(?:book|booking|đặt|appointment|reservation|service)\s+(?:for|a|an|the)?\s*([^.!?\n]{2,60})/iu,
    /(?:mani|manicure|gel|nails|pedicure|haircut|massage|facial|table|party|chỗ|dịch vụ)\s*[a-zA-ZÀ-ỹ0-9\s]*/iu,
  ];
  for (const re of servicePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const cand = m[1].trim();
      if (cand.length >= 2 && !/^\d+$/.test(cand)) {
        out.service = cand.replace(/\s+/g, ' ');
        break;
      }
    }
  }
  if (!out.service) {
    const m2 = text.match(
      /\b(manicure|pedicure|gel|nails|haircut|massage|facial|table|appointment)\b/i
    );
    if (m2?.[1]) out.service = m2[1];
  }

  const isoRange = text.match(
    /\b(20\d{2}-\d{2}-\d{2})\b.*\b(20\d{2}-\d{2}-\d{2})\b/
  );
  if (isoRange) {
    out.stayCheckIn = out.stayCheckIn ?? isoRange[1];
    out.stayCheckOut = out.stayCheckOut ?? isoRange[2];
  }
  const stayIn =
    text.match(/\b(?:check[-\s]?in|nhận\s*phòng|ở\s*từ)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|[^\n,.]{3,40})/iu) ??
    text.match(/\b(?:từ\s*ngày|from)\s+(\d{1,2}[./]\d{1,2}|[^\n,.]{3,36})/iu);
  if (stayIn?.[1]) out.stayCheckIn = out.stayCheckIn ?? stayIn[1].trim();
  const stayOut =
    text.match(/\b(?:check[-\s]?out|trả\s*phòng|đến\s*ngày|until)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|[^\n,.]{3,40})/iu);
  if (stayOut?.[1]) out.stayCheckOut = out.stayCheckOut ?? stayOut[1].trim();

  const occ =
    text.match(
      /\b(\d+\s*(?:adults?|người lớn|trẻ em|children|kids?)[^\n,.]{0,40})/iu
    ) ?? text.match(/\b(\d+\s*(?:khách|guests?))\b/iu);
  if (occ?.[1]) out.occupancy = occ[1].replace(/\s+/g, ' ').trim();

  return out;
}

export type ConfirmationParse = 'yes' | 'no' | 'unknown';

/** Yes/no for summary step (vi + en + cs). */
export function parseConfirmationUtterance(raw: string): ConfirmationParse {
  const t = stripRolePrefix(raw).trim().toLowerCase();
  if (!t) return 'unknown';

  if (
    /^(yes|yeah|yep|ok|okay|correct|right|sure|đúng|vâng|dạ|ừ|oke|jasně|ano)$/iu.test(t) ||
    /\b(đúng rồi|chính xác|xác nhận|potvrzuji)\b/iu.test(t)
  ) {
    return 'yes';
  }
  if (
    /^(no|nope|nah|wrong|cancel|không|ne)$/iu.test(t) ||
    /\b(chưa đúng|sai rồi|không phải)\b/iu.test(t)
  ) {
    return 'no';
  }
  return 'unknown';
}
