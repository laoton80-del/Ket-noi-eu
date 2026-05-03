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
  return {
    active: '#6EB0FF',
    inactive: 'rgba(110, 176, 255, 0.42)',
    barBg: '#061A33',
    barBorder: 'rgba(79, 140, 255, 0.28)',
  };
}
