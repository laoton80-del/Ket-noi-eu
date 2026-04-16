import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { LifeOSActionCell } from '../../components/widgets';
import { noteCompanionAction } from '../../services/companion';
import { generateSellCTA } from '../../services/selling';
import { setPendingSellResume } from '../../services/selling/sellResumeStorage';
import { LAUNCH_PILOT_CONFIG } from '../../config/launchPilot';

type LifeOSActionDeps = {
  pricing: { leonaOutbound: number; interpreterSession: number; leTanBooking: number };
  creditBalance: number;
  userCountry?: string;
  userSegment: 'adult' | 'child';
  loadingActionKey: string | null;
  setLoadingActionKey: Dispatch<SetStateAction<string | null>>;
  setLastAction: Dispatch<SetStateAction<'callHelp' | 'interpreter' | 'callAssist' | 'findServices' | 'topUp'>>;
  actions: {
    onPressTopUp: () => void;
    onPressCallHelp: () => void;
    onPressInterpreter: () => void;
    onPressCallAssist: () => void;
    onPressFindServices: () => void;
  };
};

export function useLifeOSActionCells(deps: LifeOSActionDeps): LifeOSActionCell[] {
  return useMemo(() => {
    const p = deps.pricing;
    const bal = deps.creditBalance;
    const bookingSell = generateSellCTA('booking_call', {
      userInput: 'gọi giúp tôi',
      intent: 'booking',
      context: { userCountry: deps.userCountry, segment: deps.userSegment },
    });
    const interpreterSell = generateSellCTA('interpreter', {
      userInput: 'phiên dịch ngay',
      intent: 'language_confusion',
      context: { userCountry: deps.userCountry, segment: deps.userSegment },
    });
    const callAssistSell = generateSellCTA('call_assist', {
      userInput: 'hỗ trợ cuộc gọi',
      intent: 'service_search',
      context: { userCountry: deps.userCountry, segment: deps.userSegment },
    });
    const sendToTopUpThenResume = (resume: Parameters<typeof setPendingSellResume>[0]) => {
      deps.setLastAction('topUp');
      void setPendingSellResume(resume);
      deps.actions.onPressTopUp();
    };
    const withLoading = (key: string, fn: () => void) => {
      deps.setLoadingActionKey(key);
      fn();
      setTimeout(() => deps.setLoadingActionKey((prev) => (prev === key ? null : prev)), 1200);
    };
    return [
      {
        key: 'callHelp',
        title: 'Gọi đặt lịch',
        costLine: `${p.leonaOutbound} Credits/cuộc`,
        outcomeLine: bal < p.leonaOutbound ? 'Chạm để nạp trước' : 'Leona gọi & chốt hộ',
        loading: deps.loadingActionKey === 'callHelp',
        onPress: () => {
          if (!bookingSell) return;
          if (bal < p.leonaOutbound) return sendToTopUpThenResume(bookingSell.resume);
          withLoading('callHelp', () => {
            deps.setLastAction('callHelp');
            void noteCompanionAction('call_help');
            deps.actions.onPressCallHelp();
          });
        },
      },
      {
        key: 'interpreter',
        title: 'Phiên dịch trực tiếp',
        costLine: `${p.interpreterSession} Credits/phiên`,
        outcomeLine: bal < p.interpreterSession ? 'Chạm để nạp trước' : 'Nói–dịch tức thì',
        loading: deps.loadingActionKey === 'interpreter',
        onPress: () => {
          if (!interpreterSell) return;
          if (bal < p.interpreterSession) return sendToTopUpThenResume(interpreterSell.resume);
          withLoading('interpreter', () => {
            deps.setLastAction('interpreter');
            void noteCompanionAction('interpreter');
            deps.actions.onPressInterpreter();
          });
        },
      },
      {
        key: 'callAssist',
        title: 'CSKH đặt lịch',
        costLine: `${p.leTanBooking} Credits/lượt`,
        outcomeLine: bal < p.leTanBooking ? 'Chạm để nạp trước' : 'CSKH hỗ trợ đặt lịch',
        loading: deps.loadingActionKey === 'callAssist',
        onPress: () => {
          if (!callAssistSell) return;
          if (bal < p.leTanBooking) return sendToTopUpThenResume(callAssistSell.resume);
          withLoading('callAssist', () => {
            deps.setLastAction('callAssist');
            void noteCompanionAction('call_assist');
            deps.actions.onPressCallAssist();
          });
        },
      },
      {
        key: 'radar',
        title: LAUNCH_PILOT_CONFIG.enableRadarSurface ? 'Tìm dịch vụ gần' : 'Tìm dịch vụ · Leona',
        costLine: LAUNCH_PILOT_CONFIG.enableRadarSurface ? '0 Credits · xem radar' : '0 Credits · chuyển qua Leona',
        outcomeLine: LAUNCH_PILOT_CONFIG.enableRadarSurface ? 'Quán & tiệm gần bạn' : 'Leona hỗ trợ tìm & gọi',
        loading: deps.loadingActionKey === 'radar',
        onPress: () => {
          withLoading('radar', () => {
            deps.setLastAction('findServices');
            void noteCompanionAction('radar');
            deps.actions.onPressFindServices();
          });
        },
      },
    ];
  }, [deps]);
}
