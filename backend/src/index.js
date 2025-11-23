import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import HttpError from './utils/HttpError.js';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import homepageRouter from './routes/homepage.js';
import { PORT_LISTEN } from '../config/network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = PORT_LISTEN || 4200;
import app from './server.js';

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
    console.log(`📚 Endpoints disponibles:`);
    console.log(`   GET /api/content/homepage - Contenu de la page d'accueil`);
  });
}
