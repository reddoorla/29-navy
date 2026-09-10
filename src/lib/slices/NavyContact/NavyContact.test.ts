import { render } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps } from "svelte";
import NavyContact from "./index.svelte";

type Slice = ComponentProps<typeof NavyContact>["slice"];

const PHOTO = "/29navy/assets/68b712e52ecd74e0d37afd1d_matthew-lejune-dv1r5Pftdzk-unsplash.jpg";
const CDN = "https://cdn.prod.website-files.com/61411d5add9b561004cfbf8b/";
/** U+200D ZERO WIDTH JOINER, written as an escape so nothing can trim it. */
const ZWJ = "\u200d";

// NOT `new URL(..., import.meta.url)`: under this repo's vitest config (the
// SvelteKit plugin plus `resolve.conditions: ["browser"]`) a module's
// import.meta.url is root-relative — "/src/lib/..." — so fileURLToPath hands
// back a path that does not exist and readFileSync throws ENOENT. vitest runs
// with the project root as cwd.
const ROOT = process.cwd();
const HERE = resolve(ROOT, "src/lib/slices/NavyContact");
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
/** The body of one rule, by its exact selector list — used to assert what is
    ABSENT. Anchored to the indent so a grouped selector (the box-sizing rule)
    can never stand in for the rule being asked about. */
const ruleBody = (selector: string, indent = "  ") => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = CSS.match(new RegExp(`\\n${indent}${escaped} \\{([^}]*)\\}`));
  expect(match, `no \`${selector}\` rule at indent ${indent.length}`).not.toBeNull();
  return match![1];
};

// ---- The reference itself. Rather than retyping the captured markup into the
// expectations (which would only prove the test agrees with the test), the
// contact and navbar subtrees are sliced out of the reference and the expected
// strings are DERIVED from them. The markup is minified onto one line, so it is
// addressed by string index, never by line number.
//
// The source is reference.html, a GENERATED and TRACKED pair of excerpts — not
// matching/spec/index.html, which is the live capture and is gitignored
// (`matching/*`, workspace not record). Reading the capture here passed locally
// and failed CI with ENOENT on a runner that has no capture; a test that only
// runs where someone happens to have captured the reference is not a test.
// `agrees with the live capture` below re-derives both excerpts wherever the
// capture IS present, so the fixture cannot silently drift from it.
const excerpt = (name: string) => {
  const src = read("reference.html");
  const start = src.indexOf(`<!--BEGIN ${name}-->`);
  const end = src.indexOf(`<!--END ${name}-->`);
  expect(start, `no ${name} excerpt in reference.html`).toBeGreaterThan(-1);
  return src.slice(start + `<!--BEGIN ${name}-->`.length, end).trim();
};
/** Derivation rules, content-addressed so a recapture that shifts every offset
    still resolves. Kept identical to the generator's. */
const SLICE_RULES = {
  navbar: (ref: string) => {
    const i = ref.indexOf('<div data-animation="default"');
    return ref.slice(i, ref.indexOf("</div></div></div>", i) + "</div></div></div>".length);
  },
  contact: (ref: string) => {
    const i = ref.indexOf('<div id="contact" class="section-7">');
    return ref.slice(i, ref.indexOf("<script", i));
  },
};
const REF_CONTACT = excerpt("contact");
const REF_NAVBAR = excerpt("navbar");
/** The reference's own 8-candidate srcset, with the Webflow CDN prefix
    rewritten to the local capture path. */
const REF_SRCSET = REF_CONTACT.match(/srcset="([^"]+)"/)![1]
  .split(CDN)
  .join("/29navy/assets/");
/** textContent of each reference `a.contact-link`, in document order. */
const REF_LINK_TEXT = [...REF_CONTACT.matchAll(/<a [^>]*class="contact-link">(.*?)<\/a>/g)].map(
  (m) => m[1].replace(/<br\/?>/g, ""),
);

