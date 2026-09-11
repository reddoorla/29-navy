#!/usr/bin/env node
/**
 * Publish this site's assemblies from src/lib/site-pages.js to Prismic.
 *
 *   node --env-file=.env scripts/import/seed-home.mjs            # dry run (default)
 *   node --env-file=.env scripts/import/seed-home.mjs --apply    # stage, publish, verify
 *   node --env-file=.env scripts/import/seed-home.mjs --publish  # publish + verify only
 *   node scripts/import/seed-home.mjs --verify                   # read-back check, no token
 *
 * --publish is the resume path, and it exists because the failure it recovers
 * from actually happened: --apply staged 24 assets and a document into the
 * migration release, reported success, and left the site empty. Re-running
 * --apply would have uploaded all 24 assets a second time.
 *
 * PRISMIC_WRITE_TOKEN (in .env, gitignored) is needed only for --apply. A dry
 * run reads the public API and the local filesystem and nothing else, so it is
 * safe to run anywhere and is the thing to run first.
 *
 * IMPORTING THIS FILE RUNS NOTHING. Everything below is a function, and main()
 * is called only when node was pointed at this path — which is what lets
 * seed-home.test.ts exercise the parts that decide what gets written. Earlier
 * in this project a sibling script was imported to syntax-check it and executed
 * against the live reference on import; here that would mean a CMS write.
 *
 * WHY .mjs AND NOT .ts. scripts/import/migrate.example.ts tells you to run it
 * with `pnpm tsx` and imports `dotenv/config`; neither is a dependency of this
 * repo, so those instructions have never worked. This runs on the node the repo
 * already requires: `--env-file` replaces dotenv, and Node 20+ has File and
 * fetch built in.
 *
 * WHAT THIS IS NOT. There is no `reddoor-maint prismic-seed` — comments in this
 * repo named one for a while and reddoor-maint's --help has never listed it
 * (reddoorla/reddoor-maintenance#763). If a fleet command lands, it replaces
 * this script.
 */
import { readFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as prismic from "@prismicio/client";

import { documents, lang } from "../../src/lib/site-pages.js";

export const ROOT = resolve(import.meta.dirname, "../..");

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Where an image URL from site-pages.js lives on disk.
 *
 * decodeURIComponent is load-bearing: three floor-plan triggers are referenced
 * percent-encoded ("Untitled%20design%20(16).png") and sit on disk with literal
 * spaces, because that is how the reference serves them and how the capture
 * saved them. A browser decodes before reaching the filesystem — all three
 * return 200 in production — but readFileSync does not.
 */
export const assetPath = (url, root = ROOT) =>
  resolve(root, "static", decodeURIComponent(url).replace(/^\//, ""));

/**
 * The `img` resolver site-pages.js calls, bound to one migration. Registering
 * an asset is local and offline; nothing is uploaded until migrate().
 *
 * @returns {{img: (url: string, alt: string) => unknown, assets: Map<string, object>}}
 *   `assets` is keyed by URL — one entry per FILE, not per usage.
 */
export function createImageResolver({
  migration,
  root = ROOT,
  readFile = readFileSync,
  published = new Map(),
} = {}) {
  const assets = new Map();
  const reused = new Map();

  const img = (url, alt) => {
    // ALREADY IN PRISMIC? Reuse it. @prismicio/client uploads every asset a
    // migration registers, unconditionally — migrateCreateAssets has no id
    // check — so without this every re-seed puts a second copy of all 24
    // images in the media library, and deleting those is manual. Matching on
    // the original filename works because Prismic keeps it in the asset URL.
    const already = published.get(sanitizeName(basename(decodeURIComponent(url))));
    if (already) {
      reused.set(url, already);
      return already;
    }

    const existing = assets.get(url);
    if (existing) {
      // Prismic stores alt on the ASSET, so one file has one alt however many
      // fields point at it — @prismicio/client keeps the first and drops the
      // rest in silence (Migration.js: `config.alt = config.alt || config.alt`).
      // Refuse rather than let it pick. src/lib/site-pages-images.test.ts
      // asserts the same invariant, so a green suite never reaches this.
      if (existing.alt !== alt)
        throw new Error(
          `two different alt strings for one image — Prismic can only store one:\n` +
            `    ${url}\n      1. ${existing.alt}\n      2. ${alt}`,
        );
      return existing.asset;
    }

    const file = assetPath(url, root);
    const filename = basename(file);
    const type = MIME[extname(filename).toLowerCase()];
    if (!type) throw new Error(`unknown media type for ${filename}`);

    const bytes = readFile(file);
    const asset = migration.createAsset(new File([bytes], filename, { type }), filename, { alt });
    assets.set(url, { asset, alt, bytes: bytes.length, filename });
    return asset;
  };

  return { img, assets, reused };
}

/**
 * Every filled image field already on a published document, keyed by the
 * original filename Prismic preserved in the asset URL.
 *
 * Prismic sanitises the name on upload — "Untitled design (16).png" comes back
 * as "…_Untitleddesign-16-.png" — so the key is the sanitised form of the local
 * filename, matched the same way on both sides.
 */
export function publishedImages(data, into = new Map()) {
  if (Array.isArray(data)) {
    for (const v of data) publishedImages(v, into);
  } else if (data && typeof data === "object") {
    if (typeof data.url === "string" && data.dimensions && data.id) {
      const name = decodeURIComponent(data.url.split("/").pop().split("?")[0]);
      // Prismic prefixes its own id: "<id>_<original>". Strip it back off using
      // the id itself — NOT the first underscore, because the id contains one
      // ("4uIPMTuS_qroVXjo"). Cutting at the first underscore matched 17 of 24
      // and silently re-uploaded the other 7.
      const prefix = `${data.id}_`;
      const original = name.startsWith(prefix) ? name.slice(prefix.length) : name;
      into.set(sanitizeName(original), data);
    }
    for (const v of Object.values(data)) publishedImages(v, into);
  }
  return into;
}

/** Prismic's own filename normalisation, as observed on the seeded assets:
 *  spaces dropped, parentheses become hyphens. */
export const sanitizeName = (name) => name.replace(/\s+/g, "").replace(/[()]/g, "-");

/**
 * Register every assembly on the migration, and say what each one does.
 *
 * An assembly must UPDATE the document that already carries its uid, never add
 * a second one. The write client decides on `document.id` alone
 * (WriteClient.js:163 — no id means create), so looking the document up is what
 * makes a re-run idempotent. Without it a second run leaves two `home` pages
 * and the route serves whichever Prismic answers with.
 */
export async function buildPlan({ migration, client, assemblies, locale = lang }) {
  const plan = [];
  for (const assembly of assemblies) {
    let existing = null;
    try {
      existing = await client.getByUID(assembly.type, assembly.uid, { lang: locale });
    } catch (err) {
      if (!(err instanceof prismic.NotFoundError)) throw err;
    }

    const data = { ...(existing?.data ?? {}), ...assembly.data };
    if (existing) migration.updateDocument({ ...existing, data }, assembly.title);
    else
      migration.createDocument(
        { type: assembly.type, uid: assembly.uid, lang: locale, data },
        assembly.title,
      );

    plan.push({
      assembly,
      existingId: existing?.id ?? null,
      slicesBefore: existing?.data?.slices?.length ?? 0,
      slices: assembly.data.slices ?? [],
    });
  }
  return plan;
}

/** The whole report, as a string, so a test can read what an operator reads. */
export function formatReport({ repositoryName, apply, plan, assets, reused = new Map() }) {
  const totalBytes = [...assets.values()].reduce((n, a) => n + a.bytes, 0);
  const out = [`\nseed-home · ${repositoryName} · ${apply ? "APPLY" : "DRY RUN"}\n`];

  for (const p of plan) {
    out.push(
      `${p.existingId ? `UPDATE ${p.existingId}` : "CREATE"}  ` +
        `${p.assembly.type}/${p.assembly.uid}  "${p.assembly.title}"`,
    );
    out.push(
      `    slices: ${p.slicesBefore} → ${p.slices.length}` +
        `  [${p.slices.map((s) => s.slice_type).join(", ")}]`,
    );
  }

  if (reused.size)
    out.push(
      `\n${reused.size} image(s) already in Prismic — reused, not re-uploaded.` +
        `\n(@prismicio/client uploads every asset a migration registers, so without` +
        `\nthis a re-seed would leave a second copy of each in the media library.)`,
    );
  out.push(
    `\n${assets.size} asset(s) to upload, ${(totalBytes / 1024 / 1024).toFixed(1)}MB total:`,
  );
  for (const a of assets.values()) {
    out.push(`    ${String(Math.round(a.bytes / 1024)).padStart(5)}KB  ${a.filename}`);
    out.push(`             alt: ${a.alt}`);
  }

  if (!apply)
    out.push(
      `\nDRY RUN — nothing was sent. Re-run with --apply to write.`,
      `Every asset above is uploaded to the media library, where deleting them`,
      `again is manual. The document update is versioned and revertible in the`,
      `Prismic editor; the assets are not.\n`,
    );
  return out.join("\n");
}

/**
 * Read the PUBLISHED document back and count its slices.
 *
 * This exists because `migrate()` returning without throwing proves nothing
 * about what is live: it writes into Prismic's MIGRATION RELEASE, which is
 * staged content, and the published document is untouched until
 * publishMigrationRelease(). The first run of this script printed "done" over a
 * page that still had zero slices, because a clean exit was treated as evidence.
 *
 * PLAIN, CACHE-BUSTED FETCH, not a Client. The first version of this function
 * built a fresh Client per attempt, reasoning that a Client caches the master
 * ref it resolved. That reasoning was right and irrelevant: /api/v2 is served
 * from Prismic's CDN edge, which is keyed by URL, so every fresh Client got the
 * same stale ref and the retry loop was theatre. It reported "0 slice(s) live"
 * over content that was in fact published — a false negative on the one check
 * whose whole job is to be trustworthy. A changing query parameter is what
 * actually defeats it.
 */
export async function verifyPublished({
  repositoryName,
  plan,
  attempts = 10,
  waitMs = 3000,
  sleep,
  fetchJson = async (url) => (await fetch(url)).json(),
  nonce = () => `${Math.random()}`,
}) {
  const pause = sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const api = `https://${repositoryName}.cdn.prismic.io/api/v2`;
  let last = [];

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const bust = nonce();
    const meta = await fetchJson(`${api}?_=${bust}`);
    const master = meta.refs?.find((r) => r.isMasterRef) ?? meta.refs?.[0];
    if (!master) throw new Error(`no master ref on ${api}`);

    last = [];
    for (const p of plan) {
      const q = encodeURIComponent(
        `[[at(document.type,"${p.assembly.type}")][at(my.${p.assembly.type}.uid,"${p.assembly.uid}")]]`,
      );
      const res = await fetchJson(`${api}/documents/search?ref=${master.ref}&q=${q}&_=${bust}`);
      const live = res.results?.[0]?.data ?? {};
      last.push({
        uid: p.assembly.uid,
        want: p.slices.length,
        got: live.slices?.length ?? 0,
        diffs: comparePublished(p.assembly.data ?? {}, live),
      });
    }
    if (last.every((r) => r.got === r.want && !r.diffs.length)) return last;
    if (attempt < attempts) await pause(waitMs);
  }

  throw new Error(
    `published content does not match what was sent:\n` +
      last
        .flatMap((r) => [
          `    ${r.uid}: ${r.got} slice(s) live, expected ${r.want}`,
          ...r.diffs.map((d) => `      ${d}`),
        ])
        .join("\n") +
      `\n  The migration release may exist but be unpublished — check Releases in Prismic.`,
  );
}

/**
 * What the published document disagrees with, field by field.
 *
 * This function exists because the thing above it used to compare slice COUNT
 * and nothing else, while printing "the published ref carries what
 * site-pages.js describes" — a green granted by a check that could not observe
 * most of what it was vouching for. It was measured on 2026-09-11: the meta
 * fields had just been written, the verifier never looked at them, and it
 * passed. Renaming the message would have been the smaller lie; this is the fix.
 *
 * Compared: slice types in document order, and every top-level string field.
 * NOT compared, deliberately: anything under a slice's `primary`/`items`, and
 * image fields anywhere. Prismic rewrites an uploaded image into its own CDN
 * URL with its own id and query string, so `url` never round-trips and
 * asserting on it would fail every run. `docs/workJournal.md` carries the gap;
 * the honest move is to name it rather than let the caller infer coverage the
 * function does not have.
 */
export function comparePublished(want, live) {
  const diffs = [];

  const wantTypes = (want.slices ?? []).map((s) => s.slice_type);
  const liveTypes = (live.slices ?? []).map((s) => s.slice_type);
  // Order, not just membership: the slice zone is document order, and two
  // documents with the same five slices in different order render differently.
  if (wantTypes.join(",") !== liveTypes.join(","))
    diffs.push(`slices: live [${liveTypes.join(", ")}] != sent [${wantTypes.join(", ")}]`);

  for (const [key, value] of Object.entries(want)) {
    if (key === "slices" || typeof value !== "string") continue;
    if (live[key] !== value)
      diffs.push(
        `${key}: live ${JSON.stringify(live[key] ?? null)} != sent ${JSON.stringify(value)}`,
      );
  }
  return diffs;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const publishOnly = process.argv.includes("--publish");
  const verifyOnly = process.argv.includes("--verify");
  const repositoryName =
    process.env.PRISMIC_REPOSITORY_NAME ||
    JSON.parse(readFileSync(resolve(ROOT, "slicemachine.config.json"), "utf8")).repositoryName;

  const client = prismic.createClient(repositoryName, { fetch });

  // documents() is called TWICE, on purpose. The first pass uses a resolver
  // that returns nothing: it costs nothing, and all it is for is reading the
  // uids so the published documents can be fetched before any asset decision
  // is made. The second pass is the real one, and by then it knows which images
  // Prismic already holds and can point at them instead of uploading again.
  const published = new Map();
  for (const { type, uid } of documents(() => null)) {
    try {
      publishedImages((await client.getByUID(type, uid, { lang })).data, published);
    } catch (err) {
      if (!(err instanceof prismic.NotFoundError)) throw err;
    }
  }

  const migration = prismic.createMigration();
  const { img, assets, reused } = createImageResolver({ migration, published });
  const assemblies = documents(img);
  if (!assemblies.length) throw new Error("site-pages.js returned no documents");

  const plan = await buildPlan({ migration, client, assemblies });

  if (!publishOnly && !verifyOnly)
    console.log(formatReport({ repositoryName, apply, plan, assets, reused }));

  // --verify writes nothing and needs no token: it only reads the published ref
  // back and compares. It is the check --apply runs at the end, on its own, so
  // "is the live site actually carrying this?" can be answered at any time.
  if (verifyOnly) {
    console.log(`\nseed-home · ${repositoryName} · VERIFY\n`);
    for (const r of await verifyPublished({ repositoryName, plan }))
      console.log(`  ${r.uid}: ${r.got} slice(s) live, expected ${r.want}`);
    // Names the scope it actually covered. A field that can only observe some
    // of a thing must not be named after the whole thing.
    console.log(
      `\n✔ slice types (in order) and every top-level text field match ` +
        `site-pages.js.\n  Image fields are not compared — Prismic rewrites ` +
        `their URLs on upload.\n`,
    );
    return;
  }

  if (!apply && !publishOnly) return;

  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  if (!writeToken) throw new Error("this needs PRISMIC_WRITE_TOKEN (use `node --env-file=.env …`)");

  const writeClient = prismic.createWriteClient(repositoryName, { writeToken, fetch });

  if (!publishOnly) {
    console.log("\nstaging…\n");
    await writeClient.migrate(migration, { reporter: (e) => console.log(`  ${e.type}`) });
  }

  // migrate() writes into the MIGRATION RELEASE, not into published content —
  // its own JSDoc says so twice ("Updates documents in the Prismic
  // repository's migration release") and the client's example calls this second
  // step right after it. Skipping it leaves every document staged and the site
  // exactly as empty as before, with nothing anywhere reporting a problem.
  console.log("\npublishing the migration release…");
  const { totalItems } = await writeClient.publishMigrationRelease();
  console.log(`  ${totalItems} document(s) published`);

  // The only evidence that counts: the slice count read back off the PUBLIC
  // api, from the published ref, after the publish.
  console.log("\nverifying against the published ref…");
  for (const r of await verifyPublished({ repositoryName, plan }))
    console.log(`  ${r.uid}: ${r.got} slice(s) live`);

  console.log(`\n✔ live — ${plan.length} document(s) verified on the published ref.`);
  console.log(`Next: delete the AWAITING_SEED allowlist in svelte.config.js and re-run`);
  console.log(`\`pnpm verify\` — the four section ids now exist on /.\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  main().catch((err) => {
    console.error(`\n✘ ${err.message}\n`);
    process.exit(1);
  });
