## home — the single page (`/`)

### Section census (6 sections + shared chrome)

| #   | section                                                                                                                                                     | anchor                           | source                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------ |
| —   | chrome — `.navbar` `.w-nav`, 6 links (Location, Lofts, Residents, Contact, Apply Now, Pay Rent) + `.menu-button`                                            | none — lives in the `top` region | index.html                     |
| 1   | hero slider — `.section-2` (`:2206`, `height: 100vh`) / `.slider` (`:2197`, `100vh`, `position: relative`), 6 `.w-slide`, logo + "Creative Lofts for Lease" | `Creative Lofts`                 | css `:2197-2200`, `:2206-2208` |
| 2   | mobile location image — `.mobile-location`, `display: none` at 1440                                                                                         | none — inside region 1           | css `:2878`                    |
| 3   | Location band — `.section`, `height: 100vh`, `location-aerial.jpg` at `50%` / `no-repeat` / `cover`                                                         | none — see the collision note    | css `:2171-2177`               |
| 4   | Lofts — `.section-4`, `#fff` on `#aa4133`, `flex-direction: row`, `padding: 40px 20px 60px`, four floor triggers                                            | `Hover or click on a floor`      | css `:2277-2285`               |
| 5   | Residents — `.section-5`, `#fff`, `padding-top`/`padding-bottom: 40px`, two columns                                                                         | `Paying rent online?`            | css `:2341-2345`               |
| 6   | Contact — `.section-7`, `display: flex`, address/phone/email/Zillow                                                                                         | `29 Navy Street`                 | css `:2451-2453`               |

**Anchor collision note.** The reference has three `<h1>`s — `Location`,
`Residents`, `Contact` — and the navbar carries `Location`, `Lofts`,
`Residents` and `Contact` links EARLIER in document order (stripped-text
indices 8, 23 and 33, against the first real anchor at 60). The cut lands on the
first document-order element whose collapsed text starts with the anchor, so
anchoring on any heading would cut at the navbar and put the anchors out of
order — the silent region-misalignment trap. The four chosen anchors each occur
exactly once at strictly increasing indices (60, 100, 1067, 1226), measured on
the script-stripped text. Sections 1–3 therefore share one composite region.
**The fix for a region that will not move is to change instruments** (the
element-level CSS dump in `report.json`), never to add anchors that collide.

### Interaction inventory — 20 entries (Phase 5 verifies exactly 20)

- 18 `data-w-id` triggers (4 floor + 6 amenity opens, plus their closes and
  overlays), enumerated by `matching/probe-inventory.mjs`. All 18 are backed by
  a real interaction: every one appears in the reference's own script chunks.
  The chunks define 30 ids, so 12 ship unused on this page — the DOM count, not
  the chunk count, is the denominator.
- 1 `.w-slider` — 6 `.w-slide`, prev/next arrows, dot nav.
- 1 `.w-nav` — mobile menu, `.menu-button` / `.w-icon-nav-menu`.

**NINE modal containers are `display: none` at rest**, not ten: `.second-floor-modal`
(`:3062`), `._3rd-floor-modal`, `._4th-floor-modal`, `.popup-modal---electric`
(`:2468-2474`), `.popup-modal---laundry`, `.popup-modal---gym`,
`.pop-up-modal---tv-internet`, `.ride---modal`, `.food-modal---popup`. Neither
`text-diff` nor `page-diff` can see any of their content; everything behind
those clicks is Phase 5's alone.

**`._1st-floor-modal` is NOT one of them, and this matters for height.** Measured
at 1440 it is `display: flex`, `opacity: 1`, `visibility: visible`,
`position: static`, laid out at **1174×750 at (246, 1908)** — a real in-flow
block. The floor section is a panel switcher whose FIRST floor is the default
visible state, not four hidden modals over an empty well. A rebuild that hid all
four by default would be ~750px shorter than the reference and would blow
`maxHeightDelta` 0.05 for the whole page, and the cause would read as a layout
bug rather than a missing initial state.

The full `display: none` census at 1440 is **12** divs: those nine modals plus
three mobile-only chrome elements — `.menu-button.w-nav-button`, `.w-nav-overlay`
and `.mobile-location`. Ten elements carry `modal` in their class; 9 hidden + 1
visible = 10.

### Assets

23 `<img>` in the HTML, 58 unique image URLs once srcset variants are counted
(counting `src` alone gives 18), 10 photos reached only through CSS `url()`, all
200 — see `matching/CAPTURE.md` for the 90-file manifest with sha256 per file.
**Ship the captured files.** Never redraw the logo, the Font Awesome glyphs or
any photo in CSS.

Every one of the 23 images carries `alt=""` on the reference — 23 of 23, none
with text, none missing the attribute. The rebuild authors real alt text, so
`text-diff` will show a residual row in the candidate direction on every image.
Pre-declared as artifact class 4 ("deliberate a11y additions"): one row each,
not a defect.

### Outbound links (verbatim from the capture)

`rentspree.com/apply/615b8194b7272a0016c60303/landing/apply-now`,
`payments.gozego.com/login/` (twice — navbar and Residents), `rinse.com`,
`goldsgym.com`, `classpass.com`, `fios.verizon.com`, `lyft.com`, `uber.com`,
`postmates.com`, `ubereats.com`, `zillow.com`, and the four dead
`29navy.com/pdf/file{1..4}.pdf`.

Two links are malformed on the reference and are corrected in the rebuild —
`href="https://(310) 393-9653"` and a `mailto:` carrying a zero width joiner
inside the address. See `LEDGER.md`, Phase 0. The four PDFs are a client
deliverable that 404s today (reddoorla/29-navy#8); the modals ship with the
download disabled until the real files arrive, and the plans are never redrawn.
