import { useCallback, useEffect, useRef, useState } from 'react';
import { getWalletIdToken } from '../walletFirebaseSession';

const ACADEMY_STREAM_WSS_URL = 'wss://api.ketnoiglobal.com/academy/stream';

export type StreamState = 'idle' | 'connecting' | 'live' | 'error';

export type AiTeacherStreamMessage = {
  speech: string;
  whiteboard: string;
};

type ServerEnvelope =
  | { type: 'auth_ok' | 'auth_error' | 'pong'; [key: string]: unknown }
  | { speech?: unknown; whiteboard?: unknown; [key: string]: unknown };

type OnMessageCallback = (message: AiTeacherStreamMessage) => void;

export function useAiStream() {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef<OnMessageCallback | null>(null);
  const [state, setState] = useState<StreamState>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
    setState('idle');
  }, []);

  const connect = useCallback(async (systemPrompt?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    setState('connecting');
    setLastError(null);

    const token = await getWalletIdToken(true);
    if (!token) {
      setState('error');
      setLastError('firebase_id_token_missing');
      return;
    }

    const ws = new WebSocket(ACADEMY_STREAM_WSS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      if (systemPrompt && systemPrompt.trim()) {
        ws.send(JSON.stringify({ type: 'session_config', systemPrompt }));
      }
      setState('live');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as ServerEnvelope;
        if (typeof parsed.speech === 'string' && typeof parsed.whiteboard === 'string') {
          onMessageRef.current?.({ speech: parsed.speech, whiteboard: parsed.whiteboard });
        } else if (parsed.type === 'auth_error') {
          setState('error');
          setLastError('stream_auth_failed');
        }
      } catch {
        // Ignore non-JSON frames.
      }
    };

    ws.onerror = () => {
      setState('error');
      setLastError('stream_socket_error');
    };

    ws.onclose = () => {
      wsRef.current = null;
      setState((prev) => (prev === 'error' ? 'error' : 'idle'));
    };
  }, []);

  const sendAudio = useCallback((base64Audio: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setState('error');
      setLastError('stream_not_connected');
      return;
    }
    ws.send(JSON.stringify({ type: 'audio_frame', base64Audio }));
  }, []);

  const onMessage = useCallback((callback: OnMessageCallback) => {
    onMessageRef.current = callback;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    lastError,
    connect,
    sendAudio,
    onMessage,
    disconnect,
  };
}
