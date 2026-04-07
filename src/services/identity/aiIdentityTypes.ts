export type CommunicationStyle = 'concise' | 'guided' | 'encouraging';
export type TonePreference = 'friendly' | 'supportive' | 'formal';
export type LanguageLevel = 'beginner' | 'intermediate' | 'advanced';

export type AIIdentityProfile = {
  userId: string;
  preferredName: string;
  communicationStyle: CommunicationStyle;
  tonePreference: TonePreference;
  languageLevel: LanguageLevel;
};

export type AIIdentityMemory = {
  recentActions: Array<{ action: string; at: number }>;
  preferences: {
    communicationStyle?: CommunicationStyle;
    tonePreference?: TonePreference;
    languageLevel?: LanguageLevel;
  };
  recurringNeeds: string[];
};
