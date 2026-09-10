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

> Superseded in part by 2026-09-08 — What the master ref's `types` map does and does not prove.

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

**Filed, so the enumeration outlives the session.** The class is
[reddoor-maintenance#711](https://github.com/reddoorla/reddoor-maintenance/issues/711).
Instance 4, the `netlify env:set --site` false green, is
[#710](https://github.com/reddoorla/reddoor-maintenance/issues/710). And the code
review of this session's own `resolveOwnerRepo` extraction produced
[#712](https://github.com/reddoorla/reddoor-maintenance/issues/712) — the shared
helper derives a GitHub **write** identity from a git remote without validating
provenance, so a GitLab origin resolves to a GitHub target, and a path inside a
checkout resolves to the enclosing repository. That is the same class one layer
down: a derived value treated as a validated one. It is inherited rather than new,
but it becomes load-bearing the moment `prismic-ci` writes a token at that
identity, which is the very next task.

## 2026-09-08 — What an adversarial review of this branch found, including a hatch that greens the whole gate over an empty site

A `/code-review high` over `origin/main...HEAD` at the end of the session. Six
findings; the two that matter are recorded here because both are false greens,
and one of them is armed and waiting in the starter itself.

**The emergency hatch produces a green build with no home page.** Two entries
above, `VITE_PRISMIC_ENVIRONMENT=your-prismic-repo-name pnpm build` is described
as an escape that "works". It does — for a narrow definition. Measured here:

```
build exit=0
build/index.html: ABSENT
files in build/: 5
```

`entries()` returns `[]` when the sentinel is in force, so `/` is never a
prerender entry and no home page is emitted. `pnpm build` is nonetheless green,
and `tests/smoke/routes.ts:34-35` reads the **same** environment variable, so the
smoke suite flips its expectation for `/` from 200 to 404 and passes as well. The
starter mitigates partially — the flipped case renames the test so the title says
so — but a title is read by a human and an exit code is read by CI.

The consequence is the shape worth naming: **setting that variable in CI or on
Netlify, to make a red build go green, greens the entire gate over a site that
serves no home page.** It is the fastest available fix for the exact failure this
repo is sitting in right now, which is precisely when someone would reach for it.
It is not a hatch to a working site; it is a hatch to a working _build_. Filed
against the starter, since the mechanism ships to every clone.

**`static/favicon.png` is still the stock Svelte logo**, 1571 bytes, wired as both
`icon` and `apple-touch-icon` at `src/app.html:5-6`. `docs/NEW-SITE.md` lists it
under Identity and the bootstrap entry's enumeration missed it. Small, but it is
a launch-visible default and the class of thing that survives to production
because nobody owns it.

**Two findings that look like defects and are not**, recorded so the next reader
does not re-open them:

- `PRISMIC_WRITE_TOKEN` on `reddoorla/29-navy` has no consumer today — `ci.yml`
  passes no `secrets:` and there is no other workflow. That is correct rather
  than wrong: the consumer is the `prismic-models.yml` workflow that
  `reddoor-maint prismic-ci` installs, which is plan F Task 7 and has not run.
  The secret is pre-provisioned, not orphaned.
- The review notes the cleartext `FORMS_INGEST_TOKEN` was journalled without an
  issue while smaller findings got one. Deliberate, and worth stating: filing a
  public issue describing a live shared credential's exposure advertises it. The
  right channel is the operator, who has been told directly, and the decision to
  rotate is theirs. An issue would make the record worse, not better.

**On the review's scope, honestly.** It reviewed this repo, not the
`reddoor-maintenance` branch the session spent most of its time on — the working
directory decided that, not a choice. The maintenance branch gets its own review
before its PR.

## 2026-09-08 (overnight) — The publish landed and the whole bootstrap chain ran through to a live deploy

The operator published release `aqCpxBEAAMYweC4y` and everything downstream of it
ran unattended. Recording the evidence rather than the sequence, because the
sequence is in the plan and the evidence is what was missing all night.

**The gate, with the artefact this time.** `search_documents` with
`statuses: ["published"]` returns `total: 1` — document `aqCp8REAADEAeC8A`, uid
`home`, `releaseId: null`, i.e. on the master ref. `pnpm build` exits 0 and
produces `build/index.html`, 5315 bytes, `<title>29 Navy</title>`. That file is
the thing three earlier entries kept saying was the real gate, and it exists.

**`pnpm verify` exit 0**: prettier, eslint, svelte-check, build, axe (0 violations
across 2 routes) and 334 unit tests, then 4 Playwright specs including
`/ (home) loads with no console errors`. That last one is the smoke case that
flips from expecting 404 to expecting 200 once the sentinel is gone and a
document is published — it had never run in its 200 form before tonight.

**Pushed `3b6ab20..349613c`**, six commits. CI conclusion read explicitly rather
than inferred: `success`.

**Branch protection armed after the green, not before.** `self-updating` created
the ruleset `main: reviewed changes only` and made `ci / ci` a required context.
That ordering was the whole reason the bootstrap sat unpushed for a day: the
recipe requires a context only once it has been OBSERVED, and observation counts
a check-run by name regardless of conclusion, so pushing a knowingly red `main`
would have armed a check that could not pass. It cost a day of waiting and saved
every subsequent PR an admin merge.

**Netlify deployed from the push with no intervention** — state `ready`, branch
`main`, commit `349613c` — and `https://29-navy.netlify.app/` answers 200. That
is the first proof the repo link actually works. It was configured through
`netlify api updateSite` rather than the dashboard OAuth flow, so until a real
deploy ran, "linked" was a config reading and nothing more.

**The fleet row already existed, and was better than the one this session would
have written.** `ensure-site` reported `exists (recADTWf6LCobVob0) — differs from
existing, left untouched: url`, and refusing was correct. The row holds
`Name: 29 Navy`, `Status: building`, and `url: https://www.29navy.com/` — the
client's live Webflow site, not `29-navy.netlify.app`. `building` is why
`--fleet airtable` filters this site out of fleet runs, which is right for
pre-launch.

But that `url` is worth a decision before launch, because two consumers read it
differently. Reports and audits want the site we are responsible for; `launch`'s
new `dev-guard` probes `<url>/dev/match/home` and `<url>/health` on the DEPLOYED
build. Pointed at the Webflow origin, `/health` 404s, the liveness control fails,
and `launch` refuses — fail-closed, so nothing unsafe, but it refuses for a
reason that has nothing to do with the twin it is checking. Left as the
operator's call. No point-of-contact field is set on the row either; `--contact`
was omitted deliberately rather than guessed, and unlike `--name` it is
re-runnable.

**One thing this changes for every later session:** `main` is protected now.
Direct pushes are refused; this entry arrived by pull request, which is also the
first exercise of that path.

## 2026-09-09 — Phase 0/1: the reference captured before it could die, and the gate caught lying (`docs/29navy-phase-0-1`)

29 Navy is the `match-harness` recipe's first real customer. Everything under
`matching/` here was installed by `reddoor-maint match-harness`, not by hand —
20 paths in one commit — and the install went straight into the guard that
reddoorla/reddoor-maintenance#734 had added hours earlier: every installed path
has to be found in HEAD's tree before the recipe will call itself `applied`.

**The capture is the point of Phase 0 and it is time-boxed by someone else's
decision.** Beachfront's reference died mid-campaign; running
`harness.mjs --check-ref` against it today still answers `HTTP 404`. 29navy.com
dies at DNS cutover. So: 90 files, 13,667,608 bytes, into git-ignored
`matching/spec/`, with a tracked manifest carrying a sha256 per file so a fresh
clone can tell whether its capture is the one `SPEC.md` was written from. Nothing
is rewritten — the CDN stylesheet href in `matching/spec/index.html` is still
absolute — because the capture is what Phase 1 greps, and a rewritten href would
make it lie about what the reference loads.

It fails closed, and that was proved by breaking it rather than asserted: point
the stylesheet at `nope.css` and it exits 2 naming the 403; move
`EXPECT.htmlAssets` from 58 to 57 and it exits 2, prints all 58 URLs grouped,
and says `group counts moved`. The URLs are printed rather than just the delta
because a count can move because the reference changed OR because a classifier
mis-sorted a filename, and "the reference moved" sends you to inspect a page
that did not.

**Four things the plan asserted that measurement contradicted.** Recording all
four, because the pattern matters more than any one of them: a plan written from
the previous site carries that site's shape.

1. _The matrix._ The recipe seeds `1440 / 834 / 390`. The reference's own
   stylesheet has twelve `@media` blocks whose three site-authored members are
   `max-width` 991, 767 and 479 — so the matrix is `1440 / 991 / 767 / 390` and
   the seed would have missed two of four bands. Max-width blocks cascade
   downward, so the 480–767 values are usually inherited from the ≤991 block
   rather than declared.
2. _The fonts._ The plan said all three Font Awesome faces must report
   `document.fonts.check` true, warning that a missing weight synthesizes
   silently and poisons the census. Two report false — and that is correct.
   `Fa 400` and `Fa brands 400` appear only inside their own `@font-face`
   blocks; of 190 elements on the live page, 0 compute to either, and the
   `FontFaceSet` lists both `unloaded`. A browser does not fetch a webfont
   nothing uses. Had this been "fixed", the fix would have been to a bug that
   does not exist.
3. _The first floor._ The plan counted ten `display: none` modal containers
   including `._1st-floor-modal`. Measured at 1440 it is `display: flex`,
   in flow, **1174×750 at (246, 1908)** — the default visible panel of a floor
   switcher, not a modal. Nine are hidden. A rebuild that hid all four would be
   ~750px shorter than the reference and would blow `maxHeightDelta` for the
   whole page, and the symptom would read as a layout bug rather than a missing
   initial state. This is the one that would have cost a day in Phase 5.
4. _The probe order._ The plan ran the calibration probe before writing the
   derived matrix, which would have calibrated at 834 and then shipped 991/767.
   The matrix went in first here.

**And the gate itself reports a green it did not measure.** `bash matching/gate.sh
smoke home` with no dev server prints

```
########## home ##########
home exit=1
ALL DONE (smoke)
```

and exits **0**. `gate.sh:120` is `echo "$page exit=$?"` — it prints the status
and discards it; the only non-zero paths out of the script are the two preflight
exits and the missing-SPEC branch. No `report.json` was written. `next.mjs`
catches the total-failure case (exit 2, "no parseable gate run") but not the
partial one: its denominator is summed over the pages that produced a report, so
a page whose `page-diff` crashed leaves the score altogether — eight of nine
pages could report `SCORE 160/160` while the ninth was never measured. Filed as
reddoorla/reddoor-maintenance#744; both files are recipe-owned, so the fix lands
in `beachfront-dentistry` and is regenerated, the path
reddoorla/beachfront-dentistry#58 took. **No Phase 2 score from this gate is
trustworthy until that lands**, and the ledger says so at the point of use.

Measuring the measuring device was also worth it in the other direction: my own
first reading said `next.mjs` exits 0 on its refusal. It exits 2 — the 0 was
`head`'s status through a pipe. The same trap ate the exit code of a
`pnpm preview` check earlier the same evening, where two `/dev/match/home → 404`
readings turned out to have come from **someone else's server**: three orphaned
`vite preview` processes had been holding ports 4173–4175 since Sep 6, and
`--strictPort` plus a positive identification of the build (`_app/immutable` ×18,
Webflow site id ×0) is what caught it. A 404 from a server that is not yours
looks exactly like a working guard.

**The reference's own defects are ledgered, not silently corrected.** Four
floor-plan PDFs 404 from the apex, from `www` and over `http`, with a 200
control in the same run so it is the files that are gone and not the network
(#8 — a client deliverable, never to be redrawn). A phone link written
`href="https://(310) 393-9653"`. An email whose address carries a zero width
joiner, `e2 80 8d`, between `.com` and the closing quote. And 23 of 23 `<img>`
with `alt=""`, pre-declared as artifact class 4 so that 23 expected text-diff
rows in Phase 2 are not mistaken for 23 defects.

Phase 1's spec cites twenty stylesheet line numbers, every one verified by
reading the line it names. The gate was watched refusing for a missing
`## home` section **before** `SPEC.md` existed, because once the file exists
that refusal cannot be reproduced without deleting it again, and a gate never
seen to refuse is not evidence that it can.

## 2026-09-10 — The installed harness was the one that could lie, upgraded in place (`maint/match-harness-20260910T172826020Z`)

> Superseded in part by 2026-09-10 (later) — The upgraded gate refused for the
> right reason, and named exactly what Phase 2 has to build.

This site installed its harness from `@reddoorla/maintenance@0.95.0` and then
stayed there while four defects were found in that exact code — by _using_ it
here, not by reviewing it. Fixing them upstream reached nobody: a recipe-owned
file that matches neither the new template nor a recorded previous body is
FLAGGED, never overwritten, so an installed site keeps the broken script forever
and is told it hand-edited a file it never touched. The fleet fix (#753) was to
record what had been shipped; this run is that fix arriving.

**What was here, measured before the run.** `matching/gate.sh` with zero of the
`MEASURED` / `ATTEMPTED` / `SEEN` counters and no `--check-run` — the gate that
printed `ALL DONE` unconditionally, over runs that had failed or never happened
(#744). `matching/harness.mjs` with neither `scorable` nor `unscorableWhy`, so
`next.mjs` divided real passes by a denominator describing a region layout that
does not exist and printed `SCORE 16/4 … Backlog is empty` (#751). And zero
terminators in all three marked blocks — `.gitignore`, `.prettierignore`,
`CLAUDE.md` — meaning their contents could never be corrected at all (#739),
which on `.gitignore` is not staleness but a brick: it is a negated whitelist
over `matching/*`, so a harness file at a path it does not re-include never
reaches the commit and the whole install gets reverted.

**Predicted, then run.** Before running anything, the real `planFileWrite` was
executed against this site's actual bytes for all 17 recipe files: `replace` for
`harness.mjs`, `gate.sh` and `next.mjs`, `skip` for the other fourteen, `flag`
for none. The run then reported exactly that — three upgraded, three block
regions terminated — plus 436 insertions and 24 deletions across 6 files. The
prediction mattered because a `flag` here would have been silent: the recipe
still reports `applied`, and the note naming the flagged file is the only
signal.

**The upgraded harness refuses on contact, which is the point.**
`node matching/next.mjs` now exits 2 with _"no parseable gate run under
matching/ — refusing to report a score"_. The two Phase 0/1 logs still sitting
in `matching/` (`out-smoke-home.log`, `out-smoke2-home.log`) are pre-#744 schema,
so `uncountable()` declines to count them rather than scoring stale evidence.
The old harness would have scored them and called it a number. Phase 2 therefore
starts from a real gate run, not from what was lying around.

**A trap worth recording, because it cost a wrong reading in the same hour it
was written down.** `node matching/next.mjs | head` reports `$?` as `head`'s
status under zsh, not the script's — read as exit 0 when the real answer is 2.
`${PIPESTATUS[0]}` is a bash spelling and is empty here; zsh wants
`$pipestatus[1]`. Measure an exit code without a pipe, or not at all.

**Not done.** `matching/harness.json` is site-owned and was skipped, so `--ref`
was inert on this re-run — the four anchors, the `[1440, 991, 767, 390]` matrix
and `TOTALS.home = 20` are unchanged and still this site's own. Nothing has
re-run the gate yet, so the site has no countable run and no score.

## 2026-09-10 (later) — The upgraded gate refused for the right reason, and named exactly what Phase 2 has to build

> Adds the measurement the entry above said had not been taken.

The harness upgrade was merged (`2dc4489`) proving only that the new scripts
REFUSE. A guard proven only to refuse is not proven — the repo's own rule 1 says
an error matcher may never do more than deny, so a green has to come from
somewhere. This is that run.

**Both directions, against the live reference.** `bash matching/gate.sh smoke3
home` printed:

```
REF OK — https://www.29navy.com/ → 200, no redirect, refMark present, candMark absent
########## home ##########
home exit=2
  NOT MEASURED: NO RUN — matching/out-smoke3-home/report.json: no report.json — the run wrote nothing

GATE INCOMPLETE (smoke3) — 1 of 1 page(s) produced no
countable report: home
```

The `REF OK` line is the GRANT: `checkRef` is fail-closed on four separate
conditions and cleared all four against the real Webflow reference, so it is not
a guard that refuses everything. `GATE INCOMPLETE` with exit 2 is the REFUSAL —
and it is precisely the sentence the old gate could not produce. The `0.95.0`
render printed `ALL DONE (smoke3)` here, unconditionally, over a page that wrote
no report at all (#744). Same site, same command, opposite answer.

`node matching/next.mjs` then exits 2 with _"no parseable gate run"_ — the gate
and the scorer agreeing on what counts, which is the drift #751's shared
`uncountable()` predicate exists to prevent, observed rather than asserted.

**Why the candidate wrote nothing, exactly.** `GET
http://localhost:5173/dev/match/home` returns **404**, and the route names its
own cause: `no assembly for "home" (have: none)`. `documents()` in
`src/lib/site-pages.js` returns **zero** assemblies. So the 404 is not the
dev-guard, not a routing bug and not the harness — the site genuinely has no
page to render. `src/lib/site-pages.js` is site-owned, so the recipe skipped it
on the upgrade, correctly: it is ours to author.

That locates the boundary precisely. Everything the harness needs is installed
and behaves correctly in both directions; the first countable run needs the
first home assembly, and writing it is Phase 2. The next session does not need
to re-derive any of this — start at `documents()` in `src/lib/site-pages.js`,
and the gate will have something to measure.

**Nothing was left running.** The `pnpm dev` on 5173 was stopped and the port
released; `matching/out-smoke3-*` is covered by the harness block's negated
whitelist in `.gitignore`, so the tree is clean.

## 2026-09-10 (Phase 2) — The page exists, and four of the five failures were never geometry (`feat/navy-home-slices`)

`SCORE 4/20 → 16/20` over five gate rounds. What follows is mostly about the
four fixes that were **not** in the slices, because every one of them looked
like a slice bug and none of them was.

**The build.** Five slices — hero slider, Location band, floor plans, resident
links, contact — assembled in `src/lib/site-pages.js`, with 689 rules
transcribed from the captured stylesheet and every one carrying the line it came
from. All 40 asset references resolve to files shipped under `static/29navy/`.
The four anchors occur exactly once each in the script-stripped text, at
strictly increasing indices, which is the invariant SPEC.md's collision note
demands; the duplicates a naive grep finds are SvelteKit's SSR payload inside
`<script>`, which page-diff strips.

**A `position` keyword cost the whole score.** The first gate refused: reference
5 regions, candidate 4, `TRUNCATED`, uncountable. The starter's `Nav` is
`position: fixed`; the reference's bar is `sticky` (css:2160-2161). Fixed leaves
normal flow and contributes ZERO height, so the hero began at y=0 instead of
y=68 and `regionsFromAnchors` never emitted a `top` region — with no gap above
the first anchor there is nothing to cut. The tempting explanation was a
falsy-zero bug in the region splitter; it filters on `a.y != null && a.y >= 0`,
so y=0 is handled correctly. The region was genuinely absent.

**The bar's 68px is emergent, and typing it in would have been wrong.** After
`sticky` it measured 42 — exactly the logo alone (164 wide from an intrinsic
986×253). The links were `display: inline` with no padding. Webflow's own
`.w-nav-link` base (css:1823-1832) makes them `inline-block` with `padding:
20px`: 28px line-height + 20 + 20 = 68. Transcribing the rule landed on 68
exactly rather than approximately. Same story on mobile: `.w-nav-button` is a
24px glyph in 18px of padding (css:1902-1903) = 60. Heights are now exact at all
four viewports — 68 / 124 / 60 / 60.

**Two owners for one property.** Transcribing `.container`'s `display: flex`
(css:2168) onto the element whose display is controlled by `hidden md:flex` won
the cascade, and at 390 the six links stayed on screen and stacked into a 384px
bar against the reference's 60. The utility owns `display`; `md:flex` IS
css:2168. One line later the same trap was waiting in `.w-nav-button`'s
`display: none` (css:1904) — not transcribed, deliberately.

**Fifteen pixels of page width read as a 47% hero defect.** The starter sets
`scrollbar-gutter: stable`; the reference's only html rule is `height: 100%`
(css:218-220). The gutter is reserved INSIDE the body: measured at 1440,
`document.body` laid out at 1425 against 1440, so every full-bleed element was
scaled and shifted by 1.04%. On six 100vh photo slides that is ~47% mismatch at
all four viewports, and it presents as a hero bug. `clientWidth` reports 1440 on
BOTH pages, which is why it survived a round of looking straight at it — and why
I dismissed it out loud earlier the same session with "both have a scrollbar, so
it's a wash". Removing it took the score 6/20 → 15/20 and made total page height
4174 = 4174, exact.

**The last four failures are the measurement, not the build.** `Creative Lofts`
fails at 34-38% with `heightDeltaFraction` 0.0% and every element matching to
the pixel. The reference is deterministic against itself (page-diff with the
reference as both sides: 0.0%, ΔE 0.0). The slide photo the browser downloads is
sha `b68497a0f75b8ed7` — byte-identical to the shipped file. The cause is that
`capture.mjs` settles 2200ms and then spends **601ms** taking a fullPage
screenshot of a 4174px page, while the reference's carousel advances at
`data-delay="3000"`: its dot nav reads `*.....` at t=2200 and `.*....` at
t=2801. Varying only the reference's settle, hero against hero: **600ms → 0.1%
differ, 1500ms → 0.1%, 2800ms → 36.3%.** `--neutralize-media` does not help; it
freezes `<video>`, and this is a JS-driven transform. Recorded in LEDGER.md as a
novel floor, which rule 5 makes the operator's call — presented, not decided.

**Corrected on contact.** Phase 0's capture was incomplete and said it was
whole: its `url()` extractor could not match a QUOTED url whose filename
contains a parenthesis, so it silently missed the three floor-trigger tiles
(css:2968, :2997, :3023). It reported 90 files, all 200, and `EXPECT` agreed —
because `EXPECT` had been written from that same broken output. That is an
assertion calibrated to the defect. Now 93 files, `cssPhotos` 10 → 13. While
fixing it I tried to syntax-check the script by importing it, which RAN it
against the live reference; no damage, and it incidentally proved the reference
had not drifted in 19 hours, but `node --check` on a copy was the safe move.

**What is NOT done.** The home document is not seeded to Prismic, so `/` renders
empty and the four section ids exist only on `/dev/match/home`;
`svelte.config.js` carries an explicit four-id allowlist for that, marked for
deletion at seed time. The slider does not move — frame 0 only, which is what
the geometry gate measures and what Phase 5 will have to build. `next.mjs`
instructs the operator to run `matching/probe-anchor-parity.mjs`, which the
recipe does not install (reddoorla/reddoor-maintenance#732; the class is now
bounded at exactly one dangling reference of thirteen).

## 2026-09-10 — The empty page had two causes, and only one of them was known (#12)

CI was red on PR #12 and `/` on the deploy preview served the navbar over
nothing. Three symptoms were reported together — red CI, no content, no favicon
— and they turned out to be three unrelated defects that happened to be visible
at the same time.

**CI: a test that could only run on the machine that captured the reference.**
`NavyContact.test.ts` read `matching/spec/index.html` at module scope to derive
its expectations from the real markup rather than retyping them. The reasoning
was sound and is still the reasoning; the file is gitignored. `matching/*` is
ignored on purpose — the capture is a workspace, not a record — so it exists on
every machine that has run the harness and on no CI runner. A module-scope read
throws ENOENT during **collection**, which takes the whole file down: CI
reported `1 failed | 50 passed` and `422 passed` against 445 locally, so **23
assertions about the contact band silently stopped running** and the failure
named a missing file instead of anything about contact. This is the shape the
six rules warn about from the other side: not a check that passed without
evidence, but a check that vanished without saying so.

Fixed by generating `src/lib/slices/NavyContact/reference.html` — 3885 bytes,
two verbatim excerpts (navbar 940, contact 1941) — and tracking it. The
derivation rules are content-addressed, not offset-addressed (`<div
data-animation="default"` to the next `</div></div></div>`; `<div id="contact"
class="section-7">` to the next `<script`), and they exist twice on purpose: in
the generator and in the test, where `agrees with the live capture, wherever the
live capture exists` re-runs them against `matching/spec/index.html` whenever
that capture IS present and asserts byte equality. So the fixture cannot drift
from the reference on any machine that could notice, and CI still runs every
assertion. Proof rather than inference: with the capture moved out of the tree,
**29 tests pass** — the 24 contact tests plus the 5 new repo-level ones.

**Belief corrected on contact.** The previous entry's "what is NOT done" said
`/` renders empty because the home document is not seeded, and treated that as
the whole story. It was not. `customtypes/page/index.json` — the `page` type's
slice zone, which is the list Prismic actually enforces — carried the nine
template slices and **none of the five `navy_*` ones**. Seeding would have
returned HTTP 200 and published a document with zero slices, and the page would
have stayed exactly as empty, with the seed looking like it worked. The
Migration API's silent drop is called out at the top of `site-pages.js`, and
`site-pages.test.ts` has an assertion literally named _"declares every field the
documents set, so Prismic strips nothing"_ — which is why the gap read as
covered. That check compares documents against the **slice models**, and every
model was present and correct. The zone is a separate declaration in a separate
file, and nothing compared anything to it.

`src/lib/slice-zone.test.ts` now asserts it in both directions: the set of
`model.json` ids on disk equals the set of zone choices (14 = 14), and every
slice type `documents()` publishes is in the zone. The mirror direction is not
padding — a slice offered to an editor with no component behind it renders
nothing, which is the same failure wearing the other hat.

**Favicon: the placeholder that answered 200.** `static/favicon.png` was the
template default — 128×128, 8-bit grey+alpha, 1571 bytes — and it existed, and
it served, and `curl` said `status=200 type=image/png`. Every check that asks
"does the icon resolve" was green while the tab looked blank. Now both of the
reference's own icons ship as files: `favicon.png` (32×32) and
`apple-touch-icon.png` (256×256, previously pointed at `favicon.png`). The test
asserts byte equality with the captured originals rather than existence, because
existence is precisely what was already true.

**The guards were broken on purpose before being kept.** The slice-zone check
was run with `navy_contact` deleted from the zone (both assertions red, naming
`navy_contact`); the icon check with the old placeholder restored (red); the
module-scope-read check with a synthetic `readFileSync(resolve(ROOT,
"matching/spec/index.html"))` appended to `NavyContact.test.ts` (red, naming
`NavyContact.test.ts:524`). Its limit, stated because it will matter later: it
matches a read call and `matching/` on one unindented line, so a module-scope
read spread across several lines walks past it. It catches the shape that
actually shipped, not the class.

**What is NOT done.** The home document is still not seeded. The order is now
forced and worth writing down: the slice models and the custom type only reach
Prismic when `prismic-models`' apply job runs, and that job runs on push to
`main` and nowhere else — so #12 must merge before a seed can succeed, and a
seed run before it would have published nothing either. After the seed,
`svelte.config.js`'s four-id `AWAITING_SEED` allowlist comes out. The nine
template slices remain in the zone on what is a one-page site; leaving them is
deliberate (the apply job never deletes, and no document uses them) but it does
offer an editor nine ways to break the match. The `Creative Lofts` region is
still a measurement floor, not a build defect, and the harness fix behind it —
freezing CSS/JS animation the way `capture.mjs` already freezes `<video>` — is
still unfiled.

### Addendum, same day — the seed command does not exist

Written after the entry above, which says the seed is blocked behind merging
#12. That is true and it is not the whole blocker. While checking that
`reddoor-maint prismic-seed` would work after the merge, I ran the CLI's own
`--help`: **there is no such command.** 0.93.1 exposes 27 commands; the
Prismic-adjacent ones are `prismic-ci`, `prismic-models`, and the `migrate`
actions of `blux` and `webflow`. `grep -rl prismic-seed` over the installed
`dist/` returns nothing, and over the source repo's `src/` returns nothing.

Five files in this repo name it. I wrote three of them in Phase 2 —
`site-pages.js`'s header, `svelte.config.js`'s allowlist comment, and (today)
`slice-zone.test.ts` — describing a tool I never checked existed, in the same
session as the code they describe. That is precisely the hypothesis-not-a-record
trap the six rules name, and knowing the rule did not stop me writing it three
times. Corrected in those three. The other two are recipe-owned
(`site-pages.test.ts`, `dev/match/[uid]/+page.server.ts`) and a site must not
hand-edit them; filed as reddoorla/reddoor-maintenance#763, which also asks
whether the class has more members — it is the second known instance after
\#732's `probe-anchor-parity.mjs`.

The route file makes the strongest version of the claim: it says the dev surface
renders _exactly what the seed publishes_. That cannot be true of a seed that
was never written, and it is the sentence that made "one command away from live"
feel settled for a whole phase.

So the real remaining work is not "run the seed" but "write the seed". The
machinery is present twice over: `scripts/import/migrate.example.ts` is a worked
`createWriteClient`/`createMigration`/`createAsset` example, and `webflow
migrate` already pushes docs + assets through a shared runner. What is missing
is anything that takes `documents(img)` from `site-pages.js` as its input and
uploads the ~30 images as Prismic assets. That is a real piece of work and it
writes to a live CMS, so it is the operator's call to start, not a loose end to
tidy.
