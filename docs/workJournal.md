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

### Addendum 2, same day — 25 images of authored alt text that cannot reach the page

Found while working out what the seed's inputs would have to be, after #12
merged. Every `navy_*` slice's `mocks.json` carries real authored alt text — 25
of 25 image fields, and it is good text. None of it can reach a rendered page.
`site-pages.js` resolves images through `img(url)`, a URL and nothing else, and
`dev/match/[uid]` hard-codes `alt: null`. Every component does the right thing
with what it is handed (`alt={photo.alt ?? ""}`), so the result is `alt=""`
everywhere except the hero's logo and mobile aerial, which carry hardcoded
`REF_*` fallbacks. `mocks.json` is Slice Machine preview data: read by the
previewer and by the slice tests, and by nothing that renders the site.

Third instance today of one shape — authored content in a file the path to
production does not read — after the slice zone and the gitignored capture. In
all three the mechanical checks were green because each was asking a question
the gap did not answer. Here the checks are _structurally_ incapable: `alt=""`
is valid markup, so the axe gate reports 0 violations and always will, and
`NavyContact.test.ts`'s test named `authors real alt text instead of the
reference's alt=""` passes because it supplies alt in its own fixture rather
than through the delivery path. I wrote that test believing it covered this.

`LEDGER.md` records authoring real alt text as a deliberate accepted deviation
from the reference, taken knowingly at the cost of a text diff. In the shipping
path that deviation does not exist. The ledger says it was decided; it was not
delivered — and the ledger is the document a launch sweep trusts on exactly this
question.

Filed as #13 rather than fixed here, because widening `img()` to carry alt is a
change to the contract the seed will be written against, and the seed does not
exist yet (Addendum 1). Doing it before the seed means the alt text lands in
Prismic where an editor can maintain it; doing it after means typing 25 strings
into the CMS by hand.

**State at end of session.** #12 merged as `800ceb5`; CI green on main;
`prismic-models` applied 6/6 models, and Prismic independently confirms 14
shared slices and all 14 slice-zone choices on the `page` type. So the CMS is
now capable of holding this page, and holds an empty `home` document. Three
issues open: reddoorla/claude-skills#2 (harness animation freeze, behind the
Creative Lofts floor), reddoorla/reddoor-maintenance#763 (the recipe naming a
seed command that does not exist), and #13 (this).

## 2026-09-10 — Alt text gets a channel, and the seed gets written (#13)

Two asks, one dependency between them: the seed's input contract is `img`, so
widening `img` had to come first or the alt text would have had to be typed into
the CMS by hand afterwards.

**`img(url)` → `img(url, alt)`.** Backward-compatible by construction, which is
what made it safe to do without touching a recipe-owned file. Settled from the
recipe's own table rather than by guessing: `MATCH_HARNESS_FILES` marks
`src/lib/site-pages.js` as `owner: "site"`, and `planFileWrite` returns `skip`
for those — "records are never touched again". The dev route and
`site-pages.test.ts` are `owner: "recipe"` and stay untouched; because JS drops
extra arguments, the recipe's one-argument `devImg` keeps working unchanged and
the dev surface renders exactly what it did before.

**One alt per URL, because Prismic says so.** Alt lives on the ASSET, not the
field: `@prismicio/client`'s `Migration.js` does `config.alt = config.alt || …`,
so a second `createAsset` for the same file cannot re-alt it — it keeps the
first and drops the rest in silence. The aerial is used twice, in the hero's
mobile band and the location band, and mocks.json had two authored strings for
it ("the surrounding blocks" vs "the surrounding Santa Monica blocks"). The more
specific one won. `site-pages-images.test.ts` now fails on a URL with two alt
strings rather than letting Prismic pick, and the resolver throws on it too.

**Two of my own assertions were wrong, and the test caught them.** I wrote an
alt-length floor of 10 characters; it failed six images whose alt is exactly
right — "Lyft", "Uber", "ClassPass", "29 Navy". A brand logo's alt _is_ the
brand name, and a rule that calls that too short teaches people to pad it.
Removed; the invariant is non-empty and nothing more. Then the file-existence
check failed three URLs — the floor-plan triggers, referenced percent-encoded
(`Untitled%20design%20(16).png`) and sitting on disk with literal spaces,
because that is how the reference serves them and how the capture saved them.
All three return 200 in production: a browser decodes before reaching the
filesystem. `readFileSync` does not. So the seed needed `decodeURIComponent`,
and would otherwise have died on exactly those three **after** uploading the
other 21 assets. Those are the same three files Phase 0's `url()` extractor
missed — the third time that one parenthesis has cost something.

**The seed: `scripts/import/seed-home.mjs`.** Dry run by default; `--apply`
writes. Measured dry run: `UPDATE aqCp8REAADEAeC8A page/home`, slices 0 → 5,
**24 assets, 4.7MB** — 24 and not 25 because of the dedup.

Three decisions worth the space:

- **`.mjs`, not `.ts`.** `scripts/import/migrate.example.ts` says to run it with
  `pnpm tsx` and imports `dotenv/config`; neither is a dependency of this repo
  and neither ever has been, so those instructions have never worked. Node's
  `--env-file` replaces dotenv and Node 20+ has `File` and `fetch`, so this runs
  on the node the repo already requires and adds no dependency.
- **Importing the file does nothing.** `main()` is behind an `argv[1]` check and
  a test spawns node to import the module and asserts the output is empty. This
  is not hypothetical: earlier in this project I imported a sibling script
  purely to syntax-check it and executed it against the live reference. The same
  mistake here is a CMS write.
- **UPDATE, never CREATE, when the uid exists.** The write client decides on
  `document.id` alone (`WriteClient.js:163` — no id means create), so the lookup
  is what makes a re-run idempotent. Without it a second run leaves two `home`
  documents and the route serves whichever Prismic answers with. Fields the
  assembly does not mention survive: the seed writes slices, it does not blank
  the SEO tab.

