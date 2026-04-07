import { useEffect, useState } from 'react';
import type { UserSegment } from '../../context/AuthContext';
import { generateCompanionMessage } from '../../services/companion';
import { buildLifeOSAutoCTAs, type AutoCTA } from '../../services/selling';

export function useLifeOSCompanionAndPredictive(input: {
  userPhone?: string;
  segment: UserSegment;
  showLowCreditBanner: boolean;
  showLegalWidget: boolean;
  holidayActions: string[];
  streakDays: number;
  userCountry?: string;
  visaExpiryDate: string | null;
  daysToExpiry: number | null;
  learningProgress: number;
  creditBalance: number;
}): {
  autoCtas: AutoCTA[];
  companionMessage: string;
  companionSuggestions: string[];
} {
  const [autoCtas, setAutoCtas] = useState<AutoCTA[]>([]);
  const [companionMessage, setCompanionMessage] = useState<string>('Mình ở đây để đồng hành cùng bạn mỗi ngày.');
  const [companionSuggestions, setCompanionSuggestions] = useState<string[]>(['Phiên dịch nhanh']);

  useEffect(() => {
    let active = true;
    void (async () => {
      const ctas = await buildLifeOSAutoCTAs(
        {
          userCountry: input.userCountry,
          segment: input.segment,
          visaExpiryDate: input.visaExpiryDate,
          daysToExpiry: input.daysToExpiry,
          learningProgress: input.learningProgress,
          creditBalance: input.creditBalance,
        },
        2
      );
      if (!active) return;
      setAutoCtas(ctas);
    })();
    return () => {
      active = false;
    };
  }, [
    input.userCountry,
    input.segment,
    input.visaExpiryDate,
    input.daysToExpiry,
    input.learningProgress,
    input.creditBalance,
  ]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await generateCompanionMessage({
        userId: input.userPhone,
        segment: input.segment,
        lowCredit: input.showLowCreditBanner,
        urgentVisa: input.showLegalWidget,
        holidayActions: input.holidayActions,
        streakDays: input.streakDays,
      });
      if (!active) return;
      setCompanionMessage(res.message);
      setCompanionSuggestions(res.suggestedActions.slice(0, 2));
    })();
    return () => {
      active = false;
    };
  }, [
    input.userPhone,
    input.segment,
    input.showLowCreditBanner,
    input.showLegalWidget,
    input.holidayActions,
    input.streakDays,
  ]);

  return { autoCtas, companionMessage, companionSuggestions };
}
