// test/test-verify.js
// Run assertCites against readings generated for several sign+date combos.
// Exits 0 on success, 1 on failure.

import { planetaryLongitudes, planetaryPositions } from '../lib/ephemeris.js';
import { computeAspects, generateReading } from '../lib/reading.js';
import { assertCites } from '../lib/verify.js';

const cases = [
  { sign: 'leo',       date: '2026-06-03' },
  { sign: 'aries',     date: '2026-06-04' },
  { sign: 'scorpio',   date: '2026-06-05' },
  { sign: 'aquarius',  date: '2026-01-15' }, // sanity edge: cold part of year
  { sign: 'pisces',    date: '2025-12-31' }
];

let pass = 0, fail = 0;

for (const c of cases) {
  try {
    const dateObj = new Date(c.date + 'T12:00:00Z');
    const data    = planetaryPositions(dateObj);
    const lons    = planetaryLongitudes(dateObj);
    const aspects = computeAspects(lons, { orb: 6 });
    const reading = generateReading(c.sign, c.date, data, aspects);
    assertCites(reading, data, aspects);
    console.log(`PASS  ${c.sign.padEnd(11)} ${c.date}  sentences=${reading.length}  aspects=${aspects.length}`);
    pass++;
  } catch (err) {
    console.log(`FAIL  ${c.sign.padEnd(11)} ${c.date}  ${err.message}`);
    fail++;
  }
}

// Negative test: a bogus sentence with no cites must throw
let negPass = false;
try {
  assertCites([{ text: 'no cites here', cites: [] }], { sun: 'leo' }, []);
} catch (err) {
  if (/cites must be a non-empty array/.test(err.message)) negPass = true;
}
console.log(negPass
  ? `PASS  negative: empty-cites sentence correctly rejected`
  : `FAIL  negative: empty-cites sentence was NOT rejected`);
negPass ? pass++ : fail++;

// Negative test: a bogus cite that doesn't match data must throw
let neg2Pass = false;
try {
  assertCites(
    [{ text: 'lies', cites: ['sun:gemini'] }],
    { sun: 'leo', moon: 'leo', mercury: 'leo', venus: 'leo', mars: 'leo', jupiter: 'leo', saturn: 'leo' },
    []
  );
} catch (err) {
  if (/does not match any data field/.test(err.message)) neg2Pass = true;
}
console.log(neg2Pass
  ? `PASS  negative: bogus cite correctly rejected`
  : `FAIL  negative: bogus cite was NOT rejected`);
neg2Pass ? pass++ : fail++;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
