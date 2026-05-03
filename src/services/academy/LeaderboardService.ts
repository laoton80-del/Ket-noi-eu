export type KidsLeaderboardRow = Readonly<{
  rank: number;
  nickname: string;
  cityLabel: string;
  avatarEmoji: string;
  vietKidsPoints: number;
}>;

export type KidsLeaderboardSnapshot = Readonly<{
  rows: readonly KidsLeaderboardRow[];
  generatedAtIso: string;
  periodKey: string;
  checksum: string;
  stale: boolean;
}>;

const PAYMENTS_API_BASE = process.env.EXPO_PUBLIC_PAYMENTS_API_BASE?.trim() ?? '';

const COUNTRY_CITY_POOL: Readonly<Record<string, readonly string[]>> = {
  DE: ['Berlin', 'Munich', 'Hamburg', 'Leipzig'],
  CZ: ['Praha', 'Brno', 'Ostrava', 'Plzen'],
  JP: ['Tokyo', 'Osaka', 'Nagoya', 'Saitama'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  US: ['San Jose', 'Houston', 'Seattle', 'Boston'],
};

const CHILD_NAMES = [
  'Bé Ken',
  'Bé Bông',
  'Bé Na',
  'Bé Bin',
  'Bé Sóc',
  'Bé Mít',
  'Bé Miu',
  'Bé Mộc',
  'Bé Khoa',
  'Bé Gạo',
] as const;

const AVATARS = ['🧒', '👧', '🦊', '🐼', '🐯', '🐨', '🐻'] as const;

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Local weekly ranking mock for Viet-Kids.
 * Privacy: only nickname + city + avatar emoji are exposed.
 */
export function getLocalKidsRanking(countryCode: string): readonly KidsLeaderboardRow[] {
  const cc = countryCode.trim().toUpperCase();
  const cities = COUNTRY_CITY_POOL[cc] ?? ['Global City'];
  const baseSeed = hashSeed(cc || 'GLOBAL');

  const rows: KidsLeaderboardRow[] = Array.from({ length: 50 }).map((_, index) => {
    const name = CHILD_NAMES[(baseSeed + index * 3) % CHILD_NAMES.length] ?? 'Bé Sao';
    const city = cities[(baseSeed + index) % cities.length] ?? 'Global City';
    const avatarEmoji = AVATARS[(baseSeed + index * 2) % AVATARS.length] ?? '🧒';
    const swing = ((baseSeed + index * 13) % 32) * 3;
    const vietKidsPoints = Math.max(120, 2200 - index * 35 - swing);
    return {
      rank: index + 1,
      nickname: name,
      cityLabel: city,
      avatarEmoji,
      vietKidsPoints,
    };
  });

  return rows
    .sort((a, b) => b.vietKidsPoints - a.vietKidsPoints)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));
}

function weekKeyUtc(now = new Date()): string {
  const y = now.getUTCFullYear();
  const day = now.getUTCDay() || 7;
  const date = now.getUTCDate() - day + 1;
  const monday = new Date(Date.UTC(y, now.getUTCMonth(), date));
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(
    monday.getUTCDate()
  ).padStart(2, '0')}`;
}

function checksumRows(rows: readonly KidsLeaderboardRow[]): string {
  const raw = rows.slice(0, 8).map((row) => `${row.rank}-${row.nickname}-${row.vietKidsPoints}`).join('|');
  let sum = 0;
  for (let i = 0; i < raw.length; i += 1) sum = (sum + raw.charCodeAt(i) * (i + 1)) % 1_000_003;
  return `k${sum}`;
}

type LeaderboardApiResponse = Readonly<{
  rows?: readonly KidsLeaderboardRow[];
  generatedAtIso?: string;
  periodKey?: string;
  checksum?: string;
}>;

export async function getLocalKidsRankingSnapshot(countryCode: string): Promise<KidsLeaderboardSnapshot> {
  const cc = countryCode.trim().toUpperCase();
  const fallbackRows = getLocalKidsRanking(cc);
  if (!PAYMENTS_API_BASE) {
    return {
      rows: fallbackRows,
      generatedAtIso: new Date().toISOString(),
      periodKey: weekKeyUtc(),
      checksum: checksumRows(fallbackRows),
      stale: true,
    };
  }
  try {
    const res = await fetch(
      `${PAYMENTS_API_BASE}/academy/vietkids/leaderboard?country=${encodeURIComponent(cc)}&period=weekly`,
      { method: 'GET', headers: { Accept: 'application/json' } }
    );
    if (!res.ok) {
      return {
        rows: fallbackRows,
        generatedAtIso: new Date().toISOString(),
        periodKey: weekKeyUtc(),
        checksum: checksumRows(fallbackRows),
        stale: true,
      };
    }
    const data = (await res.json()) as LeaderboardApiResponse;
    const rows = Array.isArray(data.rows) && data.rows.length > 0 ? data.rows.slice(0, 50) : fallbackRows;
    return {
      rows,
      generatedAtIso: typeof data.generatedAtIso === 'string' ? data.generatedAtIso : new Date().toISOString(),
      periodKey: typeof data.periodKey === 'string' ? data.periodKey : weekKeyUtc(),
      checksum: typeof data.checksum === 'string' ? data.checksum : checksumRows(rows),
      stale: !Array.isArray(data.rows),
    };
  } catch {
    return {
      rows: fallbackRows,
      generatedAtIso: new Date().toISOString(),
      periodKey: weekKeyUtc(),
      checksum: checksumRows(fallbackRows),
      stale: true,
    };
  }
}
