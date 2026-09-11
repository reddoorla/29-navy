import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { NotFoundError } from "@prismicio/client";

import {
  assetPath,
  buildPlan,
  createImageResolver,
  formatReport,
  publishedImages,
  sanitizeName,
  verifyPublished,
  comparePublished,
} from "./seed-home.mjs";
import { documents } from "../../src/lib/site-pages.js";

const ROOT = process.cwd();

/** A migration that records instead of uploading. */
const fakeMigration = () => {
  const created: Array<{ filename: string; alt?: string }> = [];
  const docs: Array<{ kind: "create" | "update"; doc: Record<string, unknown>; title?: string }> =
    [];
  return {
    created,
    docs,
    createAsset: (_file: unknown, filename: string, params: { alt?: string } = {}) => {
      created.push({ filename, alt: params.alt });
      return { __asset: filename };
    },
    createDocument: (doc: Record<string, unknown>, title: string) => {
      docs.push({ kind: "create", doc, title });
    },
    updateDocument: (doc: Record<string, unknown>, title: string) => {
      docs.push({ kind: "update", doc, title });
    },
  };
};

const stubBytes = () => Buffer.from("0123456789");

describe("seed-home is inert on import", () => {
  it("does nothing when imported rather than run", () => {
    // The one property that matters most in this file. Earlier in this project
    // a sibling script was imported purely to syntax-check it and executed
    // against the live reference on import; the same mistake here is a CMS
    // write. main() is behind an argv[1] check, so importing must produce no
    // output at all — not a dry-run report, not a network call.
    const out = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `await import(${JSON.stringify("./scripts/import/seed-home.mjs")})`,
      ],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    expect(out.trim()).toBe("");
  });
});

describe("assetPath", () => {
  it("decodes percent-encoded URLs to the files actually on disk", () => {
    // These three exist because the reference serves them encoded and the
    // capture saved them decoded. Reading static/<url> verbatim finds nothing
    // for exactly these, and only after 21 other assets are already uploaded.
    const encoded = [
      "/29navy/assets/615330625afda8f3e747c53f_Untitled%20design%20(16).png",
      "/29navy/assets/6153308fcb691617e9de8587_Untitled%20design%20(17).png",
      "/29navy/assets/615330c04bb71e65b9ff085c_Untitled%20design%20(18).png",
    ];
    for (const url of encoded) {
      expect(assetPath(url)).toContain("Untitled design (");
      expect(existsSync(assetPath(url)), `${url} did not resolve to a real file`).toBe(true);
    }
  });

  it("is rooted in static/, not in the repo root", () => {
    expect(assetPath("/29navy/assets/x.png")).toBe(resolve(ROOT, "static/29navy/assets/x.png"));
  });
});

describe("createImageResolver", () => {
  it("uploads one asset per file, not one per usage", () => {
    // site-pages.js makes 25 img() calls for 24 files: the aerial is used by
    // both the hero's mobile band and the location band. Without dedup the
    // media library gets two copies and the two fields point at different
    // assets, which an editor then has to keep in sync by hand.
    const migration = fakeMigration();
    const { img, assets } = createImageResolver({ migration, readFile: stubBytes });
    let calls = 0;
    documents((url: string, alt: string) => {
      calls++;
      return img(url, alt);
    });
    expect(calls).toBe(25);
    expect(assets.size).toBe(24);
    expect(migration.created.length).toBe(24);
  });

  it("carries the alt text through to the asset", () => {
    const migration = fakeMigration();
    const { img } = createImageResolver({ migration, readFile: stubBytes });
    img("/29navy/assets/a.png", "A lit brick facade.");
    expect(migration.created[0]).toEqual({
      filename: "a.png",
      alt: "A lit brick facade.",
    });
  });

  it("refuses one file with two different alt strings, naming both", () => {
    // Prismic stores alt on the asset and silently keeps the first. Letting it
    // pick means the losing string vanishes with no error anywhere.
    const migration = fakeMigration();
    const { img } = createImageResolver({ migration, readFile: stubBytes });
    img("/29navy/assets/a.png", "First description.");
    expect(() => img("/29navy/assets/a.png", "Second description.")).toThrow(
      /First description[\s\S]*Second description/,
    );
  });

  it("refuses a file type it has no MIME type for", () => {
    const migration = fakeMigration();
    const { img } = createImageResolver({ migration, readFile: stubBytes });
    expect(() => img("/29navy/assets/a.psd", "x")).toThrow(/unknown media type/);
  });
});

