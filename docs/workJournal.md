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

## 2026-09-08 — The operator write landed by halves, and the rest of the site's wiring went in around it (plan F, Tasks 3 Step 7 / 4 / 5, unpushed)

> Superseded in part by 2026-09-08 — What the master ref's `types` map does and does not prove.

The previous entry stopped at Task 3 Step 7 waiting on two Prismic writes. One of
the two arrived. This entry records which, how the halves were told apart, and
the identifiers for everything created since — the release in particular, because
a staged release nobody can name later is a thing that costs a whole session to
rediscover.

**The type landed; the document did not.** `pnpm build` still failed, and still
with the _same_ error the previous entry measured — `[function at(..)] unexpected
field 'my.page.uid'`. That was initially read as "nothing happened", which was
wrong. Three observations separate the halves, and only together:

- Prismic's Custom Types API (through the MCP, which was activated for this
  repository at the same time) lists **two** types: `page` and `form_replies`.
  The `page` model is byte-for-byte the repo's own `customtypes/page/index.json`
  — all nine slice choices registered — so the operator pushed the repo's model
  rather than hand-drawing one, which is what Step 7 asked for.
- `search_documents` for custom type `page` returned `total: 0`, `exhaustive:
true`, across every status. Not a draft, not a release, nothing.
- The Content API at `https://29-navy.cdn.prismic.io/api/v2` reported
  `"types":{}` on the master ref.

That last one is the reconciliation, and it corrects an inference the previous
entry invited. The `unexpected field 'my.page.uid'` error does **not** mean "the
type has never been pushed", as Task 3 Step 6's corrected text now says. It means
_the master ref has no published document of that type_. The Content API builds
its queryable field set from published content, so a custom type that exists in
the Custom Types API but has never had a document published is invisible to the
predicate parser in exactly the same way a wholly absent type is. The two states
are indistinguishable from the build error alone. Anyone diagnosing this again
should query `list_custom_types` before concluding anything from the build.

**The stub document is staged, not published.** Created through the Prismic MCP
rather than by hand, so the UID could not be typo'd — it is the one load-bearing
field, and `home` is what `src/routes/[[preview=preview]]/+page.server.ts` asks
for:

| Thing                | Id                                                |
| -------------------- | ------------------------------------------------- |
| Document             | `aqCp8REAADEAeC8A`                                |
| Version              | `aqCp8REAADEAeC8B`                                |
| Release              | `aqCpxBEAAMYweC4y` ("Stub home page (bootstrap)") |
| uid / title / locale | `home` / `29 Navy` / `en-us`                      |

**A staged release does not satisfy the gate, and it is worth being explicit
about why**, because "the document exists" reads like the blocker is gone. It is
not. A release-staged document is not on the master ref, so the Content API still
reports no published document behind `page`, the predicate still fails, `pnpm
build` still exits non-zero, and pushing `main` would still arm an unpassable
required check. Nothing about the push gate moved. The remaining action is one
publish click in the Prismic dashboard, and the MCP deliberately declines to
publish a release on its own.

**Netlify, done in full.** Site `29-navy`, id
`0627e670-a816-48b2-bd32-b2e52c8d2103`, at `https://29-navy.netlify.app` — the
URL `.github/workflows/ci.yml:14` already names. Created blank with
`--disable-linking`, then linked to `reddoorla/29-navy` (branch `main`, cmd `pnpm
run build`, dir `build/`) through `netlify api updateSite` rather than the
dashboard's OAuth flow, using `installation_id` 138273809 copied from three
existing fleet sites. That the App can actually _read_ a repository created hours
earlier is not assumed: `gh api orgs/reddoorla/installations` reports
`138273809 netlify selection=all`, so the installation covers every repo in the
org including this one. `FORMS_INGEST_URL` and `FORMS_INGEST_TOKEN` are set;
`PUBLIC_TURNSTILE_SITE_KEY` is deliberately absent, since the reference has no
forms.

