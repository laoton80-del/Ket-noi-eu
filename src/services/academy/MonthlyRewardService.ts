export type MonthlyWinner = Readonly<{
  rank: 1 | 2 | 3;
  monthKey: string;
  countryCode: string;
  parentId: string;
  childNickname: string;
  cityLabel: string;
  avatarEmoji: string;
  vietKidsMonthlyPoints: number;
  rewardVigTokens: number;
  achievementLabel: string;
}>;

const REWARD_BY_RANK: Readonly<Record<1 | 2 | 3, number>> = {
  1: 5000,
  2: 3000,
  3: 1000,
};

const MONTHLY_ROWS_BY_COUNTRY: Readonly<Record<string, readonly Omit<MonthlyWinner, 'monthKey' | 'rewardVigTokens' | 'achievementLabel'>[]>> = {
  DE: [
    { rank: 1, countryCode: 'DE', parentId: 'parent_de_ken', childNickname: 'Bé Ken', cityLabel: 'Berlin', avatarEmoji: '🧒', vietKidsMonthlyPoints: 9320 },
    { rank: 2, countryCode: 'DE', parentId: 'parent_de_bong', childNickname: 'Bé Bông', cityLabel: 'Munich', avatarEmoji: '👧', vietKidsMonthlyPoints: 8640 },
    { rank: 3, countryCode: 'DE', parentId: 'parent_de_soc', childNickname: 'Bé Sóc', cityLabel: 'Hamburg', avatarEmoji: '🦊', vietKidsMonthlyPoints: 8035 },
  ],
  CZ: [
    { rank: 1, countryCode: 'CZ', parentId: 'parent_cz_na', childNickname: 'Bé Na', cityLabel: 'Praha', avatarEmoji: '👧', vietKidsMonthlyPoints: 9110 },
    { rank: 2, countryCode: 'CZ', parentId: 'parent_cz_bin', childNickname: 'Bé Bin', cityLabel: 'Brno', avatarEmoji: '🧒', vietKidsMonthlyPoints: 8480 },
    { rank: 3, countryCode: 'CZ', parentId: 'parent_cz_mit', childNickname: 'Bé Mít', cityLabel: 'Ostrava', avatarEmoji: '🐼', vietKidsMonthlyPoints: 7890 },
  ],
};

const PAYMENTS_API_BASE = process.env.EXPO_PUBLIC_PAYMENTS_API_BASE?.trim() ?? '';

function currentMonthKey(nowDateInput?: Date): string {
  const now = nowDateInput ?? new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function seedRows(countryCode: string, monthKey: string): MonthlyWinner[] {
  const cc = countryCode.trim().toUpperCase();
  const base = MONTHLY_ROWS_BY_COUNTRY[cc] ?? MONTHLY_ROWS_BY_COUNTRY.DE;
  return base.map((row) => {
    const rewardVigTokens = REWARD_BY_RANK[row.rank];
    return {
      ...row,
      monthKey,
      rewardVigTokens,
      achievementLabel: row.rank === 1 ? 'Bé Giỏi Tiếng Việt Nhất Tháng' : `Top ${row.rank} Học Tiếng Việt Tháng`,
    };
  });
}

/**
 * Server-only operation contract for scheduled winner payout processing.
 * IMPORTANT: must execute in trusted backend worker, never in app runtime.
 */
export async function processMonthlyWinners(countryCode: string, monthKey?: string): Promise<never> {
  void countryCode;
  void monthKey;
  throw new Error('monthly_winners_server_only');
}

type HallOfFameApiResponse = Readonly<{
  winners?: readonly MonthlyWinner[];
  generatedAtIso?: string;
  periodKey?: string;
  checksum?: string;
}>;

export type MonthlyHallOfFameSnapshot = Readonly<{
  winners: readonly MonthlyWinner[];
  generatedAtIso: string;
  periodKey: string;
  checksum: string;
  stale: boolean;
}>;

function checksumRows(rows: readonly MonthlyWinner[]): string {
  const raw = rows.map((row) => `${row.rank}-${row.parentId}-${row.vietKidsMonthlyPoints}`).join('|');
  let sum = 0;
  for (let i = 0; i < raw.length; i += 1) sum = (sum + raw.charCodeAt(i) * (i + 1)) % 999_983;
  return `mh${sum}`;
}

/**
 * Read-only hall-of-fame query for clients.
 * Falls back to deterministic seeded rows if backend endpoint is unavailable.
 */
export async function getMonthlyHallOfFame(
  countryCode: string,
  nowDateInput?: Date
): Promise<readonly MonthlyWinner[]> {
  const snapshot = await getMonthlyHallOfFameSnapshot(countryCode, nowDateInput);
  return snapshot.winners;
}

export async function getMonthlyHallOfFameSnapshot(
  countryCode: string,
  nowDateInput?: Date
): Promise<MonthlyHallOfFameSnapshot> {
  const cc = countryCode.trim().toUpperCase();
  const monthKey = currentMonthKey(nowDateInput);
  const fallbackRows = seedRows(cc, monthKey);
  if (!PAYMENTS_API_BASE) {
    return {
      winners: fallbackRows,
      generatedAtIso: new Date().toISOString(),
      periodKey: monthKey,
      checksum: checksumRows(fallbackRows),
      stale: true,
    };
  }
  try {
    const res = await fetch(
      `${PAYMENTS_API_BASE}/academy/vietkids/hall-of-fame?country=${encodeURIComponent(cc)}&month=${encodeURIComponent(monthKey)}`,
      { method: 'GET', headers: { Accept: 'application/json' } }
    );
    if (!res.ok) {
      return {
        winners: fallbackRows,
        generatedAtIso: new Date().toISOString(),
        periodKey: monthKey,
        checksum: checksumRows(fallbackRows),
        stale: true,
      };
    }
    const data = (await res.json()) as HallOfFameApiResponse;
    const winners = (!Array.isArray(data.winners) || data.winners.length === 0 ? fallbackRows : data.winners)
      .slice(0, 3)
      .map((winner, index) => ({
        ...winner,
        rank: (index + 1) as 1 | 2 | 3,
      }));
    return {
      winners,
      generatedAtIso: typeof data.generatedAtIso === 'string' ? data.generatedAtIso : new Date().toISOString(),
      periodKey: typeof data.periodKey === 'string' ? data.periodKey : monthKey,
      checksum: typeof data.checksum === 'string' ? data.checksum : checksumRows(winners),
      stale: !Array.isArray(data.winners),
    };
  } catch {
    return {
      winners: fallbackRows,
      generatedAtIso: new Date().toISOString(),
      periodKey: monthKey,
      checksum: checksumRows(fallbackRows),
      stale: true,
    };
  }
}