describe("buildPlan", () => {
  const assemblies = [
    {
      type: "page",
      uid: "home",
      title: "29 Navy",
      data: { slices: [{ slice_type: "navy_contact" }] },
    },
  ];

  it("UPDATES the document that already holds the uid", async () => {
    // The idempotence property. The write client creates whenever the document
    // it is handed has no id, so a plan that skips the lookup leaves a second
    // `home` page on every run and the route serves whichever Prismic answers.
    const migration = fakeMigration();
    const client = {
      getByUID: async () => ({ id: "aqCp8REAADEAeC8A", data: { slices: [], title: "kept" } }),
    };
    const plan = await buildPlan({ migration, client, assemblies });
    expect(plan[0].existingId).toBe("aqCp8REAADEAeC8A");
    expect(plan[0].slicesBefore).toBe(0);
    expect(migration.docs[0].kind).toBe("update");
    expect(migration.docs[0].doc.id).toBe("aqCp8REAADEAeC8A");
    // Fields the assembly does not mention survive — the seed writes slices,
    // it does not blank the SEO tab.
    expect((migration.docs[0].doc.data as Record<string, unknown>).title).toBe("kept");
  });

  it("CREATES when nothing holds the uid yet", async () => {
    const migration = fakeMigration();
    const client = {
      getByUID: async () => {
        throw new NotFoundError("nope", "", undefined);
      },
    };
    const plan = await buildPlan({ migration, client, assemblies });
    expect(plan[0].existingId).toBeNull();
    expect(migration.docs[0].kind).toBe("create");
  });

  it("rethrows anything that is not a genuine miss", async () => {
    // A bad token or a wrong repository name must not read as "no such page"
    // and quietly become a create.
    const migration = fakeMigration();
    const client = {
      getByUID: async () => {
        throw new Error("403 Forbidden");
      },
    };
    await expect(buildPlan({ migration, client, assemblies })).rejects.toThrow("403 Forbidden");
  });
});

describe("formatReport", () => {
  it("says what changes, and warns that assets are the irreversible half", () => {
    const report = formatReport({
      repositoryName: "29-navy",
      apply: false,
      plan: [
        {
          assembly: { type: "page", uid: "home", title: "29 Navy" },
          existingId: "abc123",
          slicesBefore: 0,
          slices: [{ slice_type: "navy_contact" }],
        },
      ],
      assets: new Map([["/a.png", { filename: "a.png", alt: "An alt.", bytes: 2048 }]]),
    });
    expect(report).toContain("DRY RUN");
    expect(report).toContain("UPDATE abc123  page/home");
    expect(report).toContain("slices: 0 → 1  [navy_contact]");
    expect(report).toContain("alt: An alt.");
    expect(report).toContain("the assets are not");
  });
});

