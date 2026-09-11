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
- **The gate renders the reference WITH JavaScript, so the slider dot-nav is
  real and the rebuild server-renders six dots.** Raised as an open question by
  the hero build: `.slide-nav` is EMPTY in the captured static HTML
  (`matching/spec/index.html`), and Webflow's slider JS builds six
  `.w-slider-dot` children into it at runtime. Whether to reproduce them turns
  entirely on whether the gate runs scripts — six extra circles if not.
  **Settled from the tool, not from taste:** the matching-a-page skill's
  `lib/capture.mjs:39-45` creates its browser context with only `viewport`,
  `deviceScaleFactor` and `reducedMotion`; `javaScriptEnabled` is never set, so
  Playwright's default `true` stands, and it then waits for `load` plus a settle
  timeout. The reference the gate photographs therefore HAS six 14×14 dots in a
  40px strip (css:1222, :1257-1266) — so the candidate must too. Server-rendering
  them also satisfies the repo's no-JS rule, which a JS-built nav would not.
  Note for later: the same context sets `reducedMotion: "reduce"`, which is the
  trap CLAUDE.md records under "check what the shared harness forces" — any
  Phase 5 assertion about slider motion must account for it rather than assume
  animations run.
- Deviation, deliberate: the contact block's phone and email links are
  CORRECTED, not reproduced. The reference ships `href="https://(310) 393-9653"`
  — a malformed URL, and a number that disagrees with the `(310) 393-9657` it
  displays — plus a mailto carrying a stray zero-width character. The rebuild
  emits a well-formed `tel:` and a clean `mailto:`. Reproducing a broken link
  to match a reference is not fidelity, and neither is measurable by the gate.
- Deviation, pre-declared as artifact class 4: the reference ships `alt=""` on
  all 23 images; the rebuild authors real alt text. One residual `text-diff` row
  per image, in the candidate direction, is expected and is not a defect.
- **[OPERATOR DECISION NEEDED — novel floor] `Creative Lofts` cannot be matched
  while page-diff photographs a moving carousel.** The rebuild is not wrong; the
  measurement is. Evidence, in the order it was gathered:
  - Every element in the region matches EXACTLY at 1440 — logo block 213×243
    @(1087,396), logo image 143×147 @(1122,396), tagline 213×86 @(1087,554) at
    32px, dot nav 1440×40 @(0,928), left arrow 80×900 @(0,68), and the Location
    band's `<h1>` 1420×44 @(20,988). `heightDeltaFraction` is **0.0%** at all
    four viewports. Nothing about the geometry is off.
  - The slide photographs are byte-identical: the browser downloads
    `614de02ec8febc5e1427ffc8_gallery_roof1.jpg` as sha256 `b68497a0f75b8ed7`,
    and that is the file shipped under `static/29navy/assets/`.
  - The reference is deterministic against ITSELF: page-diff with the reference
    as both `--ref` and `--cand` returns 0.0% mismatch and ΔE 0.0 on every
    region, so the capture is reproducible.
  - The cause is timing. `lib/capture.mjs:33` settles 2200ms, then takes a
    fullPage screenshot which measures **601ms** on this 4174px page. The
    reference's slider carries `data-delay="3000"`; measured, its dot nav reads
    `*.....` at t=2200ms and `.*....` at t=2801ms. The screenshot spans the
    advance. This rebuild renders frame 0 only, by design.
  - Proved by varying only the reference's settle, hero element vs hero element:
    **600ms → 0.1% differ. 1500ms → 0.1%. 2800ms → 36.3%.** The build is right;
    it is being photographed against a different frame.
  - `--neutralize-media` does NOT help (still 35.1%): it freezes `<video>`, and
    this is a JS-driven CSS transform. `reducedMotion: "reduce"` is set on the
    context and Webflow does not honour it for slider autoplay.

  Four ways out, none of which an implementer should pick alone: declare
  `Creative Lofts` a floor and record the ΔE; implement the autoplay and accept
  that two independently-started timers will drift; teach the harness to freeze
  CSS/JS animation the way it already freezes video (the real fix, and not this
  repo's to make); or lower the settle below the first advance, which is a
  fleet-wide change to someone else's tool. **Presented, not decided.**

## 2026-09-10 — Phase 5: the slider moves, and two deviations it forced

### `Creative Lofts` stays a floor, and the motion did not change that

Recorded against the entry above, which offered four ways out. Two of them have
now happened and the number did not move: the harness learned to freeze
animation (reddoorla/claude-skills#3) and this rebuild implements the autoplay.
Gate before **16/20**, gate after **16/20** — `Creative Lofts` fails at 34.1–37.9%
across all four viewports, within a point of where it was.

That is the expected result, not a disappointment, and it narrows the diagnosis
usefully. The freeze pins looping **CSS** animations to a known phase. A Webflow
slider advancing on `setInterval` is not a CSS animation, `getAnimations()`
cannot see it, and freezing stops it moving without making two captures agree on
_where_ it stopped. Both sides now move; both are photographed at an
independently-chosen slide.

The remaining fix is a faked page clock, and the findings from attempting it are
on reddoorla/claude-skills#2 — `install()` alone keeps ticking with real time so
`runFor` double-counts, and pausing the clock either side of `goto()` hangs
navigation. Until that lands, this region is a **declared floor**: the build is
right and the instrument cannot photograph it.

### The dot nav is indicators, not controls (accessibility vs the reference)

The reference's runtime DOM gives every `.w-slider-dot` `role="button"`,
`tabindex="0"`, `aria-label="Show slide N of 6"` and `aria-pressed`, and they are
clickable. Reproducing that **fails this repo's axe gate**: `target-size`, WCAG
2.2 AA 2.5.8, serious, six nodes. The dots are `1em` = 14px with `margin: 0 3px`
(ref css:1262) — 14px targets on a 20px pitch, where the rule wants 24 of either
the size or the spacing. Neither exemption can be met without moving pixels the
geometry gate measures, so the reference cannot pass this rule as drawn.

Resolved by leaving the dots as visual indicators and putting the interaction on
the arrows, which are large enough and carry the reference's own runtime
`role`/`tabindex`/`aria-label`/`aria-controls`. Left and Right arrow keys work
anywhere inside the carousel, because without the dots the only way to reach
slide 5 by keyboard would be four activations of one arrow.

**What it costs:** click-a-dot-to-jump. A sighted mouse user loses an affordance
the reference has. **Reversing it** means either accepting an axe failure or
redrawing the dot nav at 24px, which the gate would see. Operator's call.

### The off-screen slide arrangement differs, invisibly

The reference moves by giving every `.w-slide` the same inline
`transform: translateX(-index × width)`, and at the wrap hands the outgoing slide
a one-off `-n × width` so it exits left while slide 1 enters from the right —
measured at 1440, in slide-widths:

    on slide 6   -5 -4 -3 -2 -1  0
    after wrap    0  1  2  3  4 -1

so its off-screen arrangement depends on history. This rebuild keeps a per-slide
offset instead — the standard carousel form — which reaches the same visible
result by a different internal route. `.w-slider-mask` is `overflow: hidden`
(ref css:1198), so every position outside [0, 1) slide-widths is clipped and
cannot differ on screen. Measured cadence: reference advances every **3011ms**,
this build every **3012ms**.
