/**
 * KNG Travel — flight offer discovery (mock).
 *
 * ## Integration roadmap (commission, no in-house IATA)
 * Production should integrate **Duffel** (Offers → Orders with partner settlement) or a **Skyscanner /
 * Travelpayouts-style affiliate** feed so KNG earns referral commission **without** holding IATA
 * certification or ticketing liability in-house. This module returns deterministic mock payloads so
 * product UI and cross-sell (homestay + Minh Khang) ship before API credentials.
 */

import type { Iso4217Code } from '../../config/globalLocalization';

export type FlightSegment = Readonly<{
  readonly depAirport: string;
  readonly arrAirport: string;
  readonly depLocal: string;
  readonly arrLocal: string;
}>;

export type FlightOffer = Readonly<{
  readonly id: string;
  readonly airline: string;
  readonly origin: string;
  readonly dest: string;
  readonly departureDate: string;
  readonly returnDate: string | null;
  readonly passengers: number;
  readonly outbound: FlightSegment;
  readonly inbound: FlightSegment | null;
  readonly stops: number;
  readonly cabin: 'Economy' | 'Premium Economy' | 'Business';
  /** Total for all passengers, in `priceCurrency`. */
  readonly priceTotal: number;
  readonly priceCurrency: Iso4217Code;
}>;

function hashSeed(parts: readonly string[]): number {
  const s = parts.join('|');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Rough EUR anchor → display currency (mock FX; replace with live rates from treasury service). */
function eurToDisplay(amountEur: number, code: Iso4217Code): number {
  const table: Record<Iso4217Code, number> = {
    EUR: 1,
    USD: 1.08,
    GBP: 0.86,
    CZK: 24.6,
    PLN: 4.32,
    CHF: 0.94,
    AUD: 1.65,
    JPY: 165,
    VND: 27500,
  };
  const r = table[code] ?? 1;
  return amountEur * r;
}

function pickAirlines(seed: number): readonly string[] {
  const pool = [
    'Vietnam Airlines',
    'Air France',
    'Lufthansa',
    'Czech Airlines',
    'KLM',
    'Emirates',
    'Turkish Airlines',
  ] as const;
  const i = seed % pool.length;
  const j = (seed + 3) % pool.length;
  const k = (seed + 5) % pool.length;
  return [pool[i], pool[j], pool[k]];
}

function pad2(n: number): string {
  return n < 10 ? `0${String(n)}` : String(n);
}

/** Mock IATA-style code from free-text city (Duffel would return real airport codes). */
function mockIata(cityOrCode: string): string {
  const alnum = cityOrCode.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (alnum.length >= 3) return alnum.slice(0, 3);
  return `${alnum}KNX`.replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X');
}

function shiftTime(baseHHMM: string, addMin: number): string {
  const [hh, mm] = baseHHMM.split(':').map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return baseHHMM;
  let m = hh * 60 + mm + addMin;
  m = ((m % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(m / 60);
  const nm = m % 60;
  return `${pad2(nh)}:${pad2(nm)}`;
}

/**
 * Mock flight search — async to mirror network latency.
 * @param date ISO-like `YYYY-MM-DD` (validated lightly by caller UI).
 */
export async function searchFlights(
  origin: string,
  dest: string,
  date: string,
  passengers: number,
  options?: Readonly<{ readonly returnDate?: string | null; readonly priceCurrency?: Iso4217Code }>
): Promise<readonly FlightOffer[]> {
  const returnDate = options?.returnDate?.trim() ? options.returnDate.trim() : null;
  const priceCurrency = options?.priceCurrency ?? 'EUR';
  const pax = Math.min(9, Math.max(1, Math.floor(passengers)));
  const seed = hashSeed([origin.trim(), dest.trim(), date, String(pax), returnDate ?? 'ow']);
  const airlines = pickAirlines(seed);

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 420);
  });

  const baseEur = 78 + (seed % 210) + (pax - 1) * 18;
  const o1Dep = `${pad2(6 + (seed % 4))}:${pad2(10 + (seed % 40))}`;
  const o1Arr = shiftTime(o1Dep, 140 + (seed % 90));
  const o2Dep = shiftTime(o1Dep, 95 + (seed % 50));
  const o2Arr = shiftTime(o2Dep, 155 + (seed % 120));
  const o3Dep = shiftTime(o1Dep, 210 + (seed % 40));
  const o3Arr = shiftTime(o3Dep, 320 + (seed % 80));

  const inbound: FlightSegment | null =
    returnDate === null
      ? null
      : {
          depAirport: `${mockIata(dest)}-B`,
          arrAirport: `${mockIata(origin)}-A`,
          depLocal: `${pad2(9 + (seed % 3))}:${pad2(20 + (seed % 35))}`,
          arrLocal: shiftTime(`${pad2(9 + (seed % 3))}:${pad2(20 + (seed % 35))}`, 150 + (seed % 100)),
        };

  const offers: FlightOffer[] = [
    {
      id: `fo_${seed}_1`,
      airline: airlines[0],
      origin: origin.trim(),
      dest: dest.trim(),
      departureDate: date,
      returnDate,
      passengers: pax,
      outbound: {
        depAirport: `${mockIata(origin)}-T1`,
        arrAirport: `${mockIata(dest)}-T2`,
        depLocal: o1Dep,
        arrLocal: o1Arr,
      },
      inbound,
      stops: 0,
      cabin: 'Economy',
      priceTotal: Math.round(eurToDisplay(baseEur * 1.0, priceCurrency)),
      priceCurrency,
    },
    {
      id: `fo_${seed}_2`,
      airline: airlines[1],
      origin: origin.trim(),
      dest: dest.trim(),
      departureDate: date,
      returnDate,
      passengers: pax,
      outbound: {
        depAirport: `${mockIata(origin)}-T2`,
        arrAirport: `${mockIata(dest)}-T1`,
        depLocal: o2Dep,
        arrLocal: o2Arr,
      },
      inbound,
      stops: 1,
      cabin: 'Economy',
      priceTotal: Math.round(eurToDisplay(baseEur * 0.92, priceCurrency)),
      priceCurrency,
    },
    {
      id: `fo_${seed}_3`,
      airline: airlines[2],
      origin: origin.trim(),
      dest: dest.trim(),
      departureDate: date,
      returnDate,
      passengers: pax,
      outbound: {
        depAirport: `${mockIata(origin)}-T1`,
        arrAirport: `${mockIata(dest)}-T2`,
        depLocal: o3Dep,
        arrLocal: o3Arr,
      },
      inbound,
      stops: 0,
      cabin: 'Business',
      priceTotal: Math.round(eurToDisplay(baseEur * 2.35, priceCurrency)),
      priceCurrency,
    },
  ];

  return offers;
}
