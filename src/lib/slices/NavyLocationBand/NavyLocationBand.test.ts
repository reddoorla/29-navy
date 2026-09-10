import { render } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps } from "svelte";
import NavyLocationBand from "./index.svelte";

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
const HERE = resolve(process.cwd(), "src/lib/slices/NavyLocationBand");
const read = (name: string) => readFileSync(resolve(HERE, name), "utf8");

const SOURCE = read("index.svelte");
const STYLE = SOURCE.slice(SOURCE.indexOf("<style>"), SOURCE.indexOf("</style>"));
/** Every `prop: value;` line inside the <style> block, trimmed. */
const DECLARATIONS = STYLE.split("\n")
  .map((l) => l.trim())
  .filter((l) => /^[a-z-]+:\s.*;/.test(l));
/** The style block with its comments stripped — what the browser actually gets.
    Structural assertions run against this, never against STYLE: the citation
    comments quote reference selectors and @media queries verbatim, so scanning
    the raw text finds rules that are only being talked about. */
const CSS = STYLE.replace(/\/\*[\s\S]*?\*\//g, "");
/** The body of one top-level rule, by its EXACT selector list. Split on the
    braces rather than searched for as text: `.heading {` also occurs inside the
    grouped box-sizing rule's selector list, and an indexOf would hand back that
    rule's body instead — a guard that silently measures the wrong thing. */
const ruleBody = (selector: string) => {
  const bodies = CSS.split("}")
    .map((chunk) => chunk.split("{"))
    .filter((parts) => parts.length === 2 && parts[0].trim() === selector)
    .map(([, body]) => body);
  expect(bodies, `expected exactly one top-level \`${selector}\` rule`).toHaveLength(1);
  return bodies[0];
};

describe("NavyLocationBand slice", () => {
  it("renders the reference's three-element subtree, verbatim", () => {
    // matching/spec/index.html:
    // <div id="Location" class="section"><div class="div-block-3"><h1 class="heading">Location</h1></div></div>
    const { container } = render(NavyLocationBand, { props: { slice } });
    const band = container.querySelector("div#Location.section");
    expect(band).not.toBeNull();
    const wrapper = band!.querySelector(":scope > div.div-block-3");
    expect(wrapper).not.toBeNull();
    const h1 = wrapper!.querySelector(":scope > h1.heading");
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe("Location");
    // Three elements total: the band plus exactly two descendants.
    expect(band!.querySelectorAll("*").length).toBe(2);
  });

  it("carries no anchor — an <a> here would cut the measured region at the navbar", () => {
    // SPEC.md's anchor-collision note: the navbar's own "Location" link sits at
    // stripped-text index 8, ahead of the first real anchor at 60.
    const { container } = render(NavyLocationBand, { props: { slice } });
    expect(container.querySelectorAll("a").length).toBe(0);
  });

  it("paints the photo as a CSS background, never as an <img> with a srcset", () => {
    // Hazard 8: the -p-500/-p-800/-p-1080 files next to the aerial in static/
    // are the srcset of #Mobile-location's <img class="image-18">, a different
    // census section. A CSS background takes no srcset.
    const { container } = render(NavyLocationBand, { props: { slice } });
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("picture")).toBeNull();
    expect(container.querySelector("[srcset]")).toBeNull();
    expect(SOURCE).not.toMatch(/-p-(500|800|1080)/);
  });

  it("inlines only the photo URL — every measurable value stays in the cited CSS", () => {
    const { container } = render(NavyLocationBand, { props: { slice } });
    const style = container.querySelector("div#Location")!.getAttribute("style") ?? "";
    expect(style).toContain(`url("${PHOTO}")`);
    for (const measurable of ["height", "background-position", "background-size", "cover", "vh"])
      expect(style).not.toContain(measurable);
  });

  it("falls back to the reference's own url() when no image is authored", () => {
    // ref css:2172 lives in the style block, so an unfilled field leaves the
    // band showing the captured photo rather than a bare white 100vh.
    const bare = {
      ...slice,
      primary: { ...slice.primary, background_image: {} },
    } as unknown as Slice;
    const { container } = render(NavyLocationBand, { props: { slice: bare } });
    const band = container.querySelector("div#Location")!;
    expect(band.hasAttribute("style")).toBe(false);
    expect(CSS).toContain(`background-image: url("${PHOTO}")`);
  });

  it("keeps id=\"Location\" — the navbar's <a href='#Location'> target", () => {
    const { container } = render(NavyLocationBand, { props: { slice } });
    expect(container.querySelector("#Location")).not.toBeNull();
    expect(SOURCE).toContain('id="Location"');
  });

  it("sets slice data attributes", () => {
    const { container } = render(NavyLocationBand, { props: { slice } });
    const band = container.querySelector("[data-slice-type='navy_location_band']");
    expect(band?.getAttribute("data-slice-variation")).toBe("default");
  });

  it("renders no empty <h1> when the heading is unfilled", () => {
    const bare = { ...slice, primary: { ...slice.primary, heading: [] } } as unknown as Slice;
    const { container } = render(NavyLocationBand, { props: { slice: bare } });
    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("div.div-block-3")).not.toBeNull();
  });

  it("does not wear the `residents` combo class", () => {
    // ref css:2192-2195 `.heading.residents { color: #aa4133; margin-bottom: 40px }`
    // belongs to the Residents section's h1. This h1 is class="heading" only.
    const { container } = render(NavyLocationBand, { props: { slice } });
    const h1 = container.querySelector("h1")!;
    expect(h1.classList.contains("heading")).toBe(true);
    expect(h1.classList.contains("residents")).toBe(false);
    expect(CSS).not.toContain("residents");
  });

  // ---- Source-level guards. jsdom applies no stylesheet, so the hazards that
  // live in the CSS are asserted against the file the browser will get.

  it("cites a reference line on every declaration in the style block", () => {
    // 1 box-sizing + 5 on .section + 1 display:none + 2 on .div-block-3 + 9 on .heading.
    expect(DECLARATIONS.length).toBeGreaterThanOrEqual(18);
    const uncited = DECLARATIONS.filter((l) => !/\/\* ref css:\d+/.test(l));
    expect(uncited).toEqual([]);
  });

  it("gives the h1 a 44px line box on 32px type", () => {
    // Hazard 3: .heading (ref css:2184-2190) sets font-size but never
    // line-height, so the h1 keeps 44px from ref css:387. Any bundled
    // Tailwind text-* leading, or `leading-none`, shrinks the box to ~37px.
    const heading = ruleBody(".heading");
    expect(heading).toMatch(/font-size:\s*32px;/);
    expect(heading).toMatch(/line-height:\s*44px;/);
    expect(heading).toMatch(/font-weight:\s*400;/);
    expect(heading).toMatch(/font-family:\s*Arial, sans-serif;/);
    expect(heading).not.toMatch(/line-height:\s*(1|normal|none)\b/);
  });

  it("offsets the h1 to the left rather than centring it", () => {
    // Hazard 5: margin-left 20px (ref css:2187) with margin-right 0 surviving
    // from the `margin: .67em 0` shorthand at ref css:50.
    const heading = ruleBody(".heading");
    expect(heading).toMatch(/margin-left:\s*20px;/);
    expect(heading).toMatch(/margin-right:\s*0;/);
    expect(heading).not.toMatch(/text-align/);
    expect(heading).not.toMatch(/max-width/);
    expect(heading).not.toMatch(/margin(-inline)?:\s*auto/);
  });

  it("stands 100vh tall in vh, not dvh/svh/lvh", () => {
    // Hazard 10: a dynamic-viewport unit passes a headless gate and is still
    // wrong against ref css:2176, and diverges on a real mobile browser.
    expect(ruleBody(".section")).toMatch(/height:\s*100vh;/);
    expect(CSS).not.toMatch(/\d(dvh|svh|lvh)/);
  });

  it("crops the photo dead centre", () => {
    // Hazard 7: ref css:2173 is the single value `50%`, i.e. `50% 50%`.
    // `50% 0`, `center top` or `top center` measure identically and paint a
    // materially different crop on a 100vh band.
    expect(ruleBody(".section")).toMatch(/background-position:\s*50%;/);
    expect(CSS).toMatch(/background-repeat:\s*no-repeat;/);
    expect(CSS).toMatch(/background-size:\s*cover;/);
  });

  it("hides the band at 767 and below, and reproduces no other breakpoint", () => {
    // Hazards 1 and 11: ref css:3227-3229 inside the max-width 767 block is the
    // subtree's ONLY media rule. `.div-block-3` and `.heading` appear once each
    // in the reference (ref css:2179, 2184) — the <=991 (ref css:3116) and
    // <=479 (ref css:3396) blocks contain nothing for them.
    const queries = CSS.match(/@media[^{]*/g) ?? [];
    expect(queries.map((q) => q.trim())).toEqual(["@media screen and (max-width: 767px)"]);
    expect(CSS).toMatch(
      /@media screen and \(max-width: 767px\) \{\s*\.section \{\s*display: none;/,
    );
  });

  it("keeps mocks.json aligned with model.json and with the reference's copy", () => {
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
    expect(mocks[0].primary.heading.value[0].content.text).toBe("Location");
    expect(mocks[0].primary.heading.value[0].type).toBe("heading1");
    expect(mocks[0].primary.background_image.url).toBe(PHOTO);
    // Reference ships alt="" on all 23 images; the rebuild authors real alt.
    expect(mocks[0].primary.background_image.alt.length).toBeGreaterThan(20);
  });
});
