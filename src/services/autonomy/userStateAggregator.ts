import { buildAdultLearningSnapshot, buildKidsLearningSnapshot } from '../learning';
import { getWalletState } from '../../state/wallet';
import { loadRecentLifeOSActions } from '../selling/lifeosPredictionStorage';
import type { AuthUser } from '../../context/AuthContext';
import type { AutonomousUserState } from './types';

export async function getUserState(user: AuthUser): Promise<AutonomousUserState> {
  const recentActions = await loadRecentLifeOSActions();
  const wallet = getWalletState();
  const hasUnlockedLearning = user.isLearningFullUnlocked === true || user.isLearningUnlocked === true;
  const adultLearning = buildAdultLearningSnapshot({
    isLearningFullUnlocked: user.isLearningFullUnlocked === true,
    isLearningUnlocked: user.isLearningUnlocked === true,
  });
  const kidsLearning = buildKidsLearningSnapshot({ hasUnlockedLearning });
  const learningProgress = user.segment === 'child' ? kidsLearning.progressPercent : adultLearning.unlockedFullTrack ? 100 : 35;

  const visaExpiry = user.visaExpiryDate?.trim() || null;
  const daysToExpiry = visaExpiry
    ? Math.ceil((new Date(`${visaExpiry}T00:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  const upcomingEvents: AutonomousUserState['upcomingEvents'] = [];
  if (visaExpiry && typeof daysToExpiry === 'number') {
    upcomingEvents.push({ type: 'visa_expiry', date: visaExpiry, daysLeft: daysToExpiry });
  }

  return {
    userId: user.phone,
    userCountry: user.country,
    visaExpiry,
    daysToExpiry,
    recentActions: recentActions.map((a) => ({ action: a.action, at: a.at })),
    learningProgress,
    creditBalance: wallet.credits,
    upcomingEvents,
  };
}
