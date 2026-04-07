import type { InterpreterScenario } from '../../config/aiPrompts';

export type SellingOpportunity = 'booking_call' | 'interpreter' | 'call_assist' | null;

export type SellingAction = 'leona_booking' | 'start_interpreter' | 'leTan_assist';

export type SellResume =
  | {
      route: 'LeonaCall';
      params: {
        prefillRequest?: string;
        autoSubmit?: boolean;
      };
    }
  | {
      route: 'LiveInterpreter';
      params: {
        guidedEntry?: boolean;
        scenario?: InterpreterScenario;
      };
    }
  | {
      route: 'Tabs';
      params: {
        screen: 'LeTan';
        params?: {
          proactiveQuestion?: string;
          autoSimulate?: boolean;
          aiMode?: 'roleplay';
          scenario?: string;
          initialPrompt?: string;
        };
      };
    };

export type SellCTA = {
  message: string;
  action: SellingAction;
  creditsCost: number;
  resume: SellResume;
};

export type DetectOpportunityInput = {
  userInput: string;
  intent: string | null;
  context: {
    userCountry?: string;
    segment?: 'adult' | 'child';
    scenario?: string;
  };
};

