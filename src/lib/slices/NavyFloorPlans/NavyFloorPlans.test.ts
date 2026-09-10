import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { compile } from "svelte/compiler";
import type { ComponentProps } from "svelte";
import NavyFloorPlans from "./index.svelte";

type Slice = ComponentProps<typeof NavyFloorPlans>["slice"];

// The four plan PNGs, by the filename the reference's own <img src> points at.
// PLAN_2 and PLAN_1 share the trailing name `floorplan-level-1_label.png` and
// are DIFFERENT files (sha256 f5d0fe3b… vs fc2284c3…). Opening either one is a
// 2402×1392 image in the same box, so no rect gate can tell them apart — the
// unit numbers printed on them can: PLAN_1 carries 1-8, PLAN_2 carries 21-28,
// PLAN_3 carries 31-38, PLAN_4 carries 45.
const PLAN_4 = "/29navy/assets/68a8ab2e97a0127295e1fc5a_floorplan-level-4_label.png";
const PLAN_3 = "/29navy/assets/68a8ab2eb4bb6bfe07128d9b_floorplan-level-3_label.png";
const PLAN_2 = "/29navy/assets/68a8a9f0547387a3619409d7_floorplan-level-1_label.png";
const PLAN_1 = "/29navy/assets/68a8ab2e8c93e2fcae3bc02d_floorplan-level-1_label.png";
const FPO = "/29navy/assets/614de03e7978b7a0d3de6cce_29N_floor_plan_fpo.jpg";

const TRIGGER_3 = "/29navy/assets/615330625afda8f3e747c53f_Untitled%20design%20(16).png";
const TRIGGER_2 = "/29navy/assets/6153308fcb691617e9de8587_Untitled%20design%20(17).png";
const TRIGGER_1 = "/29navy/assets/615330c04bb71e65b9ff085c_Untitled%20design%20(18).png";

const plan = (url: string, alt: string) => ({
  url,
  alt,
  dimensions: { width: 2402, height: 1392 },
});
const triggerImage = (url: string) => ({
  url,
  alt: "Button artwork",
  dimensions: { width: 216, height: 50 },
});
const pdf = (url: string, target?: string) => ({
  link_type: "Web",
  url,
  ...(target && { target }),
});

/** The reference's own content, in the reference's own DOM order: 4, 3, 2, 1. */
const slice = {
  slice_type: "navy_floor_plans",
  variation: "default",
  primary: {
    title: "Lofts",
    intro: "Hover or click on a floor",
    pdf_label: "Download a PDF of this floor",
    floors: [
      {
        label: "4th Floor - Penthouse",
        trigger_image: {},
        floorplan: plan(PLAN_4, "Floor plan of the fourth floor: one penthouse loft, numbered 45."),
        pdf: pdf("https://29navy.com/pdf/file4.pdf", "_blank"),
        open_by_default: false,
      },
      {
        label: "3rd Floor",
        trigger_image: triggerImage(TRIGGER_3),
        floorplan: plan(PLAN_3, "Floor plan of the third floor: eight lofts numbered 31 to 38."),
        pdf: pdf("https://29navy.com/pdf/file3.pdf", "_blank"),
        open_by_default: false,
      },
      {
        label: "2nd Floor",
        trigger_image: triggerImage(TRIGGER_2),
        floorplan: plan(PLAN_2, "Floor plan of the second floor: eight lofts numbered 21 to 28."),
        pdf: pdf("https://29navy.com/pdf/file2.pdf", "_blank"),
        open_by_default: false,
      },
      {
        label: "1st Floor",
        trigger_image: triggerImage(TRIGGER_1),
        floorplan: plan(PLAN_1, "Floor plan of the first floor: eight lofts numbered 1 to 8."),
        pdf: pdf("https://29navy.com/pdf/file1.pdf"),
        open_by_default: true,
      },
    ],
  },
} as unknown as Slice;

// NOT `new URL(..., import.meta.url)`: under this repo's vitest config a
// module's import.meta.url is root-relative, so fileURLToPath hands back a path
// that does not exist. vitest runs with the project root as cwd.
const HERE = resolve(process.cwd(), "src/lib/slices/NavyFloorPlans");
const read = (name: string) => readFileSync(resolve(HERE, name), "utf8");

