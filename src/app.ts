import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  registerRoutes(app);
  app.use(errorHandler);

  return app;
}
