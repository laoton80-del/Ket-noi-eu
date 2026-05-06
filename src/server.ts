/**
 * ViGlobal REST API — Node / Express. Run: `npm run api:dev`
 * Requires: DATABASE_URL, JWT_SECRET (min 16 chars).
 * WebRTC signaling: Socket.IO on the same HTTP server (`/socket.io`).
 */
import 'dotenv/config';

import http from 'node:http';

import { createApp } from './app';
import { attachSignalingServer } from './services/comms/SignalingServer';
import { startMarketingAutoPoster, stopMarketingAutoPoster } from './services/marketing/AutoPoster';
import { flushLogsForShutdown, logger } from './utils/Logger';

const app = createApp();
const port = Number(process.env.API_PORT ?? 8787);

const httpServer = http.createServer(app);
const signalingIo = attachSignalingServer(httpServer);

const server = httpServer.listen(port, () => {
  logger.info({ port }, 'ViGlobal API listening (Socket.IO on same port)');
  if (process.env.MARKETING_AUTO_POSTER_ENABLED !== '0') {
    startMarketingAutoPoster();
  }
});

function shutdown(): void {
  stopMarketingAutoPoster();
  signalingIo.close();
  void flushLogsForShutdown().finally(() => {
    server.close(() => process.exit(0));
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