const SOURCE = read("index.svelte");
const STYLE = SOURCE.slice(SOURCE.indexOf("<style>"), SOURCE.indexOf("</style>"));
/** The style block with its comments stripped — what the browser actually gets.
    Structural assertions run against this, never against STYLE: the citation
    comments quote reference selectors and @media queries verbatim, so scanning
    the raw text finds rules that are only being talked about. */
const CSS = STYLE.replace(/\/\*[\s\S]*?\*\//g, "");
/** Prettier wraps a long multi-value declaration across lines and parks the
    citation on the last one, so a per-LINE scan would report false uncited
    declarations. Rejoin every logical statement first. */
const STATEMENTS = (() => {
  const out: string[] = [];
  let buf = "";
  for (const raw of STYLE.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    buf = buf ? `${buf} ${line}` : line;
    if (/[;{}]$/.test(buf) || buf.endsWith("*/")) {
      out.push(buf);
      buf = "";
    }
  }
  if (buf) out.push(buf);
  return out;
})();
const DECLARATIONS = STATEMENTS.filter((s) => /^[a-z-]+:\s/.test(s));
/** The body of one rule, by its exact selector. Used to assert what is ABSENT. */
const ruleBody = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = CSS.match(new RegExp(`\\n\\s*${escaped}\\s*\\{([^}]*)\\}`));
  expect(match, `no \`${selector}\` rule in the style block`).not.toBeNull();
  return match![1];
};

const compiled = compile(SOURCE, { filename: "index.svelte", generate: "client" });

const trigger = (container: HTMLElement, cls: string) =>
  container.querySelector(`.div-block-5 > .${cls}`) as HTMLElement;
const panels = (container: HTMLElement) =>
  Object.fromEntries(
    ["_4th-floor-modal", "_3rd-floor-modal", "second-floor-modal", "_1st-floor-modal"].map((c) => [
      c,
      container.querySelector(`.${c}`) as HTMLElement,
    ]),
  );
/** Svelte normalises an inline style attribute ("display: flex;"), so compare
    whitespace-free. */
const displayOf = (el: HTMLElement) => (el.getAttribute("style") ?? "").replace(/\s+/g, "");
/** Svelte's scoping class is on every element; it is not part of the
    reference's class list and never belongs in an equality assertion. */
const classesOf = (el: Element) =>
  [...el.classList].filter((c) => !c.startsWith("svelte-")).join(" ");
/** The script block with its comments removed — the code, not the prose about
    it. A guard that scans the raw source matches the very comment explaining
    the thing it is asserting is absent. */
