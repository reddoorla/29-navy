// ANCHOR PARITY — does each gate anchor cut on a COMPARABLE element on both
// sides?
//
//   node matching/probe-anchor-parity.mjs [page ...]
//
// page-diff cuts at the first document-order element whose collapsed text
// starts with the anchor — from a FIXED tag list, and on that element's top Y. If live wraps that text in an extra container and we
// do not (or vice versa), the two pages are cut at different heights and the
// whole region comparison is invalid — the score is then real arithmetic on the
// wrong windows, which is indistinguishable from a rendering defect until you
// look. That is exactly what happened to ask-the-doctor "Beyond the Smile":
// live cut at a `.qa-text` wrapper 220px above the heading we cut at, and the
// resulting 79-83% mismatch was logged for two days as a colour delta.
//
// This checks every anchor on every gated page before any of those numbers are
// trusted again.
import { REF, CAND, PAGES, MATRIX, PLAYWRIGHT } from "./harness.mjs";
const { chromium } = await import(PLAYWRIGHT);

// key -> [refPath, candPath, anchors]. Built from the table, so the "must
// mirror gate.sh exactly" comment this replaces stops being a promise.
const TABLE = Object.fromEntries(
  PAGES.map((p) => [p.key, [p.ref, p.cand, p.anchors]]),
);

const VW = Number(process.env.VW ?? MATRIX[0]);
const want = process.argv.slice(2);
const pages = Object.keys(TABLE).filter(
  (p) => !want.length || want.includes(p),
);

const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (document.getAnimations().every((a) => a.playState !== "running"))
        break;
    }
    await new Promise((r) => setTimeout(r, 300));
  });
};

const READ = (anchors) => {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  // EXACTLY lib/capture.mjs's selector, not `body *`. They diverged, and the
  // divergence was not cosmetic: 29 Navy's rebuild wraps its sections in a
  // <main> landmark the Webflow reference has no equivalent of, so `body *`
  // resolved "Creative Lofts" to <main> (h=4106) against the reference's
  // <div class="section-2"> (h=900) and reported an 4.6x MISMATCH at every
  // viewport. capture.mjs never considers <main> — it is not in this list — so
  // the real cut was div.section-2 on both sides at y=68, and the probe was
  // raising an alarm about a comparison the gate does not make. A probe that
  // models the thing it is auditing differently from the thing itself is worse
  // than no probe: it sends you looking for a cutting artefact instead of the
  // real defect, which in that case was a carousel resting on a different slide.
  const all = [
    ...document.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button",
    ),
  ];
  return anchors.map((a) => {
    const hits = all.filter((e) => norm(e.textContent).startsWith(norm(a)));
    const el = hits[0];
    if (!el) return { anchor: a, missing: true, n: 0 };
    const r = el.getBoundingClientRect();
    return {
      anchor: a,
      n: hits.length,
      tag: el.tagName.toLowerCase(),
      cls: (el.className?.toString() ?? "").slice(0, 34),
      y: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      // how far the cut element sits above the NEXT hit — the size of the
      // wrapper that only one side may have
      drop: hits[1]
        ? Math.round(
            hits[1].getBoundingClientRect().top +
              window.scrollY -
              (r.top + window.scrollY),
          )
        : 0,
    };
  });
};

const b = await chromium.launch();
const problems = [];
try {
  for (const page of pages) {
    const [refPath, candPath, anchors] = TABLE[page];
    const out = {};
    for (const [name, url] of [
      ["live", REF + refPath],
      ["ours", CAND + candPath],
    ]) {
      const p = await b.newPage({ viewport: { width: VW, height: 900 } });
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await settle(p);
        out[name] = await p.evaluate(READ, anchors);
      } catch (e) {
        out[name] = anchors.map((a) => ({
          anchor: a,
          missing: true,
          err: String(e).slice(0, 40),
        }));
      }
      await p.close();
    }
    console.log(`\n===== ${page} @${VW}`);
    for (let i = 0; i < anchors.length; i++) {
      const l = out.live[i],
        o = out.ours[i];
      // What actually breaks a region comparison is the cut element CONTAINING
      // different content, which shows up as a height ratio — not a tag
      // difference. Live wrapping a heading in a 320px `.qa-text` where we cut
      // at the 80px heading itself is fatal (4x); live using <div> where we use
      // <footer> for the same ~710px block is cosmetic. Flag on the ratio.
      const ratio =
        l.missing || o.missing
          ? Infinity
          : Math.max(l.h, o.h) / Math.max(1, Math.min(l.h, o.h));
      // regionsFromAnchors (lib/regions.mjs) cuts on the anchor's TOP Y and
      // nothing else — a region runs from one anchor's y to the next one's. So
      // the y delta is the thing that can actually invalidate a score, and the
      // height ratio is context for reading it, not the verdict. Flagging on
      // height alone is what produced the false positive above; a >4px y delta
      // is the same tolerance regionsFromAnchors uses to drop a degenerate
      // region, so anything under it cannot move a cut.
      const dy = l.missing || o.missing ? Infinity : Math.abs(l.y - o.y);
      const bad = l.missing || o.missing || dy > 4;
      const flag =
        l.missing || o.missing
          ? "!! UNRESOLVED"
          : bad
            ? `!! CUT SKEW ${dy}px`
            : ratio >= 1.5
              ? `   ok (cut aligned; boxes differ ${ratio.toFixed(1)}x)`
              : "   ok        ";
      console.log(`${flag} "${l.anchor}"`);
      const fmt = (s, x) =>
        x.missing
          ? `      ${s}: NOT FOUND${x.err ? " (" + x.err + ")" : ""}`
          : `      ${s}: <${x.tag} class="${x.cls}"> y=${x.y} h=${x.h} hits=${x.n} nextHitDrop=${x.drop}`;
      console.log(fmt("live", l));
      console.log(fmt("ours", o));
      if (bad)
        problems.push({ page, anchor: l.anchor, live: l, ours: o, ratio, dy });
    }
  }
} finally {
  await b.close();
}

console.log(`\n\n########## SUMMARY @${VW}`);
if (!problems.length) {
  console.log(
    "All anchors resolve to comparable elements. Region scores are measuring what they claim.",
  );
} else {
  console.log(
    `${problems.length} anchor(s) cut on non-comparable elements — every region score BELOW each of these is suspect:\n`,
  );
  problems.sort((a, b) => b.dy - a.dy);
  for (const p of problems) {
    const d =
      p.live.missing || p.ours.missing
        ? "UNRESOLVED on " + (p.live.missing ? "live" : "ours")
        : `cut y ${p.live.y} vs ${p.ours.y} (${p.dy}px apart), ` +
          `h=${p.live.h} vs ${p.ours.h}`;
    console.log(
      `  ${p.page.padEnd(9)} "${p.anchor}"  <${p.live.tag ?? "?"}> vs <${p.ours.tag ?? "?"}>  ${d}`,
    );
  }
}
process.exit(problems.length ? 1 : 0);
