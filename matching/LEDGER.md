# Deviations / masks / floors ledger

Append-only, and written at the moment a decision is made — not reconstructed at
the end of a round, when the reason has already been lost. An entry is never
edited to be right: a later entry corrects an earlier one and says which.

Every entry in `matching/floors.mjs` and `matching/census-deviations.mjs`, and
every mask in `matching/harness.json`, needs a line here. Without one the gate
has been quietly widened and nothing records who widened it, or why.

- [deviation | floor | mask | a11y] `<region or selector>` — what differs, why
  it is accepted, and the evidence: a spec citation, a census row, a gate run.

## Phase 0 — reference defects (2026-09-09)

Four things the live reference does that the rebuild must NOT reproduce. Each
was read out of the captured HTML in `matching/spec/index.html`, not inferred.

- [deviation] Floor-plan modals — all four "Download a PDF of this floor" links
  point at `https://29navy.com/pdf/file{1,2,3,4}.pdf` (one occurrence each in
  the capture), and all four return 404 with the same 906-byte Webflow
  not-found page from the apex, from `www`, and over `http`. A control request
  to `https://29navy.com/` in the same run answered 200/21156, so the site is
  up and it is the files that are gone. The download is broken on the client's
  live site today. The PDFs are a client deliverable; capture cannot recover
  them and they must never be redrawn. Tracked as reddoorla/29-navy#8.
- [deviation] Contact/cable-tv phone link — `href="https://(310) 393-9653"`.
  An https URL whose authority is a phone number: it resolves to nothing. The
  rebuild ships `tel:+13103939653`.
- [deviation] Email link — `href="mailto:29navy@worthe.com&zwj;"`, with a
  trailing ZERO WIDTH JOINER inside the address. Confirmed by hexdump: the
  bytes after `...worthe.com` are `e2 80 8d`, then the closing quote. The
  rebuild ships the address without it.
- [a11y] All 23 `<img>` elements on the reference carry `alt=""` — 23 of 23
  empty, none with text, none missing the attribute. The rebuild authors real
  alt text, so `text-diff`'s alt census will show residual rows in the
  candidate direction on every image. Pre-declared as artifact class 4
  ("deliberate a11y additions") — one row each, not a defect.

## Phase 0 — calibration complete (2026-09-09)

- Matrix **1440 / 991 / 767 / 390**, derived from the three site-authored
  `@media` blocks in the captured stylesheet (`:3116`, `:3218`, `:3396`) out of
  twelve total. The `(min-width: 768px)` block at `:1632` is Webflow's
  `.w-lightbox-content` rule and is NOT a site breakpoint. The recipe's seeded
  `1440 / 834 / 390` would have missed two whole bands.
- Root font-size **16px at every viewport** — no ladder. Two `html` rules exist
  (`:1-5`, `:218-220`) and neither sets `font-size`, so px values in this
  stylesheet are literal and matched values need no rem arithmetic.
- **Fonts census is NOT what the plan predicted, and the plan was wrong rather
  than the site.** Only `Fa solid 900` reports `document.fonts.check` true.
  `Fa 400` and `Fa brands 400` report false — correctly: both appear ONLY inside
  their own `@font-face` blocks, and of 190 elements on the live page, 0 compute
  to either (`FontFaceSet` status `unloaded`). A browser does not fetch a
  webfont nothing renders in. Do not read those two as a missing face; the
  silent-synthesis risk cannot arise for a family no element uses. No kit, no
  licensing block.
- Reference captured: 90 files, 13,667,608 bytes, every one 200. Manifest with
  sha256 per file in `matching/CAPTURE.md` (tracked); the bytes are in
  git-ignored `matching/spec/` and exist **only on this machine**. Committing
  them, or serving them as a local reference, is the follow-up issue
  (`match-harness: captured-reference mode`).
- [ACK-REQUIRED at cutover] `selfHosts` lists only `29-navy.netlify.app`.
  `29navy.com` and `www.29navy.com` serve the REFERENCE today and must be added
  to `selfHosts` the moment DNS moves — otherwise the preflight passes while
  comparing our build with itself, which is exactly what happened to Beachfront
  and went unnoticed in three separate tools for a month.
- Composite region declared: sections 1–3 (hero + mobile-location + Location
  band) share the `Creative Lofts` region, because every candidate anchor for
  the Location band collides with a navbar link earlier in document order.
  `TOTALS.home = 20` (4 anchors + 1 region, times 4 viewports), checked against
  the formula rather than eyeballed.
- **The floor section's first panel is visible at rest.** `._1st-floor-modal` is
  `display: flex`, in flow, 1174×750 at (246, 1908); its three siblings are
  `display: none` at 0×0. Nine modals are hidden, not ten. A rebuild that hid
  all four by default would be ~750px shorter than the reference and would blow
  `maxHeightDelta` 0.05 for the whole page.
- [BLOCKED-ON-TOOLING] `matching/gate.sh` prints `ALL DONE` and exits **0** even
  when every `page-diff` in the table failed — `:120` echoes `$?` and discards
  it, and the only non-zero paths are the two preflight exits and the
  missing-SPEC branch. Measured here: `home exit=1`, no `report.json` written,
  `gate exit=0`. `next.mjs` catches TOTAL failure (exit 2, no parseable run) but
  not partial: its denominator is summed over the pages that produced a report,
  so a page that crashed leaves the score entirely. **Do not read a Phase 2
  score from this gate until reddoorla/reddoor-maintenance#744 lands.** Both
  files are recipe-owned, so the fix is made in `beachfront-dentistry` and
  regenerated.
