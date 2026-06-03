// lib/verify.js
// Hard rule: every reading sentence has a non-empty cites array,
// and every cite points to a real field in data or a real aspect.

import { BODIES, SIGNS } from './ephemeris.js';

const SIGN_SET = new Set(SIGNS);

/**
 * Validate a reading.
 *
 * Cite formats (must be one of these, and must be present in `data` or `aspects`):
 *   - "<planet>:<sign>"   where planet is one of BODIES and sign is one of SIGNS,
 *                          and data[planet] === sign
 *   - "aspect:<a>-<type>" where a is the body-pair field (e.g. "sun-moon") and
 *                          type is the aspect type (e.g. "opposition"),
 *                          matching an entry in `aspects`
 *
 * @param {Array<{text: string, cites: string[]}>} reading
 * @param {Object} data   { sun, moon, mercury, venus, mars, jupiter, saturn } (zodiac signs)
 * @param {Array<{a: string, type: string, orb: number}>} aspects
 * @throws {Error} with sentence index and reason on any failure
 */
export function assertCites(reading, data, aspects) {
  if (!Array.isArray(reading)) {
    throw new Error('reading must be an array');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('data must be an object');
  }
  if (!Array.isArray(aspects)) {
    throw new Error('aspects must be an array');
  }

  // Build the set of valid data cites from the actual data
  const validDataCites = new Set();
  for (const planet of BODIES) {
    const sign = data[planet];
    if (sign && SIGN_SET.has(sign)) {
      validDataCites.add(`${planet}:${sign}`);
    }
  }

  // Build the set of valid aspect cites from the actual aspects
  const validAspectCites = new Set();
  for (const asp of aspects) {
    if (asp && typeof asp.a === 'string' && typeof asp.type === 'string') {
      validAspectCites.add(`aspect:${asp.a}-${asp.type}`);
    }
  }

  reading.forEach((sentence, i) => {
    if (!sentence || typeof sentence.text !== 'string' || sentence.text.trim() === '') {
      throw new Error(`sentence[${i}]: empty or missing text`);
    }
    if (!Array.isArray(sentence.cites) || sentence.cites.length === 0) {
      throw new Error(`sentence[${i}]: cites must be a non-empty array (got ${JSON.stringify(sentence.cites)})`);
    }
    for (const cite of sentence.cites) {
      if (typeof cite !== 'string' || cite === '') {
        throw new Error(`sentence[${i}]: cite must be a non-empty string (got ${JSON.stringify(cite)})`);
      }
      if (cite.startsWith('aspect:')) {
        if (!validAspectCites.has(cite)) {
          throw new Error(
            `sentence[${i}]: cite "${cite}" does not match any aspect ` +
            `(valid: ${[...validAspectCites].join(', ') || '<none>'})`
          );
        }
      } else if (cite.includes(':')) {
        if (!validDataCites.has(cite)) {
          throw new Error(
            `sentence[${i}]: cite "${cite}" does not match any data field ` +
            `(valid: ${[...validDataCites].join(', ')})`
          );
        }
      } else {
        throw new Error(
          `sentence[${i}]: cite "${cite}" must be "<planet>:<sign>" or "aspect:<a>-<type>"`
        );
      }
    }
  });
}
