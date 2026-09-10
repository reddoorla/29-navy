#!/usr/bin/env node
/**
 * matching/capture-reference.mjs — Phase 0 reference capture (spec D11).
 *
 * Downloads the reference page and EVERY file it needs into matching/spec/,
 * preserving each URL's own filename and REWRITING NOTHING: the capture is the
 * authoritative source Phase 1 greps, and a rewritten href would make it lie
 * about what the reference actually loads.
 *
 * It fails loudly. A non-200 on any file, a filename collision, or a group
 * count that disagrees with EXPECT stops the run with exit 2 — a capture that
 * silently dropped a file is worse than no capture, because SPEC.md would then
 * cite a stylesheet that is missing rules and nothing would say so.
 *
 * Why this exists at all: on 2026-09-08, Beachfront's reference was found dead
 * on every host, mid-campaign. The client's live site does not outlive the
 * cutover.
 *
 * Run from the site root, redirecting to the tracked manifest:
 *   node matching/capture-reference.mjs > matching/CAPTURE.md; echo exit=$?
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { REF } from "./harness.mjs";
import prettier from "prettier";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const OUT = "matching/spec";

/**
 * Measured against https://www.29navy.com/ on 2026-09-08, every URL fetched.
 * These are ASSERTIONS, not documentation. If the reference gains a slide or
 * drops a photo the run fails and the operator decides — rather than Phase 1
 * quietly speccing a different page than the one that was censused.
 *
 * `htmlAssets` counts <img src> plus every srcset variant: 58, not the 18 that
 * counting src alone gives. `fonts` is the three Font Awesome families in
 * woff2/eot/woff/ttf; `fontSvg` is their legacy .svg faces; the webflow-icons
 * face is a base64 data: URI and needs no file. `cssOther` is Webflow's
 * background-image.svg placeholder.
 */
const EXPECT = {
  html: 1,
  css: 1,
  scripts: 3,
  icons: 2,
  htmlAssets: 58,
  fonts: 12,
  fontSvg: 3,
  cssPhotos: 10,
  cssOther: 1,
  files: 90,
};

const FONT_EXT = /\.(?:woff2?|eot|ttf|otf)$/i;
const FA_SVG = /_fa-[a-z]+-\d+\.svg$/i;
const RASTER = /\.(?:jpe?g|png|gif|webp|avif)$/i;

/** Where each group lands. Anything unlisted goes to assets/. */
const DIRS = { html: ".", css: ".", scripts: "js", fonts: "fonts", fontSvg: "fonts" };
const DIR_ORDER = ["html", "css", "scripts", "fonts", "fontSvg"];

const die = (msg) => {
  console.error(`capture: ${msg}`);
  process.exit(2);
};

/** url -> Set(group). One URL can belong to two groups (location-aerial.jpg is
 *  both an <img> asset and a CSS background), so counts and downloads differ. */
const queue = new Map();
const add = (url, group) => queue.set(url, (queue.get(url) ?? new Set()).add(group));

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  return { status: res.status, buf: Buffer.from(await res.arrayBuffer()) };
}

const root = REF.endsWith("/") ? REF : `${REF}/`;
const page = await get(root);
if (page.status !== 200) die(`${root} returned ${page.status} — nothing captured`);
const html = page.buf.toString("utf8");
add(root, "html");

const abs = (u, base) => new URL(u, base).href;

// <link> attribute order on this reference is href-then-rel, so read the whole
// tag and pull both attributes out of it rather than assuming an order.
for (const m of html.matchAll(/<link\b[^>]*>/g)) {
  const href = /href="([^"]+)"/.exec(m[0])?.[1];
  const rel = (/rel="([^"]+)"/.exec(m[0])?.[1] ?? "").toLowerCase();
  if (!href) continue;
  if (rel.includes("stylesheet")) add(abs(href, root), "css");
  else if (rel.includes("icon")) add(abs(href, root), "icons"); // shortcut icon, apple-touch-icon
}
for (const m of html.matchAll(/<script\b[^>]+src="([^"]+)"/g)) add(abs(m[1], root), "scripts");
for (const m of html.matchAll(/<img\b[^>]+src="([^"]+)"/g)) add(abs(m[1], root), "htmlAssets");
for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const part of m[1].split(",")) {
    const u = part.trim().split(/\s+/)[0];
    if (u) add(abs(u, root), "htmlAssets");
  }
}

// The stylesheet must be read before its own url()s can be queued, so it is
// fetched here rather than in the download loop below.
const sheets = [...queue].filter(([, g]) => g.has("css")).map(([u]) => u);
if (sheets.length !== EXPECT.css) die(`expected ${EXPECT.css} stylesheet, found ${sheets.length}`);
const sheet = await get(sheets[0]);
if (sheet.status !== 200) die(`stylesheet ${sheets[0]} returned ${sheet.status}`);