`vite.config.ts` now includes `scripts/**/*.test.{js,ts}`. "It is only a script"
is exactly the reasoning that leaves the irreversible code as the untested code.

Every guard was broken on purpose and watched go red: the import guard removed
(the inertness test failed), dedup disabled (two tests), `decodeURIComponent`
removed (the path test). `pnpm verify`: **55 files, 468 tests, 4 smoke, exit 0.**

**What is NOT done.** The seed has not been run. `--apply` uploads 24 assets to
the media library, and deleting those again is manual — the document update is
versioned and revertible in the editor, the assets are not. That asymmetry is
printed in the dry-run footer so it is in front of whoever types the command.
After a successful run the `AWAITING_SEED` allowlist in `svelte.config.js` comes
out. `meta_title` and `meta_description` on the home document are still null;
the seed deliberately does not invent them.

### Addendum, same day — the seed ran, and reported success over an empty page

`--apply` uploaded 24 assets, updated the document, printed `✔ done`, and left
`/` with zero slices. Both halves of that are worth keeping.

**`migrate()` stages; it does not publish.** It writes into Prismic's _migration
release_, and the published document is untouched until
`publishMigrationRelease()`. `@prismicio/client` says so in
`migrateUpdateDocuments`' own JSDoc — _"Updates documents in the Prismic
repository's migration release"_ — and its usage example calls publish on the
very next line. I read `createAsset`, `createDocument`, `updateDocument` and
`WriteClient.js:163` closely enough to get the create-vs-update semantics right,
and never read the two lines after the call I was copying. The script then
reported success on a clean exit — the exact shape the first of the six rules
names, in the one place tonight where it was irreversible.

Caught because the plan was to verify in Prismic afterwards, not because
anything in the script objected. Nothing in it could have: it had no idea what
"live" meant.

**Then the verifier I wrote to fix it returned a false negative.** First version
built a fresh Client per attempt, with a comment explaining that a Client caches
the master ref it first resolves — true, and beside the point. `/api/v2` is
served from a **URL-keyed CDN edge**, so every fresh Client received the same
stale ref and the retry loop was theatre for a different reason than the comment
claimed. It printed `0 slice(s) live, expected 5` over content that was already
published; the direct query that disproved it differed only by a random query
parameter. Now a plain cache-busted fetch, and a test asserts every request
carries `_=` and that the nonce changes between attempts — because a retry
without one re-reads the first attempt's cached answer.

Both failures are the same mistake at different distances from the truth: taking
a thing that returned cleanly as a thing that worked.

**What is live.** `publishMigrationRelease()` moved it; the fixed `--verify`
reads `home: 5 slice(s) live, expected 5` off the published ref. The document is
one page (not two — the uid lookup held), all 24 assets resolved to
`images.prismic.io`, and **every alt string arrived**: "29 Navy", "Lyft",
"Sunlight falling across the brick facade…". Both aerial usages point at one
asset id, `ma98hXBLD58eEQjF`, so the dedup survived the round trip.

`svelte.config.js`'s four-id `AWAITING_SEED` allowlist is deleted. That turns
`handleMissingId` back into a real check, and it is now the evidence: `pnpm
verify` prerenders `/` from live Prismic with no allowlist and passes, so
`Location`, `Lofts`, `Residents` and `contact` all exist on the page. The
prerendered `index.html` is **44,721 bytes** against 6,951 before, carries all
five `data-slice-type` markers and 75 `images.prismic.io` references.

`--publish` and `--verify` exist as separate modes because of this: the resume
path is what you need when staging succeeded and publishing did not, and
re-running `--apply` would have uploaded all 24 assets a second time.

`pnpm verify`: **55 files, 472 tests, 4 smoke, exit 0.**

## 2026-09-10 — The modal fade was the wrong curve, and 12 images waited for a click

Two defects reported off the live site, both invisible to every check the repo
had.

**The backdrop.** The CSS transcription was correct — `.popup-modal---electric`
is `#000000a1`, the other five are opaque `var(--black)`, and all six geometries
match the reference to the pixel (backdrop 1440×900 @0,0, card 600×300 @420,300,
logo 41×41 @969,310, measured on both live sites). What did not match was the
_curve_. The reference tweens all six with IX2, duration 500, delay 0, and
**three different easings**:

|                            | reference   | this repo, before |
| -------------------------- | ----------- | ----------------- |
| open, `.popup-modal---gym` | `outQuad`   | `inOutQuad`       |
| open, the other five       | `inOutQuad` | `inOutQuad`       |
| close, all six             | `""`        | `inOutQuad`       |

The old comment said _"IX2 actionList 'a' group 3 tweens opacity 0 -> 1 over
duration 500 with easing 'inOutQuad'"_ — one action list, read correctly, and
generalised to twelve. Enumerating the class was the whole job and it was the
step that got skipped.

Measured rather than inferred, gym opening at 1440: reference opacity
**0.63976** at 200ms, which is easeOutQuad exactly — `0.4 × (2 − 0.4) = 0.64`.
This repo produced **0.334882** there, an easeInOutQuad value. Closing, sampled
every 100ms: reference **0.7834 / 0.5834 / 0.3832 / 0.1686 / 0** — a straight
line, so IX2's empty easing is LINEAR, not some default curve. After the fix,
against a production build: open **0.399 / 0.704 / 0.865 / 0.961** against the
reference's 0.437 / 0.714 / 0.898 / 0.993, and close 0.785 / 0.567 / 0.350 /
0.135 against 0.782 / 0.582 / 0.382 / 0.166. The 200ms gap went from 0.305 to
0.010; the residual is about one frame, since `shown` flips on rAF.

