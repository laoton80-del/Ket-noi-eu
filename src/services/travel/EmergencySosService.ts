import { generateSpeech } from '../OpenAIService';
import { haversineKm } from '../../utils/geoHaversine';

export type VietnameseMissionKind = 'embassy' | 'consulate_general' | 'consulate';

export type VietnameseMission = Readonly<{
  id: string;
  kind: VietnameseMissionKind;
  nameVi: string;
  cityLabel: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  phoneDisplay: string;
  mapsQueryHint: string;
}>;

export type NearestVietnameseMissionResult = Readonly<{
  mission: VietnameseMission;
  distanceKm: number;
}>;

export type SosQuickActionKind = 'medical' | 'police';

export type SosQuickActionScript = Readonly<{
  kind: SosQuickActionKind;
  /** Single string optimized for TTS in front of local emergency services. */
  ttsPrimaryLocalLanguage: string;
  /** Vietnamese helper line for the traveler (shown + optional second TTS). */
  vietnameseCompanionLine: string;
  /** ISO 3166-1 alpha-2 hint used to pick the host language script. */
  hostCountryCode: string;
}>;

/** Curated Vietnamese diplomatic missions in Europe (demo dataset; verify before production). */
export const VIETNAMESE_DIPLOMATIC_MISSIONS: readonly VietnameseMission[] = [
  {
    id: 'vn-de-emb-berlin',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Berlin',
    cityLabel: 'Berlin, Đức',
    countryCode: 'DE',
    latitude: 52.514_467,
    longitude: 13.389_854,
    phoneDisplay: '+49 30 53630108',
    mapsQueryHint: 'Vietnamese Embassy Berlin Unter den Linden',
  },
  {
    id: 'vn-fr-emb-paris',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Paris',
    cityLabel: 'Paris, Pháp',
    countryCode: 'FR',
    latitude: 48.870_8,
    longitude: 2.307_7,
    phoneDisplay: '+33 1 4414 6400',
    mapsQueryHint: 'Ambassade du Vietnam Paris',
  },
  {
    id: 'vn-gb-emb-london',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại London',
    cityLabel: 'London, Anh',
    countryCode: 'GB',
    latitude: 51.507_35,
    longitude: -0.127_758,
    phoneDisplay: '+44 20 7937 1912',
    mapsQueryHint: 'Embassy of Vietnam London',
  },
  {
    id: 'vn-cz-emb-prague',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Praha',
    cityLabel: 'Praha, Séc',
    countryCode: 'CZ',
    latitude: 50.102_2,
    longitude: 14.391_2,
    phoneDisplay: '+420 257 211 540',
    mapsQueryHint: 'Embassy of Vietnam Prague',
  },
  {
    id: 'vn-at-emb-vienna',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Wien',
    cityLabel: 'Wien, Áo',
    countryCode: 'AT',
    latitude: 48.245_6,
    longitude: 16.365_3,
    phoneDisplay: '+43 1 505 75 16',
    mapsQueryHint: 'Botschaft Vietnam Wien',
  },
  {
    id: 'vn-pl-emb-warsaw',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Warszawa',
    cityLabel: 'Warszawa, Ba Lan',
    countryCode: 'PL',
    latitude: 52.229_7,
    longitude: 21.012_2,
    phoneDisplay: '+48 22 651 2391',
    mapsQueryHint: 'Embassy of Vietnam Warsaw',
  },
  {
    id: 'vn-nl-emb-hague',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Den Haag',
    cityLabel: 'Den Haag, Hà Lan',
    countryCode: 'NL',
    latitude: 52.070_5,
    longitude: 4.300_7,
    phoneDisplay: '+31 70 364 8917',
    mapsQueryHint: 'Embassy of Vietnam The Hague',
  },
  {
    id: 'vn-be-emb-brussels',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Bruxelles',
    cityLabel: 'Bruxelles, Bỉ',
    countryCode: 'BE',
    latitude: 50.822_5,
    longitude: 4.384_7,
    phoneDisplay: '+32 2 379 2737',
    mapsQueryHint: 'Embassy of Vietnam Brussels',
  },
  {
    id: 'vn-it-emb-rome',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Roma',
    cityLabel: 'Roma, Ý',
    countryCode: 'IT',
    latitude: 41.918_8,
    longitude: 12.488_3,
    phoneDisplay: '+39 06 853 5751',
    mapsQueryHint: 'Embasciata Vietnam Roma',
  },
  {
    id: 'vn-es-emb-madrid',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Madrid',
    cityLabel: 'Madrid, Tây Ban Nha',
    countryCode: 'ES',
    latitude: 40.452_4,
    longitude: -3.690_1,
    phoneDisplay: '+34 91 345 1218',
    mapsQueryHint: 'Embajada Vietnam Madrid',
  },
  {
    id: 'vn-hu-emb-budapest',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Budapest',
    cityLabel: 'Budapest, Hungary',
    countryCode: 'HU',
    latitude: 47.516_9,
    longitude: 19.077_9,
    phoneDisplay: '+36 1 326 9608',
    mapsQueryHint: 'Vietnam Embassy Budapest',
  },
  {
    id: 'vn-se-emb-stockholm',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Stockholm',
    cityLabel: 'Stockholm, Thụy Điển',
    countryCode: 'SE',
    latitude: 59.329_3,
    longitude: 18.068_6,
    phoneDisplay: '+46 8 545 184 80',
    mapsQueryHint: 'Embassy of Vietnam Stockholm',
  },
  {
    id: 'vn-ch-emb-bern',
    kind: 'embassy',
    nameVi: 'Đại sứ quán Việt Nam tại Bern',
    cityLabel: 'Bern, Thụy Sĩ',
    countryCode: 'CH',
    latitude: 46.948_1,
    longitude: 7.447_4,
    phoneDisplay: '+41 31 388 78 78',
    mapsQueryHint: 'Botschaft Vietnam Bern',
  },
  {
    id: 'vn-de-cg-frankfurt',
    kind: 'consulate_general',
    nameVi: 'Tổng Lãnh sự quán Việt Nam tại Frankfurt',
    cityLabel: 'Frankfurt, Đức',
    countryCode: 'DE',
    latitude: 50.110_9,
    longitude: 8.682_1,
    phoneDisplay: '+49 69 795 405 0',
    mapsQueryHint: 'Vietnamese Consulate General Frankfurt',
  },
  {
    id: 'vn-de-cg-munich',
    kind: 'consulate_general',
    nameVi: 'Tổng Lãnh sự quán Việt Nam tại München',
    cityLabel: 'München, Đức',
    countryCode: 'DE',
    latitude: 48.135_1,
    longitude: 11.582_0,
    phoneDisplay: '+49 89 288 087 0',
    mapsQueryHint: 'Vietnamese Consulate Munich',
  },
];

