import { render, cleanup, within } from "@testing-library/svelte";
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tick } from "svelte";
import type { ComponentProps } from "svelte";
import { preloadHidden } from "$utils/preloadHidden";
import NavyResidentLinks from "./index.svelte";

vi.mock("$utils/preloadHidden", () => ({ preloadHidden: vi.fn(() => () => {}) }));

type Slice = ComponentProps<typeof NavyResidentLinks>["slice"];

const A = "/29navy/assets/";

const web = (url: string, target?: string) => ({
  link_type: "Web",
  url,
  ...(target && { target }),
});
const image = (file: string, alt: string) => ({
  url: A + file,
  alt,
  dimensions: { width: 1, height: 1 },
});
const para = (text: string) => ({ type: "paragraph", text, spans: [] });

/** The eight tile labels, in the reference's document order — left column then
 *  right (matching/spec/index.html, `#Residents`). */
const LABELS = [
  "Paying rent online?",
  "Hooking up electricity?",
  "Too busy to do laundry?",
  "Looking for a gym?",
  "Connecting cable tv?",
  "Plugging in internet?",
  "Need a ride?",
  "Hungry?",
];

const slice = {
  slice_type: "navy_resident_links",
  variation: "default",
  primary: {
    heading: [{ type: "heading1", text: "Residents", spans: [] }],
    tiles: [
      { label: LABELS[0], link: web("https://payments.gozego.com/", "_blank"), modal: null },
      { label: LABELS[1], modal: "electric" },
      { label: LABELS[2], modal: "laundry" },
      { label: LABELS[3], modal: "gym" },
      { label: LABELS[4], modal: "tv_internet" },
      { label: LABELS[5], modal: "tv_internet" },
      { label: LABELS[6], modal: "ride" },
      { label: LABELS[7], modal: "food" },
    ],
    electric_title: "Hooking up electricity?",
    electric_body: [para("Call LA DWP at 800.342.5397."), para("If you have any large items…")],
    laundry_title: "Too busy to do your laundry?",
    laundry_logo: image("614def0e7bf7b30746beec9d_logo-modal-washio.png", "Rinse, formerly Washio"),
    laundry_link: web("https://www.rinse.com/getwashio"),
    gym_title: "Looking for a gym?",
    gym_logo_1: image("614dfdbeeca57714e0b275e0_golds-gym-logo.png", "Gold’s Gym Venice"),
    gym_link_1: web("http://www.goldsgym.com/veniceca/", "_blank"),
    gym_logo_2: image("614dfca76c78053dab7d696f_logo-modal-classpass.png", "ClassPass"),
    gym_link_2: web("https://classpass.com/"),
    tv_title: "connecting cable tv?",
    tv_logo: image("614e015fb3f528b5d65f8192_logo-modal-fios.png", "Verizon Fios"),
    tv_link: web("http://fios.verizon.com/", "_blank"),
    tv_body: [para("Contact Building Management at 310-393-9653.")],
    ride_title: "need a ride?",
    ride_logo_1: image("614e04a52a076aebf5fb883e_logo-modal-lyft.png", "Lyft"),
    ride_link_1: web("https://www.lyft.com/", "_blank"),
    ride_logo_2: image("614e04ae200f160bc3dd791f_logo-modal-uber.png", "Uber"),
    ride_link_2: web("https://www.uber.com/", "_blank"),
    food_title: "Hungry?",
    food_logo_1: image("614e083adb033884c9babd48_logo-modal-postmates.png", "Postmates"),
    food_link_1: web("https://postmates.com/los-angeles", "_blank"),
    food_logo_2: image("614e0828dc5ca9db01c4b415_logo-modal-uber-eats.png", "Uber Eats"),
    food_link_2: web("https://ubereats.com/eats/la/", "_blank"),
  },
} as unknown as Slice;

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => readFileSync(join(HERE, name), "utf8");

/** The inline at-rest pair, read back off the CSSOM — the browser normalises
 *  `display:none;opacity:0` into `display: none; opacity: 0;`, so the attribute
 *  string is not comparable while the two properties are. */
const inlineState = (el: Element) => {
  const style = (el as HTMLElement).style;
  return `display:${style.display};opacity:${style.opacity}`;
};
const display = (el: Element) => (el as HTMLElement).style.display;

/** The six popup roots, keyed by the `modal` Select value that opens them.
 *  SEVEN triggers, SIX popups — `tv_internet` is opened by two tiles. */