The two directions now differ, which needs a hook: `data-open` is set in the
same frame as the opacity so the timing function is already in effect when the
transition starts.

**The pop-in.** `loading="lazy"` on an image inside `display: none` is never
"near the viewport", so the browser defers it until the container is shown and
the user watches it arrive. Measured on production: **2 of 12** hidden images
had been fetched before any interaction — the close icon and the one floor plan
that is `open_by_default`, both of which are visible. The other ten waited for a
click or a hover.

The reported instance was the residents modals; the class is larger. Three of
the four floor plans are hidden at rest too, and each is a 2402×1392 PNG, so
hovering a floor started a fetch for the picture the hover exists to show.
`$utils/preloadHidden` warms both sets after `load` and inside
`requestIdleCallback` — deliberately not on mount, because these are by
construction not needed for first paint and fetching them early would compete
with the hero slides for connections on exactly the slow links where that
matters. After: **12 of 12**, resources 34 → 46.

Two details that are not decoration. The util takes `{src, srcset, sizes}`, not
a bare URL, because the floor plans render under `sizes="100vw"` over a
five-candidate ladder — warming `src` alone caches the 2402w original and the
browser then requests the 1600w candidate anyway, which is two fetches and the
pop-in intact. And srcset/sizes are assigned _before_ src, because the candidate
is resolved at the moment src is set; a test asserts the assignment order rather
than the final values, since the final values are identical either way.
`.image-14` is deliberately excluded: ref css:2789 hides it and no reference JS
chunk un-hides it, so warming it would spend a request on something unreachable.

**Why nothing caught either.** The axe gate cannot see a fade curve or a
deferred fetch. The geometry gate measures a settled still frame, so a 500ms
tween of any shape is identical to it once settled, and it never opens a modal
at all. Both defects live in the gap between "the markup is right" and "the page
behaves like the reference" — which is Phase 5's territory, and this is the
first evidence of how much is in it.

Guards broken on purpose: gym's own rule disabled (the exact original bug — the
test names it), the close transition set back to the opening curve, the srcset
dropped from the floor-plan warm-up. All three red, restored green.

`pnpm verify`: **56 files, 486 tests, 4 smoke, exit 0.**

## 2026-09-10 — Phase 5: the slider moves, and the gate says exactly what it said before

The hero carousel autoplays, loops, takes arrows, keys and swipes. Gate before
**16/20**, gate after **16/20**. Both numbers are worth having.

**How the reference moves, measured rather than assumed.** It does not translate
the mask and it does not reorder the DOM. Each `.w-slide` carries its own inline
`transform: translateX(...)` with an inline `transition: transform 0.5s ease`
that is absent at rest — computed `all 0s` until the first move. Everything else
came off the element itself: `data-delay="3000"`, `data-duration="500"`,
`data-easing="ease"`, `data-infinite="true"`, `data-hide-arrows="false"`,
`data-disable-swipe="false"`.

The wrap was the part worth measuring. The obvious implementation — index + 1,
modulo — rewinds through five slides at the end, which is visibly wrong. The
reference instead hands the outgoing slide a one-off transform so it keeps
travelling left while slide 1 arrives from the right. In slide-widths:

    on slide 6   -5 -4 -3 -2 -1  0
    after wrap    0  1  2  3  4 -1

Found by sampling the computed transform every 50ms through the wrap: it jumped
to **+1368** — positive — and eased to 0, which is nothing like a rewind. This
build keeps a per-slide offset instead of the reference's history-dependent
arrangement; `.w-slider-mask` is `overflow: hidden` (ref css:1198) so everything
outside one slide-width is clipped and the two cannot differ on screen. Measured
cadence: reference **3011ms**, this build **3012ms**.

**The a11y gate caught something real, and it is a genuine conflict.** Giving the
dots the reference's own runtime `role="button"` and `tabindex="0"` turned six
indicators into six interactive controls, and axe failed the build on
`target-size` — WCAG 2.2 AA 2.5.8, serious, six nodes. The dots are `1em` = 14px
with `margin: 0 3px` (ref css:1262): 14px targets on a 20px pitch, where the rule
wants 24 of either. Neither the size nor the spacing exemption can be met without
moving pixels the geometry gate measures. **The reference cannot pass this rule
as drawn.** Interaction moved to the arrows, which are large enough and carry the
reference's runtime `role`/`tabindex`/`aria-label`/`aria-controls`; Left and Right
work anywhere in the carousel. It costs click-a-dot-to-jump, and it is in
LEDGER.md as an operator decision rather than a thing I quietly chose.

**A bug I wrote and my own test caught.** Moving the background into a quoted
`style="..."` attribute alongside `{...}` expressions rendered
`url("&quot;…&quot;")` — Svelte does not decode an entity written inside a
template string, so the quotes reached the CSS as literal text and every slide
background stopped loading. The whole style is built in one function now. The
test that failed was the reduced-motion one, which was looking at the style
attribute for an unrelated reason; it printed the broken URL and the bug was
obvious. Two existing tests also had to change — one looked for
`<div class="w-slider-mask">` before it gained an id, the other asserted bare
slides carry no `style` attribute at all, which stopped being true the moment
slides carry a transform. Both intents survived; only their expression moved.

**Why the gate did not improve.** Two of the four exits offered in LEDGER.md have
now happened — the harness learned to freeze animation, and the autoplay exists —
and `Creative Lofts` still fails at 34.1–37.9%. That is the expected result and
it sharpens the diagnosis: the freeze pins looping **CSS** animations, and a
Webflow slider on `setInterval` is not one. `getAnimations()` cannot see it, so
freezing stops it moving without making two captures agree on where it stopped.
Both sides now move and both are photographed at an independently-chosen slide.
The remaining fix is a faked page clock; what I learned attempting it is on
reddoorla/claude-skills#2.

