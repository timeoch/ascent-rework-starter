import fs from 'fs';

// Express error-handling middleware
export default function errorHandler(err, req, res, next) { // eslint-disable-line
  const isProd = process.env.NODE_ENV === 'production';
  const status = err && err.status && Number.isFinite(Number(err.status)) ? Number(err.status) : 500;

  // Structured log
  const log = {
    time: new Date().toISOString(),
    pid: process.pid,
    level: status >= 500 ? 'error' : 'warn',
    status,
    method: req.method,
    path: req.originalUrl || req.url,
    message: err && err.message ? String(err.message) : 'Unknown error'
  };

  if (!isProd && err && err.stack) {
    log.stack = err.stack;
  }

  try {
    // write structured log to stderr as JSON (can be picked by log collector)
    console.error(JSON.stringify(log));
  } catch (e) {
    console.error('Error logging failed', e);
  }

  // Do not leak internal messages in production
  const clientMessage = (() => {
    if (isProd) {
      if (err && err.publicMessage) return err.publicMessage;
      if (status === 404) return 'Ressource non trouvée';
      if (status >= 400 && status < 500) return 'Requête invalide';
      return 'Erreur interne du serveur';
    }
    // non prod: return error message for easier debugging
    return err && err.publicMessage ? err.publicMessage : (err && err.message ? String(err.message) : 'Erreur interne du serveur');
  })();

  res.status(status).json({ success: false, error: clientMessage });
}
