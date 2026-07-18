import type { ActiveRole } from '../store/userStore';
import { MAIN_TAB, type RootTabParamList } from './routes';

/**
 * V7 Global Lifeline visibility — matches MainTabNavigator historical rule:
 * all roles; B2C hides the *global shell* SOS control only on Academy (voice shell).
 * Academy still owns in-rail SOS via VionaGlobalTopRail.
 */
export function shouldShowGlobalLifelineSos(
  role: ActiveRole,
  focusedTabRoute: keyof RootTabParamList | undefined
): boolean {
  return role !== 'B2C' || focusedTabRoute == null || focusedTabRoute !== MAIN_TAB.B2C.ai;
}

/**
 * Whether tab chrome (bottom bar **or** desktop left rail) should host the integrated SOS action.
 *
 * Surfaces that already own an in-screen shell SOS (Local utility rail, Travel/Academy
 * top rail, fashion desktop command bar) must not also mount a chrome SOS entry.
 *
 * B2B / Broker / Admin always mount chrome SOS — including desktop `tabBarPosition === 'left'`.
 */
export function shouldMountSosInTabBarShell(input: Readonly<{
  role: ActiveRole;
  focusedTabRoute: keyof RootTabParamList | undefined;
  fashionHomeDesktopShell: boolean;
}>): boolean {
  if (input.fashionHomeDesktopShell) return false;
  if (!shouldShowGlobalLifelineSos(input.role, input.focusedTabRoute)) return false;

  if (input.role === 'B2C') {
    if (input.focusedTabRoute === MAIN_TAB.B2C.local) return false;
    if (input.focusedTabRoute === MAIN_TAB.B2C.travel) return false;
    if (input.focusedTabRoute === MAIN_TAB.B2C.ai) return false;
    return true;
  }

  // B2B / Broker / Admin — preserve prior global SOS reachability via tab chrome (bottom or left rail).
  return true;
}
