// lib/ephemeris.js
// Offline, deterministic planetary positions via astronomy-engine.
// No network, no API keys, fully reproducible from a (date, time) input.

import * as Astronomy from 'astronomy-engine';

export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

export const BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// Map of body name -> astronomy-engine Body enum
const BODY_ENUM = {
  sun:     Astronomy.Body.Sun,
  moon:    Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus:   Astronomy.Body.Venus,
  mars:    Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn:  Astronomy.Body.Saturn
};

export function longitudeToSign(lon) {
  const norm = ((Number(lon) % 360) + 360) % 360;
  return SIGNS[Math.floor(norm / 30)];
}

/**
 * Geocentric ecliptic longitude of a body at the given date.
 *  - Sun:     Astronomy.SunPosition (geocentric apparent)
 *  - Moon:    Astronomy.EclipticGeoMoon (geocentric ecliptic lon)
 *  - Others:  Astronomy.GeoVector (geocentric, aberration-corrected) -> Ecliptic
 */
function bodyLongitude(bodyName, date) {
  const t = Astronomy.MakeTime(date);
  if (bodyName === 'sun') {
    return Astronomy.SunPosition(t).elon;
  }
  if (bodyName === 'moon') {
    return Astronomy.EclipticGeoMoon(t).lon;
  }
  const v = Astronomy.GeoVector(BODY_ENUM[bodyName], t, true);
  return Astronomy.Ecliptic(v).elon;
}

/**
 * Return raw geocentric ecliptic longitudes (0..360) for the 7 bodies.
 */
export function planetaryLongitudes(date) {
  const out = {};
  for (const name of BODIES) {
    out[name] = bodyLongitude(name, date);
  }
  return out;
}

/**
 * Return zodiac sign names for the 7 bodies at the given date.
 */
export function planetaryPositions(date) {
  const lons = planetaryLongitudes(date);
  const out = {};
  for (const name of BODIES) {
    out[name] = longitudeToSign(lons[name]);
  }
  return out;
}