describe("verifyPublished", () => {
  const SENT = [{ slice_type: "a" }, { slice_type: "b" }];
  const plan = [
    {
      assembly: {
        type: "page",
        uid: "home",
        // The document the seeder sends is more than a slice count, and the
        // fixture has to carry that or the verifier's new checks are never
        // exercised by these tests at all.
        data: { slices: SENT, meta_title: "T", meta_description: "D" },
      },
      slices: SENT,
    },
  ];
  const REFS = { refs: [{ isMasterRef: true, ref: "master-ref" }] };
  const withSlices = (n: number, over = {}) => ({
    results: [
      { data: { slices: SENT.slice(0, n), meta_title: "T", meta_description: "D", ...over } },
    ],
  });

  const run = (pages: Array<number>, extra = {}) => {
    const urls: string[] = [];
    let call = 0;
    return {
      urls,
      result: verifyPublished({
        repositoryName: "r",
        plan,
        sleep: async () => {},
        nonce: () => `n${++call}`,
        fetchJson: async (url: string) => {
          urls.push(url);
          if (url.includes("/documents/search"))
            return withSlices(
              pages[
                Math.min(urls.filter((u) => u.includes("search")).length - 1, pages.length - 1)
              ],
            );
          return REFS;
        },
        ...extra,
      }),
    };
  };

  it("passes only when the PUBLISHED ref carries the slices", async () => {
    expect(await run([2]).result).toEqual([{ uid: "home", want: 2, got: 2, diffs: [] }]);
  });

  it("throws, naming both counts, when the release was staged but not published", async () => {
    // The failure this function exists for: migrate() writes into the migration
    // release and returns cleanly while the published document keeps its old
    // content. Treating that clean return as success printed "done" over a page
    // that still had zero slices.
    await expect(run([0], { attempts: 2 }).result).rejects.toThrow(
      /0 slice\(s\) live, expected 2[\s\S]*unpublished/,
    );
  });

  it("retries, because the published ref lags the publish call", async () => {
    expect((await run([0, 0, 2]).result)[0].got).toBe(2);
  });

  it("fails when a text field the seeder wrote is absent from the published ref", async () => {
    // THE regression. Before this, verifyPublished compared slice count and
    // nothing else, then printed "the published ref carries what site-pages.js
    // describes". Measured on 2026-09-11 against the real repository: the run
    // that wrote meta_title and meta_description passed without ever reading
    // either one back. Slice count is right here and the field is wrong, so
    // this test fails for exactly one reason.
    const result = verifyPublished({
      repositoryName: "r",
      plan,
      attempts: 2,
      sleep: async () => {},
      nonce: () => "n1",
      fetchJson: async (url: string) =>
        url.includes("/documents/search") ? withSlices(2, { meta_title: undefined }) : REFS,
    });
    await expect(result).rejects.toThrow(/meta_title: live null != sent "T"/);
  });

  it("fails when the slices are published in the wrong order", async () => {
    // Same five slices in a different order is a different page, and a count
    // cannot see it.
    const result = verifyPublished({
      repositoryName: "r",
      plan,
      attempts: 2,
      sleep: async () => {},
      nonce: () => "n1",
      fetchJson: async (url: string) =>
        url.includes("/documents/search")
          ? {
              results: [
                { data: { slices: [...SENT].reverse(), meta_title: "T", meta_description: "D" } },
              ],
            }
          : REFS,
    });
    await expect(result).rejects.toThrow(/slices: live \[b, a\] != sent \[a, b\]/);
  });

  it("busts the CDN cache on every request", async () => {
    // Not decoration. The first version of this used a fresh Client per attempt
    // and still read a stale master ref every time, because /api/v2 is served
    // from a URL-keyed CDN edge — so it reported 0 slices over content that WAS
    // published. A changing query parameter is the only thing that defeats it,
    // and a retry loop without one is theatre.
    const { urls, result } = run([0, 2]);
    await result;
    expect(urls.length).toBeGreaterThan(2);
    for (const u of urls) expect(u, `${u} has no cache-buster`).toMatch(/[?&]_=n\d+/);
    // A different nonce on the second attempt, or the retry re-reads the first
    // attempt's cached response.
    expect(new Set(urls.map((u) => u.match(/_=(n\d+)/)![1])).size).toBeGreaterThan(1);
  });
});

