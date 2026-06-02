import type { ActiveRole } from '../store/userStore';

export type RoleTabChromeOptions = Readonly<{
  /** B2C Travel universe — light acrylic tab bar on platinum field */
  b2cTravelPlatinum?: boolean;
}>;

/** Distinct tab chrome per hat — Consumer navy, Merchant deep green + gold, Broker black + gold, Admin cyber red/blue. */
export function roleTabChrome(
  role: ActiveRole,
  options?: RoleTabChromeOptions
): Readonly<{
  active: string;
  inactive: string;
  barBg: string;
  barBorder: string;
}> {
  if (role === 'B2C' && options?.b2cTravelPlatinum) {
    return {
      active: '#9A7209',
      inactive: 'rgba(10, 22, 40, 0.42)',
      barBg: 'rgba(255, 255, 255, 0.94)',
      barBorder: 'rgba(197, 160, 89, 0.38)',
    };
  }
  if (role === 'ADMIN') {
    return {
      active: '#38BDF8',
      inactive: 'rgba(56, 189, 248, 0.38)',
      barBg: '#030712',
      barBorder: 'rgba(248, 113, 113, 0.35)',
    };
  }
  if (role === 'B2B') {
    return {
      active: '#E8C547',
      inactive: 'rgba(232, 197, 71, 0.4)',
      barBg: '#03150E',
      barBorder: 'rgba(46, 125, 90, 0.45)',
    };
  }
  if (role === 'BROKER') {
    return {
      active: '#F5D286',
      inactive: 'rgba(245, 210, 134, 0.38)',
      barBg: '#030304',
      barBorder: 'rgba(245, 210, 134, 0.22)',
    };
  }
  // B2C consumer (Hub / Local / Travel Lite / Academy Lite). Premium glass parity:
  //  - barBg is a dark translucent navy (was the flat opaque slab #061A33) so it reads as glass —
  //    a web backdrop-blur in MainTabNavigator turns this into frosted depth, while the high opacity
  //    keeps it clean on native where blur is unavailable and content can sit behind the absolute bar.
  //  - barBorder is a crisper cyan/blue top edge-light (not heavy neon).
  //  - active is a clearer, brighter cyan-blue; inactive is a readable muted slate (not disabled-looking).
  return {
    active: '#9CCBFF',
    inactive: 'rgba(178, 200, 230, 0.64)',
    barBg: 'rgba(8, 20, 38, 0.9)',
    barBorder: 'rgba(124, 196, 255, 0.44)',
  };
}
