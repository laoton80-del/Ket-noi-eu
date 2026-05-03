/**
 * Serializable WebRTC signaling payloads (Socket.IO). Media/audio stays peer-to-peer.
 */

export type SessionDescriptionWire = Readonly<{
  type: string;
  sdp?: string;
}>;

export type IceCandidateWire = Readonly<{
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
}>;

export type WebRtcSignalPayload =
  | Readonly<{ kind: 'offer'; sdp: SessionDescriptionWire }>
  | Readonly<{ kind: 'answer'; sdp: SessionDescriptionWire }>
  | Readonly<{ kind: 'ice'; candidate: IceCandidateWire | null }>;

export type CallJoinPayload = Readonly<{
  roomId: string;
  role: 'tourist' | 'merchant';
  displayName?: string;
}>;

export type CallLeavePayload = Readonly<{
  roomId: string;
}>;

export type WebrtcSignalEnvelope = Readonly<{
  roomId: string;
  signal: WebRtcSignalPayload;
}>;

export type PeerJoinedEvent = Readonly<{
  socketId: string;
  role: 'tourist' | 'merchant';
  displayName?: string;
}>;

export type PeersReadyEvent = Readonly<{
  roomId: string;
}>;

export type WebrtcSignalIncoming = Readonly<{
  from: string;
  signal: WebRtcSignalPayload;
}>;

export type PeerLeftEvent = Readonly<{
  socketId: string;
}>;