Everything else on the page still passes, most at **0.0%** — `Hover or click on
a floor`, `Paying rent online?` and `29 Navy Street` are 0.0/0.0 at all four
viewports, and the four anchors resolve to identical Y on both sides.

`pnpm verify`: **56 files, 494 tests, 4 smoke, 0 axe violations, exit 0.**

## 2026-09-10 — SEO metadata, and a seeder that would have duplicated 24 assets

Small change, one real defect found on the way to it.

**The seeder was not idempotent for assets, only for documents.** The earlier
entry claims "UPDATE, never CREATE" and that is true of the _document_; every
image was a fresh upload on every run. `@prismicio/client`'s
`migrateCreateAssets` walks `migration._assets` and uploads each one
unconditionally — there is no id check anywhere in that path — so the second
seed would have put a duplicate of all 24 images in the media library, and
deleting those is manual. Nothing would have reported a problem.

Found by asking a narrow question — "what does re-running this actually do?" —
before running it, which is the only reason it was found before rather than
after. Fixed by reading the published document first and reusing the image
fields it already carries: an `img()` whose file is already in Prismic returns
the existing field instead of registering an upload. Measured: **24 to upload
before, 0 after.**

`documents()` is now called twice, deliberately. The first pass hands in a
resolver that returns nothing and exists only to read the uids, so the published
documents can be fetched before any asset decision is made.

**A bug inside the fix, caught by measurement not by review.** Prismic stores
assets as `<id>_<original filename>`, so the original is recovered by stripping
the prefix. Stripping at the first underscore is wrong: **the id itself contains
one** — `4uIPMTuS_qroVXjo`. That matched **17 of 24** and silently re-uploaded
the other seven. Visible only because the dry run prints both counts; a fix that
merely "worked" would have shipped at 71%. Now stripped using the field's own
`id`, and a test uses an underscore-bearing id specifically.

**The metadata itself is written, not transcribed.** The whole reference carries
exactly two `<meta>` tags — charset and viewport — and a `<title>` of "29Navy".
There is no description to copy, so matching the reference here would mean
shipping none either. That is a gap in the original rather than a spec to
reproduce, and meta tags render nothing the geometry gate measures. Every phrase
is lifted from copy already on the page: the hero tagline, the contact block,
and the Lofts section's own labels. Nothing is claimed that the page does not
already say. It is **draft copy on a client site and nobody has approved it.**

**Not applied.** The `--apply` run was blocked by this environment's guard on
writes to live systems, which is the correct call for a CMS write. The change is
committed and the dry run is clean; one command lands it.

`pnpm verify`: **56 files, 491 tests, 4 smoke, exit 0.**

## 2026-09-11 — The hero region was never geometry, and the verifier was vouching for fields it never read (#20, reddoorla/claude-skills#4)

Started from `--apply` finally being run by the operator. Confirmed the meta
fields are live — `meta_title` and `meta_description` both exactly as authored,
`last_publication_date` 2026-09-11T05:07:36Z — by reading the published ref
directly rather than trusting the exit code.

**The seeder's own verifier was overclaiming.** `--verify` printed "the
published ref carries what site-pages.js describes" while comparing slice
**count** and nothing else. It had just been run over a write whose entire
purpose was two text fields, and it passed without reading either. This is the
`turnstile: true` shape from CLAUDE.md, in code merged the day before: a green
granted by a check that cannot observe most of what it vouches for. `--verify`
now compares slice types in document order and every top-level string field, and
the success line names that scope instead of the whole document. Image fields are
excluded deliberately and the reason is in the code: Prismic rewrites an uploaded
image's URL, so `url` never round-trips and an assertion on it would fail every
run.

