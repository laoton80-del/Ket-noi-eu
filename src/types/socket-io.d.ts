import 'socket.io';

declare module 'socket.io' {
  interface SocketData {
    /** ViGlobal REST JWT `sub` — set by {@link attachSignalingServer} middleware. */
    userId?: string;
  }
}