describe("reusing assets Prismic already holds", () => {
  // @prismicio/client's migrateCreateAssets uploads EVERY asset a migration
  // registers — there is no id check — so without this a second seed leaves a
  // duplicate of all 24 images in the media library, and deleting those is
  // manual. Measured: the first run of this uploaded 24; with reuse, 0.
  const field = (id: string, original: string) => ({
    id,
    dimensions: { width: 10, height: 10 },
    url: `https://images.prismic.io/29-navy/${id}_${original}?auto=format,compress`,
  });

  it("strips the Prismic id prefix using the id, not the first underscore", () => {
    // The id CONTAINS an underscore ("4uIPMTuS_qroVXjo"). Cutting at the first
    // one matched 17 of 24 published images and silently re-uploaded the rest.
    const map = publishedImages({
      a: field("4uIPMTuS_qroVXjo", "68a8b03886756d39d580f327_29-navy-logo-black.jpg"),
      b: field("YX7QPp8nibm5yetD", "614de02ec8febc5e1427ffc8_gallery_roof1.jpg"),
    });
    expect([...map.keys()].sort()).toEqual([
      "614de02ec8febc5e1427ffc8_gallery_roof1.jpg",
      "68a8b03886756d39d580f327_29-navy-logo-black.jpg",
    ]);
  });

  it("matches Prismic's own filename mangling", () => {
    // "Untitled design (16).png" is stored as "Untitleddesign-16-.png".
    expect(sanitizeName("Untitled design (16).png")).toBe("Untitleddesign-16-.png");
  });

  it("finds a published image nested anywhere in the document", () => {
    const map = publishedImages({
      slices: [{ primary: { group: [{ image: field("abc", "x.png") }] } }],
    });
    expect(map.has("x.png")).toBe(true);
  });

  it("returns the published field instead of registering an upload", () => {
    const migration = fakeMigration();
    const published = publishedImages({ a: field("abc_def", "roof.jpg") });
    const { img, assets, reused } = createImageResolver({
      migration,
      published,
      readFile: stubBytes,
    });
    const got = img("/29navy/assets/roof.jpg", "A roof.");
    expect(got).toBe(published.get("roof.jpg"));
    expect(migration.created, "an already-published image was uploaded again").toEqual([]);
    expect(assets.size).toBe(0);
    expect(reused.size).toBe(1);
  });

  it("still uploads an image Prismic has never seen", () => {
    const migration = fakeMigration();
    const { img, assets } = createImageResolver({
      migration,
      published: publishedImages({ a: field("abc", "other.jpg") }),
      readFile: stubBytes,
    });
    img("/29navy/assets/roof.jpg", "A roof.");
    expect(migration.created.map((c) => c.filename)).toEqual(["roof.jpg"]);
    expect(assets.size).toBe(1);
  });
});

describe("comparePublished", () => {
  it("is silent when the published document matches what was sent", () => {
    const want = { slices: [{ slice_type: "a" }], meta_title: "T" };
    expect(comparePublished(want, { slices: [{ slice_type: "a" }], meta_title: "T" })).toEqual([]);
  });

  it("does not compare image fields, because Prismic rewrites their URLs", () => {
    // Not an oversight — an upload returns a different host, id and query
    // string every time, so asserting on `url` would fail every single run and
    // the check would be deleted within a day. Named here so the gap is a
    // decision on the record rather than something a reader has to infer.
    const want = { hero: { url: "/images/a.jpg", alt: "A" } };
    const live = {
      hero: { url: "https://images.prismic.io/29-navy/xyz.jpg?auto=format", alt: "A" },
    };
    expect(comparePublished(want, live)).toEqual([]);
  });

  it("reports a missing field and a changed field separately", () => {
    const want = { meta_title: "T", meta_description: "D" };
    const diffs = comparePublished(want, { meta_title: "OTHER" });
    expect(diffs).toHaveLength(2);
    expect(diffs.join(" ")).toContain('meta_title: live "OTHER" != sent "T"');
    expect(diffs.join(" ")).toContain("meta_description: live null");
  });
});
