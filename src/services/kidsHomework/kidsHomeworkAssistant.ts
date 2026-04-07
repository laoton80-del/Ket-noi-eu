import { analyzeKidsHomeworkWithAI, generateSpeech } from '../OpenAIService';
import { toOpenAiTtsVoice } from '../voicePersona';

export type KidsHomeworkAssistResult = {
  subject: string;
  level: 'easy' | 'medium' | 'advanced';
  explanation: string;
  steps: string[];
  voiceUri: string | null;
};

export async function assistKidsHomeworkFromImage(input: {
  base64Image: string;
  withVoice?: boolean;
  voiceId?: string;
}): Promise<KidsHomeworkAssistResult> {
  const analysis = await analyzeKidsHomeworkWithAI(input.base64Image);
  const explanation = `${analysis.plainSummary}\n\n${analysis.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  let voiceUri: string | null = null;
  if (input.withVoice) {
    const v = toOpenAiTtsVoice(input.voiceId ?? 'shimmer');
    try {
      voiceUri = await generateSpeech(explanation, v);
    } catch {
      voiceUri = null;
    }
  }
  return {
    subject: analysis.subject,
    level: analysis.level,
    explanation,
    steps: analysis.steps,
    voiceUri,
  };
}
