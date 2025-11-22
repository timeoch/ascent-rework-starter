import fs from 'fs';

export default function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err && err.status && Number.isFinite(Number(err.status)) ? Number(err.status) : 500;

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
    console.error(JSON.stringify(log));
  } catch (e) {
    console.error('Error logging failed', e);
  }

  const clientMessage = (() => {
    if (isProd) {
      if (err && err.publicMessage) return err.publicMessage;
      if (status === 404) return 'Ressource non trouvée';
      if (status >= 400 && status < 500) return 'Requête invalide';
      return 'Erreur interne du serveur';
    }
    return err && err.publicMessage ? err.publicMessage : (err && err.message ? String(err.message) : 'Erreur interne du serveur');
  })();

  res.status(status).json({ success: false, error: clientMessage });
}
