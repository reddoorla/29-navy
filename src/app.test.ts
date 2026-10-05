import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

// Facts about the repo that no component test can see: what the shipped
// document head points at, and whether the suite can run somewhere other than
// the machine that captured the reference.
const ROOT = process.cwd();
const read = (p: string) => readFileSync(resolve(ROOT, p));

describe("app.html", () => {
  const APP_HTML = read("src/app.html").toString("utf8");
  /** Every <link rel="…icon…">: its rel tokens, and its `href` (asset placeholder
      or root-relative, query dropped) as the path under static/. */
  const icons = [...APP_HTML.matchAll(/<link[^>]*\brel="([^"]*icon[^"]*)"[^>]*>/g)].map((m) => ({
    rels: m[1].split(/\s+/),
    href: (m[0].match(/href="([^"]+)"/)?.[1] ?? "")
      .replace(/^(?:%sveltekit\.assets%)?\//, "")
      .replace(/[?#].*$/, ""),
  }));
  const iconHrefs = icons.map((i) => i.href);

  it("declares a favicon and an apple-touch icon", () => {
    expect(icons.flatMap((i) => i.rels)).toEqual(
      expect.arrayContaining(["icon", "apple-touch-icon"]),
    );
  });

  /** Whether a file opens the way an icon format a browser takes does. */
  const isImage = (bytes: Buffer) => {
    const hex = bytes.subarray(0, 12).toString("hex");
    const text = bytes.toString("utf8");
    return (
      hex.startsWith("89504e470d0a1a0a") || // PNG
      hex.startsWith("00000100") || // ICO
      hex.startsWith("ffd8ff") || // JPEG
      hex.startsWith("47494638") || // GIF
      (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") || // WebP
      (/^\uFEFF?\s*</.test(text) && /<svg[\s>]/i.test(text)) // SVG
    );
  };

  it("every declared icon is an image file in static/", () => {
    for (const href of iconHrefs) {
      expect(isImage(read(join("static", href))), href).toBe(true);
    }
  });

  // Not "does it resolve". The bug this replaces was invisible precisely
  // because the old favicon.png DID exist and DID return 200 — it was the
  // template's 128x128 grey placeholder, so the tab looked empty and every
  // check that only asked "does it resolve" stayed green. The test above asks
  // for an image's own bytes; this one refuses reddoor-starter's
  // static/favicon.png by digest. Any other image, the client's next favicon
  // included, passes.
  const TEMPLATE_PLACEHOLDER_SHA256 =
    "5146ed79b486cb9e1cdcdd7814cd22ae78e70ceb30fa06b4cd9a16cf121bc9e6";

  it("no declared icon is the template placeholder", () => {
    for (const href of iconHrefs) {
      const digest = createHash("sha256")
        .update(read(join("static", href)))
        .digest("hex");
      expect(digest, href).not.toBe(TEMPLATE_PLACEHOLDER_SHA256);
    }
  });
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
  // and guarded by existsSync is supported. This does not catch a module-scope
  // read spread across several lines; it catches the shape that actually
  // shipped.
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