**`next.mjs` prescribed a tool this harness has never installed.** Rule 5 makes
every round run `node matching/next.mjs`, and its output names
`probe-anchor-parity.mjs` as the first thing to do before treating a failure as
geometry. The file does not exist here; it exists in `beachfront-dentistry`,
whose 214-file `matching/` the harness was ported from. Second instance of the
same class as the `prismic-seed` references (reddoor-maintenance#763): a command
written down without checking it runs. Ported the probe rather than deleting the
line, because its answer was needed.

**The probe then produced a false positive, and it was nearly convincing.** It
reported `Creative Lofts` cutting on non-comparable elements at every viewport —
`<div class="section-2">` h=900 on live against `<main class="flex-1">` h=4106
here, a 4.6× box difference — and concluded every region score below it was
suspect. It was wrong twice. The probe selects over `body *`; `lib/capture.mjs`,
which does the real cutting, uses a fixed tag list that **does not contain
`main`**. And `regionsFromAnchors` cuts on the anchor's top **Y**, not its box:
both sides were at y=68. So the gate had never made the comparison the probe was
alarmed about. The probe now uses capture.mjs's exact selector and flags on y
divergence, with the height ratio demoted to context. A probe that models the
thing it audits differently from the thing itself is worse than no probe.

**The real cause of `Creative Lofts`, after five phases of it failing 34–38%.**
`capture.mjs:42` sets `reducedMotion: "reduce"` on every capture. This build's
hero honours that and does not autoplay; Webflow's slider ignores the media query
and keeps advancing. The gate was photographing this build on slide 1 and the
reference on slide 5 of 6 — `gallery_roof1.jpg` against
`gallery_29navy_interior.jpg`. `heightDeltaFraction` was exactly 0, the anchors
were identical, and the Location band immediately below matched pixel for pixel.
Everything measurable said "the geometry is right", and it was.

The evidence that settled it was the fail crop, which shows a kitchen on the left
and a rooftop in the middle. That image had been sitting in
`matching/out-phase5b-home/` for a phase and a half. **Four viewports of
consistent arithmetic got more attention than the picture of the thing failing.**

Fixed with `pinState` in the shared skill — one snippet applied to both pages
from a single option object, disclosed by `gate.sh`, by page-diff's header and in
`report.json`. `Creative Lofts` went to **0.0% at all four viewports**;
**20/20**, zero floors, zero masks, threshold still 0.1.

**Belief corrected on contact.** Phase 5 recorded the cause as "the freeze pins
looping CSS animations, and a `setInterval` carousel is not one". Both halves
were wrong: the reference bundle has **zero** `setInterval` calls and autoplays
on recursive `setTimeout`, and the operative difference was never the freeze's
reach but the capture's own forced reduced-motion, which the two implementations
answer differently. That belief is also why a faked page clock looked like the
only exit and the region looked like a floor. It was a one-line config change
away from passing the whole time.

**Honest accounting.** The gate did not move because of anything drawn or
restyled this session. Every one of the 20 regions was already correct; the
measurement was reading two different pages. The slider motion work in #18 and
the preload/modal work in #17 were both real, but neither moved this number, and
anyone reading the score jump as evidence that they did would over-invest in
exactly the wrong place.

**Not fixed.** A faked page clock (reddoorla/claude-skills#2) remains the better
answer than naming an element per page — it would pin any timer-driven widget
without the site having to describe its own carousel to the harness. `page.clock`
was measured and does not work as documented: `install()` alone ticks with real
time, and `pauseAt` hangs navigation whether called before or after `goto`.
`pinState` is the workable version, not the right one.

## 2026-09-11 — The hero slider was empty most of the time, one subtraction away (#21)

Operator report: "slider is in a rough state right now, most of the time it's
just grey." Reproduced on production before touching anything, because a report
about intermittent behaviour is worth measuring rather than reasoning about:
sampled the live page every second for twenty seconds and found **no slide at the
mask's left edge in 14 of 21 samples**. The grey is `.slider`'s own
`rgb(221, 221, 221)` — Webflow's default — showing through an empty mask. Every
image decoded, no request failed, total hero payload 0.93 MB across six files. It
was never a loading problem.

**Cause, in one line.** `.w-slide` is `display: inline-block`, so slide _i_
already sits at _i_ slide-widths from inline flow. `translateX` adds to a flow
position; it does not replace one. `slideStyle` wrote `translateX(offset * 100%)`
as if it were absolute, so rendered position was `i + offset`:

    at rest      0  2  4  6  8 10     two slide-widths apart
    one step    -1  1  3  5  7  9     nothing at 0 — the mask is empty

Fixed with `translateX((offset - i) * 100%)`.

**I reasoned my way to the wrong answer first.** Reading `step()` I traced all
six positions by hand, confirmed exactly one slide has `offset === 0` at every
point in the loop, and concluded the offset arithmetic was correct — and wrote
that down. It _was_ correct. The bug was one layer below, in translating an
offset into a screen position, and no amount of staring at `step()` would ever
have shown it. What found it was dumping every slide's actual rect and reading
the spacing: `0 2 4 6 8 10`, twice what it should be, which names the defect on
sight.

**The fix is not a workaround; it converges on the reference.** Measuring the
live slider — which should have happened when this was first written — shows all
six slides carry `translateX(0px)` at rest and share ONE transform value away
from a wrap (`-0.30`, `-1.33`, `-2.37` sampled mid-tween), with a one-off value
for the wrapping slide. `(offset - i)` produces exactly that: `0,0,0,0,0,0` at
rest, one shared value in motion, `4,-2,-2,-2,-2,-2` at the wrap.

**A declared deviation was hiding a defect.** `matching/LEDGER.md` carried "The
off-screen slide arrangement differs, invisibly", arguing that
`overflow: hidden` (ref css:1198) clips everything outside [0, 1) slide-widths so
the arrangement "cannot differ on screen". The clipping premise was true and the
conclusion was false — the slides were not merely arranged differently off
screen, the on-screen slot was empty. And there was no deviation to declare: the
build now matches the reference's mechanism exactly. Writing "this differs, and
here is why it does not matter" removed the pressure to check whether it differed
at all. That entry cited a stylesheet line for the clipping and cited nothing for
the arrangement, which under matching rule 1 should have been the tell.

**Why every test passed.** The motion tests read the transform value and compare
transform values with each other — the offset domain, which was internally
consistent and right. Not one of them asked where a slide ends up. Worse, the
first of them recorded the correct measurement in its own comment ("every slide
carries `translateX(0px)` and they sit at 0, 1440, 2880") and then asserted
`[0, 1, 2, 3, 4, 5]` against the transform, contradicting the sentence directly
above it. The comment was a note taken from the reference; the assertion was
written from the implementation; nobody read them together. Those assertions now
read `positions()` — `transform + index` — which is what their comments always
meant, and a new guard asserts the carousel's one real invariant: **exactly one
slide is on screen at every step of a full loop.** It fails on the old code with
`step 1: positions -1 1 3 5 7 9`.

**Why the gate could not have caught it, and a warning about Phase 6.** The gate
photographs one settled frame. At rest slide 0 sits at `0 + 0 = 0` either way, so
all four `Creative Lofts` regions read 0.0% before and after this fix — the
number was identical across a change that took the slider from broken to
working. Phase 6's `pinState` deliberately pins the carousel to slide 1, which is
precisely the frame where this defect is invisible. Pinning bought a real,
honest measurement of everything static, and it cannot say anything about the
frames in between. **A passing geometry gate is not a claim that a moving
component moves correctly**, and nothing in the harness currently is.

## 2026-09-11 — Autoplay restarts on interaction, and I should have read the starter first (#22)

Operator: "clicking a slide should reset the autoplay timer. Did you build your
own slider or use the implementation we already had in reddoor starter?"

**I built my own, and I did not check.** `src/lib/components/Slider.svelte` is in
this repo — 12KB, with tests, shipped from the starter — and is referenced only
by the a11y fixtures route. It already has autoplay with pause-on-hover,
pause-on-hidden-tab, APG focus handling, reduced-motion, loop and fade modes, and
`autoplayEpoch`, whose comment reads "Re-key the interval on swipe navigation so
a gesture restarts the full delay" — precisely the feature being asked for.

Two things follow, and only one of them is an excuse.

The excuse is real but partial: this is a pixel-matched Webflow rebuild, and the
gate compares against a DOM of transcribed Webflow classes
(`.w-slider-mask > .w-slide.slide-6`, arrows, `.w-slider-nav`), with CSS lifted
from the reference stylesheet. The starter's Slider owns its own wrapper markup
and exposes only a Snippet for slide content, so it could not have been dropped
in without forking it. A separate component was probably the right outcome.

The part that is not excused: **the outcome was right and the process was not.**
I never opened the file, so I never saw that the logic — epoch re-keying, the
pause states, the dot hit-area treatment — was sitting there to be copied. Two
of those I then re-derived, one of them wrongly enough to escalate it to the
operator as a decision.

**The dot-nav deviation, re-tested.** Phase 5 declared that the reference's dot
nav cannot pass WCAG 2.2 target-size and moved interaction to the arrows, and I
put that to the operator as a call only they could make. The starter's answer is
`h-6 min-w-6` — a 24px hit area wrapping a smaller visual. Tested here with the
reference's real geometry:

    as shipped   target 14x14  visual 14x14  pitch 20px  row 114px  FAIL insufficient size
    padded       target 24x24  visual 14x14  pitch 20px  row 114px  FAIL partially obscured

The conclusion survives, which is the only reason this is a footnote rather than
a retraction: the hit area preserves geometry exactly (row width identical at
114px) but adjacent 24px targets overlap on the reference's 20px pitch and axe
fails 5 of 6 on obscuring. The blocker is the PITCH, not the box — a materially
better statement of the problem than the one I gave, and one I would have had a
day earlier by reading the component that was already here. First attempt at the
fixture also got this wrong: negative margins collapsed the pitch to 14px and I
nearly read the result off a row 30px narrower than the reference's.

**The autoplay measurement.** The existing code comment said clicking "does NOT
stop" the reference's autoplay — true, and not the question. Measured whether it
re-phases: ticks at 2192, 5201, 8211, 11222ms hold a flat ~3010ms cadence
straight through a click at 4235ms. So the reference lets a scheduled tick land
under a second after a click and jump again unasked. This build now restarts the
delay, which is a deliberate deviation recorded in LEDGER. The guard that matters
is negative — at 2900ms after a click the original tick's slot has passed and
nothing may have moved — and it fails on the old code with "expected 2 to be 1".

**Worth carrying forward:** this repo has a `$lib/components/` directory of
solved problems, and a slice that needs behaviour should be read against it
before the behaviour gets written. The cost here was not the duplicated
component; it was re-deriving two answers badly and taking one of them to the
operator as a novel constraint.

## 2026-09-11 — The resident tiles, the modals, and the third time $lib solved it first (#23)

Two asks: "the modals in the resident section still need some work, and the whole
box should be clickable, not just the text."

**The tile.** The whole box is clickable now, and the reference never was. Every
tile is `div.div-block-9 > a.link-block-N > div.text-block-8`; the eight anchor
classes carry `text-decoration: none` and nothing else, so the anchor's box IS
the label's box — 9.4% of the 460x124.8 tile for "Hungry?" at 1440. Meanwhile
`.div-block-9:hover` lights the entire tile. The reference has advertised a hit
area it does not have since 2021.

The obvious fix is a trap worth writing down. Stretching the anchor
(`flex: 1; align-self: stretch`) reaches at most 64% of the tile, because 80 of
its 124.8px are the PARENT's padding and a flex item cannot cover it — and it
shifts the glyphs 93.02px left at 1440 while shifting them 0.00px at 991, 767 and
390, because `.text-block-8` is `text-align: left` at 1440 and `center` below it.
**A pixel regression that passes three of the gate's four viewports.** The
stretched-link `::after` ships instead: out of flow, so nothing moves, and
`inset: 0` resolves against the tile's padding box including both 40px bands.

Measured on a production build: corner hit-test `....A` -> `AAAAA` on all eight
tiles at all four viewports, the anchors' own boxes unchanged at 6.1%-34.5%, and
`#Residents` still 743.19px / 1322.38px. Two earlier runs of that probe reported
false misses because `scroll-behavior: smooth` (app.css:223) meant
`scrollIntoView` was still animating when I sampled — the failures moved around
between runs, which is the tell I should have read faster.

**The modals.** `$lib/actions/trapFocus.ts` was in the repo the whole time, with
a docblock describing this exact case and an `enabled` option for overlays that
are always rendered and toggled by state. The hand-rolled version moved focus in
and never contained it, so one Tab from the close control walked onto the page
behind an opaque 100vw/100vh overlay. It also focused inside `queueMicrotask`,
which races Svelte's flush: the popup is `display:none` until `popupStyle` lands
and `.focus()` inside a `display:none` ancestor is a silent no-op — no throw, no
return value, nothing to assert on. trapFocus focuses inside rAF after layout.

Also: `aria-modal="true"` on all six; the six close controls are real `<button>`s
(they were divs whose hand-rolled handler fired on Space KEYDOWN, where a real
button fires on keyup — press Space, change your mind, move off, and it still
closed); backdrop-click dismissal matching `components/Modal.svelte`; focus
restored after the outro rather than 500ms before it; and `aria-expanded`
deleted, because it was keyed on the MODAL and two triggers open `tv_internet`,
so opening either announced both as expanded.

**Three guards, three defects the repo already had.** The style block's
"names a source on every declaration" test caught all thirteen of my new
declarations uncited and made me tag them `repo a11y`. That is matching rule 1
enforced mechanically, and it worked on me within a minute of writing the CSS.
The close-control test's own comment had claimed a `<button>` "would drag UA
styles the reference never had" — true, and not a reason: it is eight
declarations to zero. Corrected forward.

**The pattern, for the third time today.** Slider.svelte yesterday, trapFocus
today, and `prefersReducedMotion` declared verbatim in two slices while
`$lib/transitions.ts:15` exports exactly it. All three were found by looking,
none by remembering. The operator's question — "how do we fix this?" — is the
right one, and the answer is not another paragraph in CLAUDE.md: I read that file
at session start and still did not open `$lib/components/`. Every rule in this
repo that actually holds has a mechanical check bolted to it. The reuse rule is
the only one without.

**Not fixed, filed instead:** `components/Modal.svelte`'s close button is 20x20
(under the 24px target minimum) and its `<dialog>` has no accessible name;
`LandscapeModal` never moves focus into itself; and the six popups sit outside
the axe gate's scope entirely, so the green says nothing about them.

## 2026-09-11 — A check fires after the cost; the index fires before it (#25)

Operator, on my proposal to catch component reinvention with a CI audit: "this
feels retroactive, when the goal is to avoid doing duplicate work, so by the time
you've run the check the cost of failing has already occurred."

Correct, and it inverts the design. I had optimised for _unevadable_ when the
goal is _never started_. A gate that fails in CI saves the merge; it does not
save the hour, and the hour is the thing being wasted. Worse, I had ranked the
three candidate designs by fleet reach and evadability — both properties of a
detector — and put discoverability last, which was the only one of the three
that fires before the work.

**What shipped is the cheapest layer and the earliest-firing one.**
`scripts/capability-index.mjs` generates `docs/COMPONENTS.md`: 50 modules from
`src/lib`, each with its real prop/export names, test count, and its own first
sentence where it left one. `CLAUDE.md`'s Orientation table points at it, so it
is in front of an agent before any decision rather than after any commit.

**No `@provides` tags.** A tag nobody updates is worse than no tag, and the
authoring tax falls on exactly the person already not reading the directory.
Prop names are the capability surface, cost nothing to extract, and cannot drift
because they ARE the code. The Slider row reads
`itemCount, label, cardsPerView, mode, loop, autoplay, showDots, showArrows…` —
that is unmissable in a way a sentence I wrote would not be.

**Why this is not "more prose".** CLAUDE.md already said to check for existing
work. I read it at session start and re-derived three things anyway. The
instruction was never missing; the DATA was. Before today nothing in this repo
put the string `Slider.svelte` next to the word "carousel". Recognition is a
different mechanism from recall, and only one of them had been tried.

**Its own test caught the first real defect in it.** The generator began with an
allowlist — components, actions, utils, stores — and the test asserting that the
three actually-re-derived modules appear failed immediately: `transitions.ts`
sits at the TOP level of `src/lib`, outside all four, and it exports
`prefersReducedMotion`, which is one of the three. An allowlist encodes a guess
about where people put things. It is now `src/lib` minus `src/lib/slices`, and
the count went 40 → 50.

**A generated file cannot also be a formatted file.** Prettier realigns markdown
tables, which rewrote every row and left the freshness check failing forever
against a file nobody had edited. `docs/COMPONENTS.md` is in `.prettierignore`
with the reason.

**What this does NOT solve, stated plainly.**

- It is advisory. Nothing stops an agent that does not read it. The honest claim
  is that recognition beats recall, not that this is enforcement.
- It reaches this repo only. `CLAUDE.md` propagates from the starter, so the row
  and the generator can, but `.claude/` — where a `UserPromptSubmit` or
  `PreToolUse` hook would live, and hooks are the only surface that can
  _interrupt_ before the writing starts — is gitignored at
  `reddoor-starter/.gitignore:12`. Shipping hooks fleet-wide needs that policy
  changed first, which is the operator's call.
- The staleness test IS retroactive, deliberately. It guards the index, not the
  decision.

**The ladder, for whoever picks this up.** Earliest-firing first: inventory in
context (shipped) → `UserPromptSubmit` hook injecting matched entries →
`PreToolUse` on writes to `src/lib/slices/**` → CI audit as the backstop for
authors who bypass all three. Only the last needs an `@reddoorla/maintenance`
release, which is why I had reached for it first and why that was backwards.

## 2026-09-12 — Five pre-show items, and the gate refusing the one that was asked for (`fix/pre-show-launch-items`)

Started from "is this site ready to show?". The measurable answer was yes —
`pnpm verify` exit 0, the matching gate 20/20 at threshold 0.1 with no masks
across 1440/991/767/390, `/health` reporting `prismic: ok`, and axe clean on the
live home page at 1440 and 390. The useful answer was no, for three reasons a
visitor meets in the first five minutes. The operator then asked for five
things. Four are done; the fifth is measured and waiting on a decision.

**The a11y green was not evidence, and saying so cost two real defects.**
`tests/a11y/fixtures.spec.ts` audits `/dev/a11y-fixtures` and `/dev/animate-in`.
No Navy slice is mounted on either. Every a11y pass in this repo's history has
therefore been a statement about the starter's components, and #24 had already
named the gap for the resident popups. Auditing the REAL page found two serious
violations, and — this is the part worth keeping — **auditing it at rest would
have found neither.** Both need an interaction:

- `color-contrast` **2.30:1** on the penthouse floor tab's label. `.div-block-6:hover`
  takes `background-color: #ffffff7d` (ref css:2321); 49% white composited over
  the firebrick band is `#d49e97`, and the label stays inherited white. Needs a
  pointer on the element.
- `target-size` on the floor-plan download icon, squeezed to an **11.3×50px**
  hit area when the electricity or internet popup opens over it. Needs a popup
  open — and only those two of the seven, because only those two overlap it.

`tests/a11y/home.spec.ts` now drives the composed page: four breakpoints at rest,
every floor tab hovered AND opened, all seven popups opened. Under
`no-preference`, deliberately — the shared config forces
`contextOptions.reducedMotion: "reduce"` and the popups branch on it, so
inheriting it audits only the synchronous path.

**It cost a debugging round to make that spec non-vacuous, in exactly the way
the spec exists to prevent.** The first version clicked immediately after
`goto`, before hydration. The triggers are `<a href="#">` server-side, so the
click followed the empty fragment, nothing opened, and axe audited the closed
page — green, measuring nothing. `waitUntil: "networkidle"` fixes it; the
`toHaveCount(1)` on a visible dialog is what makes the failure loud instead of
silent. A second version used `click({ force: true })`, which dispatches at the
element's coordinates and landed on the hero overlay — same silent nothing.

**The contrast fix reuses the reference's own ink.** Background left verbatim
(it is the hover affordance and the gate measures those pixels); only the label
moves, to `#050101`, which is ref css:3055's own hover ink for this component.
2.30:1 → 9.04:1. A unit test composites the two reference values independently
and lands on `#d49e97` to the byte, which is what confirmed the diagnosis rather
than assuming axe's reading. That test exists because the axe spec reads
whatever Prismic serves: give floor 4 a `trigger_image` and `.div-block-6` stops
rendering and the spec goes green having measured nothing.

**The download link: #8 described a mitigation that was never in the code.** The
issue said the rebuild "ships with the download link disabled rather than
pointing at a 404". It did not — the live candidate served
`href="https://29navy.com/pdf/file1.pdf"`, and all four still 404 (re-checked
2026-09-12). Removed the anchor, its glyph, and the `pdf_label` caption, because
an instruction to press a control that is not there is worse than neither. The
`pdf`/`pdf_label` fields stay modelled and populated; restoring is one block.

**And the gate refused it, correctly.** `._3`'s 50px line-height was the second
term in every panel's height and ref css:3210 added 20px more at ≤991, so the
Lofts region is now ~90px shorter than a reference that still offers the broken
button. `Hover or click on a floor` fails at all four breakpoints — mm 8.6% /
9.0% / 10.3% / 13.2% against threshold 0.1, Δh 7.9%–12.2% against
maxHeightDelta 0.05. That is not a defect to fix; it is the measured cost of the
removal the operator asked for. It belongs in `ACCEPTED` in `matching/floors.mjs`
— "regions the OPERATOR has looked at and chosen to leave failing" — not in
`FLOORS`, because we _can_ reproduce it; we chose not to. Left undeclared: rule
5 names a novel floor as the operator's decision, and adding it myself is
exactly the "reclassify it to make it go away" the rules forbid.

**Share card.** `DEFAULT_OG_IMAGE` was `""`, so every pasted link degraded to
`twitter:card: summary` — text, no picture. `static/og-default.jpg` (1200×630,
204KB) is built by `scripts/og-card.mjs` from the client's own hero photograph
and wordmark. The crop is recorded rather than remembered: `top: 248` is the
highest window that still contains the entrance and the building's real black
"29 NAVY" plate, which is the one part of the frame that identifies the address;
the first attempt at `top: 96` kept more sky and cut exactly that. The wordmark
is composited (`blend: "screen"` drops its black ground), not retypeset. A test
asserts the FILE exists at 1200×630 — a constant pointing at a missing file
emits a perfectly well-formed `<meta>` tag for a 404.

**Turnstile is blocked on Cloudflare, and the block is the documented one.**
`reddoor-maintenance/docs/runbooks/turnstile-widgets.md`: a widget holds 10
hostnames, a sitekey served from a hostname not on its widget's list throws
`110200`, renders nothing and mints **no token**, and `/health` cannot see that
because it only checks the env var is a non-empty string (#689 — and the exact
shape CLAUDE.md's worked example is about). No `CLOUDFLARE_*` credentials on this
machine, so listing widget capacity and allowlisting a hostname are not
available here. What WAS verified: with Cloudflare's documented always-passes
test sitekey exported locally, the widget mounts and **mints a real token**
(`XXXX.DUMMY.TOKEN`, 21 chars). This repo's half works; the missing piece is a
sitekey whose widget allowlists `29-navy.netlify.app`. The test key was never
committed and never set on Netlify.

**Images: the answer was one, not eight.** The eight local `/29navy/` image
occurrences are three unique files — the close icon (×6, UI chrome, belongs in
code), the hidden `.image-14` FPO jpg (`display: none`, kept for capture
fidelity), and the nav logo. Only the logo is arguably content, and even it is
chrome. So: nothing urgently needs routing through Prismic, which is a better
answer than the one the question invited.

**What the image audit did find was worse than a routing question.** The Contact
section's photograph is a Venice boardwalk stock shot — palms, cyclists, a
surfer. That is the client's own choice; it is in the reference capture with
`alt=""`. But this repo authors real alt text, and the one written for it reads
"Sunlight falling across the brick facade and steel-framed windows of the 29
Navy building." It describes a photograph that is not there. A sighted visitor
sees a beach; a screen-reader user is told they are looking at the building.
Corrected in `src/lib/site-pages.js` and `NavyContact/mocks.json` — **but the
published Prismic copy still carries the wrong string**, and that is what the
live site serves. Not fixed here: it is a content write to the client's CMS.

**Corrected belief.** Earlier in the session I reported the two `target-size`
nodes as a defect in the resident popups. They were not. `.link-block-14` is the
floor-plan download anchor; the popups only OBSCURE it. The violation went away
with the anchor and is recorded as a consequence, not a fix.
