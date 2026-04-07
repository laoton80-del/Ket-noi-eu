import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { markDailyOpen, type DailyLoopAction } from '../../services/engagement';

export type LifeOSDailyLoopBootstrapState = {
  streakDays: number;
  lastAction: DailyLoopAction;
};

export function useLifeOSDailyLoopBootstrap(): {
  dailyState: LifeOSDailyLoopBootstrapState;
  setDailyState: Dispatch<SetStateAction<LifeOSDailyLoopBootstrapState>>;
} {
  const [dailyState, setDailyState] = useState<LifeOSDailyLoopBootstrapState>({
    streakDays: 0,
    lastAction: 'none',
  });

  useEffect(() => {
    void (async () => {
      const s = await markDailyOpen();
      setDailyState({ streakDays: s.streakDays, lastAction: s.lastAction });
    })();
  }, []);

  return { dailyState, setDailyState };
}
