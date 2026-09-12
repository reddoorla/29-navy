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

> Superseded by 2026-09-11 — Phase 7: the arrangement was not off-screen,
> and not invisible.

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

## Phase 6 — the hero region was never a geometry failure (2026-09-11)

`Creative Lofts` failed 34.1–37.9% at all four viewports across Phases 2–5 and
was on its way to being declared a floor. It was neither a floor nor geometry.

**Cause.** `lib/capture.mjs:42` sets `reducedMotion: "reduce"` on every capture,
on both pages. This rebuild's hero honours that
(`NavyHeroSlider/index.svelte:125`) and does not autoplay; Webflow's slider
ignores the media query and keeps advancing on recursive `setTimeout`. So the
gate photographed **this build on slide 1 and the reference on slide 5 of 6** —
`gallery_roof1.jpg` against `gallery_29navy_interior.jpg`, per the slide order in
ref css (`.slide-6` … `.slide-5`). Both sides were cut at y=68 by the same
anchor, `heightDeltaFraction` was exactly **0**, and every pixel of the Location
band below it already matched. Real arithmetic on different content, which is
indistinguishable from a rendering defect until you look at the crop.

**Not fixed by** removing the reduced-motion check. That trades an accessibility
behaviour for a number, and the reference's failure to implement it is not a
reason to match it.

**Fixed by** `pinState` — a new `capturePage`/`page-diff` option carrying one JS
snippet that is applied to BOTH pages from a single option object, so it cannot
move one side without moving the other by the same rule. This page pins with
`document.querySelectorAll('.w-slider-nav').forEach(n => n.querySelector('.w-slider-dot')?.click())`,
which both sides answer structurally: the reference's dots are built by Webflow's
JS at runtime, this build renders the same `.w-slider-dot` elements at
`NavyHeroSlider/index.svelte:331`. It runs twice, before and after the freeze,
because a slider driven through its own UI needs live timers to get to slide 1
while a timer-written widget walks straight back out of the state it was put in
(measured on the skill's own fixture: pinned to 0, read back at 85).

**This is not a mask and not a threshold change.** The threshold is still 0.1,
no region is excluded, and the pin is printed by `gate.sh` and by page-diff's own
header and recorded as `meta.pinState` in `report.json` — an undisclosed pin
would be a mask wearing a different hat. It makes the region _more_ measurable,
not less: at slide parity a real hero defect now shows, where before the region
was pure noise.

**Result:** `Creative Lofts` 0.0% at all four viewports; **20/20**, zero floors,
zero masks.

### Correction to earlier notes

Phase 5 recorded the cause as "the freeze pins looping CSS animations, and a
`setInterval` carousel is not one." Both halves were wrong. The reference bundle
contains **zero** `setInterval` calls — it autoplays on recursive `setTimeout`
(12 uses in the site bundle, 8 more in jQuery) — and the operative difference was
never the freeze's reach but the capture's own forced `reducedMotion`, which the
two implementations answer differently. The Phase 5 entry stands as written.

## Phase 7 — the slider was empty most of the time, and this file said it could not be (2026-09-11)

Reported by the operator: "slider is in a rough state right now, most of the
time it's just grey." Reproduced on production before changing anything —
**14 of 21 one-second samples had no slide at the mask's left edge at all**, and
the grey is `.slider`'s own `rgb(221, 221, 221)` showing through an empty mask.
Every image decoded; no request failed.

**Cause.** `.w-slide` is `display: inline-block` (measured on the reference), so
slide _i_ already sits at _i_ slide-widths from inline flow alone. `translateX`
adds to that position rather than replacing it, and `slideStyle` wrote
`translateX(offset * 100%)` as though it were absolute. Rendered position was
therefore `i + offset`. Measured in production, at rest:

    positions   0  2  4  6  8  10      <- two slide-widths apart
    after one step
               -1  1  3  5  7   9      <- NOTHING at 0

**Fixed** by subtracting the flow position — `translateX((offset - i) * 100%)`.
One subtraction.

### The correction this file owes

The entry above, _"The off-screen slide arrangement differs, invisibly"_, argued
that because `.w-slider-mask` is `overflow: hidden` (ref css:1198), "every
position outside [0, 1) slide-widths is clipped and cannot differ on screen." The
reasoning was sound and the premise was false: the positions were not merely
arranged differently off-screen, the **on-screen slot was empty**. A clipped
region cannot hide a slide that is not there.

Worse, the deviation was never real. With the subtraction in place this build
now reproduces the reference exactly, and the reference's own behaviour —
measured on the live site, which is what should have happened when that entry
was written — is:

    at rest        all six slides carry translateX(0px); flow does the work
    away from wrap all six share ONE transform value (-0.30, -1.33, -2.37 …)
    at the wrap    the wrapping slide takes a one-off value, the other five share

`(offset - i)` produces precisely that: `0,0,0,0,0,0` at rest, one shared value
away from a wrap, and `4,-2,-2,-2,-2,-2` at the wrap. **What was declared a
deviation was a defect**, and declaring it removed the pressure to check it
against the source. Rule 1 exists for this: the entry cited ref css:1198 for the
clipping and cited nothing for the arrangement, because nothing had been measured.

**The gate could not have caught it.** It photographs one settled frame, and at
rest slide 0 sits at `0 + 0 = 0` either way — correct by coincidence. All four
`Creative Lofts` regions read 0.0% before and after this fix. A carousel's defect
lives in the frames between the ones anyone photographed, and `pinState` (Phase 6) deliberately pins to the one frame where this bug is invisible.

## Phase 8 — autoplay restarts on interaction, which the reference does not (2026-09-11)

**Deviation, at the operator's request.** User navigation (arrows, Left/Right
keys, swipe) now restarts the full 3000ms delay. The reference does not.