function normalizeCc(cc: string | undefined): string {
  return (cc ?? '').trim().toUpperCase();
}

function scriptForMedical(hostCc: string): { local: string; vi: string } {
  switch (normalizeCc(hostCc)) {
    case 'DE':
    case 'AT':
      return {
        local:
          'Bitte rufen Sie den Rettungsdienst. Ich brauche dringend medizinische Hilfe. Ich spreche nicht gut Deutsch. Vietnamese.',
        vi: 'Xin gọi cấp cứu. Tôi cần giúp đỡ y tế khẩn cấp. Tôi là người Việt Nam.',
      };
    case 'CZ':
      return {
        local:
          'Prosím volejte záchrannou službu. Potřebuji naléhavou lékařskou pomoc. Mluvím špatně česky. Vietnamština.',
        vi: 'Xin gọi cấp cứu. Tôi cần trợ giúp y tế khẩn cấp.',
      };
    case 'FR':
      return {
        local:
          "Appelez les secours s'il vous plaît. J'ai besoin d'une aide médicale urgente. Je ne parle pas bien français. Vietnamien.",
        vi: 'Xin gọi cấp cứu. Tôi cần hỗ trợ y tế khẩn cấp.',
      };
    case 'PL':
      return {
        local:
          'Proszę wezwać pogotowie. Potrzebuję pilnej pomocy medycznej. Słabo mówię po polsku. Wietnamski.',
        vi: 'Xin gọi cấp cứu. Tôi cần hỗ trợ y tế gấp.',
      };
    case 'GB':
      return {
        local:
          'Please call an ambulance. I need urgent medical help. I do not speak English well. Vietnamese speaker.',
        vi: 'Please call 999. I need urgent medical help. I am Vietnamese.',
      };
    default:
      return {
        local:
          'Please call emergency medical services. I need urgent medical help. I am Vietnamese and need an interpreter if possible.',
        vi: 'Xin gọi cấp cứu. Tôi cần trợ giúp y tế khẩn cấp.',
      };
  }
}

