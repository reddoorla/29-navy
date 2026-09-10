import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

// Facts about the repo that no component test can see: what the shipped
// document head points at, and whether the suite can run somewhere other than
// the machine that captured the reference.
const ROOT = process.cwd();
const read = (p: string) => readFileSync(resolve(ROOT, p));

describe("app.html", () => {
  const APP_HTML = read("src/app.html").toString("utf8");
  /** Every `href` on a <link rel="…icon…">, with SvelteKit's asset placeholder
      stripped back to the path under static/. */
  const iconHrefs = [...APP_HTML.matchAll(/<link[^>]*\brel="[^"]*icon[^"]*"[^>]*>/g)].map((m) => {
    const href = m[0].match(/href="([^"]+)"/)?.[1] ?? "";
    return href.replace("%sveltekit.assets%/", "");
  });

  it("declares both icons", () => {
    expect(iconHrefs).toEqual(["favicon.png", "apple-touch-icon.png"]);
  });

  // Positive evidence, not "no 404": each icon is byte-identical to the file
  // 29navy.com serves for that same rel. The bug this replaces was invisible
  // precisely because the old favicon.png DID exist and DID return 200 — it was
  // the template's 128x128 grey placeholder, so the tab looked empty and every
  // check that only asked "does it resolve" stayed green.
  const REFERENCE_ICONS: Record<string, string> = {
    "favicon.png": "29navy/assets/66734453c258a15e340f4029_favicon-32x32.png",
    "apple-touch-icon.png": "29navy/assets/66f5902c770ab3b836eb01f2_Artboard 1.png",
  };

  for (const [shipped, captured] of Object.entries(REFERENCE_ICONS)) {
    it(`ships the reference's own ${shipped}`, () => {
      expect(read(join("static", shipped)).equals(read(join("static", captured)))).toBe(true);
    });
  }
});

describe("the suite runs on a machine that never captured the reference", () => {
  // The defect: NavyContact.test.ts read matching/spec/index.html at module
  // scope. matching/* is gitignored on purpose — the capture is a workspace,
  // not a record — so the file exists on every machine that has run the harness
  // and on no CI runner. A module-scope read throws ENOENT during collection,
  // which takes the whole FILE down: 23 assertions stopped running and the
  // failure named a missing file rather than anything about the contact band.
  //
  // The narrow, honest rule: reads of matching/ at MODULE scope (column 0) are
  // banned, because those are the ones that kill collection. Inside a test body
  // and guarded by existsSync is supported and used — see NavyContact.test.ts
  // "agrees with the live capture, wherever the live capture exists". This does
  // not catch a module-scope read spread across several lines; it catches the
  // shape that actually shipped.
  const testFiles: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(resolve(ROOT, dir))) {
      const rel = join(dir, entry);
      if (statSync(resolve(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.test\.[jt]s$/.test(entry)) testFiles.push(rel);
    }
  };
  walk("src");

  it("finds the test files to check", () => {
    expect(testFiles.length).toBeGreaterThan(40);
  });

  it("has no module-scope read of the gitignored matching/ workspace", () => {
    const offenders: string[] = [];
    for (const rel of testFiles) {
      readFileSync(resolve(ROOT, rel), "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/^\S/.test(line) && /\breadFileSync?\s*\(/.test(line) && line.includes("matching/"))
            offenders.push(`${rel}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
