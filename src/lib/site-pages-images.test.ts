import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { documents } from "./site-pages.js";

const ROOT = process.cwd();

/** Every `img(url, alt)` the assemblies make, in document order. `documents()`
 *  takes the resolver, so recording one is the only way to see the calls — and
 *  it is exactly the shape the seed and the dev route each supply. */
const calls: Array<{ url: string; alt: unknown }> = [];
documents((url: string, alt: string) => {
  calls.push({ url, alt });
  return { url, alt };
});

describe("the images site-pages.js publishes", () => {
  it("makes the img() calls at all", () => {
    // Denominator for everything below: an assembly that stopped emitting
    // images would otherwise pass every assertion here vacuously.
    expect(calls.length).toBe(25);
  });

  it("gives every image real alt text", () => {
    // The check that was missing when 25 authored alt strings sat in
    // mocks.json — Slice Machine preview data — while every rendered image got
    // alt="" (#13). `alt=""` is valid markup, so the axe gate reports 0
    // violations either way and always will; nothing downstream of here can
    // tell the difference. This is the only place it can be caught.
    // Non-empty, and nothing more. A length floor was tried and removed: it
    // failed six images whose alt is exactly right — "Lyft", "Uber",
    // "ClassPass", "29 Navy". A brand logo's alt IS the brand name, and a rule
    // that calls that too short is a rule that teaches people to pad it.
    const bare = calls.filter((c) => typeof c.alt !== "string" || c.alt.trim() === "");
    expect(bare.map((c) => c.url)).toEqual([]);
  });

  it("never gives one URL two different alt strings", () => {
    // Prismic stores alt on the ASSET, so a URL used twice has exactly one alt
    // whatever this file says — @prismicio/client keeps the FIRST and drops the
    // second in silence. The aerial is used twice (the hero's mobile band and
    // the location band) and mocks.json had authored two different strings for
    // it. Rather than let Prismic pick, fail here and make someone choose.
    const byUrl = new Map<string, Set<string>>();
    for (const c of calls) {
      if (!byUrl.has(c.url)) byUrl.set(c.url, new Set());
      byUrl.get(c.url)!.add(String(c.alt));
    }
    const conflicted = [...byUrl].filter(([, alts]) => alts.size > 1);
    expect(conflicted.map(([url, alts]) => `${url}: ${[...alts].join(" | ")}`)).toEqual([]);
  });

  it("names a file that is actually on disk for every image", () => {
    // The seed uploads these files. A URL with no file behind it fails halfway
    // through a migration, after assets are already in the media library —
    // cheaper to catch here than to reconcile a half-run migration.
    // decodeURIComponent, and it is load-bearing. Three floor-plan triggers are
    // referenced percent-encoded ("Untitled%20design%20(16).png") and sit on
    // disk with literal spaces, because that is how the reference serves them
    // and how the capture saved them. A browser decodes before hitting the
    // filesystem — all three return 200 in production — but readFileSync does
    // not, so a seed that reads static/<url> verbatim finds nothing for exactly
    // these three, and only after it has already uploaded the other 21 assets.
    const missing = calls
      .map((c) => c.url)
      .filter(
        (u) => !existsSync(resolve(ROOT, "static", decodeURIComponent(u).replace(/^\//, ""))),
      );
    expect([...new Set(missing)]).toEqual([]);
  });
});
