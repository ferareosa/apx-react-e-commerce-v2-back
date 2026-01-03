import type { Express } from 'express';
import { Router } from 'express';
import authRouter from './auth.js';
import meRouter from './me.js';
import orderRouter from './orders.js';
import pedidosRouter from './pedidos.js';
import productRouter from './products.js';
import searchRouter from './search.js';
import webhookRouter from './webhook.js';

export function registerRoutes(app: Express) {
  const healthRouter = Router();
  healthRouter.get('/', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/me', meRouter);
  app.use('/search', searchRouter);
  app.use('/products', productRouter);
  app.use('/order', orderRouter);
  app.use('/pedidos', pedidosRouter);
  app.use('/ipn', webhookRouter);
  app.use('/api/webhook', webhookRouter);
}
