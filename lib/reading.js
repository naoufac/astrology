// lib/reading.js
// Compute aspects and generate a cited reading.
// Every sentence MUST have at least one cite that verifies against data/aspects.

import { BODIES } from './ephemeris.js';

const ASPECT_LABELS = {
  conjunction: 'conjunction',
  opposition:  'opposition',
  trine:       'trine',
  square:      'square',
  sextile:     'sextile'
};

const ASPECT_ANGLES = [
  { name: 'conjunction', angle: 0   },
  { name: 'sextile',     angle: 60  },
  { name: 'square',      angle: 90  },
  { name: 'trine',       angle: 120 },
  { name: 'opposition',  angle: 180 }
];

/**
 * Compute aspects between the 7 bodies, using raw longitudes (0..360).
 * Pair order is canonical (BODIES order), so "sun-moon" never "moon-sun".
 * Returns up to N aspects sorted by tightness (smallest orb first).
 */
export function computeAspects(longitudes, { orb = 6, limit = Infinity } = {}) {
  const out = [];
  for (let i = 0; i < BODIES.length; i++) {
    for (let j = i + 1; j < BODIES.length; j++) {
      const a = BODIES[i], b = BODIES[j];
      const diff = Math.abs(longitudes[a] - longitudes[b]);
      const sep  = Math.min(diff, 360 - diff);
      for (const t of ASPECT_ANGLES) {
        const dev = Math.abs(sep - t.angle);
        if (dev <= orb) {
          out.push({ a: `${a}-${b}`, type: t.name, orb: +dev.toFixed(2) });
          break; // only the closest aspect for this pair
        }
      }
    }
  }
  out.sort((x, y) => x.orb - y.orb);
  return out.slice(0, limit);
}

/**
 * Generate a cited reading for `queriedSign` on `date`.
 * `data`   : { sun, moon, mercury, venus, mars, jupiter, saturn } zodiac signs
 * `aspects`: array of {a, type, orb}
 *
 * Hard rule: every returned sentence has at least one cite that verifies
 * against data/aspects (see lib/verify.js). No uncited sentences ship.
 */
export function generateReading(queriedSign, date, data, aspects) {
  const reading = [];
  const safeSign = String(queriedSign).toLowerCase();

  // 1. Sun sentence — always cite data.sun
  reading.push({
    text: `The Sun in ${data.sun} shapes today's tone.`,
    cites: [`sun:${data.sun}`]
  });

  // 2. Moon sentence
  reading.push({
    text: `The Moon in ${data.moon} colors the emotional field.`,
    cites: [`moon:${data.moon}`]
  });

  // 3. Mercury sentence
  reading.push({
    text: `Mercury in ${data.mercury} sharpens the mind today.`,
    cites: [`mercury:${data.mercury}`]
  });

  // 4-6. Aspect sentences — top 3 by tightness
  const topAspects = (aspects || []).slice(0, 3);
  for (const asp of topAspects) {
    const [a, b] = asp.a.split('-');
    const label = ASPECT_LABELS[asp.type] || asp.type;
    reading.push({
      text: `A ${label} between ${a} and ${b} within ${asp.orb}° colors today's tone.`,
      cites: [`aspect:${asp.a}-${asp.type}`]
    });
  }

  // 7. Sign-specific line — anchored to data.sun (the day-ruler)
  reading.push({
    text: `As a ${safeSign}, the current Sun in ${data.sun} invites you to lead with curiosity.`,
    cites: [`sun:${data.sun}`]
  });

  return reading;
}
