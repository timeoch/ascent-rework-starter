import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HOMEPAGE_FILE = path.join(__dirname, '../../../data/homepage.json');

let data = null;
try {
  const raw = fs.readFileSync(HOMEPAGE_FILE, 'utf8');
  data = JSON.parse(raw);
} catch (err) {
  console.error('cacheSync: échec du chargement synchrone de homepage.json au démarrage', err && err.stack ? err.stack : err);
  data = null;
}

export default {
  data
};
