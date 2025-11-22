// Validation and normalization for homepage data
// Exports a function validateHomepage(raw) -> { data, errors }

function sanitizeString(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function isIsoDate(v) {
  if (typeof v !== 'string') return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(v);
}

function sanitizeUrl(u) {
  if (typeof u !== 'string') return '';
  const s = u.trim();
  if (s === '') return '';
  if (s.startsWith('/')) return s;
  try {
    const parsed = new URL(s);
    if (!/^https?:$/i.test(parsed.protocol)) return '';
    return parsed.toString();
  } catch (e) {
    return '';
  }
}

export default function validateHomepage(raw) {
  const errors = [];
  const result = { hero: null, formations: [] };

  if (!raw || typeof raw !== 'object') {
    errors.push({ path: '/', message: 'Root must be an object' });
    return { data: result, errors };
  }

  // Hero
  const hero = raw.hero || {};
  const heroTitle = sanitizeString(hero.title);
  const heroSubtitle = sanitizeString(hero.subtitle);
  const heroCtaText = sanitizeString(hero.cta && hero.cta.text);
  const heroCtaLink = sanitizeUrl(hero.cta && hero.cta.link);
  if (!heroTitle) errors.push({ path: 'hero.title', message: 'Hero title is missing or empty' });
  result.hero = {
    title: heroTitle,
    subtitle: heroSubtitle,
    cta: { text: heroCtaText, link: heroCtaLink }
  };

  // Formations
  const items = Array.isArray(raw.formations) ? raw.formations : [];
  if (!Array.isArray(raw.formations)) {
    errors.push({ path: 'formations', message: 'formations must be an array' });
  }

  // track ids and generate ids when missing/duplicate
  const seenIds = new Set();
  let maxId = 0;
  // calculate initial maxId from numeric ids
  for (const it of items) {
    const id = Number(it && it.id);
    if (Number.isFinite(id) && id > maxId) maxId = id;
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const pathBase = `formations[${i}]`;

    // id
    let id = it.id;
    if (!Number.isFinite(Number(id))) {
      maxId += 1;
      id = maxId;
      errors.push({ path: `${pathBase}.id`, message: `Missing or invalid id — assigned ${id}` });
    } else {
      id = Number(id);
      if (seenIds.has(id)) {
        maxId += 1;
        const newId = maxId;
        errors.push({ path: `${pathBase}.id`, message: `Duplicate id ${id} — reassigned to ${newId}` });
        id = newId;
      }
    }
    seenIds.add(id);
    if (id > maxId) maxId = id;

    // title
    const title = sanitizeString(it.title);
    if (!title) errors.push({ path: `${pathBase}.title`, message: 'Missing or empty title' });

    // description
    const description = sanitizeString(it.description);

    // category & level
    const category = sanitizeString(it.category);
    const level = sanitizeString(it.level);
    if (!category) errors.push({ path: `${pathBase}.category`, message: 'Missing or empty category' });
    if (!level) errors.push({ path: `${pathBase}.level`, message: 'Missing or empty level' });

    // duration
    let duration = Number(it.duration);
    if (!Number.isFinite(duration) || duration < 0) {
      duration = null;
      errors.push({ path: `${pathBase}.duration`, message: 'Invalid duration' });
    }

    // price
    let price = Number(it.price);
    if (!Number.isFinite(price) || price < 0) {
      price = null;
      errors.push({ path: `${pathBase}.price`, message: 'Invalid price' });
    }

    // image
    const image = sanitizeUrl(it.image || '');
    if ((it.image || '') && !image) {
      errors.push({ path: `${pathBase}.image`, message: 'Invalid image URL' });
    }

    // date
    const dateRaw = sanitizeString(it.date);
    const date = isIsoDate(dateRaw) ? dateRaw : '';
    if (dateRaw && !date) errors.push({ path: `${pathBase}.date`, message: 'Invalid date format (expected ISO YYYY-MM-DD)' });

    // instructor
    const instructor = sanitizeString(it.instructor);

    result.formations.push({
      id,
      title,
      description,
      category,
      level,
      duration,
      price,
      image,
      date,
      instructor
    });
  }

  return { data: result, errors };
}
