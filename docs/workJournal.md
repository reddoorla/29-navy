# Reddoor Starter — Work Journal

Running log of build work: what was done, why, and where it landed.
Chronological — newest entry at the bottom. [STARTER.md](STARTER.md) says what
the stack ships; this is the history of getting it there.

The convention is in [CLAUDE.md](../CLAUDE.md) under "The work journal". In
short: every working session appends a dated entry, prose over bullets, why
over what, and history is never edited to be right — a later entry corrects an
earlier one and says so.

---

## 2026-09-05 — Journal opened, and 280 commits of history summarised rather than reconstructed (`chore/work-journal`)

The journal starts today, so this first entry is a **backfill**: a deliberately
coarse summary of what came before, written from the commit log rather than
from memory. Detail below this line is trustworthy; detail above it is not, and
nothing here should be cited as though someone wrote it down at the time. The
commit log remains the record for anything before 2026-09-05.

**What this repo is.** A forkable SvelteKit 2 / Svelte 5 / Tailwind v4 /
Prismic starting point for every site Reddoor builds, deployed on Netlify. 280
commits from `initial` on 2024-02-22 to here — 72 in 2024, 68 in 2025, 140 in
2026, which is the shape of a template that stopped being a side project once
sites started shipping from it.

**The eras, roughly.** 2024 and 2025 are the slow build of the stack itself.
2026 is where the volume is, and it clusters: **July alone carries 61 commits**,
mostly the Blux migration track — a frozen-render pipeline for pixel-faithful
migration of an existing catalog site, proven on `the-pointe-burbank` and then
upstreamed (#78, #81–#84, #88, #89). That layer was snapshotted out to
[reddoor-starter-blux](https://github.com/reddoorla/reddoor-starter-blux) on
2026-08-31 as forward-merge-only, so this repo keeps the general case and the
Blux specifics live next door. August and September are consolidation: the
shared configs adopted so sync drift went to zero (#110), Prismic srcset widths
capped with a real `sizes` on every image (#109), and `Testimonial` and
`CtaBanner` added to the slice library, taking it to nine.

**One trap worth pulling forward, because it recurred downstream.** #74
(2026-07-18) reworded a comment in `src/app.html` so that `%sveltekit.body%`
was not trapped inside it — SvelteKit substitutes the **first** occurrence of a
placeholder and only the first, so merely _mentioning_ one in prose consumes
it. The fix was correct and it held. The lesson did not generalise: on
2026-09-04 the Vida Legacy Foundation site shipped the identical defect against
`%sveltekit.head%` **twice in one hour**, the second time while writing the
explanation of the first. A fix that lands in one repo as a one-line reword,
with no test and no note that the whole placeholder _family_ is affected, is a
fix that gets to happen again. That is a large part of why this journal exists.

**State as of this entry.** `main` at `2377e9c`, CI green. Nine shared slices,
each with `model.json`, `mocks.json` and a vitest suite. The `pnpm verify`
gate runs prettier → eslint → svelte-check → build → axe → unit + smoke, which
is exactly CI's order. `docs/NEW-SITE.md` lists what is still a template
default in a fresh clone.

**What changed today.** `CLAUDE.md` gained "The work journal", and this file
exists. Because this file ships with the template, every site generated from
the starter now starts with the convention rather than acquiring it later —
which was the actual gap: Vida Legacy Foundation accumulated four days of
hard-won detail in `CLAUDE.md` prose and PR bodies, where it is real but
unordered, because there was nowhere chronological to put it.

## 2026-09-05 — Ten retrospective rules made into defaults, and the half of the journal rule that was missing (#115, `15abd0d`)

Two changes, a few hours apart, and the second exists because a research pass
went looking for what the first got wrong.

**The ten rules landed (#115).** `scripts/figma-compare/` is now in the template
rather than in one site's repo, `package.json` ships
`reddoor.a11yRoutes: ["/"]` so a clone's axe gate measures a real page from the
first commit instead of only `/dev/a11y-fixtures`, and `CLAUDE.md` gained "Six
rules that came from shipping a site". The provenance of all ten is Vida Legacy
Foundation's `docs/workJournal.md`, written the same week.

**And the journal rule turned out to be half a mechanism.** It says an entry
that stops being true is never rewritten — a later entry corrects it and names
which one. That is right, and on its own it fails at the only moment it
matters. The correction goes to the bottom of the file. A reader searching for
"sticky band" or "Turnstile" lands in the middle, on the superseded paragraph,
and leaves with the answer that was already known to be wrong. Nothing in the
old entry points forward, because the rule forbade touching it.

So: one line under a superseded heading, `> Superseded in part by <date> —
<title>.` It asserts nothing and retracts nothing, so the record of what was
believed at the time survives whole; it only redirects. The distinction that
makes it safe is that a pointer is *navigation*, not *content* — the prohibition
is on editing the claim, and a pointer makes no claim.

The evidence it was needed showed up by accident. Sweeping the convention across
the fleet found `a-budget`'s `CLAUDE.md` already doing it by hand, uncommitted:
`**SUPERSEDED WHILE IN DEBT PAYOFF — see "Envelopes: pure retroactive" below.**`
Somebody hit the problem and invented the fix locally, which is usually the sign
that a convention is missing rather than that a person is wrong.

**One thing not to copy from the site that produced these rules.** Its
`CLAUDE.md` is 963 lines and ~13K tokens, loaded into every session whatever the
task. The only measured study of this file class (Gloaguen et al., ETH Zurich,
arXiv:2602.11988, Feb 2026 — 138 tasks, four agents) puts developer-written
context files at **+4% task success for +19% inference cost**, and concludes
that unnecessary requirements in them make tasks _harder_. The archive is worth
having; keeping all of it in the always-on file is not. Traps and history belong
in the journal, and `CLAUDE.md` should hold the minimum a session must not
violate. This starter’s own is 194 lines and should stay closer to that than to 963.

---

## 2026-09-08 — 29 Navy bootstrapped from the template, and stopped one operator write short of a pushable `main` (plan F, Tasks 2–4)

This repo's first entry. `reddoorla/29-navy` was created from
`reddoorla/reddoor-starter` (native track, not blux — `src/lib/blux` is absent
and `@slicemachine/adapter-sveltekit` is the adapter) and cloned to
`~/Documents/GitHub/29-navy`. The site is 29 Navy, a Worthe creative-loft
property in Venice; the reference is the single-page Webflow site at
https://www.29navy.com/.

The config edits are the `/new-site` set: `package.json#name` → `29-navy` (it
drives the fleet audit's slug matching), `ci.yml`'s `netlify-site` →
`"29-navy"`, `SITE_NAME` → `"29 Navy"`, the README placeholders filled. Left
alone deliberately: `SITE_LOCALE` (`en_US`), `DEFAULT_OG_IMAGE` (`""` — there
is no 1200×630 card yet and a Reddoor-branded default would leak), `<html
lang="en">`, and the CSP. The reference loads no third-party web fonts — a
system stack plus three Font Awesome faces, all self-hosted on the Webflow CDN —
so the `devMatchImgHosts` dev-only CSP hole Beachfront carries has no
counterpart here.

Both gates were checked rather than assumed, because both default to measuring
nothing while reporting green: `pkg.reddoor.a11yRoutes` already ships `["/"]`
and `tests/smoke/routes.ts` already ships the single `/` entry keyed on the
sentinel. For a one-page site both are already right, so nothing was changed —
but "already correct" is a finding, not a skip.

**The belief this session corrected.** The plan predicted that replacing the
`your-prismic-repo-name` sentinel against an EMPTY Prismic repository would fail
`pnpm build` with `404 /: Page not found` — the chain being Prismic's
`NotFoundError` → `src/lib/page-load.ts:30-31`'s `error(404)` →
`svelte.config.js`'s rethrow once `isPlaceholderRepo` is false. It does not. The
real failure is:

```
[500] GET /
Error: [function at(..)] unexpected field 'my.page.uid' on line:1 col:6 in query '[[at(my.page.uid, "home")]]'
Error: 500 /: 500 /
```

An empty Prismic repository has no _custom types_, so the Content API rejects
the **predicate itself** — `my.page.uid` names a field of a type that was never
pushed — and returns a parsing error, not a not-found. `loadPage`'s catch tests
`err instanceof NotFoundError`, which this is not, so it rethrows unmapped and
SvelteKit prerenders a 500. `handleHttpError` then throws regardless of
`isPlaceholderRepo`, because that guard only ever swallows a **404**.

Three things follow. First, the plan's Step 6 expectation is wrong in shape
though right in outcome — the build does fail, and harder than predicted.
Second, the plan's differential diagnosis ("a `RepositoryNotFoundError` instead
means the repository NAME is wrong") is missing a third outcome: an
`unexpected field` parsing error means the repository name is _right_ and the
`page` type has never been pushed. That is a genuinely useful signal and it is
worth adding to the plan, because it distinguishes "wrong repo" from "empty
repo" without a single extra query.

Third, a correction to something drafted earlier in this same session and
checked before it shipped. The first draft of this entry claimed the emergency
hatch `VITE_PRISMIC_ENVIRONMENT=your-prismic-repo-name` would not rescue a build
in this state either, on the reasoning that `handleHttpError`'s escape only
swallows a 404 and this failure is a 500. Reading the code says otherwise: the
hatch works, and it never reaches `handleHttpError` at all.
`src/routes/[[preview=preview]]/+page.server.ts:19-21`'s `entries()` returns
`[]` whenever `isPlaceholderRepo`, so `/` is not a prerender entry, no Prismic
query is issued, and there is no error to handle. The two guards are doing
different jobs: `entries()` is what actually protects the placeholder state, and
`handleHttpError`'s `status === 404` clause is a second, narrower net for
Prismic-backed routes that _are_ still crawled. Writing that down because the
wrong version was one sentence away from being committed as fact, and because
the project's own rule — a claim about what code does is a claim that must be
made by reading that code — is exactly what caught it.

**Where this stopped, and why nothing was pushed.** Task 3 Step 7 is an operator
step: push the repo's own `page` custom type from `pnpm slicemachine`, then
create and publish a stub `Page` document with uid `home`. Both are RED-tier
Prismic writes. The Prismic MCP cannot substitute — it exposes no
create-custom-type tool at all, and it is not activated for this repository
anyway. Until that lands, `pnpm build` fails and so would CI.

So the bootstrap is committed here but **not pushed**, and branch protection was
not installed. That ordering is not fussiness: `self-updating` makes `ci / ci` a
required context once it has been _observed_ on `main`, and
`checkContextObserved` counts a check-run by name regardless of its conclusion.
Pushing a knowingly red `main` would therefore arm a required check that cannot
pass, and every later PR in this plan would need an operator `--admin` merge to
escape it. The cheap thing to do now is wait for one Prismic write; the
expensive thing is to push and then need admin merges for the rest of the build.

Everything except `build` is green locally: `prettier --check .` clean, `eslint`
clean, `svelte-check` 0 errors / 0 warnings across 4499 files.
