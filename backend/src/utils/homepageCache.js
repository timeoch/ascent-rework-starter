import fs from 'fs/promises';
import fsWatch from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import validateHomepage from './validateHomepage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HOMEPAGE_FILE = path.join(__dirname, '../../../data/homepage.json');

const DEFAULT_DEBOUNCE_MS = 200;

let cache = { data: null, loadedAt: 0 };
let loadingPromise = null;
let metrics = {
  hits: 0,
  misses: 0,
  loads: 0,
  lastLoadMs: 0,
  lastLoadAt: null
};

async function loadNow() {
  const start = Date.now();
  metrics.loads += 1;
  try {
    const raw = await fs.readFile(HOMEPAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const { data: cleaned, errors } = validateHomepage(parsed);
    if (errors && errors.length) {
      console.warn('homepageCache : avertissements de validation :');
      for (const e of errors) console.warn(' -', e.path, ':', e.message);
    }
    cache = { data: cleaned, loadedAt: Date.now() };
    metrics.lastLoadMs = Date.now() - start;
    metrics.lastLoadAt = new Date().toISOString();
    return cleaned;
  } catch (err) {
    console.error('homepageCache : échec du chargement', err && err.stack ? err.stack : err);
    metrics.lastLoadMs = Date.now() - start;
    metrics.lastLoadAt = new Date().toISOString();
    throw err;
  }
}

async function ensureLoaded() {
  if (cache.data) return cache.data;
  if (loadingPromise) {
    metrics.misses += 1;
    return loadingPromise;
  }
  metrics.misses += 1;
  loadingPromise = loadNow().finally(() => { loadingPromise = null; });
  return loadingPromise;
}

function get() {
  if (cache.data) {
    metrics.hits += 1;
    return { data: cache.data, loadedAt: cache.loadedAt };
  }
  return ensureLoaded();
}

async function reload() {
  if (loadingPromise) return loadingPromise;
  loadingPromise = loadNow().finally(() => { loadingPromise = null; });
  return loadingPromise;
}

function getMetrics() {
  return { ...metrics };
}

try {
  const watcher = fsWatch.watch(HOMEPAGE_FILE, { persistent: false }, (eventType) => {
    if (eventType !== 'change') return;
    if (watcher._debounceTimer) clearTimeout(watcher._debounceTimer);
    watcher._debounceTimer = setTimeout(() => {
      reload().catch(() => {});
    }, DEFAULT_DEBOUNCE_MS);
  });
  watcher.on('error', (err) => {
    console.warn('homepageCache : erreur du watcher :', err && err.stack ? err.stack : err);
  });
} catch (e) {
  console.warn('homepageCache : fs.watch non disponible, rechargement automatique désactivé', e && e.stack ? e.stack : e);
}

loadingPromise = loadNow().finally(() => { loadingPromise = null; });

export default {
  get,
  reload,
  getMetrics
};