for (const m of sheet.buf.toString("utf8").matchAll(/url\(\s*(["']?)([^)"']+)\1\s*\)/g)) {
  const raw = m[2].trim();
  if (raw.startsWith("data:")) continue;
  const u = abs(raw, sheets[0]);
  const name = decodeURIComponent(basename(new URL(u).pathname));
  if (FONT_EXT.test(name)) add(u, "fonts");
  else if (FA_SVG.test(name)) add(u, "fontSvg");
  else if (RASTER.test(name)) add(u, "cssPhotos");
  else add(u, "cssOther");
}

const fetched = new Map([
  [root, page],
  [sheets[0], sheet],
]);
const claimed = new Map();
const rows = [];

for (const [url, groups] of queue) {
  const r = fetched.get(url) ?? (await get(url));
  const dir = DIRS[DIR_ORDER.find((g) => groups.has(g))] ?? "assets";
  const name = groups.has("html")
    ? "index.html"
    : decodeURIComponent(basename(new URL(url).pathname)) || "index.html";
  const path = join(OUT, dir, name);
  const owner = claimed.get(path);
  if (owner && owner !== url) die(`filename collision at ${path}: ${owner} and ${url}`);
  claimed.set(path, url);
  const label = [...groups].sort().join("+");
  if (r.status !== 200) {
    rows.push({ path, url, label, status: r.status, bytes: 0, sha: "-" });
    continue;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, r.buf);
  rows.push({
    path,
    url,
    label,
    status: r.status,
    bytes: r.buf.length,
    sha: createHash("sha256").update(r.buf).digest("hex").slice(0, 16),
  });
}

const counts = { files: queue.size };
for (const [, groups] of queue) for (const g of groups) counts[g] = (counts[g] ?? 0) + 1;

// The manifest is TRACKED, so it goes through `prettier --check .` like every
// other record here — and prettier pads Markdown tables to their widest cell,
// which no `console.log` of mine is going to reproduce by hand. So the report is
// buffered and handed to the SITE's own prettier, resolved from its own config.
// Emitting it raw makes the documented command — `node matching/capture-reference.mjs
// > matching/CAPTURE.md` — reliably leave `pnpm verify` red, which is a trap for
// whoever regenerates it next.
const out = [];
const say = (line) => out.push(line);
say(`# Reference capture — ${root}`);
say("");
say(`Captured ${new Date().toISOString()} by \`matching/capture-reference.mjs\`.`);
say("The bytes live in git-ignored `matching/spec/`; this manifest is tracked so a");
say("fresh clone can tell whether its capture is the same one SPEC.md was written from.");
say("");
say("| file | group | bytes | status | sha256:16 |");
say("| --- | --- | --- | --- | --- |");
for (const r of rows.sort((a, b) => a.path.localeCompare(b.path))) {
  say(`| \`${r.path}\` | ${r.label} | ${r.bytes} | ${r.status} | \`${r.sha}\` |`);
}
say("");
say(`Total ${rows.length} files, ${rows.reduce((n, r) => n + r.bytes, 0)} bytes.`);
say("");
say("| group | found | expected |");
say("| --- | --- | --- |");
for (const k of Object.keys(EXPECT)) say(`| ${k} | ${counts[k] ?? 0} | ${EXPECT[k]} |`);

const md = out.join("\n") + "\n";
try {
  const cfg = await prettier.resolveConfig("matching/CAPTURE.md");
  process.stdout.write(await prettier.format(md, { ...cfg, parser: "markdown" }));
} catch (e) {
  // A manifest that is merely unformatted is still a true manifest. Losing a
  // 13 MB capture over a style tool would be the worse trade — say so and go on.
  process.stdout.write(md);
  console.error(`capture: prettier could not format the manifest (${e.message});`);
  console.error("capture: wrote it unformatted — run `pnpm exec prettier --write matching/CAPTURE.md`.");
}

const bad = rows.filter((r) => r.status !== 200);
if (bad.length) {
  die(
    `${bad.length} file(s) did not return 200: ` +
      bad.map((r) => `${r.status} ${r.url}`).join(", "),
  );
}
const wrong = Object.keys(EXPECT).filter((k) => (counts[k] ?? 0) !== EXPECT[k]);
if (wrong.length) {
  // Print the URLs, not just the delta. A count can move because the reference
  // changed OR because a classifier above mis-sorted a filename (FA_SVG assumes
  // Webflow's <hash>_fa-<family>-<weight>.svg shape, and anything unmatched
  // falls through to cssOther) — and "the reference moved" sends the operator
  // to inspect a page that did not. The URLs are what tells the two apart.
  for (const k of wrong) {
    const urls = rows.filter((r) => r.label.split("+").includes(k)).map((r) => r.url);
    console.error(`capture:   ${k} (${counts[k] ?? 0}, expected ${EXPECT[k]}):`);
    for (const u of urls) console.error(`capture:     ${u}`);
  }
  die(
    "group counts moved: " +
      wrong.map((k) => `${k} ${counts[k] ?? 0}≠${EXPECT[k]}`).join(", ") +
      " — either the reference changed or a classifier mis-sorted the URLs listed" +
      " above; check the group column in matching/CAPTURE.md before re-censusing",
  );
}
console.error("capture OK");
