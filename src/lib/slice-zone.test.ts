import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { glob } from "node:fs/promises";

import { documents } from "./site-pages.js";

const ROOT = process.cwd();
const readJson = (p: string) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));

/** The `page` custom type's slice zone — the list Prismic checks a document
 *  against when the Migration API publishes it. */
const zone: string[] = Object.keys(
  readJson("customtypes/page/index.json").json.Main.slices.config.choices,
);

const modelIds = async () => {
  const ids: string[] = [];
  for await (const f of glob("src/lib/slices/*/model.json")) ids.push(readJson(f).id);
  return ids.sort();
};

// A slice can be fully built — model, mocks, component, registered in
// src/lib/slices/index.js, rendering correctly on /dev/match/home — and still
// be absent from the custom type that is supposed to hold it. Prismic then
// accepts the seed with HTTP 200 and publishes a document with NO slices.
//
// That is what shipped: the five navy_* slices were built and registered, the
// slice zone still listed only the nine template ones, and 29navy.com served
// its navbar over an empty page. src/lib/site-pages.test.ts did not catch it
// and could not — it compares documents against the SLICE MODELS, and every
// model was present and correct. The zone is a separate declaration, and it is
// the one Prismic enforces.
describe("the page slice zone", () => {
  it("accepts every slice this repo ships, and names no slice it does not", async () => {
    // Both directions, deliberately. Missing-from-zone is the silent-drop bug
    // above. Present-in-zone-without-a-model is its mirror: an editor is
    // offered a slice, authors content into it, and the site renders nothing
    // for it.
    expect(zone.slice().sort()).toEqual(await modelIds());
  });

  it("accepts every slice type the seed actually publishes", async () => {
    // The assertion that stands directly between the seed and another empty
    // home page. site-pages.js is the seed's input.
    const used = [
      ...new Set(
        documents(() => ({})).flatMap((d) =>
          ((d.data.slices ?? []) as Array<{ slice_type: string }>).map((s) => s.slice_type),
        ),
      ),
    ].sort();
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((t) => !zone.includes(t))).toEqual([]);
  });
});