**A false green, caught only because it was checked.** `netlify env:set KEY VALUE
--site <id>` run from outside a linked directory **exits 0 and writes nothing**.
Both variables were reported set on that basis and neither existed. What exposed
it was reading them back — `netlify env:list` returned a single variable,
`NODE_VERSION`, which is not even a site variable but `netlify.toml`'s
`build.environment` being merged into the listing. The fix was `netlify link
--id` first, then `env:set` with no `--site` flag, then a read-back that shows all
three. This is precisely the defect class CLAUDE.md's first rule names: an exit
code is the absence of an error, and it was allowed to mean success. Worth
remembering that `--site` is accepted-and-ignored by `env:set`, because the CLI
gives no hint of it.

**Secrets.** `PRISMIC_WRITE_TOKEN` on `reddoorla/29-navy` and
`PRISMIC_TOKEN_29_NAVY` on `reddoorla/reddoor-maintenance`, both set from the
288-character value the operator had put in the local `.env` (which is
`.gitignore:7`, confirmed before anything ran). The token's _length_ is
consistent with a Custom Types API JWT but its _type_ is unverified — nothing
here has spent it. The first `prismic-ci` run is what will prove it, and if that
run fails on authorization, this is the line to come back to.

Unrelated caution for whoever reads the CLI output next: `netlify env:set` echoes
the value it just set into stdout. The shared `FORMS_INGEST_TOKEN` was therefore
printed in cleartext in a session transcript. No action taken; flagged so a
rotation decision is at least an informed one.

**A wrong call, recorded because the method was the wrong part.** The branch
`origin/docs/plan-f-corrections-and-journal` in the maintenance repo was reported
here as unmerged work needing a PR. It is merged — PR #707, squash-merged at
2026-09-08T23:21:05Z. Two habits produced the error together: `gh pr list --state
open`, which hides a merged PR entirely, and `git diff origin/main...branch`,
whose three-dot form diffs from the merge base and so shows a squash-merged
branch's changes as though they were still outstanding. The two-dot form,
`git diff origin/main origin/<branch> -- <paths>`, compares the trees as they
stand and returns empty. Use the two-dot form and `--state all`; a squash merge
makes a landed branch look exactly like abandoned work.

**Where this stands.** `main` is still local-only at `be723c5`, still deliberately
unpushed, remote still at `3b6ab20`, for the reason the previous entry gives.
Everything that does not depend on the publish is now done. One click unblocks:
publish → `pnpm build` goes green → push `main` → `self-updating` for protection
→ `ensure-site` for the fleet row (needs the client contact email, and `--name`
is create-only).

## 2026-09-08 — What the master ref's `types` map does and does not prove (corrects the entry above)

> Superseded in part by 2026-09-08 — The `types` check needs a host, and the class needs a name.

The entry above cites `"types":{}` from `https://29-navy.cdn.prismic.io/api/v2` as
its evidence that no document had been published. That evidence was wrong, and
the correct version is more useful than the wrong one, so it is worth the space.

**The stale read.** That probe was issued within a minute or two of the operator's
type push, against a CDN-cached endpoint. It returned the pre-push body. Nothing
was inferred incorrectly from it that changed a decision, but "the Content API
says there are no types" was never measured — a cache was.

**What is actually true, measured directly.** On master ref `aqBkdBEAADEAd1gR`:

- `types` = `form_replies, page`. The type is registered and the Content API can
  see it.
- The exact query the build issues — `GET /api/v2/documents/search?ref=…&q=[[at(my.page.uid,"home")]]`
  — returns **HTTP 400**, `{"type":"api_parsing_error","message":"[function at(..)] unexpected field 'my.page.uid'"}`.
- `search_documents` for type `page`, `statuses: ["published"]` returns `total: 0`,
  `exhaustive: true`.

So the type is listed **and** the predicate naming its field is still rejected.
Those two facts together are the finding: **a type's presence in `types` and its
fields' addressability in a predicate are different things.** A type joins `types`
the moment it is pushed; its fields become predicate-addressable only once a
document of that type is **published**, because the query parser validates field
names against the schema indexed from published content.

