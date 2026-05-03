import cors from 'cors';
import express from 'express';

import { buildExpressCorsOptions, getTrustProxyHops } from './config/httpSecurity';
import * as StripeWebhookController from './controllers/StripeWebhookController';
import { pathAwareApiRateLimiter } from './middleware/RateLimitMiddleware';
import { adminRouter } from './routes/adminRoutes';
import { aiRouter } from './routes/aiRoutes';
import { bookingRouter } from './routes/bookingRoutes';
import { authRouter } from './routes/authRoutes';
import { businessRouter } from './routes/businessRoutes';
import { charityRouter } from './routes/charityRoutes';
import { educationRouter } from './routes/educationRoutes';
import { mediaRouter } from './routes/mediaRoutes';
import { payRouter } from './routes/payRoutes';
import { userRouter } from './routes/userRoutes';
import { brokerRouter } from './routes/brokerRoutes';
import { tourismRouter } from './routes/tourismRoutes';
import { walletRouter } from './routes/walletRoutes';
import { jsonFail } from './utils/apiEnvelope';
import { logger } from './utils/Logger';

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', getTrustProxyHops());
  app.disable('x-powered-by');
  app.use(cors(buildExpressCorsOptions()));

  /** Stripe signature verification requires the raw body — must run before `express.json`. */
  app.post(
    '/api/pay/webhook/stripe',
    express.raw({ type: 'application/json', limit: '1mb' }),
    (req, res, next) => {
      void StripeWebhookController.postStripeWebhook(req, res).catch(next);
    }
  );

  app.use(express.json({ limit: '512kb' }));

  app.use(pathAwareApiRateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } } as const);
  });

  app.use('/api/auth', authRouter);
  app.use('/api/charity', charityRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/users', userRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/pay', payRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/tourism', tourismRouter);
  app.use('/api/broker', brokerRouter);
  app.use('/api/business', businessRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/edu', educationRouter);
  app.use('/api/media', mediaRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Not found' } as const);
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ): void => {
      logger.error({ err }, '[api] unhandled error');
      jsonFail(res, 'Internal server error', 500);
    }
  );

  return app;
}
