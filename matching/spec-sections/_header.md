Reference: `https://www.29navy.com/`, Webflow site `61411d5add9b561004cfbf8b`,
page `61411d5add9b56e648cfbf8c`,
`Last Published: Thu Nov 06 2025 00:21:41 GMT+0000 (Coordinated Universal Time)`.
Captured 2026-09-09 into `matching/spec/` — see `matching/CAPTURE.md` for the
90-file manifest and per-file sha256. Every line number below cites
`matching/spec/29navy-8c2435.shared.46514381b.css` (3,530 lines, 61,786 bytes).

**Root font-size is 16px at every viewport.** The stylesheet declares two `html`
rules (`:1-5`, `:218-220`) and neither sets `font-size`; the only other `html`
selectors are `html.w-mod-touch *` (`:238`) and `html[data-w-dynpage]
[data-w-cloak]` (`:281`). Measured at 1440 / 991 / 767 / 390: `root=16px` at all
four. **Px values in this stylesheet are literal — no rem ladder, unlike
Beachfront.** `document.body.clientWidth` equals the viewport at every width:
no max-width clamp, no scrollbar inset.

`body` (`:222-230`): `#333` on `#fff`, `Arial, sans-serif`, `14px`/`20px`,
`margin: 0`, `min-height: 100%`.

Theme (`:root`, `:2073-2078`): `--white: white`, `--firebrick: #aa4133`,
`--black: black`, `--white-2: #ffffff78`.

Fonts: the system stack plus three self-hosted Font Awesome faces —
`"Fa solid 900"` (`@font-face` at `:2049`), `"Fa 400"` (`:2057`) and
`"Fa brands 400"` (`:2065`), each `400` / `normal` / `font-display: swap`, each
with five `src` formats. A fourth face, `webflow-icons` (`:171`), is a base64
`data:` URI and needs no file. No web-font kit, no licensing dependency.

**Only one of the three FA faces is used.** `"Fa solid 900"` is applied by six
rules; `"Fa 400"` and `"Fa brands 400"` appear ONLY inside their own
`@font-face` blocks. Measured on the live page at 1440: of 190 elements, 4
compute to `Fa solid 900`, 3 to `webflow-icons`, and **0** to either of the
other two, whose `FontFaceSet` status is `unloaded`. So
`document.fonts.check()` answers `false` for them and that is correct — a
browser does not fetch a webfont nothing renders in. Do not read those two
`false`s as a missing face; the silent-synthesis risk cannot arise for a family
no element uses. The rebuild ships all three files anyway, because the reference
does.

Breakpoints: the stylesheet has twelve `@media` blocks; the site-authored ones
are the last three — `(max-width: 991px)` (`:3116`), `(max-width: 767px)`
(`:3218`) and `(max-width: 479px)` (`:3396`). The single `(min-width: 768px)`
at `:1632` is a Webflow `.w-lightbox-content` rule, not a site breakpoint.
Ranges `>=992` / `768-991` / `480-767` / `<=479` give the matrix
**1440 / 991 / 767 / 390**. Max-width blocks cascade downward — read the whole
cascade for a property before assuming the nearest breakpoint owns it; the
480-767 value is usually inherited from the `<=991` block rather than declared
in a `<=767` one.

There are 28 `:hover` rules, 21 of them site-authored (the rest are Webflow
`.w-*` chrome). Three are restated inside breakpoints (`.image-22` at `:3182`
and `:3391`, `.div-block-38` at `:3192`, `._2nd-floor-div` at `:3200`, `._11`
at `:3205`), so a hover matched only at 1440 is not matched.
