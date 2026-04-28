/**
 * Interpreter session credit flat fee — shared by UI, selling CTAs, and Cloud Functions bundle.
 * Keep this module free of RN/Expo/OpenAI imports so `functions` esbuild does not pull client-only deps.
 */
export const INTERPRETER_SESSION_CREDITS = 25;
