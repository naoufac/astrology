# Daily Reading — Astrology with Cited Data

> A daily horoscope web app where every sentence is traceable to a real planetary position. No vibes, no vibes-based "energy" — just ephemeris, citations, and a verification suite that won't let an uncited sentence ship.

## What it does

Pick a zodiac sign. Pick a date. Get a reading. Every claim in the reading cites a data point in the response — sun position, moon position, planetary aspect — that you can inspect in the "Show the data" panel.

```
GET /api/horoscope?sign=leo&date=2026-06-03

{
  "sign": "leo",
  "date": "2026-06-03",
  "data":    { "sun":"gemini","moon":"capricorn","mercury":"cancer",... },
  "aspects": [ {"a":"sun-saturn","type":"sextile","orb":0.48}, ... ],
  "reading": [
    {"text":"The Sun in gemini shapes today's tone.",
     "cites":["sun:gemini"]},
    {"text":"A sextile between sun and saturn within 0.48° colors today's tone.",
     "cites":["aspect:sun-saturn-sextile"]},
    ...
  ]
}
```

The `cites` array is the contract: every entry must resolve to a real field in `data` or `aspects`. `lib/verify.js` enforces this in the API route and in the test suite.

## Why

Astrology is mostly delivered as vibes — vague, unverifiable, easy to dismiss. This app flips that: every claim points at a real data point, computed from a public ephemeris (`astronomy-engine`, derived from NASA's JPL DE series). The user can pull the curtain back and see exactly what each sentence is grounded in.

That's the "delivers truth" part. The astrology is the framing. The traceability is the point.

## Quick start

```bash
git clone https://github.com/naoufac/astrology.git
cd astrology
npm install
npm start              # server on http://localhost:3000
```

Open <http://localhost:3000>, pick a sign, hit "Get reading."

## Tests

```bash
npm test
```

Runs `test/test-verify.js` — generates readings for several sign/date combinations and asserts every sentence is cited. Also runs two negative tests (empty-cites rejected, bogus-cite rejected). Currently 7/7 pass.

## How it works

1. **`lib/ephemeris.js`** — uses `astronomy-engine` to compute ecliptic longitudes for sun, moon, mercury, venus, mars, jupiter, saturn at a given date. Converts longitudes to zodiac signs.

2. **`lib/reading.js`** — generates a cited reading from positions and aspects. Five core templates (sun, moon, mercury, top 3 aspects, sign-anchor) plus a 7th fallback. Every sentence produces non-empty `cites`.

3. **`lib/verify.js`** — `assertCites(reading, data, aspects)`. Builds the set of valid cites from the actual data, walks the reading, throws on any sentence with missing/empty/bogus cites. Used in the API and in the test.

4. **`server.js`** — Fastify app. `/api/horoscope` runs the pipeline and asserts before returning. Caches results by `(date, sign)` in `data/cache.json`. Serves `public/` statically with path-traversal protection.

5. **`public/`** — single-page HTML/JS/CSS frontend. Sign picker, date input, button, render of the reading as a list, collapsible "Show the data" section exposing the raw positions and aspects.

## Stack

- **Node.js** (ES modules)
- **Fastify** — HTTP server
- **astronomy-engine** — offline deterministic planetary positions (no API key, no network)
- **Vanilla HTML/CSS/JS** — no build step, no framework

Zero auth, zero DB, zero framework. v1 is honest.

## API

```
GET /api/horoscope?sign=<sign>&date=YYYY-MM-DD
  sign : one of aries, taurus, gemini, cancer, leo, virgo, libra,
         scorpio, sagittarius, capricorn, aquarius, pisces (case-insensitive)
  date : YYYY-MM-DD, default = today (UTC)
  200  : { sign, date, data, aspects, reading }
  400  : { error }   on invalid sign or date

GET /api/health
  200  : { ok: true, bodies: 7, signs: 12 }
```

## Project status

**v0.1 — slice 1 shipped.** What's working:
- Daily reading for any of 12 signs, any valid date
- Real ephemeris (no fake data)
- Citation-driven output (no uncited sentences)
- 7/7 tests pass
- Health endpoint
- Cache
- Static frontend

What's not yet:
- Public deploy (currently localhost)
- Auth, accounts, saved readings
- Multi-sign (relationship) views
- Mobile-native app

## License

MIT — see `LICENSE`.
