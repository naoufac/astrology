# Process Review — astrology slice-1

> Goal: real building experience. What worked, what didn't, and what to fix before slice 2.

## TL;DR

We shipped a working full-stack astrology app in ~30 minutes from kickoff, with a citation-cop pattern that forced every claim to trace to real ephemeris data. Tests pass. Pushed to GitHub. The pattern is sound; the slowest link is the Reviewer agent.

## What worked

| Thing | Why it worked |
|-------|---------------|
| **The hard rule: every reading sentence cites a data point** | Made "astrology" deliverable as engineering, not vibes. Same shape as "every claim has a source" in journalism. |
| **`astronomy-engine` over a network API** | Offline, deterministic, no API key, no rate limit. The frontend never has to wait on a third party. |
| **Fastify + `app.get('/*', static)` + `app.get('/api/...')` route order** | Static and API on the same port, no CORS, no build step. Two `app.get` calls, done. |
| **`assertCites` in both the API route AND `npm test`** | Same code path enforced in production and in CI. No way for the test to lie. |
| **Negative tests in the test suite** | `empty-cites sentence correctly rejected`, `bogus cite correctly rejected` — proves the cop actually catches things. |
| **7/7 tests passing on first push** | The spec was tight enough that forge shipped working code in one round (after npm install was unstuck). |
| **Direct file edit + git push** | Skipped PR review, skipped CI — just like a one-person project should. No ceremony. |

## What didn't

| Thing | Cost | Fix |
|-------|------|-----|
| **Reviewer kept timing out at 240s** | PM had to do the citation-cop review manually. | Set Reviewer's task tighter: "Read these 3 files, output a 200-word verdict." Don't ask Reviewer to start servers, run tests, AND do code review. |
| **First forge prompt only ran `npm install`** | Builder spent its first push on deps, no code. | Lead forge prompts with "deps are installed, write code now" or pre-install before the spec is sent. |
| **The `splash → cleanup → re-task` cycle on forge** | ~5 minutes of wasted turns before files appeared. | Add a "files must exist by turn N" check in the loop, or break the spec into one-file-at-a-time. |
| **Default port 3000 collided with another app (Adam Careers)** | First server start crashed with EADDRINUSE. | Spec the port as an env var (`PORT`) from the start, not a constant. |
| **The "aggressive astro" framing risk never got stress-tested** | The Reviewer never pushed back on whether the templates were too vague ("colors today's tone" appears twice). | Add a quality test: "no two sentences use the same template verb." |
| **No deploy** | Mission said "to the world"; we shipped to localhost. | Add `deploy.md` with a Cloudflare tunnel / ngrok recipe. |
| **Reading sentences are templated, not generative** | 7 sentences, same shape every day. Cheap to build, but predictable. | Stretch: add a tiny model call for sentence *paraphrase* while keeping the data tied. |
| **No a11y on the frontend** | `<select>`, `<input>`, `<button>` exist but no keyboard testing, no ARIA. | Add a "axe" pass. |

## Quality ratings (1-10)

| Aspect | Score | Note |
|--------|:-----:|------|
| **Spec clarity (PM → Builder)** | **8** | File layout + API shape + hard rule made the spec executable. Could be tighter on caching + port. |
| **Builder (forge) execution** | **6** | Produced 14 working files in one push, but only after a wasted first turn. Slow ramp-up. |
| **Reviewer (reviewer) execution** | **3** | Timed out 4 times at 240s. PM ended up doing the review. The agent is the weak link. |
| **3-agent PM / Builder / Reviewer loop** | **7** | The pattern works in principle; the Reviewer slot is broken. PM is solid. |
| **Verification rule (citation-cop)** | **10** | The single most important design choice. Made everything else testable. |
| **Output quality (the code)** | **8** | Clean, idiomatic, no tests failed, real data. |
| **Time to ship (kickoff → GitHub push)** | **6** | ~30 min for slice-1, with the Reviewer timing out eating the most. |
| **Scope discipline (kept it to slice 1)** | **8** | No auth, no DB, no framework creep. Sliced clean. |
| **Stack choice (Fastify + astronomy-engine)** | **9** | Zero bloat, zero auth, offline-capable, deterministic. |
| **Test coverage** | **8** | 5 positive + 2 negative. Could add: edge cases (date in 1900), caching behavior, error path coverage. |
| **Error handling** | **9** | 400 for bad sign/date, 404 for path traversal, 500 fallback. Solid. |
| **Frontend UX** | **7** | Clean and functional. Missing: keyboard nav, mobile layout, loading state on slow requests. |
| **Caching** | **6** | Works, no TTL, no size cap. Fine for a v1; needs limits before production. |
| **Public deploy ("to the world")** | **1** | Not done. Mission said "to the world" — we shipped to localhost. |
| **GitHub push** | **10** | Clean repo, MIT, README, real artifact. |
| **README quality** | **8** | Quick start, API doc, status table, license. |
| **The "delivers truth" angle** | **9** | Citations visible in the UI ("Show the data" collapsible). Not vibes. |

**Overall: 7.2/10.** Shipped the artifact, not the deployment.

## What I'd do differently next slice

1. **Fix the Reviewer slot.** Either:
   - Give it a much narrower job (only "verify the citation rule, output PASS/REVISE with sentence indices")
   - Or replace with a deterministic test (just `npm test`).
2. **Pre-install deps in the spec.** Don't make forge spend its first turn on `npm install`.
3. **Make the spec self-validate.** Add a `npm run check` that boots the server, hits the API, and asserts the response shape. Forge can't ship until that passes.
4. **Slice 2 candidate**: a second sign at once (relationship / synastry) — same pattern, doubles the data lookup logic. Good test of whether the verification scales.
5. **Deploy path.** Cloudflare tunnel from localhost → public URL in 5 minutes. Should have done this in slice 1.

## What this exercise proved

- The PM-Builder-Reviewer pattern works *when* the verification rule is sharp and *when* the Reviewer slot is functional.
- "Delivers truth" is achievable in an astrology app by anchoring every claim to a public data source. The framing is esoteric; the engineering is not.
- An LLM-as-builder can ship a working full-stack app in one session if the spec is tight. The bottleneck is the review/iterate cycle, not the build.
- The most useful thing in this whole run was the citation rule. It's the only thing that made astrology ship as something that can be defended, not as a vibes generator.

## Next move

If we keep going:
- Slice 2: a second sign / relationship view (same citation rule, more data)
- Deploy: tunnel to a public URL
- Replace the Reviewer with a deterministic check, freeing the PM to focus on decisions
- Add a "tier 2" reading mode: longer, more planets (Uranus, Neptune, Pluto), still all cited