const SCRIPT = SOURCE.slice(0, SOURCE.indexOf("</script>"))
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("NavyFloorPlans slice", () => {
  it("renders the harness anchor verbatim", () => {
    // matching/harness.json anchors the home page's region 4 on this exact
    // string. The gate cuts on the first element whose collapsed text starts
    // with it, so any drift here silently misaligns every region on the page.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const intro = container.querySelector(".div-block-5 > .text-block-4")!;
    expect(intro.textContent).toBe("Hover or click on a floor");
  });

  it("reproduces the reference's section shell and left column", () => {
    // <div id="Lofts" class="section-4"><div class="div-block-5">
    //   <div class="text-block-3">Lofts</div>
    //   <div class="text-block-4">Hover or click on a floor</div> …
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const section = container.querySelector("div#Lofts.section-4")!;
    expect(section).not.toBeNull();
    expect(section.getAttribute("data-slice-type")).toBe("navy_floor_plans");
    expect(section.getAttribute("data-slice-variation")).toBe("default");
    const column = section.querySelector(":scope > div.div-block-5")!;
    expect(column.querySelector(":scope > .text-block-3")!.textContent).toBe("Lofts");
    expect(column.querySelector(":scope > .text-block-4")!.textContent).toBe(
      "Hover or click on a floor",
    );
    // Four panels, all siblings of the column inside .section-4 — never nested
    // inside it. The open panel is a flex ITEM of .section-4, and that is the
    // whole mechanism behind its 1174px width.
    expect(section.querySelectorAll(":scope > div").length).toBe(5);
  });

  it("orders the four triggers 4, 3, 2, 1 and gives each its reference class", () => {
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const kids = [...container.querySelectorAll(".div-block-5 > [role='button']")];
    expect(kids.map(classesOf)).toEqual(["div-block-6", "div-block-38", "_2nd-floor-div", "_11"]);
  });

  it("leaves the 1st-floor panel OPEN at rest and the other three closed", () => {
    // The single largest height risk in this section. `._1st-floor-modal` ships
    // inline style="display:flex" in matching/spec/index.html and `display:flex`
    // at ref css:2338; the other three are `display:none` (ref css:3065, 3081).
    // A component that initialises everything closed is ~750px short at 1440
    // and blows maxHeightDelta for the whole page.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const p = panels(container);
    expect(displayOf(p["_1st-floor-modal"])).toContain("display:flex");
    expect(displayOf(p["_4th-floor-modal"])).toContain("display:none");
    expect(displayOf(p["_3rd-floor-modal"])).toContain("display:none");
    expect(displayOf(p["second-floor-modal"])).toContain("display:none");
  });

  it("falls back to the LAST floor, never to all-closed, when nothing is flagged", () => {
    const none = {
      ...slice,
      primary: {
        ...slice.primary,
        floors: slice.primary.floors.map((f) => ({ ...f, open_by_default: false })),
      },
    } as unknown as Slice;
    const { container } = render(NavyFloorPlans, { props: { slice: none } });
    const open = [...container.querySelectorAll("[id^='lofts-floor-panel-']")].filter((el) =>
      displayOf(el as HTMLElement).includes("display:flex"),
    );
    expect(open.length).toBe(1);
    expect(open[0].id).toBe("lofts-floor-panel-3");
  });

  // ---- The hazard the geometry gate cannot see: the class names lie.

  it("opens the panel the reference's ix2 payload wires each trigger to", async () => {
    // `.div-block-38` is the 3RD floor, `._2nd-floor-div` the 2nd, `._11` the
    // 1st, `.div-block-6` the 4th (js chunk events e-47/e-45/e-53/e-49 →
    // actionLists a-19/a-18/a-17/a-20). Wiring by name opens the wrong panel on
    // three of four clicks, and since every panel is the same 1174-wide image
    // the geometry gate stays green throughout.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const cases: Array<[string, string]> = [
      ["div-block-38", "_3rd-floor-modal"],
      ["_2nd-floor-div", "second-floor-modal"],
      ["div-block-6", "_4th-floor-modal"],
      ["_11", "_1st-floor-modal"],
    ];
    for (const [triggerClass, panelClass] of cases) {
      await fireEvent.click(trigger(container, triggerClass));
      const p = panels(container);
      expect(displayOf(p[panelClass]), `${triggerClass} → ${panelClass}`).toContain("display:flex");
      for (const [name, el] of Object.entries(p))
        if (name !== panelClass)
          expect(displayOf(el), `${name} should be closed`).toContain("none");
    }
  });

  it("shows each floor its own plan, resolved by URL and not by filename", async () => {
    // Hazard: the floor-2 plan ships under a stale `level-1` export name. A
    // rebuild that maps floor 2 to the other `level-1` file shows units 1-8
    // behind the 2nd-floor button, and only a click can reveal it.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const src = (panelClass: string) =>
      container.querySelector(`.${panelClass} img`)!.getAttribute("src");
    expect(src("_1st-floor-modal")).toBe(PLAN_1);
    expect(src("second-floor-modal")).toBe(PLAN_2);
    expect(src("_3rd-floor-modal")).toBe(PLAN_3);
    expect(src("_4th-floor-modal")).toBe(PLAN_4);
    expect(PLAN_1).not.toBe(PLAN_2);
  });

  it("keeps the reference's per-panel width attributes and adds no height", () => {
    // Hazard: `width` is a presentational hint, so each plan is
    // min(attr, 100% of container) — the four attributes differ (1331 / 1325 /
    // 1345 / 1214) for four images that are all 2402×1392. Normalising them
    // bites above ~1234px of container width. A `height` attribute would pin
    // the box instead of letting the intrinsic ratio regenerate it.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const widths = ["_4th-floor-modal", "_3rd-floor-modal", "second-floor-modal"].map((c) =>
      container.querySelector(`.${c} img`)!.getAttribute("width"),
    );
    expect(widths).toEqual(["1331", "1325", "1345"]);
    expect(container.querySelector("#floor-1")!.getAttribute("width")).toBe("1214");
    for (const img of container.querySelectorAll("img"))
      expect(img.hasAttribute("height"), `${img.getAttribute("src")} carries a height`).toBe(false);
  });

  it("marks the 2nd-floor plan and the 1st-floor plan the way the reference does", () => {
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const twos = container.querySelectorAll("._2nd-floor-plan");
    expect(twos.length).toBe(1);
    expect(twos[0].closest(".second-floor-modal")).not.toBeNull();
    const one = container.querySelectorAll("#floor-1");
    expect(one.length).toBe(1);
    expect(one[0].closest("._1st-floor-modal")).not.toBeNull();
  });

  it("keeps `.image-14` — hidden, unreferenced, and present exactly once", () => {
    // ref css:2789 `display: none`, and grep across all three reference js
    // chunks returns zero hits for `image-14`: nothing ever un-hides it. It
    // contributes to no rect but is one of the page's 23 <img> in
    // matching/CAPTURE.md, so it stays hard-coded rather than being dropped.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const dead = container.querySelectorAll(".image-14");
    expect(dead.length).toBe(1);
    expect(dead[0].getAttribute("src")).toBe(FPO);
    expect(dead[0].closest("._1st-floor-modal")).not.toBeNull();
    expect(ruleBody(".image-14")).toMatch(/display:\s*none;/);
    // Nothing in the component may toggle it: `image-14` appears in the markup
    // and in its own rule, and never in the script.
    expect(SCRIPT).not.toContain("image-14");
  });

  // ---- Interaction state that no at-rest gate can see.

  it("underlines the glyph in panels 2/3/4 and only clears it in panel 1", () => {
    // ref css:3058-3060 sets `text-decoration: none` on `.link-block-14`, which
    // ONLY the 1st-floor link wears; nothing in the reference sheet clears the
    // UA underline from a bare <a> (ref css:273 is `.w-button`). Floor 1 is the
    // panel open at rest, so this shows up only after a click.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const links = [...container.querySelectorAll("a")];
    expect(links.length).toBe(4);
    const cleared = links.filter((a) => a.classList.contains("link-block-14"));
    expect(cleared.length).toBe(1);
    expect(cleared[0].getAttribute("href")).toBe("https://29navy.com/pdf/file1.pdf");
    for (const a of links) expect(a.classList.contains("w-inline-block")).toBe(true);
    expect(ruleBody(".link-block-14")).toMatch(/text-decoration:\s*none;/);
  });

  it("carries target=_blank on floors 2/3/4 and not on floor 1", () => {
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const byHref = Object.fromEntries(
      [...container.querySelectorAll("a")].map((a) => [a.getAttribute("href"), a]),
    );
    expect(byHref["https://29navy.com/pdf/file1.pdf"].getAttribute("target")).toBeNull();
    for (const n of [2, 3, 4])
      expect(byHref[`https://29navy.com/pdf/file${n}.pdf`].getAttribute("target")).toBe("_blank");
  });

  it("renders the Font Awesome U+F15B glyph, four times, hidden from the a11y tree", () => {
    // The reference's `._3` divs look empty in a terminal because the codepoint
    // is in the private-use area. They are not empty, and the glyph is not an
    // SVG: the real font file is on disk.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const glyphs = [...container.querySelectorAll("._3")];
    expect(glyphs.length).toBe(4);
    for (const g of glyphs) {
      expect(g.textContent).toBe("");
      expect(g.getAttribute("aria-hidden")).toBe("true");
    }
    // ref html: the per-panel combo classes, including the reference's own typo.
    expect(glyphs.map(classesOf)).toEqual([
      "_3 _4the-floor-pdf",
      "_3 floor-pds",
      "_3 _2nd-floor-pdf",
      "_3",
    ]);
    expect(container.querySelector("svg")).toBeNull();
  });

  // ---- Accessibility, which the reference does not have.

  it("makes every trigger keyboard-operable and names it", async () => {
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const kids = [...container.querySelectorAll(".div-block-5 > [role='button']")] as HTMLElement[];
    for (const k of kids) expect(k.getAttribute("tabindex")).toBe("0");
    // Floors 1-3 have their name baked into the PNG, so it reaches the a11y
    // tree as aria-label; floor 4's name is real visible text.
    expect(kids[0].textContent).toBe("4th Floor - Penthouse");
    expect(kids[0].getAttribute("aria-label")).toBeNull();
    expect(kids.slice(1).map((k) => k.getAttribute("aria-label"))).toEqual([
      "3rd Floor",
      "2nd Floor",
      "1st Floor",
    ]);

    await fireEvent.keyDown(kids[1], { key: "Enter" });
    expect(displayOf(panels(container)["_3rd-floor-modal"])).toContain("display:flex");
    await fireEvent.keyDown(kids[2], { key: " " });
    expect(displayOf(panels(container)["second-floor-modal"])).toContain("display:flex");
  });

  it("wires aria-expanded and aria-controls to the panel each trigger opens", async () => {
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const kids = [...container.querySelectorAll(".div-block-5 > [role='button']")] as HTMLElement[];
    expect(kids.map((k) => k.getAttribute("aria-expanded"))).toEqual([
      "false",
      "false",
      "false",
      "true",
    ]);
    for (const [i, k] of kids.entries()) {
      const controlled = container.querySelector(`#${k.getAttribute("aria-controls")}`)!;
      expect(controlled).not.toBeNull();
      expect(controlled.id).toBe(`lofts-floor-panel-${i}`);
    }
    await fireEvent.click(kids[0]);
    expect(
      [...container.querySelectorAll(".div-block-5 > [role='button']")].map((k) =>
        k.getAttribute("aria-expanded"),
      ),
    ).toEqual(["true", "false", "false", "false"]);
  });

  it("gives every plan real alt text", () => {
    // The reference ships alt="" on all 23 images; this repo pre-declared real
    // alt as an accepted text-diff artifact. `.image-14` is excluded on purpose:
    // it is never rendered and never exposed.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    for (const img of container.querySelectorAll("img")) {
      if (img.classList.contains("image-14")) {
        expect(img.getAttribute("alt")).toBe("");
        continue;
      }
      expect((img.getAttribute("alt") ?? "").length).toBeGreaterThan(20);
    }
  });

  it("names each download link, rather than leaving it named by a PUA codepoint", () => {
    const { container } = render(NavyFloorPlans, { props: { slice } });
    expect([...container.querySelectorAll("a")].map((a) => a.getAttribute("aria-label"))).toEqual([
      "Download a PDF of this floor — 4th Floor - Penthouse",
      "Download a PDF of this floor — 3rd Floor",
      "Download a PDF of this floor — 2nd Floor",
      "Download a PDF of this floor — 1st Floor",
    ]);
  });

  // ---- Responsive image candidates.

  it("rebuilds the reference's own srcset for a captured plan", () => {
    // matching/spec/index.html gives every plan five `-p-<w>` candidates plus
    // the full-size original at 2402w; all six files are on disk. Without them
    // the browser downloads the 2402px source and downsamples from a different
    // mip than the reference does, which is a pixel-gate difference on line
    // drawings, not a layout one.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    expect(container.querySelector("#floor-1")!.getAttribute("srcset")).toBe(
      [500, 800, 1080, 1600, 2000]
        .map((w) => `${PLAN_1.replace(/\.png$/, "")}-p-${w}.png ${w}w`)
        .concat(`${PLAN_1} 2402w`)
        .join(", "),
    );
    // The FPO jpg is the exception: Webflow re-encoded its variants as .jpeg
    // and emitted no 500w, so its srcset is the reference's, literally.
    const fpo = container.querySelector(".image-14")!.getAttribute("srcset")!;
    expect(fpo).not.toContain("-p-500");
    expect(fpo).toContain("-p-800.jpeg 800w");
    expect(fpo).toContain(`${FPO} 2402w`);
  });

  // ---- Source-level guards. jsdom applies no stylesheet, so the hazards that
  // live in the CSS are asserted against the file the browser will get.

  it("cites a reference line on every declaration in the style block", () => {
    expect(DECLARATIONS.length).toBeGreaterThanOrEqual(80);
    const uncited = DECLARATIONS.filter((d) => !/\/\* ref css:\d+/.test(d));
    expect(uncited).toEqual([]);
  });

  it("emits every rule into the bundle, scoped, under its own selector", () => {
    // Positive evidence, not the absence of an error. The trigger, panel, glyph
    // and link classes all reach the DOM through dynamic `class={…}`
    // expressions, and jsdom applies no stylesheet at all, so nothing else in
    // this file would notice if a rule stopped being emitted or its selector
    // were renamed.
    //
    // Matching on `<selector>.svelte-<hash>` and not on the bare class is the
    // point: the compiled CSS still carries this file's comments, which quote
    // every reference selector verbatim, so a bare `toContain(".div-block-38")`
    // passes a rename happily. Measured, not assumed — a probe that appended
    // `.zzz-never-used {}` to this stylesheet found it emitted and unwarned,
    // because a single dynamic class attribute makes Svelte treat every
    // selector in the file as possibly-used. So this asserts what the bundle
    // contains; it cannot and does not assert that pruning was declined.
    const emitted = (compiled.css?.code ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(emitted).not.toBe("");
    for (const selector of [
      ".section-4",
      ".div-block-5",
      ".text-block-3",
      ".text-block-4",
      ".div-block-6",
      ".div-block-6:hover",
      ".div-block-38",
      ".div-block-38:hover",
      ".div-block-38:active",
      ".div-block-38:focus",
      "._2nd-floor-div",
      "._2nd-floor-div:hover",
      "._11",
      "._11:hover",
      "._11:focus",
      "._3",
      "._3:hover",
      "._2nd-floor-plan",
      ".link-block-14",
      ".w-inline-block",
      ".second-floor-modal",
      "._3rd-floor-modal",
      "._4th-floor-modal",
      "._1st-floor-modal",
      ".image-14",
    ]) {
      // `.a:hover` scopes as `.a.svelte-hash:hover`, so split the pseudo off.
      const [cls, pseudo = ""] = selector.split(":");
      const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Anchored on the rule head (`… {` or `… ,`) so a renamed base rule
      // cannot be covered by a surviving pseudo-class rule for the same class.
      const re = new RegExp(`${escaped}\\.svelte-[a-z0-9]+${pseudo ? `:${pseudo}` : ""}\\s*[,{]`);
      expect(emitted, `\`${selector}\` is not in the compiled CSS`).toMatch(re);
    }
    expect(emitted).toContain("@font-face");
    expect(emitted).toContain("6153165404074dc8073ec349_fa-solid-900.woff2");
    // The three reference breakpoints survive compilation in order.
    expect((emitted.match(/@media[^{]*/g) ?? []).map((q) => q.trim())).toEqual([
      "@media screen and (max-width: 991px)",
      "@media screen and (max-width: 767px)",
      "@media screen and (max-width: 479px)",
    ]);
  });

  it("self-hosts the Fa solid 900 face rather than drawing the glyph", () => {
    // ref css:2049-2055. If the face fails to load the glyph falls back to
    // `sans-serif` (ref css:3049) and renders as tofu — but the 50px line box
    // at ref css:3051 still holds, so every height gate stays green while the
    // icon is wrong.
    expect(STYLE).toContain('font-family: "Fa solid 900"');
    expect(STYLE).toContain("/29navy/fonts/6153165404074dc8073ec349_fa-solid-900.woff2");
    expect(ruleBody("._3")).toMatch(/font-size:\s*50px;/);
    expect(ruleBody("._3")).toMatch(/line-height:\s*50px;/);
  });

  it("pins no width on the panels or the column — the flex clamp is the mechanism", () => {
    // At 1440 `.section-4` is a 1400px row box (ref css:2283). `.div-block-5`
    // has no width; its automatic minimum size is 216 (ref css:2972) + 5 + 5 =
    // 226, so `._1st-floor-modal` absorbs the deficit: 1400 − 226 = 1174 at
    // x = 246, which is SPEC.md's measured rect exactly. Hard-coding 1174px or
    // any percentage breaks it at the other three viewports.
    const column = ruleBody(".div-block-5");
    expect(column).toMatch(/max-width:\s*33\.3%;/);
    expect(column).not.toMatch(/(^|[^-])width:/);
    expect(column).toMatch(/margin-left:\s*auto;/);
    expect(column).toMatch(/margin-right:\s*auto;/);
    for (const panel of ["._1st-floor-modal", ".second-floor-modal"]) {
      const body = ruleBody(panel);
      expect(body).not.toMatch(/width:/);
      expect(body).not.toMatch(/flex:/);
      expect(body).not.toMatch(/height:/);
    }
    // And the 216×50 triggers keep their hard box.
    for (const t of [".div-block-38", "._2nd-floor-div", "._11"]) {
      expect(ruleBody(t)).toMatch(/width:\s*216px;/);
      expect(ruleBody(t)).toMatch(/height:\s*50px;/);
    }
    // `.div-block-6` deliberately has neither: 5 + 20 + 10 = 35px of its own.
    expect(ruleBody(".div-block-6")).not.toMatch(/(^|[^-])width:/);
    expect(ruleBody(".div-block-6")).not.toMatch(/height:/);
  });

  it("reproduces exactly the reference's three breakpoints, and invents none", () => {
    const queries = (CSS.match(/@media[^{]*/g) ?? []).map((q) => q.trim());
    expect(queries).toEqual([
      "@media screen and (max-width: 991px)",
      "@media screen and (max-width: 767px)",
      "@media screen and (max-width: 479px)",
    ]);
    expect(CSS).not.toMatch(/min-width/);
  });

  it("puts the +20px glyph margin in the ≤991 block, where 767 and 390 inherit it", () => {
    // ref css:3209-3211 lives inside the ≤991 block and is never restated, so it
    // applies at 991, 767 AND 390 — +20px to every panel at three of the four
    // gate viewports. ref css:3213-3215 sits in the same block but touches the
    // 2nd-floor panel alone; hoisting it inflates the wrong panels.
    const at991 = CSS.slice(CSS.indexOf("@media screen and (max-width: 991px)"));
    const block = at991.slice(0, at991.indexOf("@media screen and (max-width: 767px)"));
    expect(block).toMatch(/\._3\s*\{\s*margin-top:\s*20px;\s*\}/);
    expect(block).toMatch(/\.second-floor-modal\s*\{\s*padding-top:\s*20px;\s*\}/);
    for (const other of ["_1st-floor-modal", "_3rd-floor-modal", "_4th-floor-modal"])
      expect(block).not.toContain(other);
    // ref css:3187-3189 is this trigger alone, not all three.
    expect(block).toMatch(/\.div-block-38\s*\{[^}]*display:\s*flex;/);
  });

  it("keeps the four triggers' hover/focus/active states deliberately unequal", () => {
    // Every border is 4px inside a border-box 216×50 box (ref css:215), so a
    // uniform rule shifts nothing and passes every geometry gate — it fails
    // only the interaction-state comparison. `.div-block-38` swaps a BORDER on
    // :focus (ref css:2991) while `._11` swaps a BACKGROUND (ref css:3038), and
    // `._2nd-floor-div` has no transition, no :active and no :focus at all.
    expect(CSS).toMatch(/\.div-block-38:focus\s*\{\s*border:\s*4px solid white;/);
    expect(CSS).toMatch(/\._11:focus\s*\{\s*background-image:/);
    expect(CSS).not.toMatch(/\._11:focus\s*\{\s*border/);
    expect(CSS).not.toContain("._2nd-floor-div:focus");
    expect(CSS).not.toContain("._2nd-floor-div:active");
    expect(ruleBody("._2nd-floor-div")).not.toMatch(/transition/);
    expect(ruleBody(".div-block-38")).toMatch(/transition:\s*border 0\.2s;/);
    expect(ruleBody("._11")).toMatch(/transition:\s*border 0\.2s;/);
    // `.div-block-6` changes background only, never a border (ref css:2320-2322).
    expect(ruleBody(".div-block-6:hover")).toMatch(/background-color:\s*#ffffff7d;/);
    expect(ruleBody(".div-block-6:hover")).not.toMatch(/border/);
    // Painting differs too: cover at 50% on one, auto at 0 0 on the others.
    expect(ruleBody(".div-block-38")).toMatch(/background-size:\s*cover;/);
    expect(ruleBody("._2nd-floor-div")).toMatch(/background-size:\s*auto;/);
    expect(ruleBody("._11")).toMatch(/background-size:\s*auto;/);
  });

  it("routes the trigger artwork through a custom property, not `background-image`", () => {
    // An inline `background-image` would outrank `.div-block-38:active`
    // (ref css:2984) and `._11:focus` (ref css:3038), which restate the same
    // url under a --white-2 overlay: the overlay would simply never appear.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const style = trigger(container, "_11").getAttribute("style") ?? "";
    expect(style).toContain(`--trigger-bg: url('${TRIGGER_1}')`);
    expect(style).not.toContain("background-image");
    expect(trigger(container, "div-block-6").getAttribute("style")).toBeNull();
  });

  it("selects the text-button rendering from an empty trigger image", () => {
    // The reference's 4th-floor trigger is the only one with no background PNG
    // and the only one with visible text (ref css:2308-2318, no width/height).
    const withArt = {
      ...slice,
      primary: {
        ...slice.primary,
        floors: slice.primary.floors.map((f, i) =>
          i === 0 ? { ...f, trigger_image: triggerImage(TRIGGER_1) } : f,
        ),
      },
    } as unknown as Slice;
    const { container } = render(NavyFloorPlans, { props: { slice: withArt } });
    expect(container.querySelector(".div-block-6")).toBeNull();
    expect(classesOf(container.querySelector(".div-block-5 > [role='button']")!)).toBe("_11");
  });

  it("keeps mocks.json aligned with model.json and with the reference's copy", () => {
    const model = JSON.parse(read("model.json"));
    const mocks = JSON.parse(read("mocks.json"));
    expect(model.id).toBe("navy_floor_plans");
    const variation = model.variations.find((v: { id: string }) => v.id === mocks[0].variation);
    expect(variation).toBeDefined();
    // A mock field with no model behind it is silently dropped by the Migration
    // API — the same failure src/lib/site-pages.test.ts guards.
    expect(Object.keys(mocks[0].primary).sort()).toEqual(Object.keys(variation.primary).sort());
    expect(mocks[0].primary.title.value).toBe("Lofts");
    expect(mocks[0].primary.intro.value).toBe("Hover or click on a floor");
    expect(mocks[0].primary.pdf_label.value).toBe("Download a PDF of this floor");

    const groupFields = Object.keys(variation.primary.floors.config.fields);
    const items = mocks[0].primary.floors.value as Array<{ value: Array<[string, unknown]> }>;
    expect(items.length).toBe(4);
    for (const item of items)
      for (const [key] of item.value) expect(groupFields, `unmodelled field ${key}`).toContain(key);

    const field = (i: number, name: string) =>
      items[i].value.find(([k]) => k === name)?.[1] as Record<string, unknown> | undefined;
    expect(items.map((_, i) => (field(i, "label") as { value: string }).value)).toEqual([
      "4th Floor - Penthouse",
      "3rd Floor",
      "2nd Floor",
      "1st Floor",
    ]);
    // The 4th-floor trigger has no artwork — that absence IS the switch.
    expect(field(0, "trigger_image")).toBeUndefined();
    for (const i of [1, 2, 3]) expect(field(i, "trigger_image")).toBeDefined();
    // Each panel gets its own plan, and floor 2 gets the stale-named file.
    expect(items.map((_, i) => (field(i, "floorplan") as { url: string }).url)).toEqual([
      PLAN_4,
      PLAN_3,
      PLAN_2,
      PLAN_1,
    ]);
    // Exactly one floor open at rest, and it is the 1st.
    const open = items.map((_, i) => (field(i, "open_by_default") as { value: boolean }).value);
    expect(open).toEqual([false, false, false, true]);
    // Real alt text on every plan.
    for (const i of [0, 1, 2, 3])
      expect((field(i, "floorplan") as { alt: string }).alt.length).toBeGreaterThan(20);
  });
});
