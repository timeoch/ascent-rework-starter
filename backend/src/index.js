import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import homepageRouter from './routes/homepage.js';
import { PORT_LISTEN } from '../config/network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = PORT_LISTEN || 4200;
const app = express();

// Use helmet to set common security headers. Disable CSP here to avoid blocking dev assets,
// but recommend enabling a strict CSP in production with proper configuration.
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:4200')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server) when no origin is set.
    if (!origin) return callback(null, true);
    // In production be strict: only allow configured origins. If env contains '*', treat it as explicit wildcard.
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

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
  console.log(`📚 Endpoints disponibles:`);
  console.log(`   GET /api/content/homepage - Contenu de la page d'accueil`);
});

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err && err.stack ? err.stack : err);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});