function scriptForPolice(hostCc: string): { local: string; vi: string } {
  switch (normalizeCc(hostCc)) {
    case 'DE':
    case 'AT':
      return {
        local:
          'Ich brauche die Polizei. Ich bin in Not. Ich spreche nicht gut Deutsch. Bitte um Hilfe. Vietnamese.',
        vi: 'Tôi cần cảnh sát. Tôi đang gặp nguy hiểm. Xin giúp đỡ.',
      };
    case 'CZ':
      return {
        local: 'Potřebuji policii. Jsem v nouzi. Špatně mluvím česky. Vietnamština. Prosím o pomoc.',
        vi: 'Tôi cần cảnh sát. Tôi đang gặp nguy hiểm.',
      };
    case 'FR':
      return {
        local:
          "J'ai besoin de la police. Je suis en danger. Je ne parle pas bien français. Vietnamien. Aidez-moi s'il vous plaît.",
        vi: 'Tôi cần cảnh sát. Tôi đang gặp nguy hiểm.',
      };
    case 'PL':
      return {
        local: 'Potrzebuję policji. Jestem w niebezpieczeństwie. Słabo mówię po polsku. Wietnamski.',
        vi: 'Tôi cần cảnh sát. Tôi đang gặp nguy hiểm.',
      };
    case 'GB':
      return {
        local:
          'I need the police. I am in danger. I do not speak English well. Vietnamese speaker. Please help.',
        vi: 'I need the police. I am in danger. Please help.',
      };
    default:
      return {
        local:
          'I need the police. I am in danger. I am Vietnamese and need help. Please connect an interpreter if possible.',
        vi: 'Tôi cần cảnh sát. Tôi đang gặp nguy hiểm.',
      };
  }
}

/**
 * Maps the user's GPS fix to the nearest Vietnamese embassy / consulate in the curated catalog.
 */
export function resolveNearestVietnameseMission(
  userLatitude: number,
  userLongitude: number
): NearestVietnameseMissionResult {
  let best: VietnameseMission = VIETNAMESE_DIPLOMATIC_MISSIONS[0];
  let bestKm = Number.POSITIVE_INFINITY;
  for (const m of VIETNAMESE_DIPLOMATIC_MISSIONS) {
    const d = haversineKm(userLatitude, userLongitude, m.latitude, m.longitude);
    if (d < bestKm) {
      bestKm = d;
      best = m;
    }
  }
  return { mission: best, distanceKm: bestKm };
}

/**
 * Pre-translated quick-action lines for Medical / Police scenarios (host language + Vietnamese echo).
 */
export function getSosQuickActionScript(
  kind: SosQuickActionKind,
  hostCountryCode: string | undefined
): SosQuickActionScript {
  const host = normalizeCc(hostCountryCode);
  const pair = kind === 'medical' ? scriptForMedical(host) : scriptForPolice(host);
  return {
    kind,
    hostCountryCode: host.length === 2 ? host : 'INTL',
    ttsPrimaryLocalLanguage: pair.local,
    vietnameseCompanionLine: pair.vi,
  };
}

type OpenAiTtsVoice = 'nova' | 'alloy' | 'shimmer';

function combinedQuickActionTtsText(kind: SosQuickActionKind, hostCountryCode: string | undefined): string {
  const script = getSosQuickActionScript(kind, hostCountryCode);
  return `${script.ttsPrimaryLocalLanguage}\n\nTiếng Việt: ${script.vietnameseCompanionLine}`;
}

/**
 * Synthesizes the host-language emergency line via the existing OpenAI TTS pipeline (`generateSpeech`).
 */
export async function synthesizeSosQuickActionAudio(
  kind: SosQuickActionKind,
  hostCountryCode: string | undefined,
  voice: OpenAiTtsVoice = 'nova'
): Promise<string> {
  const script = getSosQuickActionScript(kind, hostCountryCode);
  return generateSpeech(script.ttsPrimaryLocalLanguage, voice);
}

/**
 * Single clip: local authorities phrase, then Vietnamese echo (same AI engine).
 */
export async function synthesizeSosQuickActionDualLanguageAudio(
  kind: SosQuickActionKind,
  hostCountryCode: string | undefined,
  voice: OpenAiTtsVoice = 'nova'
): Promise<string> {
  return generateSpeech(combinedQuickActionTtsText(kind, hostCountryCode), voice);
}
