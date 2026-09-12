// The failures we have already established are NOT geometry. Shared by
// next.mjs (which reports them separately from the backlog) and strikes.mjs
// (which must not report them as stalled — a region that cannot move is flat
// by definition, and three strikes on one is noise that hides a real stall).
// Every entry needs a matching LEDGER entry to stay honest.
//
// NOTE the second matcher argument. Region records carry `label` and
// `viewport` but not the page, so an entry keyed on label+viewport alone is
// safe only where the label is unique site-wide. "top" is not — every page has
// one — so such an entry would silently accept the `top` failure on EVERY page
// and hide every real one. next.mjs and strikes.mjs pass the page key as the
// second argument: take `(r, page)` unless you have checked the label.

/** Reference behaviour we cannot reproduce (declared floors). */
export const FLOORS = [];

/** Regions the OPERATOR has looked at and chosen to leave failing. These are
 *  not floors and are not silently dropped: next.mjs prints them under their
 *  own heading with the decision, so the number never quietly improves. */
export const ACCEPTED = [
  {
    // Keyed on the page as well as the label. The label happens to be unique
    // site-wide today — one page — but this file's own note at the top is that
    // a label-only entry starts accepting failures on pages that do not exist
    // yet, and the second page is where that is discovered.
    match: (r, page) => page === "home" && r.label === "Hover or click on a floor",
    why:
      "The floor-plan download affordance is deliberately not rendered: all four " +
      "https://29navy.com/pdf/file{1,2,3,4}.pdf answer 404 on the client's own live site " +
      "(Phase 0 2026-09-09, re-checked 2026-09-12). Removing the anchor removed `._3`'s " +
      "50px line-height — the second term in every panel's height — and ref css:3210's " +
      "further 20px at <=991, so the Lofts region measures ~90px shorter than a reference " +
      "that still offers the broken button: mm 8.6/9.0/10.3/13.2% and dh 7.9-12.2% at " +
      "1440/991/767/390. NOT a floor: the reference behaviour is perfectly reproducible, " +
      "we chose not to reproduce it. Operator accepted 2026-09-12, matching complete. " +
      "LEDGER Phase 10, reddoorla/29-navy#8, #28.",
  },
];
