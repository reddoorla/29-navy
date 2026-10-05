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

// The autoplay cadence is a design value the client has already changed once
// (matching/LEDGER.md, Post-close 2026-09-17), so no test here restates it:
// they step fake time until the slider moves, and derive what they need from
// how long that took.
const STEP_MS = 100;
const LIMIT_MS = 60_000;
/** Steps fake time until `moved()` holds, and resolves to how long that took. */
const advanceUntil = async (moved: () => boolean) => {
  for (let elapsed = STEP_MS; elapsed <= LIMIT_MS; elapsed += STEP_MS) {
    await vi.advanceTimersByTimeAsync(STEP_MS);
    await tick();
    if (moved()) return elapsed;
  }
  throw new Error(`nothing moved within ${LIMIT_MS}ms`);
};

describe("NavyHeroSlider slice", () => {
  it("renders the harness anchor 'Creative Lofts' exactly, then the second line", () => {
    const { container } = mount();
    const block = container.querySelector(".text-block");
    // matching/harness.json cuts every region on this string. It must survive
    // as one contiguous run of text, not "Creative  Lofts" or "CreativeLofts".
    expect(block?.textContent).toContain("Creative Lofts");
    expect(block?.textContent?.replace(/\s+/g, " ").trim()).toBe("Creative Lofts for Lease");
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

  it("server-renders one nav dot per slide with the first one active", () => {
    const { container } = mount();
    const slides = container.querySelectorAll(".w-slider-mask .w-slide");
    const dots = [...container.querySelectorAll(".slide-nav > .w-slider-dot")];
    expect(dots).toHaveLength(slides.length);
    expect(dots.flatMap((d, i) => (d.classList.contains("w-active") ? [i] : []))).toEqual([0]);
  });

  it("authors real alt text where the reference ships alt=''", () => {
    const { getByAltText, container } = mount();
    expect(getByAltText("29 Navy")).not.toBeNull();
    expect(getByAltText("Aerial view")).not.toBeNull();
    // The private-use-area chevron glyphs must never reach a screen reader.
    for (const arrow of container.querySelectorAll(".w-slider-arrow-left, .w-slider-arrow-right")) {
      for (const icon of arrow.children) expect(icon.getAttribute("aria-hidden")).toBe("true");
    }
    // The slides are CSS backgrounds, so their authored alt travels as a label.
    const first = container.querySelector(".w-slider-mask > div");
    expect(first?.getAttribute("role")).toBe("img");
    expect(first?.getAttribute("aria-label")).toBe("Gallery photograph 1");
  });

  it("sets the slice data attributes on the section root", () => {
    const { container } = mount();
    const section = container.querySelector("[data-slice-type='navy_hero_slider']");
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
  });

  describe("motion", () => {
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
     * `translateX` then adds to that. The transform value alone is the offset
     * domain, and the defect that shipped lived entirely in the step from
     * offset to screen: the transform was written as an absolute position onto
     * an element that was already positioned, so the two compounded and slides
     * came to rest two slide-widths apart. Measured in production:
     * 0 2 4 6 8 10, with NOTHING at 0 for 14 of 21 one-second samples — the
     * mask sat empty and the slider's own grey background showed through.
     *
     * jsdom computes no layout, so natural position cannot be read from it; it
     * is the element's index by definition of inline-block flow, which is what
     * the reference was measured doing.
     */
    const positions = (container: Element) => xs(container).map((x, i) => x + i);

    /** Index of the slide currently at the mask's left edge. */
    const onScreen = (container: Element) => positions(container).indexOf(0);

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
      // THE regression. A carousel's one invariant is that a visitor is always
      // looking at a slide.
      vi.useFakeTimers();
      const container = mountSlider();
      for (let step = 0; step <= SLIDE_FILES.length; step++) {
        const showing = positions(container).filter((x) => x === 0);
        expect(showing, `step ${step}: positions ${positions(container).join(" ")}`).toHaveLength(
          1,
        );
        const before = onScreen(container);
        await advanceUntil(() => onScreen(container) !== before);
      }
    });

    it("advances one slide on its own", async () => {
      vi.useFakeTimers();
      const container = mountSlider();
      expect(onScreen(container)).toBe(0);
      await advanceUntil(() => onScreen(container) !== 0);
      expect(onScreen(container), "moved by exactly one").toBe(1);
      const dots = [...container.querySelectorAll(".w-slider-dot")];
      expect(dots.flatMap((d, i) => (d.classList.contains("w-active") ? [i] : []))).toEqual([1]);
    });

    it("restarts the full delay when the visitor navigates", async () => {
      // DELIBERATE DEVIATION from the reference, at the operator's request.
      // Measured on the live site: autoplay settled slide 2 at 2192ms, the right
      // arrow was clicked at 4235ms, and ticks carried on at 5201 / 8211 /
      // 11222ms — a flat ~3010ms cadence straight through the click. So the
      // reference lets a scheduled tick land ~1s after a click and jump again
      // unasked. This build restarts the delay instead.
      //
      // The assertion that matters is the NEGATIVE one, and it is only worth
      // anything if the clock is past the ORIGINAL tick's slot when it runs.
      // Literals here once put the check at 4900ms from mount — BEFORE the
      // 5000ms slot it claimed to have survived — so the delay is measured on a
      // first mount and every time below is derived from it.
      vi.useFakeTimers();
      const measured = mountSlider();
      const delay = await advanceUntil(() => onScreen(measured) !== 0);
      cleanup();

      const CLICK_AT = Math.floor(delay / 2 / STEP_MS) * STEP_MS; // inside the first delay
      const container = mountSlider();
      await vi.advanceTimersByTimeAsync(CLICK_AT);
      await tick();
      expect(onScreen(container), `no tick yet at ${CLICK_AT}ms`).toBe(0);

      (container.querySelector(".w-slider-arrow-right") as HTMLElement).click();
      await tick();
      expect(onScreen(container), "the click itself advances").toBe(1);

      // `delay` is the first STEP_MS boundary at or past the real tick, so
      // CLICK_AT + delay - STEP_MS from mount is past the original slot, and
      // short of a full delay after the click.
      await vi.advanceTimersByTimeAsync(delay - STEP_MS);
      await tick();
      expect(
        onScreen(container),
        "the tick scheduled for the original delay must not survive the click",
      ).toBe(1);

      await vi.advanceTimersByTimeAsync(STEP_MS);
      await tick();
      expect(onScreen(container), "a full delay after the click, it advances").toBe(2);
    });

    it("loops forward at the wrap instead of rewinding", async () => {
      // The measured reference behaviour, and the reason this is not just
      // `index + 1`: at the wrap the outgoing slide keeps moving LEFT while the
      // incoming one arrives from the RIGHT. Rewinding through five slides
      // would be the obvious implementation and is visibly wrong.
      const container = mountSlider();
      const next = container.querySelector(".w-slider-arrow-right") as HTMLElement;
      for (let i = 0; i < SLIDE_FILES.length; i++) {
        next.click();
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
      const transitions = [...container.querySelectorAll(".w-slide")].map((el) =>
        /transition:\s*([^;]+)/.exec(el.getAttribute("style") ?? "")?.[1]?.trim(),
      );
      const none = transitions.filter((t) => t === "none");
      const tweened = transitions.filter((t) => t !== undefined && t !== "none");
      expect(none).toHaveLength(1);
      expect(tweened).toHaveLength(transitions.length - 1);
    });

    it("steps from the arrows, and the dots report where it is", async () => {
      const container = mountSlider();
      const dots = [...container.querySelectorAll(".w-slider-dot")];
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
      const mask = container.querySelector(".w-slider-mask")!;
      expect(mask.id).not.toBe("");
      for (const [sel, label] of [
        [".w-slider-arrow-left", "previous slide"],
        [".w-slider-arrow-right", "next slide"],
      ] as const) {
        const el = container.querySelector(sel)!;
        expect(el.getAttribute("role")).toBe("button");
        expect(el.getAttribute("tabindex")).toBe("0");
        expect(el.getAttribute("aria-label")).toBe(label);
        expect(el.getAttribute("aria-controls")).toBe(mask.id);
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
        await expect(advanceUntil(() => onScreen(container) !== 0)).rejects.toThrow(
          /nothing moved/,
        );
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

// The first slide is the page's LCP element and it paints as a CSS
// background-image, which the preload scanner cannot see: measured on
// production 2026-09-21, the browser found it 1.1–2.4s late and Lighthouse
// performance flipped between ~90 and ~72 from run to run (#48). The cure is a
// <link rel="preload"> — and its ONE hard requirement is that the href is the
// IDENTICAL string the slide's `url("…")` carries. A preload that differs by a
// single query param is worse than none: the image downloads twice, once at
// highest priority. That is why there is no `imagesrcset` here, unlike
// `HeroBackgroundImage.svelte`: a CSS background cannot consume a srcset, so
// the candidate the browser picked would never be the URL the CSS asks for.
describe("NavyHeroSlider LCP preload", () => {
  const preloads = () =>
    Array.from(document.head.querySelectorAll<HTMLLinkElement>("link[rel='preload'][as='image']"));

  /** The URL inside the first slide's inline `background-image: url("…")`. */
  const firstSlideUrl = (container: HTMLElement) => {
    const style = container.querySelector(".w-slider-mask .w-slide")!.getAttribute("style") ?? "";
    return /background-image:\s*url\("([^"]+)"\)/.exec(style)?.[1];
  };

  // svelte:head content is not removed by cleanup() (see
  // HeroBackgroundImage.test.ts), so clear it or one test's link satisfies the next.
  afterEach(() => preloads().forEach((el) => el.remove()));

  // A Prismic-shaped URL with a second query param, so an implementation that
  // rebuilds the URL instead of reusing it (re-encoding `&`, dropping `rect`,
  // appending `w=`) cannot pass by accident.
  const PRISMIC =
    "https://images.prismic.io/29-navy/roof1.jpg?auto=format,compress&rect=0,0,1500,807";
  const authored = {
    slice_type: "navy_hero_slider",
    variation: "default",
    primary: {
      logo: {},
      tagline_line_1: null,
      tagline_line_2: null,
      slides: [
        { image: { url: PRISMIC, alt: "Roof deck", dimensions: { width: 1500, height: 807 } } },
        { image: image(SLIDE_FILES[1]!, "Second") },
        { image: image(SLIDE_FILES[2]!, "Third") },
      ],
    },
  } as never;

  it("preloads the first slide's photograph from the exact URL its background paints", () => {
    const { container } = render(NavyHeroSlider, { props: { slice: authored } });
    const painted = firstSlideUrl(container);
    expect(painted).toBe(PRISMIC);
    const [link] = preloads();
    expect(link, "a <link rel=preload as=image> in <head>").toBeDefined();
    expect(link!.getAttribute("href")).toBe(painted);
    expect(link!.getAttribute("fetchpriority")).toBe("high");
  });

  it("offers the browser no srcset, because a CSS background could never use the candidate", () => {
    render(NavyHeroSlider, { props: { slice: authored } });
    const [link] = preloads();
    expect(link).toBeDefined();
    expect(link!.hasAttribute("imagesrcset")).toBe(false);
    expect(link!.hasAttribute("imagesizes")).toBe(false);
  });

  it("preloads exactly one image however many slides there are", () => {
    // Every extra high-priority preload competes with the real LCP for
    // bandwidth — the multi-instance hazard HeroBackgroundImage.svelte names.
    mount();
    expect(preloads()).toHaveLength(1);
  });

  it("emits no preload when the first slide has no authored image", () => {
    // No CMS content: the slides paint the class defaults from the stylesheet,
    // and there is no URL in hand that is guaranteed to match them. No preload
    // beats a mismatched one.
    const bare = {
      slice_type: "navy_hero_slider",
      variation: "default",
      primary: { logo: {}, tagline_line_1: null, tagline_line_2: null, slides: [] },
    } as never;
    render(NavyHeroSlider, { props: { slice: bare } });
    expect(preloads()).toHaveLength(0);
  });
});

// WHAT ACTUALLY MOVES THE LIGHTHOUSE SCORE (#48, corrected). Not late discovery
// of the hero — that reading came from Lantern's scaled phase numbers and was
// wrong. Measured by blocking requests on production, 2026-09-21: the score is
// governed by the bytes that load ALONGSIDE the first slide. With slides 2–6
// (414KB) and the aerial (201KB) out of the first burst it read 97, 96, 98;
// with them in, anything from 73 to 94. The aerial is also the layout shift:
// 0.12–0.14 on div#Lofts in every run where it loads, 0.009 where it does not.
describe("NavyHeroSlider keeps the first burst to the first slide", () => {
  // jsdom has no requestIdleCallback, so the after-load-and-idle schedule falls
  // back to a timer. Anything comfortably over that fallback.
  const PAST_IDLE = 3100;

  const backgrounds = (container: HTMLElement) =>
    [...container.querySelectorAll<HTMLElement>(".w-slider-mask .w-slide")].map(
      (el) => /background-image:\s*url\("([^"]+)"\)/.exec(el.getAttribute("style") ?? "")?.[1],
    );
  const authoredUrls = SLIDE_FILES.map((f) => A + f);
  const activeDot = (container: HTMLElement) =>
    [...container.querySelectorAll(".w-slider-dot")].findIndex((d) =>
      d.classList.contains("w-active"),
    );

  const setReadyState = (value: DocumentReadyState) =>
    Object.defineProperty(document, "readyState", { value, configurable: true });
  afterEach(() => {
    // Drop the instance override so the prototype getter ("complete") is back.
    delete (document as { readyState?: unknown }).readyState;
  });

  it("first paints the first slide's photograph and no other", () => {
    vi.useFakeTimers();
    const { container } = mount();
    expect(backgrounds(container)).toEqual([authoredUrls[0], ...Array(5).fill(undefined)]);
  });

  it("says `background-image: none` on the slides it is holding back", () => {
    // Omitting the declaration is NOT withholding the photograph. Every slide
    // class carries a default in the stylesheet — the captured reference JPEG
    // (`.slide-7 { background-image: url("/29navy/assets/…colvu2.jpg") }`) — so a
    // slide with no inline background falls through to it, and the browser
    // fetches five unoptimised local JPEGs at first paint and then the five
    // authored photographs after idle: ten requests where there were five.
    // jsdom fetches nothing, so only this assertion can see it from here;
    // tests/smoke/hero-lcp-preload.spec.ts watches the real network.
    vi.useFakeTimers();
    const { container } = mount();
    const styles = [...container.querySelectorAll(".w-slider-mask .w-slide")].map(
      (el) => el.getAttribute("style") ?? "",
    );
    expect(styles[0]).not.toContain("background-image: none");
    for (const style of styles.slice(1)) expect(style).toContain("background-image: none;");
  });

  it("leaves the stylesheet defaults alone when nothing is authored", () => {
    // No CMS: the class defaults ARE the photographs. `none` here would blank
    // the whole strip on a fresh clone.
    vi.useFakeTimers();
    const bare = {
      slice_type: "navy_hero_slider",
      variation: "default",
      primary: { logo: {}, tagline_line_1: null, tagline_line_2: null, slides: [] },
    } as never;
    const { container } = render(NavyHeroSlider, { props: { slice: bare } });
    for (const el of container.querySelectorAll(".w-slider-mask .w-slide")) {
      expect(el.getAttribute("style") ?? "").not.toContain("background-image");
    }
  });

  it("paints the other five once the page has loaded and gone idle", async () => {
    vi.useFakeTimers();
    const { container } = mount();
    await vi.advanceTimersByTimeAsync(PAST_IDLE);
    expect(backgrounds(container)).toEqual(authoredUrls);
  });

  it("paints them at once when the visitor navigates before that", async () => {
    vi.useFakeTimers();
    setReadyState("loading"); // nothing but the click can have painted them
    const { container } = mount();
    (container.querySelector(".w-slider-arrow-right") as HTMLElement).click();
    await tick();
    expect(backgrounds(container)).toEqual(authoredUrls);
  });

  it("holds autoplay rather than sliding onto a photograph it has not painted", async () => {
    vi.useFakeTimers();
    setReadyState("loading");
    const { container } = mount();
    // Watched at every step, not read once at the end: a whole number of loops
    // brings an unheld slider back to the first slide.
    await expect(advanceUntil(() => activeDot(container) !== 0)).rejects.toThrow(/nothing moved/);
    expect(backgrounds(container).slice(1)).toEqual(Array(5).fill(undefined));

    setReadyState("complete");
    window.dispatchEvent(new Event("load"));
    await vi.advanceTimersByTimeAsync(PAST_IDLE);
    expect(backgrounds(container)).toEqual(authoredUrls);
    await advanceUntil(() => activeDot(container) !== 0);
    expect(activeDot(container), "autoplay resumes once they are painted").toBe(1);
  });
});

describe("NavyHeroSlider mobile aerial", () => {
  const PRISMIC_AERIAL =
    "https://images.prismic.io/29-navy/location-aerial.jpg?auto=format,compress";
  const withAerial = {
    slice_type: "navy_hero_slider",
    variation: "default",
    primary: {
      logo: {},
      tagline_line_1: null,
      tagline_line_2: null,
      slides: [],
      mobile_location_image: {
        url: PRISMIC_AERIAL,
        alt: "Aerial view",
        dimensions: { width: 2400, height: 1350 },
      },
    },
  } as never;
  const aerialOf = (container: HTMLElement) =>
    container.querySelector("#Mobile-location img.image-18") as HTMLImageElement;

  it("reserves the aerial's box before it loads, from the authored dimensions", () => {
    // The 0.12–0.14 layout shift on div#Lofts IS this image arriving into a box
    // nobody reserved. width/height give the browser the aspect ratio up front.
    const aerial = aerialOf(render(NavyHeroSlider, { props: { slice: withAerial } }).container);
    expect(aerial.getAttribute("width")).toBe("2400");
    expect(aerial.getAttribute("height")).toBe("1350");
  });

  it("offers a width ladder so a phone does not download the desktop master", () => {
    // 201KB unsized; the 768w rendition of the same photograph is ~25KB.
    const aerial = aerialOf(render(NavyHeroSlider, { props: { slice: withAerial } }).container);
    const candidates = (aerial.getAttribute("srcset") ?? "").split(", ");
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    for (const c of candidates) {
      const [url, w] = c.split(" ") as [string, string];
      expect(new URL(url).searchParams.get("w")).toBe(w.replace("w", ""));
      expect(new URL(url).pathname).toBe(new URL(PRISMIC_AERIAL).pathname);
    }
    expect(aerial.getAttribute("loading")).toBe("lazy");
  });

  it("leaves the captured reference aerial exactly as it was when nothing is authored", () => {
    // No CMS: a local /29navy/assets file, which imgix cannot resize and whose
    // dimensions nobody has authored. No srcset, no attributes — and therefore
    // no distortion, because there is nothing for height:auto to correct.
    const bare = {
      slice_type: "navy_hero_slider",
      variation: "default",
      primary: { logo: {}, tagline_line_1: null, tagline_line_2: null, slides: [] },
    } as never;
    const aerial = aerialOf(render(NavyHeroSlider, { props: { slice: bare } }).container);
    expect(aerial.hasAttribute("srcset")).toBe(false);
    expect(aerial.hasAttribute("width")).toBe(false);
    expect(aerial.hasAttribute("height")).toBe(false);
  });
});
