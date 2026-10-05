import { render, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps } from "svelte";
import NavyLocationBand from "./index.svelte";

afterEach(() => cleanup());

type Slice = ComponentProps<typeof NavyLocationBand>["slice"];

const PHOTO = "/29navy/assets/614ddffddb6b8587d3d41004_location-aerial.jpg";

const slice = {
  slice_type: "navy_location_band",
  variation: "default",
  primary: {
    heading: [{ type: "heading1", text: "Location", spans: [] }],
    background_image: {
      url: PHOTO,
      alt: "Aerial photograph of the 29 Navy building.",
      dimensions: { width: 1600, height: 861 },
    },
  },
} as unknown as Slice;

// Resolved from cwd, which vitest sets to the project root, and NOT from
// `new URL(..., import.meta.url)`. Measured, not assumed: the first revision of
// this file used the URL form and threw
//   ENOENT ... open '/src/lib/slices/NavyLocationBand/index.svelte'
// — the repo root missing from the front. A later probe in this same file got a
// correct absolute path out of import.meta.url, so the URL form is not reliably
// wrong either; it is simply not dependable here. cwd is.
const ROOT = process.cwd();
const HERE = resolve(ROOT, "src/lib/slices/NavyLocationBand");
const read = (name: string) => readFileSync(resolve(HERE, name), "utf8");

const BAND = "[data-slice-type='navy_location_band']";

describe("NavyLocationBand slice", () => {
  it("renders the authored heading", () => {
    const { getByRole } = render(NavyLocationBand, { props: { slice } });
    expect(getByRole("heading", { name: "Location" })).toBeTruthy();
  });

  it("carries the photo as a custom property, never as an inline background-image", () => {
    // #48. An inline `background-image` is resolved the moment the element is
    // parsed, while the `display: none` that hides this band at <=767 sits in a
    // stylesheet that may still be on the wire. Measured on the 2026-09-21
    // deploy: a phone downloaded this 201KB photograph, for a band it never
    // shows, in 13 of 20 loads, and every one of those fetches STARTED BEFORE
    // the stylesheet finished. A custom property fetches nothing by itself: the
    // fetch now waits for the stylesheet's `background-image: var(--band-photo)`,
    // which arrives together with the rule that hides the band.
    const { container } = render(NavyLocationBand, { props: { slice } });
    const style = container.querySelector(BAND)!.getAttribute("style") ?? "";
    expect(style).toContain(PHOTO);
    expect(style).not.toContain("background-image");
  });

  it("leaves no inline style when no image is authored", () => {
    // An unfilled field must not override the stylesheet's own photo with an
    // empty one.
    const bare = {
      ...slice,
      primary: { ...slice.primary, background_image: {} },
    } as unknown as Slice;
    const { container } = render(NavyLocationBand, { props: { slice: bare } });
    expect(container.querySelector(BAND)!.hasAttribute("style")).toBe(false);
  });

  it("carries the id the navbar's Location link targets", () => {
    const { nav } = JSON.parse(readFileSync(resolve(ROOT, "src/lib/site-config.json"), "utf8")) as {
      nav: { items: Array<{ href: string }> };
    };
    expect(nav.items.map((item) => item.href)).toContain("/#Location");
    const { container } = render(NavyLocationBand, { props: { slice } });
    expect(container.querySelector("#Location")).not.toBeNull();
  });

  it("sets slice data attributes", () => {
    const { container } = render(NavyLocationBand, { props: { slice } });
    const band = container.querySelector(BAND);
    expect(band?.getAttribute("data-slice-variation")).toBe("default");
  });

  it("renders no empty heading when the heading is unfilled", () => {
    const bare = { ...slice, primary: { ...slice.primary, heading: [] } } as unknown as Slice;
    const { queryByRole } = render(NavyLocationBand, { props: { slice: bare } });
    expect(queryByRole("heading")).toBeNull();
  });

  it("keeps mocks.json aligned with model.json, with a photo on disk and real alt", () => {
    const model = JSON.parse(read("model.json"));
    const mocks = JSON.parse(read("mocks.json"));
    const variation = model.variations.find((v: { id: string }) => v.id === mocks[0].variation) as {
      primary: Record<string, unknown>;
    };
    expect(model.id).toBe("navy_location_band");
    expect(variation).toBeDefined();
    // A mock field with no model behind it is silently dropped by the
    // Migration API — the same failure src/lib/site-pages.test.ts guards.
    expect(Object.keys(mocks[0].primary).sort()).toEqual(Object.keys(variation.primary).sort());
    const url = mocks[0].primary.background_image.url as string;
    expect(existsSync(resolve(ROOT, "static", url.slice(1))), `${url} is not under static/`).toBe(
      true,
    );
    expect(mocks[0].primary.background_image.alt.trim()).not.toBe("");
  });
});
