import { render, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach, vi } from "vitest";
import { tick } from "svelte";
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
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

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
      .find((l) => l.includes('class="w-slider-mask"') && l.includes("{#each"));
    expect(src).toContain("<!-- prettier-ignore -->");
    // Attributes on the mask are free to change — the id the arrows
    // aria-control was added after this test was written. What must not change
    // is that the `{#each}` and every slide stay on ONE line.
    expect(maskLine).toMatch(/class="w-slider-mask"[^>]*>\{#each[\s\S]*\{\/each\}<\/div>$/);
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
    // No inline background-image, so the six class rules show through. Slides
    // DO carry an inline style now — the carousel's transform lives there — so
    // asserting the attribute is absent would fail for a reason that has
    // nothing to do with the fallback this test is about.
    expect(bareSlides.every((el) => !/background-image/.test(el.getAttribute("style") ?? ""))).toBe(
      true,
    );
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

  describe("motion", () => {
    // Every number below is the reference's own: data-delay="3000",
    // data-duration="500", data-easing="ease", data-infinite="true".
    const xs = (container: Element) =>
      [...container.querySelectorAll(".w-slide")].map((el) => {
        const m = /translateX\((-?\d+)%\)/.exec(el.getAttribute("style") ?? "");
        return m ? Number(m[1]) / 100 : NaN;
      });

    const mountSlider = () => render(NavyHeroSlider, { props: { slice } }).container;

    /**
     * Where each slide actually lands, in slide-widths from the mask's left
     * edge — which is the only thing a visitor can see.
     *
     * `.w-slide` is `display: inline-block` (measured on the reference), so
     * slide i ALREADY sits at i slide-widths before any transform is applied.
     * `translateX` then adds to that. Every other assertion in this block reads
     * the transform value alone, which is the offset domain, and the defect
     * that shipped lived entirely in the step from offset to screen: the
     * transform was written as an absolute position onto an element that was
     * already positioned, so the two compounded and slides came to rest two
     * slide-widths apart. Measured in production: 0 2 4 6 8 10, with NOTHING at
     * 0 for 14 of 21 one-second samples — the mask sat empty and the slider's
     * own grey background showed through.
     *
     * jsdom computes no layout, so natural position cannot be read from it; it
     * is the element's index by definition of inline-block flow, which is what
     * the reference was measured doing.
     */
    const positions = (container: Element) => xs(container).map((x, i) => x + i);

    it("starts as plain document order, like the reference before it moves", () => {
      // Measured on the live reference at rest: every slide carries
      // translateX(0px) and they sit at 0, 1440, 2880 … — the carousel has not
      // rearranged anything yet.
      //
      // This asserted that measurement against xs() — the TRANSFORM — and so
      // required translateX to reproduce a position inline-block flow had
      // already produced. The comment was right and the assertion contradicted
      // it. Reading positions() is what the sentence above always meant.
      expect(positions(mountSlider())).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it("keeps exactly one slide on screen through a whole loop", async () => {
      // THE regression, and the only assertion in this block that would have
      // caught it. Everything else here compares transform values with each
      // other, so a model that is internally consistent and wrong about the
      // screen passes all of them. A carousel's one invariant is that a visitor
      // is always looking at a slide.
      vi.useFakeTimers();
      const container = mountSlider();
      for (let step = 0; step <= 6; step++) {
        const onScreen = positions(container).filter((x) => x === 0);
        expect(onScreen, `step ${step}: positions ${positions(container).join(" ")}`).toHaveLength(
          1,
        );
        await vi.advanceTimersByTimeAsync(3000);
        await tick();
      }
    });

    it("carries translateX(0) on every slide at rest, exactly like the reference", async () => {
      // Measured on the live reference: at rest all six slides carry
      // translateX(0px) and sit at 0, 1440, 2880 … from inline-block flow
      // alone. The old assertion recorded that measurement in a comment and
      // then asserted [0, 1, 2, 3, 4, 5] — the transform doing work the flow
      // had already done.
      expect(xs(mountSlider())).toEqual([0, 0, 0, 0, 0, 0]);
    });

    it("moves the strip as a unit, giving only the wrapping slide its own value", async () => {
      // Also measured on the reference, and a consequence of the fix rather
      // than an extra requirement: away from a wrap all six slides share one
      // transform (-0.30, -1.33, -2.37 … sampled mid-tween on the live site),
      // and at a wrap the slide that jumps to the far end takes a one-off value
      // while the other five still share theirs.
      vi.useFakeTimers();
      const container = mountSlider();
      await vi.advanceTimersByTimeAsync(3000);
      await tick();
      expect(new Set(xs(container)).size, "away from a wrap the strip moves as one").toBe(1);
      await vi.advanceTimersByTimeAsync(3000);
      await tick();
      const counts = new Map<number, number>();
      for (const x of xs(container)) counts.set(x, (counts.get(x) ?? 0) + 1);
      expect(
        [...counts.values()].sort((a, b) => a - b),
        "five share, one wraps",
      ).toEqual([1, 5]);
    });

    it("advances one slide every 3000ms on its own", async () => {
      vi.useFakeTimers();
      const container = mountSlider();
      expect(positions(container)[0]).toBe(0);
      await vi.advanceTimersByTimeAsync(3000);
      await tick();
      // Everything shifted left by one: slide 1 is now off to the left.
      expect(positions(container)).toEqual([-1, 0, 1, 2, 3, 4]);
      expect(container.querySelectorAll(".w-slider-dot.w-active")).toHaveLength(1);
      expect(
        [...container.querySelectorAll(".w-slider-dot")][1]!.classList.contains("w-active"),
      ).toBe(true);
    });

    /** Index of the slide currently at the mask's left edge. */
    const onScreen = (container: Element) => positions(container).indexOf(0);

    it("restarts the full delay when the visitor navigates", async () => {
      // DELIBERATE DEVIATION from the reference, at the operator's request.
      // Measured on the live site: autoplay settled slide 2 at 2192ms, the right
      // arrow was clicked at 4235ms, and ticks carried on at 5201 / 8211 /
      // 11222ms — a flat ~3010ms cadence straight through the click. So the
      // reference lets a scheduled tick land ~1s after a click and jump again
      // unasked. This build restarts the delay instead.
      //
      // The assertion that matters is the NEGATIVE one: at 2900ms after the
      // click the original tick's slot (3000ms from mount) has already passed,
      // and nothing may have moved.
      vi.useFakeTimers();
      const container = mountSlider();
      await vi.advanceTimersByTimeAsync(2000);
      await tick();
      expect(onScreen(container), "no tick yet at 2000ms").toBe(0);

      (container.querySelector(".w-slider-arrow-right") as HTMLElement).click();
      await tick();
      expect(onScreen(container), "the click itself advances").toBe(1);

      await vi.advanceTimersByTimeAsync(2900);
      await tick();
      expect(onScreen(container), "the tick scheduled for 3000ms must not survive the click").toBe(
        1,
      );

      await vi.advanceTimersByTimeAsync(200);
      await tick();
      expect(onScreen(container), "a full delay after the click, it advances").toBe(2);
    });

    it("does not re-key the interval on its own ticks", async () => {
      // The cheap way to implement the above is to bump the epoch inside step()
      // itself, which also re-keys on every autoplay tick — rebuilding the
      // interval 20 times a minute and making the cadence depend on teardown
      // ordering. Three unattended ticks must land on a flat 3000ms grid.
      vi.useFakeTimers();
      const container = mountSlider();
      for (const expected of [1, 2, 3]) {
        await vi.advanceTimersByTimeAsync(2999);
        await tick();
        expect(onScreen(container), `no early tick before ${expected}`).toBe(expected - 1);
        await vi.advanceTimersByTimeAsync(1);
        await tick();
        expect(onScreen(container), `tick ${expected} on the 3000ms grid`).toBe(expected);
      }
    });

    it("loops forward at the wrap instead of rewinding", async () => {
      // The measured reference behaviour, and the reason this is not just
      // `index + 1`: at the wrap the outgoing slide keeps moving LEFT while the
      // incoming one arrives from the RIGHT. Rewinding through five slides
      // would be the obvious implementation and is visibly wrong.
      vi.useFakeTimers();
      const container = mountSlider();
      for (let i = 0; i < 6; i++) {
        await vi.advanceTimersByTimeAsync(3000);
        await tick();
      }
      const after = positions(container);
      // Back on slide 1, with the last slide parked just off to the LEFT.
      expect(after[0]).toBe(0);
      expect(Math.min(...after)).toBe(-1);
      // Nothing is ever more than one slide-width to the left: a slide that
      // would go further teleports to the far end instead.
      expect(after.filter((x) => x < -1)).toEqual([]);
    });

    it("does not animate the slide that teleports across the strip", async () => {
      // The one move that must not tween. It crosses the whole strip, so
      // animating it would drag a photograph across the viewport backwards.
      // Driven by clicks, not timers: the flag that suppresses the tween is
      // cleared on the next animation frame, and advancing fake timers flushes
      // rAF too — so a timer-driven version of this test reads the state AFTER
      // the thing it is trying to observe. `tick()` is a microtask; rAF is not.
      const container = mountSlider();
      const next = container.querySelector(".w-slider-arrow-right") as HTMLElement;
      next.click();
      await tick();
      next.click();
      await tick();
      const styles = [...container.querySelectorAll(".w-slide")].map(
        (el) => el.getAttribute("style") ?? "",
      );
      const none = styles.filter((s) => s.includes("transition: none"));
      const tweened = styles.filter((s) => s.includes("transform 500ms ease"));
      expect(none).toHaveLength(1);
      expect(tweened).toHaveLength(5);
    });

    it("steps from the arrows, and the dots only report", async () => {
      // The dots are INDICATORS here, not controls. Reproducing the
      // reference's clickable role="button" dots fails the axe gate on
      // target-size (WCAG 2.2 2.5.8): they are 1em = 14px on a 20px pitch
      // (ref css:1262) and neither the 24px size nor the 24px spacing
      // exemption can be met without moving pixels the geometry gate measures.
      const container = mountSlider();
      const dots = [...container.querySelectorAll(".w-slider-dot")] as HTMLElement[];
      for (const dot of dots) {
        expect(dot.getAttribute("role")).toBeNull();
        expect(dot.getAttribute("tabindex")).toBeNull();
      }
      const next = container.querySelector(".w-slider-arrow-right") as HTMLElement;
      next.click();
      await tick();
      expect(dots[1].classList.contains("w-active")).toBe(true);
      (container.querySelector(".w-slider-arrow-left") as HTMLElement).click();
      await tick();
      expect(dots[0].classList.contains("w-active")).toBe(true);
    });

    it("moves on Left and Right from inside the carousel", async () => {
      // The affordance the dots used to carry. Without it, reaching slide 5 by
      // keyboard is four activations of one arrow.
      const container = mountSlider();
      const region = container.querySelector(".slider.w-slider") as HTMLElement;
      const dots = [...container.querySelectorAll(".w-slider-dot")];
      region.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      await tick();
      expect(dots[1].classList.contains("w-active")).toBe(true);
      region.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      await tick();
      expect(dots[0].classList.contains("w-active")).toBe(true);
    });

    it("carries the reference's own runtime a11y attributes", () => {
      // Webflow's slider adds these at runtime, and the gate measures the
      // reference WITH its JS running — so they are part of what is matched,
      // and they are what makes a div-built control usable by keyboard.
      const container = mountSlider();
      const region = container.querySelector(".slider.w-slider")!;
      expect(region.getAttribute("role")).toBe("region");
      expect(region.getAttribute("aria-label")).toBe("carousel");
      expect(container.querySelector(".w-slider-mask")!.id).toBe("w-slider-mask-0");
      for (const [sel, label] of [
        [".w-slider-arrow-left", "previous slide"],
        [".w-slider-arrow-right", "next slide"],
      ] as const) {
        const el = container.querySelector(sel)!;
        expect(el.getAttribute("role")).toBe("button");
        expect(el.getAttribute("tabindex")).toBe("0");
        expect(el.getAttribute("aria-label")).toBe(label);
        expect(el.getAttribute("aria-controls")).toBe("w-slider-mask-0");
      }
    });

    it("never autoplays under prefers-reduced-motion", async () => {
      // The reference has no reduced-motion handling at all; this is the
      // repo's, per docs/accessibility.md. An auto-advancing carousel is the
      // canonical thing that setting is for.
      const original = window.matchMedia;
      window.matchMedia = ((q: string) =>
        ({
          matches: q.includes("prefers-reduced-motion"),
          media: q,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList) as typeof window.matchMedia;
      try {
        vi.useFakeTimers();
        const container = mountSlider();
        await vi.advanceTimersByTimeAsync(12000);
        await tick();
        // Nothing moved — which is a statement about where the slides ARE, so
        // it reads positions rather than transform values.
        expect(positions(container)).toEqual([0, 1, 2, 3, 4, 5]);
        expect(container.querySelector(".w-slide")!.getAttribute("style")).toContain(
          "transition: none",
        );
      } finally {
        window.matchMedia = original;
      }
    });
  });
});