Measured on the live site rather than assumed, because the existing note in
`NavyHeroSlider/index.svelte` said only that clicking "does NOT stop" autoplay,
which is a different claim from whether it re-phases:

    2192ms  autoplay settles on slide 2
    4235ms  CLICK right-arrow
    5201ms  settles on slide 4   (+966ms)
    8211ms  settles on slide 5   (+3010ms)
    11222ms settles on slide 6   (+3011ms)

The ticks hold a flat ~3010ms cadence straight through the click — 5201, 8211
and 11222 all sit on the phase established at 2192. So the reference lets a
scheduled tick land under a second after a click and jump again unasked, which
is the behaviour the operator reported.

Implemented with the `autoplayEpoch` mechanism already in
`$lib/components/Slider.svelte` rather than a new one, so the two carousels in
this repo do not answer the same question two ways. Only user-initiated moves
re-key; routing the interval through the same path would rebuild it on every
tick, and there is a test for that.

**Moves no pixels.** The gate photographs one settled frame with the carousel
pinned to slide 1; timer phase is not observable in it. 20/20 unchanged.

### The dot-nav decision, re-tested against the house solution

`$lib/components/Slider.svelte:310` renders each dot as `h-6 min-w-6` — a 24px
hit area with the visual dot styled separately inside. That is the standard
answer to WCAG 2.2 target-size and it was available all along; the Phase 5 entry
above reached its conclusion without checking it. Tested here properly:

    as shipped   target 14x14  visual 14x14  pitch 20px  row 114px  FAIL insufficient size
    padded       target 24x24  visual 14x14  pitch 20px  row 114px  FAIL partially obscured (20x24)

The technique preserves the geometry exactly — row width is identical at 114px,
so the gate would not see it — but on the reference's **20px pitch** adjacent
24px targets overlap, and axe fails 5 of the 6 on obscuring rather than on size.

So the earlier conclusion stands and its reason is now sharper: the blocker is
the pitch (`.w-slider-dot { margin: 0 3px }` on a 14px dot, ref css:1262), not
the size of the box. Passing requires the pitch itself to reach 24px, which
moves pixels the gate measures. **Still the operator's call**, unchanged.

## Phase 9 — the resident tiles get the hit area their hover already promises (2026-09-11)

