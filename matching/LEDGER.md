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
