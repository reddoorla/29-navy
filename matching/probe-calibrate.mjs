/**
 * matching/probe-calibrate.mjs — Phase 0 steps 3, 4, 7.
 * Root font-size, body clientWidth and the fonts census, on the reference and
 * (when it is running) the candidate, at every matrix viewport.
 * Run from the site root: node matching/probe-calibrate.mjs
 */
import { chromium } from "@playwright/test";
import { REF, CAND, MATRIX } from "./harness.mjs";

const FAMILIES = [
  ["Arial", 400],
  ["Helvetica Neue", 400],
  ["Fa solid 900", 400],
  ["Fa 400", 400],
  ["Fa brands 400", 400],
  ["webflow-icons", 400],
];

const b = await chromium.launch();
try {
  for (const [side, base] of [
    ["ref", REF],
    ["cand", CAND],
  ]) {
    for (const width of MATRIX) {
      const p = await b.newPage({ viewport: { width, height: 900 } });
      try {
        await p.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
      } catch {
        console.log(`${side} ${width}: unreachable — skipped`);
        await p.close();
        continue;
      }
      const out = await p.evaluate(
        (fams) => ({
          root: getComputedStyle(document.documentElement).fontSize,
          bodyFont: getComputedStyle(document.body).font,
          clientWidth: document.body.clientWidth,
          fonts: fams.map(([f, w]) => `${f}/${w}=${document.fonts.check(`${w} 1em "${f}"`)}`),
        }),
        FAMILIES,
      );
      console.log(
        `${side} ${width}: root=${out.root} bodyWidth=${out.clientWidth} body=${out.bodyFont}`,
      );
      console.log(`  fonts: ${out.fonts.join(" ")}`);
      await p.close();
    }
  }
} finally {
  await b.close();
}
