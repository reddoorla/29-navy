import { render, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tick } from "svelte";
import type { ComponentProps } from "svelte";
import NavyResidentLinks from "./index.svelte";

type Slice = ComponentProps<typeof NavyResidentLinks>["slice"];

const A = "/29navy/assets/";
/** The reference's own path for the shared close glyph, URL-encoded exactly as
 *  matching/spec/index.html encodes it. The file is NOT in static/29navy/assets/
 *  — see the KNOWN GAP note in index.svelte. */
const CLOSE_ICON = `${A}614de9548befc939ad34bd31_Untitled%20design%20(8).png`;

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

const SOURCE = read("index.svelte");
const STYLE = SOURCE.slice(SOURCE.indexOf("<style>"), SOURCE.indexOf("</style>"));
/** Every `prop: value;` line inside the <style> block, trimmed. */
const DECLARATIONS = STYLE.split("\n")
  .map((l) => l.trim())
  .filter((l) => /^[a-z-]+:\s.*;/.test(l));
/** Every rule body whose selector list ends `<selector> {`, in source order.
 *  A selector can legitimately appear more than once — a base rule, a media
 *  override, and (for the popup roots) the shared custom-property rule — so a
 *  naive first-match lookup silently reads the wrong one. */
const rulesFor = (selector: string) => {
  const needle = `${selector} {`;
  const bodies: string[] = [];
  for (let i = STYLE.indexOf(needle); i > -1; i = STYLE.indexOf(needle, i + 1))
    bodies.push(STYLE.slice(i, STYLE.indexOf("}", i)));
  return bodies;
};
/** The FIRST (base) rule for a selector — used to assert what is ABSENT. */
const ruleBody = (selector: string) => {
  const bodies = rulesFor(selector);
  expect(bodies.length, `no \`${selector}\` rule in the style block`).toBeGreaterThan(0);
  return bodies[0];
};
/** Every rule for a selector, joined — used to assert what is PRESENT. */
const anyRule = (selector: string) => rulesFor(selector).join("\n");
/** An element's reference classes, with Svelte's scope hash stripped. */
const refClasses = (el: Element) => [...el.classList].filter((c) => !c.startsWith("svelte-"));
/** The inline at-rest pair, read back off the CSSOM — the browser normalises
 *  `display:none;opacity:0` into `display: none; opacity: 0;`, so the attribute
 *  string is not comparable while the two properties are. */