**This settles plan F's "third outcome", against plan F.** That text says an
`unexpected field 'my.page.uid'` error means "the repository name is RIGHT and the
`page` custom type has never been pushed to it". It does not. Today the type _had_
been pushed — it is in `types`, and its model matches the repo's own
`customtypes/page/index.json` — and the build error was byte-identical to the
error produced when no type existed at all. The two states are indistinguishable
from the build output. The entry above reached the right conclusion by the wrong
route; this one reaches it by measurement.

**The diagnostic that actually works**, for whoever hits this next: do not read
the build error. Query `types` on the master ref, or `list_custom_types` on the
Custom Types API. If `page` is absent, the type was never pushed. If `page` is
present and the build still says `unexpected field`, the missing thing is a
**published document**, and re-pushing the type will do nothing.

**A false green of my own, for the record.** Seeing `page` appear in `types` was
briefly reported as the publish gate having cleared. It had not. The `types` map
was never the gate; a prerendered `build/index.html` is. This is the same rule the
entry above cites Netlify for breaking — a pass needs the artefact only a working
system produces, and `types` is configuration, not content. Checked against the
build within the minute, which is the only reason it was a wrong sentence rather
than a wrong push.

**Gate state, unchanged:** zero published documents, `pnpm build` still exits
non-zero on `[500] GET /`, release `aqCpxBEAAMYweC4y` still staged and awaiting one
publish click.

## 2026-09-08 — The `types` check needs a host, and the class needs a name (corrects the entry above)

The entry above prescribes a diagnostic — "query `types` on the master ref" — and
never says **which host**. That omission makes the instruction unsafe in one
direction, and the reason is worth more than the fix.

**Measured here, two calls to each host, seconds apart:**

| Host                            | `cache-control`       | CloudFront                               |
| ------------------------------- | --------------------- | ---------------------------------------- |
| `29-navy.cdn.prismic.io/api/v2` | `max-age=0, no-store` | `Miss from cloudfront` → `Hit` on call 2 |
| `29-navy.prismic.io/api/v2`     | `max-age=0, no-store` | no CloudFront headers at all             |

The origin marks that response **uncacheable and the edge caches it anyway.** So
the CDN host can serve a pre-push snapshot while its own headers promise it will
not. That is the mechanism behind this repo's `"types":{}` reading two entries
ago, and it is not "the CDN might lag" — it is a response that says `no-store`
coming back as a cache hit.

**The asymmetry, which is the actual rule.** A `types` map can lag reality but can
never lead it, so:

- **Presence is trustworthy.** `page` in `types` means the type is registered.
  A stale snapshot could not have invented it.
- **Absence proves nothing.** It is equally consistent with "never pushed" and
  "pushed, and you are holding a cached older copy".

Confirm any absence against the bare host `<repo>.prismic.io/api/v2`, or against
`customtypes.prismic.io`. The corrected check is in maintenance PR #709
(`49e8561`).

**Naming the class, because three instances landed in one day.** Every one of
these was the same shape — _a derived or cached view of state, read as though it
were the state_:

1. Plan F's "`unexpected field` means the type was never pushed" (#707).
2. This journal's `"types":{}` as evidence about published content.
3. #709's first replacement, which asserted the `types` map in **both**
   directions.

And two more from the same day that are the same rule wearing different clothes:
`netlify env:set --site` exiting 0 having written nothing (issue #710), and the
one-sentence claim in this session that the publish gate had CLEARED because
`page` appeared in `types`.

Five instances, one rule, already written down: **a pass needs the artefact only a
working system produces.** `types` is a registry. An exit code is a return value.
The gate has always been a prerendered `build/index.html`, and it still has not
been produced. Fixing these one at a time is what CLAUDE.md's "enumerate the
defect class before fixing an instance" exists to prevent, and today is a fair
demonstration that the rule is easier to state than to apply — three of the five
were committed by people actively holding the rule in mind, including while
writing the correction to a previous instance of it.

**Gate state, unchanged:** zero published documents, release `aqCpxBEAAMYweC4y`
staged, `pnpm build` non-zero on `[500] GET /`.
