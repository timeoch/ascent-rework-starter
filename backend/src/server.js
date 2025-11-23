import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import HttpError from './utils/HttpError.js';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import homepageRouter from './routes/homepage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:4200')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use('/api/content', homepageRouter);

app.use((req, res, next) => {
  next(new HttpError(404, 'Not Found', 'Route non trouvée'));
});

app.use(errorHandler);

export default app;
