import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import HttpError from '../utils/HttpError.js';
import validateHomepage from '../utils/validateHomepage.js';
import homepageCache from '../utils/homepageCache.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOMEPAGE_FILE = path.join(__dirname, '../../../data/homepage.json');
const CACHE_TTL = parseInt(process.env.HOMEPAGE_CACHE_TTL_MS) || 5 * 60 * 1000;
let cache = { data: null, t: 0 };

async function loadHomepage(force = false) {
  try {
    if (force) {
      await homepageCache.reload();
    }
    const maybe = homepageCache.get();
    const result = (maybe && typeof maybe.then === 'function') ? await maybe : maybe.data || maybe;
    return result;
  } catch (err) {
    console.error('Erreur lors du chargement de homepage.json', err && err.stack ? err.stack : err);
    return null;
  }
}

// GET /api/content/homepage
router.get('/homepage', async (req, res) => {
  try {
    const force = req.query.reload === '1';
    const homepage = await loadHomepage(force);
    if (!homepage) throw new HttpError(404, "Homepage not found", "Contenu de la page d'accueil non trouvé");
    let { page = 1, limit = 6, category, level, sort = 'date', order = 'desc' } = req.query;
    const sanitizeParam = (v) => {
      if (typeof v !== 'string') return null;
      const s = v.trim();
      if (s.length === 0) return null;
      return s.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '').toLowerCase();
    };

    const sanitizeOutputString = (v) => {
      if (typeof v !== 'string') return v;
      return v.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '');
    };

        const sanitizeUrl = (u) => {
          if (typeof u !== 'string') return '';
          const s = u.trim();
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

    category = sanitizeParam(category);
    level = sanitizeParam(level);

    const ALLOWED_SORTS = new Set(['date', 'price', 'title']);
    const ALLOWED_ORDERS = new Set(['asc', 'desc']);
    sort = sanitizeParam(sort) || 'date';
    if (!ALLOWED_SORTS.has(sort)) sort = 'date';
    order = sanitizeParam(order) || 'desc';
    if (!ALLOWED_ORDERS.has(order)) order = 'desc';

    let formations = Array.isArray(homepage.formations) ? [...homepage.formations] : [];

    if (category) formations = formations.filter(f => (f.category || '').toLowerCase() === category);
    if (level) formations = formations.filter(f => (f.level || '').toLowerCase() === level);

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
    console.error('Erreur endpoint /api/content/homepage', err && err.stack ? err.stack : err);
    if (err && err.name === 'HttpError') throw err;
    throw new HttpError(500, err && err.message ? String(err.message) : 'Internal error', 'Erreur lors du chargement de la page d\'accueil');
  }
});

// GET /api/content/homepage/metrics
router.get('/homepage/metrics', (req, res) => {
  try {
    const m = homepageCache.getMetrics();
    res.json({ success: true, data: m });
  } catch (err) {
    console.error('Failed to get homepage metrics', err && err.stack ? err.stack : err);
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

export default router;
