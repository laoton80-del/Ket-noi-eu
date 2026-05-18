import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  type MediaStream,
} from 'react-native-webrtc';
import RTCIceCandidateEvent from 'react-native-webrtc/lib/typescript/RTCIceCandidateEvent';
import RTCTrackEvent from 'react-native-webrtc/lib/typescript/RTCTrackEvent';

import { getRestApiJwt } from '../apiClient';
import { getSignalingBaseUrl } from './signalingBaseUrl';
import type { VoiceTranslationBridge } from './VoiceTranslationBridge';
import type { WebRtcSignalPayload, WebrtcSignalIncoming } from './webrtcSignalingTypes';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function toSessionDesc(w: { type: string; sdp?: string }): RTCSessionDescription {
  return new RTCSessionDescription({
    type: w.type as RTCSessionDescription['type'],
    sdp: w.sdp ?? '',
  });
}

/** Typings omit legacy `on*` handlers; runtime supports them (see RN WebRTC impl). */
type RTCPeerConnectionWithHandlers = RTCPeerConnection & {
  onicecandidate: ((ev: RTCIceCandidateEvent<'icecandidate'>) => void) | null;
  ontrack: ((ev: RTCTrackEvent<'track'>) => void) | null;
};

export type P2PCallControls = Readonly<{
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: string;
  signalingConnected: boolean;
  setMuted: (muted: boolean) => void;
  hangUp: () => void;
}>;