const POPUPS = {
  electric: ".popup-modal---electric",
  laundry: ".popup-modal---laundry",
  gym: ".popup-modal---gym",
  tv_internet: ".pop-up-modal---tv-internet",
  ride: ".ride---modal",
  food: ".food-modal---popup",
} as const;
type PopupKey = keyof typeof POPUPS;

/** Which popup each tile opens, by the label a visitor clicks. */
const WIRING: Array<[string, PopupKey]> = [
  [LABELS[1], "electric"],
  [LABELS[2], "laundry"],
  [LABELS[3], "gym"],
  [LABELS[4], "tv_internet"],
  [LABELS[5], "tv_internet"],
  [LABELS[6], "ride"],
  [LABELS[7], "food"],
];

/** The slice field that titles each popup. */
const TITLES = {
  electric: "electric_title",
  laundry: "laundry_title",
  gym: "gym_title",
  tv_internet: "tv_title",
  ride: "ride_title",
  food: "food_title",
} as const;

/** A tile's anchor, found by its accessible name. */
const tile = (container: Element, label: string) =>
  within(container.querySelector("#Residents") as HTMLElement).getByRole("link", { name: label });
/** The first tile that opens `key`. */
const opener = (container: Element, key: PopupKey) =>
  tile(container, WIRING.find(([, k]) => k === key)![0]);
/** A popup's close control, by role and accessible name. `hidden: true`
 *  because a closed popup is display:none and aria-hidden. */
const closeButton = (popup: Element) =>
  within(popup as HTMLElement).getByRole("button", { name: "Close", hidden: true });

afterEach(() => {
  // Without this, every render leaves its container in document.body — and
  // jsdom resolves a leading `#id` through getElementById, which returns the
  // FIRST match in the whole document. `#Residents > h1` then silently reads a
  // stale render's subtree and comes back null.
  cleanup();
  vi.useRealTimers();
});

