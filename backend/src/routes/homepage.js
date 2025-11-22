import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import HttpError from '../utils/HttpError.js';
import validateHomepage from '../utils/validateHomepage.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOMEPAGE_FILE = path.join(__dirname, '../../../data/homepage.json');
const CACHE_TTL = parseInt(process.env.HOMEPAGE_CACHE_TTL_MS) || 5 * 60 * 1000;
let cache = { data: null, t: 0 };

async function loadHomepage(force = false) {
  const now = Date.now();
  if (!force && cache.data && now - cache.t < CACHE_TTL) return cache.data;
  try {
    const raw = await fs.readFile(HOMEPAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      console.warn('Le fichier homepage.json est invalide: racine non objet');
      return null;
    }

    // Validate and normalize
    const { data: cleaned, errors } = validateHomepage(parsed);
    if (errors && errors.length > 0) {
      console.warn('Validation warnings for homepage.json:');
      for (const e of errors) console.warn(' -', e.path, ':', e.message);
    }

    cache = { data: cleaned, t: now };
    return cleaned;
  } catch (err) {
    console.error('Erreur lors du chargement de homepage.json', err);
    return null;
  }
}

// GET /api/content/homepage
router.get('/homepage', async (req, res) => {
  try {
    const force = req.query.reload === '1';
    const homepage = await loadHomepage(force);
    if (!homepage) throw new HttpError(404, "Homepage not found", "Contenu de la page d'accueil non trouvé");
    // --- Sanitize & validate input parameters ---
    let { page = 1, limit = 6, category, level, sort = 'date', order = 'desc' } = req.query;
    // Helper sanitize for simple strings (allow letters, numbers, spaces, -, _)
    const sanitizeParam = (v) => {
      if (typeof v !== 'string') return null;
      const s = v.trim();
      if (s.length === 0) return null;
      // remove HTML tags and control characters
      return s.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '').toLowerCase();
    };

    const sanitizeOutputString = (v) => {
      if (typeof v !== 'string') return v;
      return v.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '');
    };

        const sanitizeUrl = (u) => {
          if (typeof u !== 'string') return '';
          const s = u.trim();
          // allow relative paths or absolute http(s) urls only
          if (s.startsWith('/')) return s;
          if (/^https?:\/\//i.test(s)) return s;
          return '';
        };

    page = Number.parseInt(page, 10);
    limit = Number.parseInt(limit, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 6;
    const MAX_LIMIT = 100;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    // sanitize category & level; if invalid, set to null (ignored)
    category = sanitizeParam(category);
    level = sanitizeParam(level);

    // validate sort & order against allowed values
    const ALLOWED_SORTS = new Set(['date', 'price', 'title']);
    const ALLOWED_ORDERS = new Set(['asc', 'desc']);
    sort = sanitizeParam(sort) || 'date';
    if (!ALLOWED_SORTS.has(sort)) sort = 'date';
    order = sanitizeParam(order) || 'desc';
    if (!ALLOWED_ORDERS.has(order)) order = 'desc';

    // Work on a shallow copy of formations
    let formations = Array.isArray(homepage.formations) ? [...homepage.formations] : [];

    // Apply filters (case-insensitive comparison)
    if (category) formations = formations.filter(f => (f.category || '').toLowerCase() === category);
    if (level) formations = formations.filter(f => (f.level || '').toLowerCase() === level);

    // Apply sort
    if (sort === 'date') {
      formations.sort((a, b) => {
        const da = new Date(a.date).getTime() || 0;
        const db = new Date(b.date).getTime() || 0;
        return order === 'asc' ? da - db : db - da;
      });
    } else if (sort === 'price') {
      formations.sort((a, b) => {
        const pa = Number(a.price) || 0;
        const pb = Number(b.price) || 0;
        return order === 'asc' ? pa - pb : pb - pa;
      });
    } else if (sort === 'title') {
      formations.sort((a, b) => {
        const ta = String(a.title || '').toLowerCase();
        const tb = String(b.title || '').toLowerCase();
        if (ta < tb) return order === 'asc' ? -1 : 1;
        if (ta > tb) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = formations.length;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const start = (page - 1) * limit;
    const paginated = formations.slice(start, start + limit).map(f => {
      // sanitize output fields to reduce XSS risk
      return {
        id: f.id,
        title: sanitizeOutputString(f.title || ''),
        description: sanitizeOutputString(f.description || ''),
        category: sanitizeOutputString(f.category || ''),
        level: sanitizeOutputString(f.level || ''),
        duration: f.duration,
        price: f.price,
        image: sanitizeUrl(f.image || ''),
        date: f.date,
        instructor: sanitizeOutputString(f.instructor || '')
      };
    });

    // Helper to build page URLs preserving filters and sort
    const buildPageUrl = (p) => {
      try {
        const base = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        const url = new URL(base);
        url.searchParams.set('page', String(p));
        url.searchParams.set('limit', String(limit));
        if (category) url.searchParams.set('category', category);
        if (level) url.searchParams.set('level', level);
        if (sort) url.searchParams.set('sort', sort);
        if (order) url.searchParams.set('order', order);
        return url.toString();
      } catch (e) {
        return null;
      }
    };

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 && totalPages > 0 ? page - 1 : null,
      nextUrl: page < totalPages ? buildPageUrl(page + 1) : null,
      prevUrl: page > 1 && totalPages > 0 ? buildPageUrl(page - 1) : null
    };

    // Sanitize hero
    const hero = homepage.hero ? {
      title: sanitizeOutputString(homepage.hero.title || ''),
      subtitle: sanitizeOutputString(homepage.hero.subtitle || ''),
      cta: {
        text: sanitizeOutputString((homepage.hero.cta && homepage.hero.cta.text) || ''),
        link: sanitizeUrl((homepage.hero.cta && homepage.hero.cta.link) || '')
      }
    } : null;

    res.json({
      success: true,
      data: {
        hero,
        formations: paginated,
        pagination
      }
    });
  } catch (err) {
    // log server-side detail then forward a generic error to the handler
    console.error('Erreur endpoint /api/content/homepage', err && err.stack ? err.stack : err);
    // If it's already an HttpError, rethrow to be handled by centralized handler
    if (err && err.name === 'HttpError') throw err;
    throw new HttpError(500, err && err.message ? String(err.message) : 'Internal error', 'Erreur lors du chargement de la page d\'accueil');
  }
});

export default router;
