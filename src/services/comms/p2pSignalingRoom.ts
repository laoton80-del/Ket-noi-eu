/**
 * Canonical P2P signaling room ids: `vg|<userIdLow>|<userIdHigh>` with lexicographic order on user ids.
 * Server only allows join when JWT `sub` matches one of the two participants (no free-form rooms).
 */

const PREFIX = 'vg|' as const;

/** Build the room string both peers must use (sorted ids). */
export function buildP2PSignalingRoomId(userIdA: string, userIdB: string): string {
  const a = userIdA.trim();
  const b = userIdB.trim();
  if (!a || !b) {
    throw new Error('p2p_room_ids_required');
  }
  if (a.includes('|') || b.includes('|')) {
    throw new Error('p2p_room_id_invalid_char');
  }
  const [low, high] = a <= b ? [a, b] : [b, a];
  return `${PREFIX}${low}|${high}`;
}

export type ParsedP2PRoom = Readonly<{ low: string; high: string }>;

/** Parse and validate canonical shape + sorted order. */
export function parseP2PSignalingRoom(roomId: string): ParsedP2PRoom | null {
  const trimmed = roomId.trim();
  if (!trimmed.startsWith(PREFIX)) return null;
  const rest = trimmed.slice(PREFIX.length);
  const parts = rest.split('|');
  if (parts.length !== 2) return null;
  const [low, high] = parts.map((p) => p.trim());
  if (!low || !high || low.includes('|') || high.includes('|')) return null;
  if (low >= high) return null;
  return { low, high };
}

export function userBelongsToP2PRoom(userId: string, roomId: string): boolean {
  const p = parseP2PSignalingRoom(roomId);
  if (!p) return false;
  return userId === p.low || userId === p.high;
}
