import { render, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import NavyHeroSlider from "./index.svelte";

const HERE = dirname(fileURLToPath(import.meta.url));
const A = "/29navy/assets/";

const image = (file: string, alt: string) => ({
  url: A + file,
  alt,
  dimensions: { width: 1600, height: 861 },
});

// The reference's own six slides, in the reference's document order
// (matching/spec/index.html chars 2663..4701): roof1, colvu2, colvu1,
// hero-main-final, interior, 13A9553p. The hero photograph is FOURTH.
const SLIDE_FILES = [
  "614de02ec8febc5e1427ffc8_gallery_roof1.jpg",
  "614de02ec8febc767427ffcd_gallery_colvu2.jpg",
  "614de02ec8febc401227ffd2_gallery_colvu1.jpg",
  "614ddfc369005a542460176f_hero-main-final.jpg",
  "614de02ec8febcca7527ffb4_gallery_29navy_interior.jpg",
  "614de02ec8febce2c327ffc3_gallery_13A9553p.jpg",
];

const slice = {
  slice_type: "navy_hero_slider",
  variation: "default",
  primary: {
    logo: image("68a8b03886756d39d580f327_29-navy-logo-black.jpg", "29 Navy"),
    tagline_line_1: "Creative Lofts",
    tagline_line_2: "for Lease",
    slides: SLIDE_FILES.map((f, i) => ({ image: image(f, `Gallery photograph ${i + 1}`) })),
    mobile_location_image: image("614ddffddb6b8587d3d41004_location-aerial.jpg", "Aerial view"),
  },
} as never;

const mount = () => render(NavyHeroSlider, { props: { slice } });

// vitest runs without `globals`, so @testing-library/svelte never registers its
// own auto-cleanup and every render would otherwise stay in document.body —
// getByAltText then finds the same logo once per earlier test.
afterEach(cleanup);

describe("NavyHeroSlider slice", () => {
  it("renders the harness anchor 'Creative Lofts' exactly, split by a <br>", () => {
    const { container } = mount();
    const block = container.querySelector(".text-block");
    // matching/harness.json cuts every region on this string. It must survive
    // as one contiguous run of text, not "Creative  Lofts" or "CreativeLofts".
    expect(block?.textContent).toContain("Creative Lofts");
    expect(block?.textContent?.replace(/\s+/g, " ").trim()).toBe("Creative Lofts for Lease");
    // The reference's break is content, not styling: two authored lines with a
    // <br> between them (index.html: "Creative Lofts " + <br/> + "for Lease").
    expect(block?.querySelector("br")).not.toBeNull();
  });

  it("reproduces the reference element structure, mobile-location last", () => {
    const { container } = mount();
    const gallery = container.querySelector("#Gallery.section-2");
    const slider = gallery?.querySelector(":scope > .slider.w-slider");
    expect(slider).not.toBeNull();
    expect(
      [...(slider?.children ?? [])].map((el) => el.className.replace(/\s*svelte-\S+/, "")),
    ).toEqual([
      "_29-navy-logo-hero",
      "w-slider-mask",
      "left-arrow w-slider-arrow-left",
      "right-arrow w-slider-arrow-right",
      "slide-nav w-slider-nav w-shadow w-round",
    ]);
    expect(slider?.querySelector(".left-arrow > .w-icon-slider-left")).not.toBeNull();
    expect(slider?.querySelector(".right-arrow > .w-icon-slider-right")).not.toBeNull();

    // #Mobile-location is a SIBLING of #Gallery and follows it in document
    // order. Nesting it, or emitting it first, is a different DOM.
    const aerial = container.querySelector("#Mobile-location.mobile-location");
    expect(aerial).not.toBeNull();
    expect(gallery?.contains(aerial as Node)).toBe(false);
    const position = (gallery as Node).compareDocumentPosition(aerial as Node);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("puts the six slides in reference class order, so frame 0 is gallery_roof1", () => {
    const { container } = mount();
    const slides = [...container.querySelectorAll(".w-slider-mask > div")];
    expect(slides.map((el) => el.className.replace(/\s*svelte-\S+/, ""))).toEqual([
      "slide-6 w-slide",
      "slide-7 w-slide",
      "slide-8 w-slide",
      "slide w-slide",
      "slide-2 w-slide",
      "slide-5 w-slide",
    ]);
    // The hazard, stated as an assertion: the first frame is the roof photo and
    // hero-main-final.jpg is the FOURTH slide (ref css:2251 vs ref css:2232).
    expect(slides[0].getAttribute("style")).toContain(SLIDE_FILES[0]);
    expect(slides[3].getAttribute("style")).toContain("hero-main-final");
  });

  it("emits ZERO whitespace between the slides inside the nowrap mask", () => {
    const { container } = mount();
    const mask = container.querySelector(".w-slider-mask");
    // .w-slide is inline-block (ref css:1213) inside white-space:nowrap
    // (ref css:1198). One text node here is a ~4px word-space that walks every
    // slide after the first off its offset — invisible at rest, wrong the
    // moment the slider moves. Mutation-checked: deleting the
    // `<!-- prettier-ignore -->` above the mask and running `prettier --write`
    // reintroduces the text nodes and turns this red.
    const kids = [...(mask?.childNodes ?? [])];
    // Svelte 5 closes an {#each} with an EMPTY text node as its anchor, which
    // renders nothing. Any text node carrying actual characters is the defect,
    // so the assertion is on the text, not on the node count.
    const text = kids.filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.nodeValue);
    expect(text.join("")).toBe("");
    expect(kids.filter((n) => n.nodeType === Node.ELEMENT_NODE)).toHaveLength(6);
  });

  it("keeps the source formatted so the mask stays whitespace-free", () => {
    // The guard above only holds while the source line holds. This asserts the
    // mechanism itself: the ignore comment, and a mask whose slides live on one
    // unbroken line.
    const src = readFileSync(join(HERE, "index.svelte"), "utf8");
    const maskLine = src
      .split("\n")
      .find((l) => l.includes('<div class="w-slider-mask">') && l.includes("{#each"));
    expect(src).toContain("<!-- prettier-ignore -->");
    expect(maskLine).toMatch(/<div class="w-slider-mask">\{#each[\s\S]*\{\/each\}<\/div>$/);
  });

  it("sizes the logo from the HTML width attribute and gives it no height", () => {
    const { container } = mount();
    const logo = container.querySelector("._29-navy-logo-hero img") as HTMLImageElement;
    // Nothing in the reference stylesheet sets a width for this image — the
    // 143px is the presentation attribute, and the absence of a height
    // attribute is what lets 776×800 resolve the height to 147.42px.
    expect(logo.getAttribute("width")).toBe("143");
    expect(logo.hasAttribute("height")).toBe(false);
    expect(logo.getAttribute("src")).toContain("29-navy-logo-black.jpg");
  });

  it("gives the aerial no width/height attributes, since no CSS sets height:auto", () => {
    const { container } = mount();
    const aerial = container.querySelector("#Mobile-location img.image-18") as HTMLImageElement;
    expect(aerial.hasAttribute("width")).toBe(false);
    expect(aerial.hasAttribute("height")).toBe(false);
  });

  it("server-renders six nav dots with the first one active", () => {
    const { container } = mount();
    const dots = [...container.querySelectorAll(".slide-nav > .w-slider-dot")];
    expect(dots).toHaveLength(6);
    expect(dots[0].classList.contains("w-active")).toBe(true);
    expect(dots.slice(1).some((d) => d.classList.contains("w-active"))).toBe(false);
  });

  it("authors real alt text where the reference ships alt=''", () => {
    const { getByAltText, container } = mount();
    expect(getByAltText("29 Navy")).not.toBeNull();
    expect(getByAltText("Aerial view")).not.toBeNull();
    // The private-use-area chevron glyphs must never reach a screen reader.
    expect(container.querySelector(".w-icon-slider-left")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(container.querySelector(".w-icon-slider-right")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    // The slides are CSS backgrounds, so their authored alt travels as a label.
    const first = container.querySelector(".w-slider-mask > div");
    expect(first?.getAttribute("role")).toBe("img");
    expect(first?.getAttribute("aria-label")).toBe("Gallery photograph 1");
  });

  it("sets the slice data attributes on the section root", () => {
    const { container } = mount();
    const section = container.querySelector("[data-slice-type='navy_hero_slider']");
    expect(section?.id).toBe("Gallery");
    expect(section?.getAttribute("data-slice-variation")).toBe("default");
  });

  it("falls back to the captured reference assets when no CMS content exists", () => {
    // Keeps a fresh clone's build rendering the real page before the Prismic
    // repository exists (CLAUDE.md: the sentinel is load-bearing).
    const bare = {
      slice_type: "navy_hero_slider",
      variation: "default",
      primary: { logo: {}, tagline_line_1: null, tagline_line_2: null, slides: [] },
    } as never;
    const { container } = render(NavyHeroSlider, { props: { slice: bare } });
    const logo = container.querySelector("._29-navy-logo-hero img") as HTMLImageElement;
    expect(logo.getAttribute("src")).toBe(A + "68a8b03886756d39d580f327_29-navy-logo-black.jpg");
    expect(logo.getAttribute("alt")).toBe("29 Navy");
    const aerial = container.querySelector("img.image-18") as HTMLImageElement;
    expect(aerial.getAttribute("src")).toBe(A + "614ddffddb6b8587d3d41004_location-aerial.jpg");
    expect(aerial.getAttribute("alt")?.length).toBeGreaterThan(0);
    // Six bare slides still render, so the reference photographs carried by the
    // six class rules show through instead of .w-slider's grey (ref css:1191).
    const bareSlides = [...container.querySelectorAll(".w-slider-mask > div")];
    expect(bareSlides).toHaveLength(6);
    expect(bareSlides.every((el) => !el.hasAttribute("style"))).toBe(true);
    // The anchor, by contrast, is NOT defaulted: no tagline, no text.
    expect(container.querySelector(".text-block")?.textContent?.trim()).toBe("");
  });

  it("keeps mocks.json aligned with model.json", () => {
    const model = JSON.parse(readFileSync(join(HERE, "model.json"), "utf8"));
    const mocks = JSON.parse(readFileSync(join(HERE, "mocks.json"), "utf8"));
    const declared = Object.keys(model.variations[0].primary);
    const used = Object.keys(mocks[0].primary);
    // A mock field with no model behind it is silently dropped by the Prismic
    // Migration API — HTTP 200, no warning (src/lib/site-pages.test.ts).
    expect(used.filter((k) => !declared.includes(k))).toEqual([]);
    expect(declared.filter((k) => !used.includes(k))).toEqual([]);
    expect(mocks[0].primary.tagline_line_1.value).toBe("Creative Lofts");
    expect(mocks[0].primary.slides.value).toHaveLength(6);
    expect(
      mocks[0].primary.slides.value.map(
        (item: { value: [string, { url: string }][] }) => item.value[0][1].url,
      ),
    ).toEqual(SLIDE_FILES.map((f) => A + f));
  });
});