const inlineState = (el: Element) => {
  const style = (el as HTMLElement).style;
  return `display:${style.display};opacity:${style.opacity}`;
};

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

  it("renders the gate's anchor string verbatim, once, on the one real outbound link", () => {
    // matching/harness.json cuts the `home` page's regions on "Paying rent
    // online?". Change the string and every region on the page misaligns
    // silently — the failure reads as a geometry bug three sections away.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const hits = [...container.querySelectorAll("*")].filter(
      (el) => el.textContent === "Paying rent online?" && el.children.length === 0,
    );
    expect(hits).toHaveLength(1);
    const anchor = container.querySelector("a.link-block")!;
    expect(anchor.textContent).toBe("Paying rent online?");
    expect(anchor.getAttribute("href")).toBe("https://payments.gozego.com/");
    expect(anchor.getAttribute("target")).toBe("_blank");
    // It is the ONLY tile that is a link rather than a popup trigger.
    const tileHrefs = [...container.querySelectorAll("#Residents a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(tileHrefs.filter((h) => h !== "#")).toEqual(["https://payments.gozego.com/"]);
  });

  it("reproduces the reference's section subtree", () => {
    // matching/spec/index.html: <div id="Residents" class="section-5">
    //   <h1 class="heading residents">Residents </h1>
    //   <div class="w-container"><div class="columns w-row">
    //     <div class="w-col w-col-6"> 4 x <div class="div-block-9"><a…><div class="text-block-8">
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const section = container.querySelector("div#Residents.section-5")!;
    expect(section).not.toBeNull();

    const h1 = section.querySelector(":scope > h1.heading.residents")!;
    expect(h1).not.toBeNull();
    expect(h1.textContent).toBe("Residents");

    const row = section.querySelector(":scope > div.w-container > div.columns.w-row")!;
    expect(row).not.toBeNull();
    const cols = row.querySelectorAll(":scope > div.w-col.w-col-6");
    expect(cols).toHaveLength(2);
    for (const col of cols) {
      const tiles = col.querySelectorAll(":scope > div.div-block-9");
      expect(tiles).toHaveLength(4);
      for (const tile of tiles) {
        const a = tile.querySelector(":scope > a.w-inline-block")!;
        expect(a).not.toBeNull();
        expect(a.querySelector(":scope > div.text-block-8")).not.toBeNull();
      }
    }
    expect([...row.querySelectorAll("div.text-block-8")].map((d) => d.textContent)).toEqual(LABELS);
  });

  it("keeps the h1 OUTSIDE .w-container", () => {
    // Hazard: `.heading` is margin-left 20px (ref css:2187) while the container
    // is a 940px auto-centred box (ref css:690-692). At 1440 the h1 starts at
    // x=20 and the tiles at x=260. Tidying the h1 into the container moves it
    // 240px right — a deliberate reference behaviour, not a bug.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    expect(container.querySelector(".w-container h1")).toBeNull();
    expect(container.querySelector("#Residents > h1.heading.residents")).not.toBeNull();
  });

  it("wears the reference's out-of-document-order anchor classes", () => {
    // Hazard: the right column numbers 5, 6, 8, 7. `.link-block-8` is
    // "Need a ride?" and `.link-block-7` is "Hungry?". Wiring by class NUMBER
    // instead of by the data-w-id map swaps the ride and food popups.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const byClass = Object.fromEntries(
      [...container.querySelectorAll("#Residents a")].map((a) => [
        [...a.classList].find((c) => c.startsWith("link-block")),
        a.textContent,
      ]),
    );
    expect(byClass).toEqual({
      "link-block": "Paying rent online?",
      "link-block-2": "Hooking up electricity?",
      "link-block-3": "Too busy to do laundry?",
      "link-block-4": "Looking for a gym?",
      "link-block-5": "Connecting cable tv?",
      "link-block-6": "Plugging in internet?",
      "link-block-8": "Need a ride?",
      "link-block-7": "Hungry?",
    });
  });

  it("carries the reference's data-w-id on all seven triggers and all six closes", () => {
    // SPEC.md's interaction inventory is counted off `data-w-id` in the DOM —
    // 18 triggers page-wide, of which this section owns 13.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    expect([...container.querySelectorAll("#Residents [data-w-id]")]).toHaveLength(7);
    expect(container.querySelector("a.link-block")!.hasAttribute("data-w-id")).toBe(false);
    expect([...container.querySelectorAll("[data-w-id]")]).toHaveLength(13);
    expect(
      container.querySelector('a.link-block-8[data-w-id="fe7975ee-45f1-d457-5dc3-20fe6f208fe6"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('a.link-block-7[data-w-id="a2f6f957-3c69-b2eb-3109-ff183138288a"]'),
    ).not.toBeNull();
  });

  // ---- The popups -----------------------------------------------------------

  it("renders all six popups in the DOM, hidden by the reference's inline pair", () => {
    // The inline `display:none;opacity:0` is IX2 `useFirstGroupAsInitialState`
    // output, reproduced verbatim. It is what actually hides them: an inline
    // display beats every stylesheet rule. They must be IN the DOM, not gated
    // behind an {#if} — SPEC.md's display:none census at 1440 counts twelve
    // divs, six of them these.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    for (const selector of Object.values(POPUPS)) {
      const popup = container.querySelector(selector)!;
      expect(popup, selector).not.toBeNull();
      expect(inlineState(popup)).toBe("display:none;opacity:0");
    }
    // Six popups, and every one precedes #Residents in document order.
    const roots = [...container.querySelectorAll(":scope > div")];
    expect(roots.map((r) => r.id)).toEqual(["", "", "", "", "", "", "Residents"]);
  });

  it("opens the tv/internet popup from BOTH of its two triggers", async () => {
    // Hazard: SEVEN triggers, SIX popups. `.link-block-5` and `.link-block-6`
    // both fire IX2 actionList "a-8" against `.pop-up-modal---tv-internet`
    // (matching/spec/js/…3cb35528df4a8f16.js). A 1:1 assumption either invents
    // a seventh popup or counts six triggers and passes vacuously.
    for (const cls of ["link-block-5", "link-block-6"]) {
      const { container, unmount } = render(NavyResidentLinks, { props: { slice } });
      (container.querySelector(`a.${cls}`) as HTMLElement).click();
      await tick();
      expect(inlineState(container.querySelector(POPUPS.tv_internet)!)).toContain("display:block");
      unmount();
    }
  });

  it("opens exactly the popup its trigger names, and no other", async () => {
    const wiring: Array<[string, keyof typeof POPUPS]> = [
      ["link-block-2", "electric"],
      ["link-block-3", "laundry"],
      ["link-block-4", "gym"],
      ["link-block-5", "tv_internet"],
      ["link-block-6", "tv_internet"],
      ["link-block-8", "ride"],
      ["link-block-7", "food"],
    ];
    for (const [cls, key] of wiring) {
      const { container, unmount } = render(NavyResidentLinks, { props: { slice } });
      const trigger = container.querySelector(`a.${cls}`) as HTMLElement;
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      trigger.click();
      await tick();
      for (const [other, selector] of Object.entries(POPUPS)) {
        const style = inlineState(container.querySelector(selector)!);
        expect(style, `${cls} -> ${other}`).toBe(
          other === key ? "display:block;opacity:0" : "display:none;opacity:0",
        );
      }
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      unmount();
    }
  });

  it("fades in on the frame AFTER display flips, never in the same one", async () => {
    // IX2 actionList "a" is three groups: the inline at-rest pair, then
    // display:block at duration 0, THEN opacity 0 -> 1 over 500ms. Setting both
    // in one frame means the transition never runs and the popup pops in.
    vi.useFakeTimers();
    const { container } = render(NavyResidentLinks, { props: { slice } });
    (container.querySelector("a.link-block-2") as HTMLElement).click();
    await tick();
    const popup = container.querySelector(POPUPS.electric)!;
    expect(inlineState(popup)).toBe("display:block;opacity:0");
    await vi.advanceTimersByTimeAsync(32);
    await tick();
    expect(inlineState(popup)).toBe("display:block;opacity:1");
  });

  it("closes on the X: opacity first, display 500ms later", async () => {
    // Close sequence "a-2": STYLE_OPACITY 0 duration 500, THEN GENERAL_DISPLAY
    // "none" duration 0. Flipping display immediately would cut the fade.
    vi.useFakeTimers();
    const { container } = render(NavyResidentLinks, { props: { slice } });
    (container.querySelector("a.link-block-4") as HTMLElement).click();
    await vi.advanceTimersByTimeAsync(32);
    await tick();
    const popup = container.querySelector(POPUPS.gym)!;
    expect(inlineState(popup)).toBe("display:block;opacity:1");

    (popup.querySelector(".div-block-21") as HTMLElement).click();
    await tick();
    expect(inlineState(popup)).toBe("display:block;opacity:0");
    await vi.advanceTimersByTimeAsync(500);
    await tick();
    expect(inlineState(popup)).toBe("display:none;opacity:0");
  });

  it("gives every close control a keyboard-operable role and a real label", async () => {
    // The reference's close is a bare <div data-w-id> with cursor:pointer
    // (ref css:2507) — mouse only, and unreachable by keyboard. The rebuild
    // keeps the div (a <button> would drag UA styles the reference never had)
    // and adds role/tabindex/keydown. The accessible name comes from the icon's
    // alt, which the reference ships as alt="".
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const closes = [...container.querySelectorAll('[role="button"]')];
    expect(closes).toHaveLength(6);
    for (const close of closes) {
      expect(close.getAttribute("tabindex")).toBe("0");
      const icon = close.querySelector("img")!;
      expect(icon.getAttribute("alt")).toBe("Close");
      expect(icon.getAttribute("src")).toBe(CLOSE_ICON);
    }

    vi.useFakeTimers();
    (container.querySelector("a.link-block-7") as HTMLElement).click();
    await vi.advanceTimersByTimeAsync(32);
    await tick();
    const popup = container.querySelector(POPUPS.food)!;
    (popup.querySelector(".div-block-29") as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    await tick();
    expect(inlineState(popup)).toBe("display:block;opacity:0");
  });

  it("closes on Escape", async () => {
    vi.useFakeTimers();
    const { container } = render(NavyResidentLinks, { props: { slice } });
    (container.querySelector("a.link-block-8") as HTMLElement).click();
    await vi.advanceTimersByTimeAsync(32);
    await tick();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.advanceTimersByTimeAsync(500);
    await tick();
    expect(inlineState(container.querySelector(POPUPS.ride)!)).toBe("display:none;opacity:0");
  });

  it("keeps the popups' copy verbatim, including where it differs from the tiles", async () => {
    // Two titles differ from their tile labels and two are lowercase against
    // title-case tiles. All four are easy to "correct" by accident.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    expect(container.querySelector(".text-block-16")!.textContent).toBe(
      "Too busy to do your laundry?",
    );
    expect(container.querySelector(".text-block-8")!.textContent).not.toBe(
      "Too busy to do your laundry?",
    );
    expect(container.querySelector(".text-block-18")!.textContent).toBe("connecting cable tv?");
    expect(container.querySelector(".text-block-20")!.textContent).toBe("need a ride?");
    expect(container.querySelector(".text-block-14")!.textContent).toBe("Hooking up electricity?");
    expect(container.querySelector(".text-block-17")!.textContent).toBe("Looking for a gym?");
    expect(container.querySelector(".text-block-21")!.textContent).toBe("Hungry?");
  });

  it("joins the electric popup's paragraphs with <br><br> in an UNCLASSED div, never <p>", () => {
    // `p { margin-bottom: 10px }` (ref css:420-423) would add 10px inside a
    // fixed 300px box (ref css:2487). And the whitespace matters: a text node
    // AFTER a <br> renders as a visible leading space on the next line.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    // The reference's body div carries NO class at all — the only element in
    // this subtree that does not — so it is found by elimination, not by class.
    const body = [...container.querySelectorAll(".div-block-15 > div")].find(
      (d) => refClasses(d).length === 0,
    )!;
    expect(body, "the electric popup's body div must carry no reference class").not.toBeUndefined();
    expect(body.querySelectorAll("p")).toHaveLength(0);
    expect(body.querySelectorAll("br")).toHaveLength(2);
    // The text nodes are the assertion that matters: exactly two, each one a
    // whole paragraph with no leading or trailing space. A newline in the
    // template either side of a `<br/>` would show up here as a third node —
    // and the one after a break paints as a visible indent on the next line.
    const textNodes = [...body.childNodes].filter((n) => n.nodeType === 3);
    expect(textNodes.filter((n) => /^\s+$/.test(n.textContent ?? ""))).toEqual([]);
    expect(textNodes.map((n) => n.textContent).filter(Boolean)).toEqual([
      "Call LA DWP at 800.342.5397.",
      "If you have any large items…",
    ]);
    expect(body.textContent).toBe("Call LA DWP at 800.342.5397.If you have any large items…");
    // The tv popup's prose is one paragraph in a CLASSED div (ref css:2653).
    const tv = container.querySelector(".text-block-19")!;
    expect(tv.querySelectorAll("br")).toHaveLength(0);
    expect(tv.textContent).toBe("Contact Building Management at 310-393-9653.");
  });

  it("keeps Lyft first in the DOM and lets order:-1 paint Uber left", () => {
    // ref css:2729-2731 puts order:-1 on `.link-block-9`, the UBER anchor,
    // which is SECOND in the reference's DOM. Reordering the markup to "fix"
    // the visual order would double the swap. The same declaration's order on
    // `.image-11` is inert — it is an only child — and is a red herring.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const anchors = [...container.querySelectorAll(".div-block-25 > a")];
    expect(anchors.map((a) => a.getAttribute("href"))).toEqual([
      "https://www.lyft.com/",
      "https://www.uber.com/",
    ]);
    expect(anchors[1].classList.contains("link-block-9")).toBe(true);
    // The Lyft <img> is the reference's ONE unclassed image in this subtree.
    expect(refClasses(anchors[0].querySelector("img")!)).toEqual([]);
    expect(anchors[1].querySelector("img")!.classList.contains("image-11")).toBe(true);
    expect(anyRule(".link-block-9")).toMatch(/order:\s*-1;/);
  });

  it("hard-codes every image's width attribute, because the stylesheet has none", () => {
    // `.image-19`, `.image-20` and `.image-21` have NO base rule anywhere in the
    // reference — their only appearance is inside @media (max-width: 479px)
    // (ref css:3522, :3527). The HTML width attribute IS the geometry, so it
    // lives next to the class and is NOT a field: a CMS image swap must not be
    // able to resize a 600x300 popup.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const widths = Object.fromEntries(
      [...container.querySelectorAll("img")]
        .filter((img) => refClasses(img).length > 0)
        .map((img) => [refClasses(img)[0], img.getAttribute("width")]),
    );
    expect(widths).toMatchObject({
      "image-4": "26",
      "image-5": "35",
      "image-7": "41",
      "image-9": "40",
      "image-10": "42",
      "image-13": "36",
      "image-19": "335",
      "image-20": "80",
      "image-6": "254",
      "image-8": "178",
      "image-11": "286",
      "image-21": "87",
      "image-12": "159",
    });
    const lyft = [...container.querySelectorAll(".div-block-25 img")].find(
      (img) => refClasses(img).length === 0,
    )!;
    expect(lyft.getAttribute("width")).toBe("78");
    for (const selector of [".image-19", ".image-20", ".image-21"]) {
      const base = STYLE.slice(0, STYLE.indexOf("@media screen and (max-width: 479px)"));
      expect(base, `${selector} must have NO base rule`).not.toContain(`${selector} {`);
    }
  });

  it('authors real alt text on every image, against the reference\'s alt=""', () => {
    // The reference ships alt="" on all 23 of the page's images. The repo
    // pre-declared the rebuild's real alt as an accepted text-diff artifact.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    const images = [...container.querySelectorAll("img")];
    expect(images).toHaveLength(14);
    for (const img of images) expect(img.getAttribute("alt")!.length).toBeGreaterThan(0);
    // Logo alt travels with the Prismic asset; the close glyph's is code-owned.
    expect(container.querySelector(".image-19")!.getAttribute("alt")).toBe(
      "Rinse, formerly Washio",
    );
  });

  // ---- Source-level guards. jsdom applies no stylesheet, so the hazards that
  // live in the CSS are asserted against the file the browser will get.

  it("names a source on every declaration in the style block", () => {
    expect(DECLARATIONS.length).toBeGreaterThan(150);
    const uncited = DECLARATIONS.filter((l) => !/\/\* (ref css:\d+|ref js:|repo )/.test(l));
    expect(uncited).toEqual([]);
    // Exactly two declarations are sourced from somewhere other than the
    // reference stylesheet, and both are the fade: the tween's numbers come from
    // the IX2 action list in the reference's JS, and the reduced-motion guard is
    // a repo a11y rule the reference has no equivalent of.
    const nonCss = DECLARATIONS.filter((l) => !/\/\* ref css:\d+/.test(l));
    expect(nonCss).toHaveLength(2);
    expect(nonCss[0]).toContain("transition: opacity 500ms");
    expect(nonCss[1]).toContain("transition: none");
  });

  it("gives the h1 a 44px line box on 32px type, left-offset and never centred", () => {
    // `.heading` (ref css:2184-2190) sets font-size and NEVER line-height, so
    // the h1 keeps 44px from ref css:387 — a 44px box on 32px glyphs. Any
    // `line-height: 1` or Tailwind heading preset loses 12px of section height
    // and the gate reports it as a whole-section offset, not a heading bug.
    const heading = ruleBody(".heading.residents");
    expect(heading).toMatch(/font-size:\s*32px;/);
    expect(heading).toMatch(/line-height:\s*44px;/);
    expect(heading).toMatch(/font-weight:\s*400;/);
    expect(heading).toMatch(/color:\s*#aa4133;/);
    expect(heading).toMatch(/margin-bottom:\s*40px;/);
    expect(heading).toMatch(/margin-left:\s*20px;/);
    expect(heading).toMatch(/margin-right:\s*0;/);
    expect(heading).not.toMatch(/line-height:\s*(1|normal|none)\b/);
    expect(heading).not.toMatch(/text-align/);
  });

  it("floats the columns rather than rebuilding the row as flex or grid", () => {
    // `.w-col` float:left (ref css:726) establishes a BFC, so the LAST
    // `.div-block-9`'s 20px bottom margin (ref css:2357) is CONTAINED in the
    // column height. Predicted 1440 column height 4 x (40 + 44.8 + 40 + 20) =
    // 579.2px, section 40 + 44 + 40 + 579.2 + 40 = 743.2px. Flex or grid drops
    // that trailing 20px and the section comes out 20px short.
    const col = ruleBody(".w-col");
    expect(col).toMatch(/float:\s*left;/);
    expect(col).toMatch(/padding-left:\s*10px;/);
    expect(col).toMatch(/padding-right:\s*10px;/);
    expect(col).not.toMatch(/display:\s*(flex|grid)/);
    expect(ruleBody(".columns")).toMatch(/padding-left:\s*0;/);
    expect(ruleBody(".w-container .w-row")).toMatch(/margin-left:\s*-10px;/);
    // The clearfix pseudo-elements are load-bearing: the :before stops the h1's
    // 40px bottom margin collapsing in, the :after clears the floats.
    expect(STYLE).toContain(".w-container:before,");
    expect(STYLE).toMatch(/\.w-container:after \{\s*clear: both;/);
    expect(STYLE).toMatch(/\.w-row:after \{\s*clear: both;/);
  });

  it("paints the tiles #030303 with no side padding, and 1.4em of leading", () => {
    const tile = ruleBody(".div-block-9");
    expect(tile).toMatch(/background-color:\s*#030303;/);
    expect(tile).toMatch(/padding-top:\s*40px;/);
    expect(tile).toMatch(/padding-bottom:\s*40px;/);
    expect(tile).toMatch(/margin-bottom:\s*20px;/);
    expect(tile).not.toMatch(/padding-(left|right)/);
    expect(tile).not.toMatch(/background-color:\s*#000;/);
    expect(ruleBody(".div-block-9:hover")).toMatch(/background-color:\s*#aa4133;/);
    // 1.4EM here (= 44.8px) against 1.4REM (= 22.4px) on all six popup titles.
    // Same numeral, different unit, 22px apart. Unifying them breaks the popups.
    expect(ruleBody(".text-block-8")).toMatch(/line-height:\s*1\.4em;/);
    expect(ruleBody(".text-block-8")).toMatch(/text-align:\s*left;/);
    for (const title of [
      ".text-block-14",
      ".text-block-16",
      ".text-block-17",
      ".text-block-18",
      ".text-block-20",
      ".text-block-21",
    ])
      expect(ruleBody(title), title).toMatch(/line-height:\s*1\.4rem;/);
  });

  it("keeps the electric popup's scrim alpha, unlike the other five", () => {
    // ref css:2468-2474 is the odd one out: 63%-alpha black and NO width or
    // height, relying on position:fixed + inset:0%. The other five are opaque
    // var(--black) at 100vw/100vh. Normalising them turns this scrim solid.
    const electric = anyRule(".popup-modal---electric");
    expect(electric).toMatch(/background-color:\s*#000000a1;/);
    expect(electric).not.toMatch(/width:/);
    expect(electric).not.toMatch(/height:/);
    for (const selector of [
      ".popup-modal---laundry",
      ".popup-modal---gym",
      ".pop-up-modal---tv-internet",
      ".ride---modal",
      ".food-modal---popup",
    ]) {
      const body = anyRule(selector);
      expect(body, selector).toMatch(/background-color:\s*var\(--black\);/);
      expect(body, selector).toMatch(/width:\s*100vw;/);
      expect(body, selector).toMatch(/height:\s*100vh;/);
    }
    // The popup boxes differ too, and the differences are per-class rules.
    expect(ruleBody(".div-block-15")).toMatch(/padding-left:\s*20px;/);
    expect(ruleBody(".div-block-17")).not.toMatch(/padding-left/);
    expect(ruleBody(".div-block-24")).toMatch(/align-items:\s*stretch;/);
    expect(ruleBody(".div-block-27")).not.toMatch(/align-items/);
  });

  it("ships the placeholder background as a file, never redrawn in CSS", () => {
    // ref css:2663 — the only close hit area carrying a background image.
    const body = ruleBody(".div-block-23");
    expect(body).toContain('background-image: url("/29navy/assets/background-image.svg")');
    expect(STYLE).not.toMatch(/data:image/);
    expect(STYLE).not.toMatch(/linear-gradient|conic-gradient|clip-path/);
  });

  it("reproduces the reference's three breakpoints and invents none", () => {
    // ref css:791 / :3116 (991), :859 / :3218 (767), :928 / :3396 (479). The
    // fourth query is the reduced-motion guard, which is the repo's, not the
    // reference's — and it is a feature query, not a width breakpoint.
    // Comments in this block name the reference's own @media lines, so the
    // comments come out before the real queries are counted.
    const bare = STYLE.replace(/\/\*[\s\S]*?\*\//g, "");
    const queries = (bare.match(/@media[^{]*/g) ?? []).map((q) => q.trim());
    expect(queries).toEqual([
      "@media (prefers-reduced-motion: reduce)",
      "@media screen and (max-width: 991px)",
      "@media screen and (max-width: 767px)",
      "@media screen and (max-width: 479px)",
    ]);
    const at991 = STYLE.slice(
      STYLE.indexOf("@media screen and (max-width: 991px)"),
      STYLE.indexOf("@media screen and (max-width: 767px)"),
    );
    // ref css:3141-3143 centres the label at <=991 and there is NO 767 or 479
    // variant, so centred persists all the way down to 390.
    expect(at991).toMatch(/\.text-block-8 \{\s*text-align: center;/);
    expect(at991).toMatch(/max-width:\s*728px;/);
    const at767 = STYLE.slice(
      STYLE.indexOf("@media screen and (max-width: 767px)"),
      STYLE.indexOf("@media screen and (max-width: 479px)"),
    );
    expect(at767).not.toContain("text-block-8");
    const at479 = STYLE.slice(STYLE.indexOf("@media screen and (max-width: 479px)"));
    expect(at479).not.toContain("text-block-8");
    expect(at479).toMatch(/max-width:\s*none;/);
    // The <=479 popup heights: 600 / 400 / 400 / 500, and nothing for the ride
    // and food boxes (ref css:3451, :3460, :3469, :3486).
    expect(at479).toMatch(/\.div-block-15 \{\s*height: 600px;/);
    expect(at479).toMatch(/\.div-block-17 \{\s*height: 400px;/);
    expect(at479).toMatch(/\.div-block-19 \{\s*height: 400px;/);
    expect(at479).toMatch(/\.div-block-22 \{\s*height: 500px;/);
    expect(at479).not.toMatch(/\.div-block-24 \{[^}]*height/);
    expect(at479).not.toMatch(/\.div-block-27 \{[^}]*height/);
  });

  it("transcribes the <=767 popup display:none but never gates behaviour on it", async () => {
    // Hazard: those six rules (ref css:3297, :3306, :3314, :3322, :3330, :3338)
    // are DEAD at runtime. IX2 writes an INLINE display, which beats a
    // stylesheet media rule, and every trigger event carries mediaQueries
    // ["main","medium","small","tiny"] — the popups DO open at 767 and 390 on
    // the reference. They are here for cascade fidelity only.
    const at767 = STYLE.slice(
      STYLE.indexOf("@media screen and (max-width: 767px)"),
      STYLE.indexOf("@media screen and (max-width: 479px)"),
    );
    expect(at767).toMatch(/display: none;/);
    // Nothing in the component reads a width to decide whether to open.
    const script = SOURCE.slice(0, SOURCE.indexOf("</script>"));
    expect(script).not.toMatch(/innerWidth|max-width|matchMedia\(\s*["'`]\(max/);
    // And an inline display:block is what opens it, at any viewport.
    const { container } = render(NavyResidentLinks, { props: { slice } });
    (container.querySelector("a.link-block-3") as HTMLElement).click();
    await tick();
    expect(inlineState(container.querySelector(POPUPS.laundry)!)).toContain("display:block");
  });

  it("restates the body font stack rather than inheriting someone else's", () => {
    // ref css:222-230. `Arial, sans-serif` is the ONLY font-family in the
    // reference's cascade for this subtree — there is no webfont link in its
    // <head>. This rebuild's <body> is not the reference's, so the inherited
    // values are restated on the roots. Label wrap points sit within a few
    // pixels of the column width at 991 and 390; a different stack flips a line
    // and moves a tile by 44.8px.
    expect(STYLE).toMatch(/font-family:\s*Arial, sans-serif;/);
    expect(STYLE).toMatch(/font-size:\s*14px;/);
    expect(STYLE).toMatch(/line-height:\s*20px;/);
    expect(STYLE).not.toMatch(/letter-spacing/);
    expect(STYLE).not.toMatch(/var\(--font/);
  });

  // ---- Model and mocks ------------------------------------------------------

  it("keeps mocks.json aligned with model.json and with the reference's copy", () => {
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

    // Eight tiles, the reference's labels, in the reference's order.
    const tiles = mocks[0].primary.tiles.value as Array<{
      value: Array<[string, { value: string }]>;
    }>;
    const field = (tile: (typeof tiles)[number], key: string) =>
      tile.value.find(([k]) => k === key)?.[1];
    expect(tiles).toHaveLength(8);
    expect(tiles.map((t) => field(t, "label")!.value)).toEqual(LABELS);

    // Exactly one tile is a link; the other seven name a popup. `tv_internet`
    // is named twice — that is the reference, not a duplicate.
    const linked = tiles.filter((t) => field(t, "link"));
    expect(linked).toHaveLength(1);
    expect(
      (field(linked[0], "link") as unknown as { value: { url: string; target: string } }).value,
    ).toEqual({ __TYPE__: "ExternalLink", url: "https://payments.gozego.com/", target: "_blank" });
    const modals = tiles.map((t) => field(t, "modal")?.value).filter(Boolean);
    expect(modals).toEqual([
      "electric",
      "laundry",
      "gym",
      "tv_internet",
      "tv_internet",
      "ride",
      "food",
    ]);
    // Every value an author can pick is one the component knows how to open.
    const options = variation.primary.tiles.config.fields as Record<
      string,
      { config: { options?: string[] } }
    >;
    expect(options.modal.config.options).toEqual(Object.keys(POPUPS));
    for (const value of modals) expect(options.modal.config.options).toContain(value);

    // The popup copy that differs from the tiles, verbatim.
    expect(mocks[0].primary.heading.value[0].type).toBe("heading1");
    expect(mocks[0].primary.laundry_title.value).toBe("Too busy to do your laundry?");
    expect(mocks[0].primary.tv_title.value).toBe("connecting cable tv?");
    expect(mocks[0].primary.ride_title.value).toBe("need a ride?");
    // The DWP copy says in so many words that it changes — this is why the two
    // prose bodies are fields and not hard-coded strings.
    const dwp = mocks[0].primary.electric_body.value as Array<{ content: { text: string } }>;
    expect(dwp).toHaveLength(2);
    expect(dwp[0].content.text).toContain("$1.33 (subject to change");
    expect(dwp[1].content.text).toContain("“800-773-2489”");
    expect(mocks[0].primary.tv_body.value[0].content.text).toContain("310-393-9653");

    // Every logo points at a file this repo actually ships.
    const logos = Object.entries(mocks[0].primary)
      .filter(([, v]) => (v as { __TYPE__?: string }).__TYPE__ === "ImageContent")
      .map(([k, v]) => [k, v as { url: string; alt: string }] as const);
    expect(logos).toHaveLength(8);
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

  it("renders no tiles and no empty heading when the slice is unfilled", () => {
    const bare = {
      ...slice,
      primary: { ...slice.primary, heading: [], tiles: [] },
    } as unknown as Slice;
    const { container } = render(NavyResidentLinks, { props: { slice: bare } });
    expect(container.querySelector("#Residents")).not.toBeNull();
    expect(container.querySelectorAll(".div-block-9")).toHaveLength(0);
    expect(container.querySelector("h1")!.textContent).toBe("");
    // The popups still render — they are hidden by inline style, not by data.
    expect(
      Object.values(POPUPS).filter(
        (s) => inlineState(container.querySelector(s)!) === "display:none;opacity:0",
      ),
    ).toHaveLength(6);
  });

  describe("the opening and closing tween", () => {
    // The reference tweens all six popups over 500ms with THREE different
    // easings — one for gym opening, one for the other five opening, and a
    // third (empty, i.e. linear) for every close. An earlier version of this
    // component read one IX2 action list and applied its easing everywhere.
    const CSS_NO_COMMENTS = STYLE.replace(/\/\*[\s\S]*?\*\//g, "");

    it("closes on a straight line, not the opening curve", () => {
      // Measured against the live reference, gym closing, every 100ms:
      // 0.7834 / 0.5834 / 0.3832 / 0.1686 / 0 — ~0.2 per 100ms, so the IX2
      // easing of "" is linear rather than any default curve.
      // anyRule, not ruleBody: the token block and the transition group BOTH
      // end in `.food-modal---popup {`, so a first-match lookup reads the
      // custom properties and never sees a transition at all.
      expect(anyRule(".food-modal---popup")).toMatch(/transition:\s*opacity 500ms linear;/);
    });

    it("gives gym a different opening easing from the other five", () => {
      // Not a slip to normalise: gym's open action carries easing "outQuad",
      // the other five carry "inOutQuad". Reference opacity at 200ms is
      // 0.63976 — easeOutQuad(0.4) = 0.4 * (2 - 0.4) = 0.64 exactly.
      const gym = ruleBody(".popup-modal---gym[data-open]");
      const others = ruleBody(".food-modal---popup[data-open]");
      expect(gym).toMatch(/cubic-bezier\(\s*0\.25,\s*0\.46,\s*0\.45,\s*0\.94\s*\)/);
      expect(others).toMatch(/cubic-bezier\(\s*0\.455,\s*0\.03,\s*0\.515,\s*0\.955\s*\)/);
      expect(gym).not.toBe(others);
    });

    it("does not give gym the shared opening easing as well", () => {
      // A grouped selector that happened to include gym would let the shared
      // curve win by source order and the fix would be invisible.
      const shared = CSS_NO_COMMENTS.match(/\n {2}([^{}]*\[data-open\][^{}]*)\{/g) ?? [];
      const sharedOpen = shared.find((g) => g.includes("electric"));
      expect(sharedOpen, "no shared [data-open] rule found").toBeTruthy();
      expect(sharedOpen).not.toContain("popup-modal---gym[data-open]");
    });

    it("marks the opening popup, and only that one", async () => {
      // data-open is what selects the OPEN easing, so if it never lands the
      // close curve runs in both directions and the fix is inert.
      const { container } = render(NavyResidentLinks, { props: { slice } });
      expect(container.querySelectorAll("[data-open]")).toHaveLength(0);
      (container.querySelector("a.link-block-4") as HTMLElement).click();
      await tick();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await tick();
      const open = [...container.querySelectorAll("[data-open]")];
      expect(open).toHaveLength(1);
      expect(refClasses(open[0])).toContain("popup-modal---gym");
    });
  });

  describe("images behind the popups", () => {
    it("warms every hidden popup image after load", () => {
      // Thirteen images live inside `display: none` popups, so `loading="lazy"`
      // defers each fetch until its popup opens and the logo lands visibly
      // late. Measured on production before this: 2 of 12 hidden images were
      // fetched before any interaction; after, 12 of 12.
      expect(SOURCE).toContain("preloadHidden");
      const list = SOURCE.slice(SOURCE.indexOf("const hiddenImages"), SOURCE.indexOf("$effect("));
      for (const field of [
        "laundry_logo",
        "gym_logo_1",
        "gym_logo_2",
        "tv_logo",
        "ride_logo_1",
        "ride_logo_2",
        "food_logo_1",
        "food_logo_2",
      ])
        expect(list, `${field} is not warmed`).toContain(field);
      expect(list).toContain("CLOSE_ICON");
    });
  });
});
