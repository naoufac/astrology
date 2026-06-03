// server.js
// Fastify app: GET /api/horoscope?sign=...&date=YYYY-MM-DD
// Cites are verified on the server before any reading ships to the client.

import Fastify from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { planetaryPositions, planetaryLongitudes, BODIES, SIGNS } from './lib/ephemeris.js';
import { computeAspects, generateReading } from './lib/reading.js';
import { assertCites } from './lib/verify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = path.join(__dirname, 'data');
const CACHE_PATH = path.join(DATA_DIR, 'cache.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const SIGN_SET = new Set(SIGNS);
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;

async function loadCache() {
  try {
    const txt = await fs.readFile(CACHE_PATH, 'utf8');
    return JSON.parse(txt);
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

/**
 * Convert a YYYY-MM-DD string into a UTC Date at noon
 * (noon avoids most timezone-edge issues for daily readings).
 */
function parseDateLocalNoon(yyyyMmDd) {
  if (!DATE_RE.test(yyyyMmDd)) return null;
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth()    !== m - 1 ||
    dt.getUTCDate()     !== d
  ) return null;
  return dt;
}

function todayUtcDateString() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

async function buildHoroscope(sign, date) {
  const cache = await loadCache();
  const key = `${date}|${sign}`;
  if (cache[key]) return cache[key];

  const dateObj = parseDateLocalNoon(date);
  if (!dateObj) throw Object.assign(new Error(`invalid date: ${date}`), { statusCode: 400 });

  const data    = planetaryPositions(dateObj);
  const lons    = planetaryLongitudes(dateObj);
  const aspects = computeAspects(lons, { orb: 6 });
  const reading = generateReading(sign, date, data, aspects);

  // Hard rule: ship only cited sentences.
  assertCites(reading, data, aspects);

  const payload = { sign, date, data, aspects, reading };
  cache[key] = payload;
  await saveCache(cache);
  return payload;
}

const app = Fastify({ logger: false });

app.get('/api/horoscope', async (req, reply) => {
  const { sign, date } = req.query || {};
  const normSign = String(sign || '').toLowerCase();
  if (!SIGN_SET.has(normSign)) {
    return reply.code(400).send({ error: `invalid sign: ${sign}` });
  }
  const useDate = date || todayUtcDateString();
  try {
    const result = await buildHoroscope(normSign, useDate);
    return result;
  } catch (err) {
    req.log?.error?.(err);
    const code = err.statusCode || 500;
    return reply.code(code).send({ error: err.message });
  }
});

app.get('/api/health', async () => ({ ok: true, bodies: BODIES.length, signs: SIGNS.length }));

// Serve /public statically (no extra plugin — read & dispatch)
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon'
};
app.get('/*', async (req, reply) => {
  let p = req.params && req.params['*'];
  if (!p || p === '') p = 'index.html';
  // prevent path traversal
  if (p.includes('..')) return reply.code(400).send('bad path');
  const full = path.join(PUBLIC_DIR, p);
  try {
    const body = await fs.readFile(full);
    const ext = path.extname(full).toLowerCase();
    reply.type(MIME[ext] || 'application/octet-stream').send(body);
  } catch {
    return reply.code(404).send('not found');
  }
});

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST })
  .then(addr => console.log(`astrology app listening on ${addr}`))
  .catch(err => { console.error(err); process.exit(1); });