export function useP2PVoiceCall(input: Readonly<{
  roomId: string;
  role: 'tourist' | 'merchant';
  isOfferer: boolean;
  bridge: VoiceTranslationBridge;
  onError: (message: string) => void;
}>): P2PCallControls {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [signalingConnected, setSignalingConnected] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const offerSentRef = useRef(false);
  const isOffererRef = useRef(input.isOfferer);
  const roomIdRef = useRef(input.roomId.trim());
  const roleRef = useRef(input.role);
  const bridgeRef = useRef(input.bridge);
  const onErrorRef = useRef(input.onError);

  useEffect(() => {
    isOffererRef.current = input.isOfferer;
    roomIdRef.current = input.roomId.trim();
    roleRef.current = input.role;
    bridgeRef.current = input.bridge;
    onErrorRef.current = input.onError;
  }, [input.isOfferer, input.roomId, input.role, input.bridge, input.onError]);

  const teardown = useCallback(() => {
    offerSentRef.current = false;
    try {
      localStreamRef.current?.getTracks().forEach((t) => {
        t.stop();
      });
    } catch {
      /* noop */
    }
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    try {
      pcRef.current?.getSenders().forEach((s) => {
        try {
          s.track?.stop();
        } catch {
          /* noop */
        }
      });
      pcRef.current?.close();
    } catch {
      /* noop */
    }
    pcRef.current = null;
    try {
      const s = socketRef.current;
      if (s?.connected) {
        s.emit('call:leave', { roomId: roomIdRef.current });
        s.disconnect();
      }
    } catch {
      /* noop */
    }
    socketRef.current = null;
    setSignalingConnected(false);
    bridgeRef.current.dispose();
  }, []);

  useEffect(() => {
    const roomId = roomIdRef.current;
    if (!roomId) {
      onErrorRef.current('Missing call room id.');
      return () => undefined;
    }

    const base = getSignalingBaseUrl();
    if (!base) {
      onErrorRef.current('Chưa cấu hình EXPO_PUBLIC_REST_API_BASE hoặc EXPO_PUBLIC_SIGNALING_URL.');
      return () => undefined;
    }

    let cancelled = false;

    void (async () => {
      try {
        const jwt = await getRestApiJwt();
        if (!jwt) {
          onErrorRef.current('Cần đăng nhập (JWT VIONA API) để kết nối thoại P2P.');
          return;
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        const pcHandlers = pc as RTCPeerConnectionWithHandlers;
        const pcEvents = pc as unknown as EventTarget;
        pcEvents.addEventListener('connectionstatechange', () => {
          setConnectionState(pc.connectionState);
        });

        pcHandlers.onicecandidate = (ev: RTCIceCandidateEvent<'icecandidate'>) => {
          const sock = socketRef.current;
          if (!sock?.connected) return;
          const c = ev.candidate;
          sock.emit('webrtc:signal', {
            roomId,
            signal: {
              kind: 'ice',
              candidate: c
                ? {
                    candidate: c.candidate ?? undefined,
                    sdpMLineIndex: c.sdpMLineIndex ?? undefined,
                    sdpMid: c.sdpMid ?? undefined,
                  }
                : null,
            },
          });
        };

        pcHandlers.ontrack = (ev: RTCTrackEvent<'track'>) => {
          const ms = ev.streams[0];
          if (ms) {
            setRemoteStream(ms);
            bridgeRef.current.attachRemoteStream(ms);
          }
        };

        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        bridgeRef.current.attachLocalStream(stream);
        stream.getTracks().forEach((t) => {
          pc.addTrack(t, stream);
        });

        const socket = io(base, {
          path: '/socket.io',
          transports: ['websocket'],
          reconnectionAttempts: 5,
          auth: { token: jwt },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          if (cancelled) return;
          setSignalingConnected(true);
          socket.emit('call:join', {
            roomId,
            role: roleRef.current,
          });
        });

        socket.on('connect_error', (err: Error) => {
          onErrorRef.current(err.message || 'Signaling connection failed');
        });

        const emitSignal = (signal: WebRtcSignalPayload) => {
          socket.emit('webrtc:signal', { roomId, signal });
        };

        const handleRemoteSignal = async (msg: WebrtcSignalIncoming) => {
          const active = pcRef.current;
          if (!active || cancelled) return;

          if (msg.signal.kind === 'offer') {
            await active.setRemoteDescription(toSessionDesc(msg.signal.sdp));
            const answer = await active.createAnswer();
            await active.setLocalDescription(answer);
            emitSignal({
              kind: 'answer',
              sdp: { type: answer.type, sdp: answer.sdp ?? undefined },
            });
            return;
          }

          if (msg.signal.kind === 'answer') {
            await active.setRemoteDescription(toSessionDesc(msg.signal.sdp));
            return;
          }

          if (msg.signal.kind === 'ice') {
            const c = msg.signal.candidate;
            if (c?.candidate && c.candidate.length > 0) {
              try {
                await active.addIceCandidate(
                  new RTCIceCandidate({
                    candidate: c.candidate,
                    sdpMLineIndex: c.sdpMLineIndex ?? undefined,
                    sdpMid: c.sdpMid ?? undefined,
                  })
                );
              } catch {
                /* ignore stale ICE */
              }
            }
          }
        };

        socket.on('webrtc:signal', (msg: WebrtcSignalIncoming) => {
          void handleRemoteSignal(msg).catch((e: unknown) => {
            onErrorRef.current(e instanceof Error ? e.message : 'WebRTC signaling error');
          });
        });

        const sendOffer = async () => {
          const active = pcRef.current;
          if (!active || cancelled || offerSentRef.current) return;
          const offer = await active.createOffer({ offerToReceiveAudio: true });
          await active.setLocalDescription(offer);
          offerSentRef.current = true;
          emitSignal({
            kind: 'offer',
            sdp: { type: offer.type, sdp: offer.sdp ?? undefined },
          });
        };

        socket.on('call:peers-ready', () => {
          if (cancelled || !isOffererRef.current) return;
          void sendOffer().catch((e: unknown) => {
            onErrorRef.current(e instanceof Error ? e.message : 'Failed to create offer');
          });
        });

      } catch (e: unknown) {
        onErrorRef.current(e instanceof Error ? e.message : 'Microphone / WebRTC error');
      }
    })();

    return () => {
      cancelled = true;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single mount; room/role via refs
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }, []);

  const hangUp = useCallback(() => {
    teardown();
  }, [teardown]);

  return {
    localStream,
    remoteStream,
    connectionState,
    signalingConnected,
    setMuted,
    hangUp,
  };
}