const slice = {
  slice_type: "navy_contact",
  variation: "default",
  primary: {
    heading: [{ type: "heading1", text: "Contact", spans: [] }],
    address_line_1: "29 Navy Street ",
    address_line_2: "Venice, California 90291 ",
    links: [
      {
        label: "Call us: ",
        value: "(310) 393-9657",
        target: { link_type: "Web", url: "tel:+13103939657" },
      },
      {
        label: "Email us:",
        value: "29navy@worthe.com",
        target: { link_type: "Web", url: "mailto:29navy@worthe.com" },
      },
      {
        label: "Find us on:",
        value: "Zillow",
        target: {
          link_type: "Web",
          url: "https://www.zillow.com/apartments/venice-ca/29-navy-creative-lofts/ChqQtg/",
        },
      },
    ],
    photo: {
      url: PHOTO,
      alt: "Sunlight falling across the brick facade of the 29 Navy building.",
      dimensions: { width: 4240, height: 2832 },
    },
  },
} as unknown as Slice;

const mount = (s: Slice = slice) => render(NavyContact, { props: { slice: s } }).container;

describe("NavyContact slice", () => {
  it("reproduces the reference's element structure", () => {
    const container = mount();
    const section = container.querySelector("div#contact.section-7");
    expect(section).not.toBeNull();
    // Exactly two children: the black panel, then the photo's bare wrapper.
    const children = [...section!.children];
    expect(children.map((c) => c.tagName)).toEqual(["DIV", "DIV"]);
    expect(children[0].className).toContain("div-block-12");

    const panel = children[0];
    expect(panel.querySelector(":scope > h1.heading-3")!.textContent).toBe("Contact");
    // Five .text-block-11 blocks: two address lines, then three link blocks.
    const blocks = [...panel.querySelectorAll(":scope > div.text-block-11")];
    expect(blocks.length).toBe(5);
    expect(blocks[1].classList.contains("venice")).toBe(true);
    expect(blocks.filter((b) => b.classList.contains("venice")).length).toBe(1);
    for (const b of blocks.slice(2)) {
      const a = b.querySelector(":scope > a.contact-link");
      expect(a).not.toBeNull();
      // A plain inline <a>, NOT a Webflow .w-inline-block. Svelte's own
      // scope hash is the only other class it may wear.
      expect([...a!.classList].filter((c) => !c.startsWith("svelte-"))).toEqual(["contact-link"]);
      // The anchor is the block's ONLY content. A formatter that breaks the
      // template across lines would leave whitespace text nodes here, and the
      // anchor's own inner whitespace is what the U+200D test then measures.
      expect([...b.childNodes].filter((n) => n.nodeType === 3)).toEqual([]);
    }
  });

  it('renders the gate anchor "29 Navy Street" exactly', () => {
    // The harness cuts regions on this string; a change to it silently
    // misaligns every region on the page.
    const container = mount();
    expect(container.textContent).toContain("29 Navy Street");
    // And verbatim from the reference, trailing U+0020 included.
    expect(REF_CONTACT).toContain(">29 Navy Street </div>");
    expect(container.querySelectorAll("div.text-block-11")[0].textContent).toBe("29 Navy Street ");
    expect(container.querySelectorAll("div.text-block-11")[1].textContent).toBe(
      "Venice, California 90291 ",
    );
  });

  it("keeps the trailing U+200D in every link's text — 28px of line box each", () => {
    // Hazard 4. Each .text-block-11 wrapping an anchor measures 84px, not 56px,
    // because the joiner after the second <br/> generates a THIRD line box.
    // Stripping it alone takes 84px off the black panel (462 -> 378 at <=991).
    // Expectations are derived from the reference, not retyped.
    const container = mount();
    const anchors = [...container.querySelectorAll("a.contact-link")];
    expect(REF_LINK_TEXT).toEqual([
      `Call us: (310) 393-9657${ZWJ}`,
      `Email us:29navy@worthe.com${ZWJ}`,
      `Find us on:Zillow${ZWJ}`,
    ]);
    expect(anchors.map((a) => a.textContent)).toEqual(REF_LINK_TEXT);
    // Two <br> per anchor, and the joiner sits after the second one.
    for (const a of anchors) {
      expect(a.querySelectorAll("br").length).toBe(2);
      expect(a.textContent!.endsWith(ZWJ)).toBe(true);
      expect(a.lastChild!.nodeType).toBe(3);
      expect(a.lastChild!.textContent).toBe(ZWJ);
    }
    // The character never appears literally in the source — an invisible
    // character is exactly what a formatter or a CMS round-trip deletes.
    expect(SOURCE.includes(ZWJ)).toBe(false);
    expect(SOURCE).toContain('const ZWJ = "\\u200d"');
  });

  it("ships the reference's exact 8-candidate w-descriptor srcset", () => {
    // Hazards 1 and 2. `width: 35%` (ref css:2404) is a flex BASE; the used
    // width comes from shrinking 504px against the img's intrinsic width, which
    // sizes="100vw" pins to the viewport. No srcset and the panel collapses to
    // 228.17px (a 145px error) and the section grows to 809.41px. The eight
    // renditions also differ in aspect ratio, so the candidate the browser picks
    // drives the section's HEIGHT.
    const img = mount().querySelector("img")!;
    expect(img.getAttribute("srcset")).toBe(REF_SRCSET);
    expect(REF_SRCSET.split(", ").length).toBe(8);
    expect(REF_SRCSET).not.toContain(CDN);
    expect(img.getAttribute("sizes")).toBe("100vw");
    expect(img.getAttribute("src")).toBe(PHOTO);
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("never emits width/height attributes on the photo", () => {
    // Hazard 3: with no `height: auto`, that attribute pair makes max-width:100%
    // honour the intrinsic HEIGHT — 2832px tall at 1440, 3254px at 390. Modern
    // lint/perf advice pushes exactly this pair; here it is catastrophic.
    const img = mount().querySelector("img")!;
    expect(img.hasAttribute("width")).toBe(false);
    expect(img.hasAttribute("height")).toBe(false);
    expect(REF_CONTACT).not.toMatch(/<img [^>]*\bwidth=/);
  });

  it("leaves the photo's wrapper div classless, as the reference does", () => {
    // It has no rule of its own in the reference; its width comes entirely from
    // flex-shrink against the img's intrinsic size.
    const wrapper = mount().querySelector("div#contact")!.children[1];
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.getAttribute("class")).toBeNull();
    expect(REF_CONTACT).toContain("</div><div><img ");
  });

  it("corrects the reference's two broken hrefs and nothing else", () => {
    // Declared deviation. The reference ships href="https://(310) 393-9653" —
    // an invalid URL carrying a DIFFERENT number from the "(310) 393-9657" it
    // displays — and a mailto with U+200D inside the address.
    expect(REF_CONTACT).toContain('href="https://(310) 393-9653"');
    expect(REF_CONTACT).toContain(`href="mailto:29navy@worthe.com${ZWJ}"`);

    const anchors = [...mount().querySelectorAll("a.contact-link")];
    const hrefs = anchors.map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "tel:+13103939657",
      "mailto:29navy@worthe.com",
      "https://www.zillow.com/apartments/venice-ca/29-navy-creative-lofts/ChqQtg/",
    ]);
    // The tel: href agrees with the DISPLAYED number.
    expect(hrefs[0]!.replace(/\D/g, "")).toContain(
      anchors[0].textContent!.replace(/\D/g, "").slice(-10),
    );
    // The asymmetry that keeps the geometry: the joiner is dropped from the
    // HREF only, never from the visible text.
    for (const href of hrefs) expect(href!.includes(ZWJ)).toBe(false);
    for (const a of anchors) expect(a.textContent!.includes(ZWJ)).toBe(true);
  });

  it("hard-codes id=\"contact\" — the navbar's <a href='#contact'> target", () => {
    const container = mount();
    expect(container.querySelector("#contact")).not.toBeNull();
    expect(SOURCE).toContain('id="contact"');
    expect(REF_NAVBAR).toContain('href="#contact"');
    // Not authorable: no field in the model can move it.
    const model = JSON.parse(read("model.json"));
    expect(Object.keys(model.variations[0].primary)).not.toContain("id");
  });

  it("sets slice data attributes", () => {
    const section = mount().querySelector("[data-slice-type='navy_contact']");
    expect(section?.getAttribute("data-slice-variation")).toBe("default");
  });

  it('authors real alt text instead of the reference\'s alt=""', () => {
    // The repo pre-declared this as an accepted text-diff artifact: the
    // reference ships alt="" on all 23 images.
    expect(REF_CONTACT).toContain('alt=""');
    const img = mount().querySelector("img")!;
    expect(img.getAttribute("alt")!.length).toBeGreaterThan(20);
    const bare = {
      ...slice,
      primary: { ...slice.primary, photo: { ...slice.primary.photo, alt: null } },
    } as unknown as Slice;
    // A null alt must still render alt="", never drop the attribute.
    expect(mount(bare).querySelector("img")!.getAttribute("alt")).toBe("");
  });

  it("renders no <img> and no empty <h1> when those fields are unfilled", () => {
    const bare = {
      ...slice,
      primary: { ...slice.primary, heading: [], photo: {}, links: [] },
    } as unknown as Slice;
    const container = mount(bare);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelectorAll("a").length).toBe(0);
    // The two address blocks and the photo wrapper still stand.
    expect(container.querySelectorAll("div.text-block-11").length).toBe(2);
  });

  it("renders one block per authored link, never a hard-coded three", () => {
    const four = {
      ...slice,
      primary: {
        ...slice.primary,
        links: [
          ...(slice.primary as { links: unknown[] }).links,
          {
            label: "Visit:",
            value: "Instagram",
            target: { link_type: "Web", url: "https://x.test" },
          },
        ],
      },
    } as unknown as Slice;
    expect(mount(four).querySelectorAll("a.contact-link").length).toBe(4);
    expect(mount(four).querySelectorAll("div.text-block-11").length).toBe(6);
  });

  // ---- Source-level guards. jsdom applies no stylesheet, so the hazards that
  // live in the CSS are asserted against the file the browser will get.

  it("cites a reference line on every declaration in the style block", () => {
    // 5 selectors share box-sizing + 6 on .section-7 + 3 on img + 4 on the
    // panel + 7 on the h1 + 5 on .text-block-11 + 1 venice + 4 link + 2 hover,
    // then the three media blocks.
    expect(DECLARATIONS.length).toBeGreaterThanOrEqual(37);
    const uncited = DECLARATIONS.filter((l) => !/\/\* ref css:\d+/.test(l));
    expect(uncited).toEqual([]);
  });

  it("keeps margin-right: 20px at every breakpoint, so centred text sits 10px left", () => {
    // Hazard 7: ref css:2442 is NEVER reset, while margin-left goes to 0 at
    // ref css:3161, 3288 and 3446. This looks like a bug and is the reference.
    expect(ruleBody(".text-block-11")).toMatch(/margin-right:\s*20px;/);
    const resets = [...CSS.matchAll(/margin-right:\s*([^;]+);/g)].map((m) => m[1].trim());
    expect(resets).toEqual(["0", "20px"]); // the h1's (ref css:50) and the block's
    // No compensating "centre it properly" rules crept in.
    expect(CSS).not.toMatch(/margin(-inline)?:\s*(0 )?auto/);
    expect(CSS).not.toMatch(/padding-right:\s*20px/);
  });

  it("gives the h1 38px/44px type that a preflight cannot zero", () => {
    // Hazard 11: .heading-3 (ref css:2432-2437) only overrides margins and
    // weight; the 38px/44px come from the ELEMENT rules at ref css:385-387, and
    // Tailwind's preflight sets `h1 { font-size: inherit }`.
    const h1 = ruleBody(".heading-3");
    expect(h1).toMatch(/font-size:\s*38px;/);
    expect(h1).toMatch(/line-height:\s*44px;/);
    expect(h1).toMatch(/font-weight:\s*400;/);
    expect(h1).toMatch(/margin-left:\s*20px;/);
    expect(h1).toMatch(/margin-top:\s*0;/);
    expect(h1).toMatch(/margin-bottom:\s*10px;/);
  });

  it("keeps the img inline-block with max-width 100%", () => {
    // Hazard 5 plus hazard 1: max-width:100% (ref css:234) is load-bearing for
    // the flex shrink, and Tailwind's preflight would make the img display:block
    // — an undeclared deviation from ref css:235.
    const img = ruleBody(".section-7 img");
    expect(img).toMatch(/display:\s*inline-block;/);
    expect(img).toMatch(/max-width:\s*100%;/);
    expect(img).toMatch(/vertical-align:\s*middle;/);
    expect(img).not.toMatch(/display:\s*block/);
    expect(CSS).not.toMatch(/object-fit|aspect-ratio/);
  });

  it("re-establishes the reference's body type context on the slice root", () => {
    // ref css:227-229. `line-height: 1.4em` on .text-block-11 resolves against
    // font-size, and the 20px strut is the line box the <img> sits in.
    const root = ruleBody(".section-7");
    expect(root).toMatch(/font-family:\s*Arial, sans-serif;/);
    expect(root).toMatch(/font-size:\s*14px;/);
    expect(root).toMatch(/line-height:\s*20px;/);
    expect(root).toMatch(/display:\s*flex;/);
    // Hazard 8: the black is on .div-block-12 alone; .section-7 has no ground.
    expect(root).not.toMatch(/background/);
    expect(ruleBody(".div-block-12")).toMatch(/background-color:\s*#000;/);
  });

  it("stacks the panel at 100vw, not 100%, below 991", () => {
    // Hazard 6: ref css:3156 is `100vw`. On an engine with a classic reserved
    // scrollbar this overflows; the reference does too, so it is a LEDGER floor.
    const panel = ruleBody(".div-block-12", "    ");
    expect(panel).toMatch(/width:\s*100vw;/);
    expect(panel).not.toMatch(/width:\s*100%;/);
  });

  it("reproduces exactly the reference's three breakpoints and no others", () => {
    // Hazard 12: max-width 991 / 767 / 479, opening at ref css:3116 / 3218 /
    // 3396. There is no 990/768/480 anywhere, and the file's only min-width
    // query (ref css:1632) does not touch this section.
    const queries = (CSS.match(/@media[^{]*/g) ?? []).map((q) => q.trim());
    expect(queries).toEqual([
      "@media screen and (max-width: 991px)",
      "@media screen and (max-width: 767px)",
      "@media screen and (max-width: 479px)",
    ]);
    expect(CSS).not.toMatch(/\b(990|768|480)px\b/);
    expect(CSS).not.toMatch(/min-width/);
  });

  it("puts the 10px side padding only in the 479 block", () => {
    // Hazard 12 again: the gate's 390 viewport is the only one inside ref
    // css:3396, so a mistake here shows up at 390 and nowhere else.
    const block = CSS.slice(CSS.indexOf("@media screen and (max-width: 479px)"));
    expect(block).toMatch(/padding-left:\s*10px;/);
    expect(block).toMatch(/padding-right:\s*10px;/);
    expect(CSS.slice(0, CSS.indexOf("@media screen and (max-width: 479px)"))).not.toMatch(
      /padding-(left|right):\s*10px/,
    );
  });

  it("does not restyle .text-block-11 outside this component", () => {
    // Hazard 10: index.html gives all six navbar links
    // `class="nav-link-2 text-block-11 w-nav-link"` and ref css:2140-2152 styles
    // that combination. Svelte's scoping is what keeps ref css:2439-2444 off
    // them — a :global escape here would silently resize the navbar, and
    // nothing in this section's gate would catch it.
    expect(REF_NAVBAR).toContain('class="nav-link-2 text-block-11 w-nav-link"');
    expect(CSS).not.toContain(":global");
    expect(CSS).not.toContain("nav-link-2");
  });

  it("keeps mocks.json aligned with model.json and with the reference's copy", () => {
    const model = JSON.parse(read("model.json"));
    const mocks = JSON.parse(read("mocks.json"));
    const variation = model.variations.find((v: { id: string }) => v.id === mocks[0].variation) as {
      primary: Record<string, unknown>;
    };
    expect(model.id).toBe("navy_contact");
    expect(variation).toBeDefined();
    // A mock field with no model behind it is silently dropped by the
    // Migration API — the same failure src/lib/site-pages.test.ts guards.
    expect(Object.keys(mocks[0].primary).sort()).toEqual(Object.keys(variation.primary).sort());

    expect(mocks[0].primary.heading.value[0].type).toBe("heading1");
    expect(mocks[0].primary.heading.value[0].content.text).toBe("Contact");
    // Verbatim, trailing U+0020 included (hazard 14).
    expect(mocks[0].primary.address_line_1.value).toBe("29 Navy Street ");
    expect(mocks[0].primary.address_line_2.value).toBe("Venice, California 90291 ");

    const group = mocks[0].primary.links.value as Array<{
      value: Array<[string, { value: string }]>;
    }>;
    expect(group.length).toBe(3);
    const flat = group.map((item) => Object.fromEntries(item.value));
    expect(flat.map((f) => f.label.value)).toEqual(["Call us: ", "Email us:", "Find us on:"]);
    expect(flat.map((f) => f.value.value)).toEqual([
      "(310) 393-9657",
      "29navy@worthe.com",
      "Zillow",
    ]);
    // The group's field names match the model's group fields exactly.
    const groupFields = Object.keys(
      (variation.primary.links as { config: { fields: object } }).config.fields,
    ).sort();
    for (const item of group) expect(item.value.map(([k]) => k).sort()).toEqual(groupFields);

    // The declared deviation has to hold in the CONTENT, not just in the
    // hand-built fixture above: mocks.json is what the dev route renders and
    // what the gate measures, so it is the file that can quietly reintroduce
    // the reference's broken hrefs.
    expect(flat.map((f) => (f.target as unknown as { value: { url: string } }).value.url)).toEqual([
      "tel:+13103939657",
      "mailto:29navy@worthe.com",
      "https://www.zillow.com/apartments/venice-ca/29-navy-creative-lofts/ChqQtg/",
    ]);
    expect(JSON.stringify(mocks)).not.toContain("https://(310)");
    expect(JSON.stringify(mocks).includes(ZWJ)).toBe(false);

    expect(mocks[0].primary.photo.url).toBe(PHOTO);
    expect(mocks[0].primary.photo.width).toBe(4240);
    expect(mocks[0].primary.photo.height).toBe(2832);
    // Reference ships alt="" on all 23 images; the rebuild authors real alt.
    expect(mocks[0].primary.photo.alt.length).toBeGreaterThan(20);
  });

  it("resolves every srcset candidate to a file that is actually on disk", () => {
    // Hazard 8: .section-7 has NO background-color (ref css:2451-2453 is
    // `display: flex` and nothing else). The black is on .div-block-12 alone
    // and the photo covers the rest exactly (373.34 + 1066.66 = 1440), so a
    // 404 leaves white showing through the right 74% of the band — and a
    // missing candidate changes which one the browser picks, and with it the
    // section's height (the eight renditions differ in aspect ratio).
    // Positive evidence: each URL names a file that exists, not merely the
    // absence of a load error.
    const mocks = JSON.parse(read("mocks.json"));
    const img = mount().querySelector("img")!;
    const urls = [
      mocks[0].primary.photo.url as string,
      img.getAttribute("src")!,
      ...img
        .getAttribute("srcset")!
        .split(", ")
        .map((c) => c.split(" ")[0]),
    ];
    expect(urls.length).toBe(10);
    const missing = urls.filter((u) => !existsSync(resolve(ROOT, "static", u.replace(/^\//, ""))));
    expect(missing).toEqual([]);
  });

  it("agrees with the live capture, wherever the live capture exists", () => {
    // reference.html is a frozen copy, so on its own it can only prove this
    // test agrees with itself. This closes that: where matching/spec/index.html
    // IS present — every machine that has run the harness, which is every
    // machine where a geometry claim gets made — both excerpts are re-derived
    // from it and compared byte for byte. A recapture that moves the reference
    // reds HERE, naming the excerpt, instead of surfacing as an unexplained
    // gate failure three regions later.
    //
    // Guarded on existsSync rather than skipped unconditionally: a CI runner
    // has no capture and must still run everything above. This assertion is the
    // one thing it genuinely cannot check, and it denies a green — it never
    // grants one.
    const capture = resolve(ROOT, "matching/spec/index.html");
    if (!existsSync(capture)) return;
    const ref = readFileSync(capture, "utf8");
    for (const [name, rule] of Object.entries(SLICE_RULES)) {
      const derived = rule(ref);
      expect(derived.length, `${name} rule matched nothing in the capture`).toBeGreaterThan(0);
      expect(excerpt(name), `reference.html's ${name} excerpt has drifted from the capture`).toBe(
        derived,
      );
    }
  });
});