describe("NavyResidentLinks slice", () => {
  // ---- Content and structure ------------------------------------------------

  it("links the rent tile out, and makes every other tile a popup trigger", () => {
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const rent = tile(container, "Paying rent online?");
    expect(rent.getAttribute("href")).toBe("https://payments.gozego.com/");
    expect(rent.getAttribute("target")).toBe("_blank");
    expect(rent.getAttribute("aria-haspopup")).toBeNull();
    // It is the ONLY tile that is a link rather than a popup trigger.
    for (const [label] of WIRING)
      expect(tile(container, label).getAttribute("href"), label).toBe("#");
  });

  // ---- The popups -----------------------------------------------------------

  it("renders every popup hidden at rest", () => {
    // The inline `display:none;opacity:0` is IX2 `useFirstGroupAsInitialState`
    // output, reproduced verbatim. It is what actually hides them: an inline
    // display beats every stylesheet rule.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    for (const selector of Object.values(POPUPS)) {
      const popup = container.querySelector(selector)!;
      expect(popup, selector).not.toBeNull();
      expect(display(popup), selector).toBe("none");
    }
  });

  it("opens the tv/internet popup from BOTH of its two triggers", async () => {
    // Hazard: SEVEN triggers, SIX popups. `.link-block-5` and `.link-block-6`
    // both fire IX2 actionList "a-8" against `.pop-up-modal---tv-internet`
    // (matching/spec/js/…3cb35528df4a8f16.js). A 1:1 assumption either invents
    // a seventh popup or counts six triggers and passes vacuously.
    for (const label of ["Connecting cable tv?", "Plugging in internet?"]) {
      const { container, unmount } = render(NavyResidentLinks, { props: { slice } });
      tile(container, label).click();
      await tick();
      expect(display(container.querySelector(POPUPS.tv_internet)!), label).toBe("block");
      unmount();
    }
  });

  it("opens exactly the popup its trigger names, and no other", async () => {
    for (const [label, key] of WIRING) {
      const { container, unmount } = render(NavyResidentLinks, { props: { slice } });
      const trigger = tile(container, label);
      expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
      trigger.click();
      await tick();
      for (const [other, selector] of Object.entries(POPUPS)) {
        expect(display(container.querySelector(selector)!), `${label} -> ${other}`).toBe(
          other === key ? "block" : "none",
        );
      }
      // aria-expanded used to be `openKey === modal`, keyed on the MODAL and
      // not on the trigger, so opening either tv/internet tile announced BOTH
      // as expanded. Whatever a trigger says about itself, no other may claim
      // the popup.
      for (const other of container.querySelectorAll("#Residents a"))
        if (other !== trigger)
          expect(other.getAttribute("aria-expanded"), `${label} -> ${other.textContent}`).not.toBe(
            "true",
          );
      unmount();
    }
  });

  it("opens every popup at phone width", async () => {
    // The <=767 stylesheet rules hide the popups, but the inline display beats
    // them, so the reference's popups DO open at 767 and 390. Nothing here may
    // decide by width whether to open.
    const width = window.innerWidth;
    const original = window.matchMedia;
    Object.defineProperty(window, "innerWidth", { value: 390, configurable: true });
    window.matchMedia = ((q: string) => {
      const max = /max-width:\s*(\d+)px/.exec(q);
      const min = /min-width:\s*(\d+)px/.exec(q);
      return {
        matches: Boolean(max || min) && (!max || 390 <= +max[1]) && (!min || 390 >= +min[1]),
        media: q,
        addEventListener() {},
        removeEventListener() {},
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;
    try {
      for (const [label, key] of WIRING) {
        const { container, unmount } = render(NavyResidentLinks, { props: { slice } });
        tile(container, label).click();
        await tick();
        expect(display(container.querySelector(POPUPS[key])!), label).toBe("block");
        unmount();
      }
    } finally {
      Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
      window.matchMedia = original;
    }
  });

  it("opens every popup fully visible once its fade runs, and closes it on its X", async () => {
    vi.useFakeTimers();
    for (const key of Object.keys(POPUPS) as PopupKey[]) {
      const { container, unmount } = render(NavyResidentLinks, { props: { slice } });
      opener(container, key).click();
      await vi.runAllTimersAsync();
      const popup = container.querySelector(POPUPS[key]) as HTMLElement;
      expect(inlineState(popup), key).toBe("display:block;opacity:1");
      // Open, it is exposed to assistive tech and named by its own title.
      within(popup).getByRole("dialog", { name: slice.primary[TITLES[key]]! });

      closeButton(popup).click();
      await vi.runAllTimersAsync();
      expect(display(popup), key).toBe("none");
      unmount();
    }
  });

  it("makes every popup a modal dialog with a real close button", () => {
    // The reference's close is a bare <div data-w-id> with cursor:pointer
    // (ref css:2507) — mouse only, and unreachable by keyboard. A hand-rolled
    // role/tabindex/keydown version fired on Space KEYDOWN where a real button
    // fires on keyup, so pressing Space, changing your mind and moving off
    // still closed the dialog. These are <button type="button"> now and the
    // key semantics are the platform's.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    // The hand-rolled affordances must be GONE, not merely supplemented — a
    // role="button" left on a real button is the kind of leftover that reads
    // as intentional later.
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
    for (const [key, selector] of Object.entries(POPUPS) as Array<[PopupKey, string]>) {
      const dialog = within(container.querySelector(selector) as HTMLElement).getByRole("dialog", {
        hidden: true,
      });
      // Focus containment without aria-modal tells a screen reader the
      // background is still browsable while Tab says otherwise.
      expect(dialog.getAttribute("aria-modal"), key).toBe("true");
      const close = closeButton(dialog);
      expect(close.getAttribute("type"), key).toBe("button");
      expect(close.getAttribute("tabindex"), key).toBeNull();
      expect(close.getAttribute("onkeydown"), key).toBeNull();
    }
  });

  it("moves focus into an open popup and gives it back to the trigger on close", async () => {
    vi.useFakeTimers();
    for (const key of Object.keys(POPUPS) as PopupKey[]) {
      const { container, unmount } = render(NavyResidentLinks, { props: { slice } });
      const trigger = opener(container, key);
      trigger.focus();
      trigger.click();
      await vi.runAllTimersAsync();
      const popup = container.querySelector(POPUPS[key])!;
      const dialog = popup.querySelector('[role="dialog"]')!;
      expect(dialog.contains(document.activeElement), `${key}: focus moved in`).toBe(true);

      closeButton(popup).click();
      await vi.runAllTimersAsync();
      expect(document.activeElement, `${key}: focus restored`).toBe(trigger);
      unmount();
    }
  });

  it("keeps Tab and Shift+Tab inside an open popup", async () => {
    // jsdom performs no layout, so trapFocus's visibility filter would reject
    // every control; treat them all as laid out.
    const rects = vi
      .spyOn(Element.prototype, "getClientRects")
      .mockReturnValue([{}] as unknown as DOMRectList);
    const tab = (target: Element, shiftKey = false) => {
      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      return event;
    };
    try {
      vi.useFakeTimers();
      for (const key of Object.keys(POPUPS) as PopupKey[]) {
        const { container, unmount } = render(NavyResidentLinks, { props: { slice } });
        opener(container, key).click();
        await vi.runAllTimersAsync();
        const popup = container.querySelector(POPUPS[key])!;
        const focusables = [...popup.querySelectorAll<HTMLElement>("a[href], button")];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        last.focus();
        expect(tab(last).defaultPrevented, `${key}: Tab from the last control`).toBe(true);
        expect(document.activeElement, `${key}: Tab from the last control`).toBe(first);

        expect(tab(first, true).defaultPrevented, `${key}: Shift+Tab from the first`).toBe(true);
        expect(document.activeElement, `${key}: Shift+Tab from the first`).toBe(last);
        unmount();
      }
    } finally {
      rects.mockRestore();
    }
  });

  it("closes on a backdrop click but not on a click inside the panel", async () => {
    // Parity with components/Modal.svelte:37-39 — a visitor who learns the
    // gesture on one dialog in this site gets it on all of them. The negative
    // half is the one that matters: a naive handler on the root closes the
    // popup when the visitor clicks the body text.
    vi.useFakeTimers();
    const { container } = render(NavyResidentLinks, { props: { slice } });
    opener(container, "electric").click();
    await vi.runAllTimersAsync();
    const popup = container.querySelector(POPUPS.electric)! as HTMLElement;
    expect(inlineState(popup)).toBe("display:block;opacity:1");

    (popup.querySelector('[role="dialog"]') as HTMLElement).click();
    await vi.runAllTimersAsync();
    expect(inlineState(popup), "a click inside the panel must not close").toBe(
      "display:block;opacity:1",
    );

    popup.click();
    await vi.runAllTimersAsync();
    expect(display(popup), "a click on the backdrop must close").toBe("none");
  });

  it("closes on Escape", async () => {
    vi.useFakeTimers();
    const { container } = render(NavyResidentLinks, { props: { slice } });
    opener(container, "ride").click();
    await vi.runAllTimersAsync();
    const popup = container.querySelector(POPUPS.ride)!;
    expect(display(popup)).toBe("block");
    (document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await vi.runAllTimersAsync();
    expect(display(popup)).toBe("none");
  });

  it("opens and closes without a fade under prefers-reduced-motion", async () => {
    // Fake timers that are never advanced: under reduced motion both
    // directions must land without waiting on a frame or a timeout.
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
      const { container } = render(NavyResidentLinks, { props: { slice } });
      opener(container, "food").click();
      await tick();
      const popup = container.querySelector(POPUPS.food)!;
      expect(inlineState(popup)).toBe("display:block;opacity:1");

      closeButton(popup).click();
      await tick();
      expect(display(popup)).toBe("none");
    } finally {
      window.matchMedia = original;
    }
  });

  it("renders every paragraph of the popups' prose", () => {
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const electric = container.querySelector(POPUPS.electric)!.textContent;
    expect(electric).toContain("Call LA DWP at 800.342.5397.");
    expect(electric).toContain("If you have any large items…");
    expect(container.querySelector(POPUPS.tv_internet)!.textContent).toContain(
      "Contact Building Management at 310-393-9653.",
    );
  });

  it("links every popup logo where the slice says, under the logo's own alt", () => {
    // The reference ships alt="" on all 23 of the page's images. The repo
    // pre-declared the rebuild's real alt as an accepted text-diff artifact.
    // Logo alt travels with the Prismic asset; the close glyph's is code-owned.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const fields = slice.primary as unknown as Record<
      string,
      { url: string; alt?: string; target?: string }
    >;
    for (const [logoKey, linkKey] of [
      ["laundry_logo", "laundry_link"],
      ["gym_logo_1", "gym_link_1"],
      ["gym_logo_2", "gym_link_2"],
      ["tv_logo", "tv_link"],
      ["ride_logo_1", "ride_link_1"],
      ["ride_logo_2", "ride_link_2"],
      ["food_logo_1", "food_link_1"],
      ["food_logo_2", "food_link_2"],
    ]) {
      const logo = fields[logoKey];
      const link = fields[linkKey];
      const img = container.querySelector(`img[src="${logo.url}"]`)!;
      expect(img, logoKey).not.toBeNull();
      expect(img.getAttribute("alt"), logoKey).toBe(logo.alt);
      const anchor = img.closest("a")!;
      expect(anchor.getAttribute("href"), linkKey).toBe(link.url);
      expect(anchor.getAttribute("target") ?? undefined, linkKey).toBe(link.target);
    }
    const images = [...container.querySelectorAll("img")];
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) expect(img.hasAttribute("alt"), img.getAttribute("src")!).toBe(true);
  });

  it("warms every image behind the popups", () => {
    // Every popup image sits inside a `display: none` popup, so
    // `loading="lazy"` defers each fetch until its popup opens and the logo
    // lands visibly late. Measured on production before the warm-up: 2 of 12
    // hidden images were fetched before any interaction; after, 12 of 12.
    vi.mocked(preloadHidden).mockClear();
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const warmed = vi.mocked(preloadHidden).mock.lastCall?.[0] ?? [];
    const hidden = [...container.querySelectorAll('[role="dialog"] img')].map((img) =>
      img.getAttribute("src"),
    );
    expect(hidden.length).toBeGreaterThan(0);
    for (const src of hidden) expect(warmed, `${src} is not warmed`).toContain(src);
  });

  // ---- Model and mocks ------------------------------------------------------

  it("keeps mocks.json aligned with model.json", () => {
    const model = JSON.parse(read("model.json"));
    const mocks = JSON.parse(read("mocks.json"));
    const variation = model.variations.find((v: { id: string }) => v.id === mocks[0].variation) as {
      primary: Record<string, { type: string; config: Record<string, unknown> }>;
    };
    expect(model.id).toBe("navy_resident_links");
    expect(model.name).toBe("NavyResidentLinks");
    expect(variation).toBeDefined();
    // A mock field with no model behind it is silently dropped by the Migration
    // API — the same failure src/lib/site-pages.test.ts guards.
    expect(Object.keys(mocks[0].primary).sort()).toEqual(Object.keys(variation.primary).sort());

    const tiles = mocks[0].primary.tiles.value as Array<{
      value: Array<[string, { value: string }]>;
    }>;
    const field = (tile: (typeof tiles)[number], key: string) =>
      tile.value.find(([k]) => k === key)?.[1];
    const modals = tiles.map((t) => field(t, "modal")?.value).filter(Boolean);
    expect(modals.length).toBeGreaterThan(0);
    // Every value an author can pick is one the component knows how to open,
    // and every value the mocks use is one an author can pick.
    const options = (
      variation.primary.tiles.config.fields as Record<string, { config: { options?: string[] } }>
    ).modal.config.options!;
    for (const option of options) expect(Object.keys(POPUPS)).toContain(option);
    for (const value of modals) expect(options).toContain(value);

    // Every logo is one of this repo's own assets, with real alt text.
    const logos = Object.entries(mocks[0].primary)
      .filter(([, v]) => (v as { __TYPE__?: string }).__TYPE__ === "ImageContent")
      .map(([k, v]) => [k, v as { url: string; alt: string }] as const);
    expect(logos.length).toBeGreaterThan(0);
    for (const [key, logo] of logos) {
      expect(logo.url, key).toMatch(/^\/29navy\/assets\//);
      expect(logo.alt.length, key).toBeGreaterThan(0);
    }
  });

  it("sets slice data attributes on the visible section", () => {
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const section = container.querySelector("[data-slice-type='navy_resident_links']");
    expect(section?.id).toBe("Residents");
    expect(section?.getAttribute("data-slice-variation")).toBe("default");
  });

  it("renders no tiles and no heading text when the slice is unfilled", () => {
    const bare = {
      ...slice,
      primary: { ...slice.primary, heading: [], tiles: [] },
    } as unknown as Slice;
    const { container } = render(NavyResidentLinks, { props: { slice: bare } });
    expect(container.querySelector("#Residents")).not.toBeNull();
    expect(
      within(container.querySelector("#Residents") as HTMLElement).queryAllByRole("link"),
    ).toHaveLength(0);
    expect(container.querySelector("h1")?.textContent ?? "").toBe("");
    // The popups still render — they are hidden by inline style, not by data.
    expect(
      Object.values(POPUPS).filter((s) => display(container.querySelector(s)!) === "none"),
    ).toHaveLength(6);
  });
});