**Deviation, at the operator's request:** "the whole box should be clickable, not
just the text."

**The reference has the same defect.** Every tile is
`div.div-block-9 > a.link-block-N.w-inline-block > div.text-block-8`. The eight
anchor classes get `text-decoration: none` and nothing else (ref css:2456, :2518,
:2618, :2678); their only box rule is `.w-inline-block { max-width: 100%;
display: inline-block }` (ref css:246-249). So the anchor's box IS the text's box
— measured against `matching/spec/index.html` in Chromium, **9.4% of the
460x124.8 tile for "Hungry?" at 1440, 34.5% at the widest** — while
`.div-block-9:hover` lights the WHOLE tile `#aa4133` (ref css:2363-2365). The
tile advertises a hit area it does not have. Inherited, not introduced.

**Not fixed by stretching the anchor.** 80 of the tile's 124.8px are its own
`padding-top/bottom: 40px` (ref css:2358-2359), and a flex ITEM cannot cover its
parent's padding — so `flex: 1; align-self: stretch` reaches 64% at best, and it
shifts glyphs **93.02px left at 1440** (`.text-block-8` is `text-align: left`,
ref css:2369) while shifting them **0.00px at 991/767/390** (ref css:3141-3143
flips it to `center`). A pixel regression that passes three of the gate's four
viewports is worse than no fix at all.

**Fixed** with a stretched-link `::after` on the eight tile anchors, plus
`position: relative` on `.div-block-9` (the containing block) and on
`.text-block-8` (so the label still paints above the overlay). An
absolutely-positioned generated box contributes nothing to flow, and `inset: 0`
resolves against `.div-block-9`'s **padding box** — the full 460x124.8 including
both 40px bands. `.link-block-9` and `.link-block-10` live inside popups and are
deliberately excluded; giving them an overlay would cover the popup body.

Measured on a production build, all four matrix viewports, every tile scrolled to
centre first (`scroll-behavior: smooth` at app.css:223 makes an unsettled
`scrollIntoView` report false misses — the first two runs did):

    corner+centre hit-test   ....A  ->  AAAAA   on all 8 tiles x 4 viewports
    anchor's own box         unchanged, still 6.1%-34.5% of the tile
    #Residents height        743.19px @1440/991, 1322.38px @767/390 — unchanged

Gate: **20/20**, `Paying rent online?` 0.0% at 1440/991/390 and 1.2% at 767
(unchanged — pre-existing).

### Modal work shipped alongside

- **Focus containment** now comes from `$lib/actions/trapFocus`, which was in the
  repo the whole time and handles the outro sequencing these 500ms fades need.
  The hand-rolled version moved focus in and never contained it: one Tab from the
  close control walked onto the page behind an opaque 100vw/100vh overlay.
- `aria-modal="true"` on all six dialogs — without it a screen reader keeps the
  background in the virtual buffer while Tab says otherwise.
- The six close controls are **real `<button>`s**. They were
  `<div role="button" tabindex="0">` with a hand-rolled handler that fired on
  Space **keydown**, where a real button fires on keyup — so pressing Space,
  changing your mind and moving off still closed the dialog. Eight `repo a11y`
  declarations zero the UA button box; no pixel moves.
- **Backdrop click closes**, matching `components/Modal.svelte:37-39`, with a
  test for the negative half (a click inside the panel must NOT close).
- **`aria-expanded` removed.** It was `openKey === modal` — keyed on the modal,
  not the trigger — and two triggers open `tv_internet`, so opening either
  announced both as expanded. `aria-haspopup="dialog"` carries the affordance.
- **Focus restore moved after the outro**, not 500ms before it.

### Checked and rejected, so the next session does not re-derive it

`NavyFloorPlans` hand-rolls exclusive disclosure that
`components/Accordion.svelte` provides via `allowMultiple={false}`. Reuse is
blocked: the gate diffs that subtree against transcribed Webflow DOM and the
component owns its own markup and `transition:slide`. The duplication is ~9 lines
of key handling. Left as is, deliberately.

