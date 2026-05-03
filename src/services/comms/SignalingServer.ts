/**
 * WebRTC signaling only — audio/video RTP is peer-to-peer. Socket.IO on the shared HTTP server.
 * Connections require a ViGlobal REST JWT; rooms must be canonical `vg|<idLow>|<idHigh>` (see {@link userBelongsToP2PRoom}).
 */

import type { Server as HTTPServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server as IOServer, type Socket } from 'socket.io';

import { buildSocketIoCorsOrigin } from '../../config/httpSecurity';
import type {
  CallJoinPayload,
  CallLeavePayload,
  PeerJoinedEvent,
  PeerLeftEvent,
  PeersReadyEvent,
  WebrtcSignalEnvelope,
  WebrtcSignalIncoming,
} from './webrtcSignalingTypes';
import { userBelongsToP2PRoom } from './p2pSignalingRoom';

const SIGNALING_PATH = '/socket.io';

type SocketAuthPayload = Readonly<{ token?: unknown }>;

function readHandshakeToken(socket: Socket): string {
  const auth = socket.handshake.auth as SocketAuthPayload | undefined;
  const fromAuth = typeof auth?.token === 'string' ? auth.token.trim() : '';
  if (fromAuth.length > 0) return fromAuth;
  const h = socket.handshake.headers.authorization;
  const raw = Array.isArray(h) ? h[0] : h;
  if (typeof raw !== 'string') return '';
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ?? '';
}

function verifiedUserIdFromJwt(token: string): string | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 16) return null;
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    const sub = decoded.sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

function isInRoom(socket: Socket, roomId: string): boolean {
  return socket.rooms.has(roomId);
}

function getSocketUserId(socket: Socket): string | null {
  const id = socket.data.userId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/**
 * Attach Socket.IO to the Node HTTP server (same port as Express).
 * CORS mirrors {@link buildExpressCorsOptions} via `API_CORS_ORIGINS` / NODE_ENV.
 */
export function attachSignalingServer(httpServer: HTTPServer): IOServer {
  const io = new IOServer(httpServer, {
    path: SIGNALING_PATH,
    cors: { origin: buildSocketIoCorsOrigin(), methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = readHandshakeToken(socket);
    if (!token) {
      next(new Error('auth_token_required'));
      return;
    }
    const userId = verifiedUserIdFromJwt(token);
    if (!userId) {
      next(new Error('unauthorized'));
      return;
    }
    socket.data.userId = userId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    socket.on('call:join', (payload: CallJoinPayload) => {
      const roomId = typeof payload?.roomId === 'string' ? payload.roomId.trim() : '';
      const userId = getSocketUserId(socket);
      if (!roomId || !userId) return;
      if (!userBelongsToP2PRoom(userId, roomId)) return;

      void socket.join(roomId);

      const joined: PeerJoinedEvent = {
        socketId: socket.id,
        role: payload.role === 'merchant' ? 'merchant' : 'tourist',
        displayName: typeof payload.displayName === 'string' ? payload.displayName : undefined,
      };
      socket.to(roomId).emit('peer:joined', joined);

      const size = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
      if (size >= 2) {
        const ready: PeersReadyEvent = { roomId };
        io.to(roomId).emit('call:peers-ready', ready);
      }
    });

    socket.on('webrtc:signal', (payload: WebrtcSignalEnvelope) => {
      const roomId = typeof payload?.roomId === 'string' ? payload.roomId.trim() : '';
      const userId = getSocketUserId(socket);
      if (!roomId || !userId || !payload?.signal) return;
      if (!userBelongsToP2PRoom(userId, roomId)) return;
      if (!isInRoom(socket, roomId)) return;

      const outgoing: WebrtcSignalIncoming = {
        from: socket.id,
        signal: payload.signal,
      };
      socket.to(roomId).emit('webrtc:signal', outgoing);
    });

    socket.on('call:leave', (payload: CallLeavePayload) => {
      const roomId = typeof payload?.roomId === 'string' ? payload.roomId.trim() : '';
      const userId = getSocketUserId(socket);
      if (!roomId || !userId) return;
      if (!userBelongsToP2PRoom(userId, roomId)) return;
      void socket.leave(roomId);
      const left: PeerLeftEvent = { socketId: socket.id };
      socket.to(roomId).emit('peer:left', left);
    });

    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;
        const left: PeerLeftEvent = { socketId: socket.id };
        socket.to(roomId).emit('peer:left', left);
      }
    });
  });

  return io;
}
