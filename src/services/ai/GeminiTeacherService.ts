/**
 * E-Learning AI Teacher — Google Gemini track (Multi-LLM strategy).
 *
 * Client build ships **no** Gemini API keys. When backend routes exist, capabilities are enabled server-side only.
 */

import { getPersonaCapability } from '../../config/aiPersonaCapabilities';
import { getRestApiBaseUrl } from '../apiClient';

export const GEMINI_TEACHER_BADGE_LABEL = 'Powered by Gemini Advanced Vision' as const;

export type GeminiLiveTutoringSessionMock = {
  readonly sessionId: string;
  readonly studentId: string;
  readonly level: string;
  readonly provider: 'gemini-multimodal-live-mock';
  readonly status: 'initializing' | 'ready';
  readonly startedAtIso: string;
  /** True when ViGlobal REST base is configured (future: Gemini via `/api/ai/...` proxy only). */
  readonly apiKeyConfigured: boolean;
};

export type GeminiWhiteboardAnalysisMock = {
  readonly requestId: string;
  readonly imagePayloadChars: number;
  readonly summary: string;
  readonly suggestions: readonly string[];
  readonly modelRoute: 'gemini-2.5-flash-mock' | 'gemini-2.5-pro-mock';
};

function isBackendAiGatewayConfigured(): boolean {
  return getRestApiBaseUrl().length > 0;
}

function randomId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export class GeminiTeacherService {
  /**
   * Mock: would open a Gemini Multimodal Live tutoring session (voice + shared vision / screen).
   */
  async startLiveTutoringSession(studentId: string, level: string): Promise<GeminiLiveTutoringSessionMock> {
    void getPersonaCapability('ai_teacher');
    return {
      sessionId: randomId('gemini_live'),
      studentId,
      level,
      provider: 'gemini-multimodal-live-mock',
      status: 'ready',
      startedAtIso: new Date().toISOString(),
      apiKeyConfigured: isBackendAiGatewayConfigured(),
    };
  }

  /**
   * Mock: would send a homework / whiteboard frame to Gemini Flash/Pro for structured feedback.
   */
  async analyzeStudentWhiteboard(imageBase64: string): Promise<GeminiWhiteboardAnalysisMock> {
    const persona = getPersonaCapability('ai_teacher');
    const imagePayloadChars = imageBase64.length;
    return {
      requestId: randomId('gemini_wb'),
      imagePayloadChars,
      summary: `Mock route (${persona.telemetryTag}): Gemini would return structured feedback on handwriting, steps, and errors.`,
      suggestions: [
        'Verify the final unit (mock).',
        'Check sign consistency on line 2 (mock).',
        'Re-read the problem statement for constraints (mock).',
      ],
      modelRoute: imagePayloadChars > 120_000 ? 'gemini-2.5-pro-mock' : 'gemini-2.5-flash-mock',
    };
  }
}

export const geminiTeacherService = new GeminiTeacherService();