## Phase 10 — the download link is removed, and the hover ink is ours (2026-09-12)

Two deviations decided in this round, one at the operator's instruction and one
found while verifying it. Both are recorded at the moment of the decision.

### [deviation] The floor-plan download affordance is not rendered

Phase 0 recorded, on 2026-09-09, that all four `https://29navy.com/pdf/file{1,2,3,4}.pdf`
links answer 404 from the apex, from `www` and over `http`, while a control
request to the site root answered 200/21156. **Re-checked 2026-09-12: still
404, all four.** The rebuild had been shipping the links anyway — the live
candidate served `href="https://29navy.com/pdf/file1.pdf"` and friends — so
every floor panel offered a button whose only outcome was a Webflow not-found
page on the client's own domain, under a page whose meta description advertises
"download a PDF of any floor". reddoorla/29-navy#8 asserted the opposite ("the
rebuild's floor-plan modals ship with the download link disabled rather than
pointing at a 404"); that was never true in code, and the issue is corrected
rather than quietly satisfied.

Removed: the `.link-block-14` / `.w-inline-block` anchor, its `._3` U+F15B glyph
child, and the `pdf_label` caption div that instructed the reader to press it.
An instruction to press a control that is not there is worse than neither.

**The `pdf` and `pdf_label` fields stay modelled and stay populated.** Restoring
is one block of markup when the client supplies the four real PDFs.

What went with it, and why the restore is not free:

- `@font-face "Fa solid 900"` (ref css:2049-2055) — the glyph was its only
  consumer. The woff2 is still at `static/29navy/fonts/`.
- `._3` (ref css:3048-3051), `._3:hover` (ref css:3055), `.link-block-14`
  (ref css:3059), and `._3 { margin-top: 20px }` inside the ≤991 block
  (ref css:3210).
- **`._3`'s 50px line-height was the second term in every panel's height, and
  ref css:3210 added 20px more at 991/767/390.** So this is a geometry change at
  all four breakpoints, not a cosmetic one. Gate re-run under tag `pdfremoval`.

### [deviation, a11y] The hovered penthouse tab gets its own ink

`.div-block-6:hover` takes `background-color: #ffffff7d` (ref css:2321). That
veil is 49% white; composited over the firebrick band behind it the computed
value is **#d49e97**, and the label the trigger carries is inherited white —
**2.30:1**, against the 4.5:1 WCAG 1.4.3 asks for 14px text. axe reports it
`serious`. Reproduced independently by compositing the two reference values in a
unit test, which lands on #d49e97 to the byte.

This is the reference's own defect, and it reaches exactly one of the four floor
triggers: `.div-block-6` is the only one whose label is live text. The other
three bake their label into a background PNG, where no contrast checker can see
it and the same failure may well be present.

**The background is left verbatim** — it is the hover affordance and the gate
measures those pixels. Only the ink moves, and it moves to `#050101`, which is
the reference's OWN hover ink for this component (ref css:3055, `._3:hover`),
not a value invented here. 2.30:1 → 9.04:1.

Tagged `repo a11y:` in the style block, following NavyResidentLinks' convention,
and the count of non-`ref css` declarations in this slice is pinned at 1 so a
second cannot arrive under cover of the category.

### Why neither was caught before

`tests/a11y/fixtures.spec.ts` audits `/dev/a11y-fixtures` and `/dev/animate-in`.
No Navy slice is mounted on either, so the a11y gate had never audited anything
this site ships (#24). Both defects also need an INTERACTION — a pointer on the
trigger, or a popup open over the link — so even auditing `/` at rest would have
missed both. `tests/a11y/home.spec.ts` now drives the real page: four
breakpoints at rest, every floor tab hovered and opened, every one of the seven
resident popups open, under `no-preference` so the timed fade path is the one
measured rather than the synchronous branch the shared config forces.

The `target-size` violation (the download icon squeezed to an 11.3×50px hit area
by the electricity and internet popups) was not fixed on its own terms — it went
away with the anchor. Recorded that way rather than claimed as a fix.
