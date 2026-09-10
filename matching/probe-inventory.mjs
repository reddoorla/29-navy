/**
 * matching/probe-inventory.mjs — Phase 1's interaction inventory and section
 * census, read from the reference's own DOM at 1440.
 * Run from the site root: node matching/probe-inventory.mjs
 */
import { chromium } from "@playwright/test";
import { REF } from "./harness.mjs";

const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${REF}/`, { waitUntil: "networkidle", timeout: 60000 });
  const out = await p.evaluate(() => {
    const rows = [];
    for (const el of document.querySelectorAll("[data-w-id]")) {
      const r = el.getBoundingClientRect();
      rows.push({
        wid: el.getAttribute("data-w-id"),
        tag: el.tagName.toLowerCase(),
        cls: el.className,
        text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
        y: Math.round(r.top + scrollY),
      });
    }
    const widgets = [...document.querySelectorAll(".w-slider, .w-nav")].map((el) => ({
      cls: el.className,
      slides: el.querySelectorAll(".w-slide").length,
    }));
    const hidden = [...document.querySelectorAll("div")]
      .filter((el) => getComputedStyle(el).display === "none" && el.className)
      .map((el) => el.className);
    return { rows, widgets, hidden };
  });
  console.log(`data-w-id triggers: ${out.rows.length}`);
  for (const r of out.rows) console.log(`  y=${r.y} ${r.tag}.${r.cls} "${r.text}"`);
  console.log(`widgets: ${JSON.stringify(out.widgets)}`);
  console.log(`display:none containers (${out.hidden.length}): ${out.hidden.join(" | ")}`);
} finally {
  await b.close();
}
