import { render, fireEvent, cleanup } from "@testing-library/svelte";
import { afterEach, describe, it, expect, vi } from "vitest";
import { isFilled } from "@prismicio/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps } from "svelte";
import { preloadHidden } from "$utils/preloadHidden";
import NavyFloorPlans from "./index.svelte";

vi.mock("$utils/preloadHidden", () => ({ preloadHidden: vi.fn(() => () => {}) }));

afterEach(() => cleanup());

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

const FLOORS = slice.primary.floors.map((f) => ({
  name: f.label!,
  plan: f.floorplan.url!,
  alt: f.floorplan.alt!,
}));
const withFloors = (patch: (f: Slice["primary"]["floors"][number]) => object) =>
  ({
    ...slice,
    primary: { ...slice.primary, floors: slice.primary.floors.map((f) => ({ ...f, ...patch(f) })) },
  }) as unknown as Slice;

// NOT `new URL(..., import.meta.url)`: under this repo's vitest config a
// module's import.meta.url is root-relative, so fileURLToPath hands back a path
// that does not exist. vitest runs with the project root as cwd.
const HERE = resolve(process.cwd(), "src/lib/slices/NavyFloorPlans");
const read = (name: string) => readFileSync(resolve(HERE, name), "utf8");

const SOURCE = read("index.svelte");
/** The style block with its comments stripped: the citation comments quote
    reference selectors verbatim. */
const CSS = SOURCE.slice(SOURCE.indexOf("<style>"), SOURCE.indexOf("</style>")).replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);
/** The body of one rule, by its exact selector — the first, so never a @media restatement. */
const ruleBody = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return CSS.match(new RegExp(`\\n\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1];
};
const declared = (selector: string, property: string) =>
  new RegExp(`(?:^|[\\s;])${property}:\\s*([^;]+);`).exec(ruleBody(selector) ?? "")?.[1].trim();

const APP_CSS = readFileSync(resolve(process.cwd(), "src/app.css"), "utf8");
/** A declared colour as [r, g, b, alpha]: hex, rgb(a), oklch, a keyword, or a token from src/app.css. */
const rgba = (value: string): number[] => {
  const v = value.trim().toLowerCase();
  const token = /^var\((--[\w-]+)\)$/.exec(v)?.[1];
  if (token)
    return rgba(new RegExp(`${token}:\\s*([^;]+);`).exec(APP_CSS)?.[1] ?? `unresolved ${token}`);
  const keyword: Record<string, string> = { white: "#fff", black: "#000", transparent: "#0000" };
  const hex = /^#([0-9a-f]+)$/.exec(keyword[v] ?? v)?.[1] ?? "";
  if ([3, 4, 6, 8].includes(hex.length)) {
    const pairs = (hex.length <= 4 ? hex.replace(/./g, "$&$&") : hex).match(/../g)!;
    const [r, g, b, a = 255] = pairs.map((p) => parseInt(p, 16));
    return [r, g, b, a / 255];
  }
  const fn =
    /^rgba?\(([^)]*)\)$/
      .exec(v)?.[1]
      .split(/[\s,/]+/)
      .map(Number) ?? [];
  if (fn.length >= 3) return [fn[0], fn[1], fn[2], fn[3] ?? 1];
  const ok = /^oklch\(([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/.exec(v);
  if (ok) {
    const L = Number(ok[1]) / (ok[2] ? 100 : 1);
    const [a, b] = [Math.cos, Math.sin].map(
      (f) => Number(ok[3]) * f((Number(ok[4]) * Math.PI) / 180),
    );
    const [l, m, s] = [
      L + 0.3963377774 * a + 0.2158037573 * b,
      L - 0.1055613458 * a - 0.0638541728 * b,
      L - 0.0894841775 * a - 1.291485548 * b,
    ].map((x) => x ** 3);
    const linear = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map((c) => Math.min(1, Math.max(0, c)));
    return [
      ...linear.map((c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)),
      1,
    ];
  }
  throw new Error(`cannot measure the colour \`${value}\``);
};
/** Paint `[r, g, b, alpha]` over an opaque ground, as a browser composites it. */
const over = ([r, g, b, a]: number[], ground: number[]) =>
  [r, g, b].map((c, i) => a * c + (1 - a) * ground[i]);
/** WCAG 2.x contrast between two opaque [r, g, b]. */
const contrast = (x: number[], y: number[]) => {
  const L = (rgb: number[]) => {
    const [r, g, b] = rgb.map((c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [L(x), L(y)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
};

/** jsdom applies no stylesheet, so this sees each ancestor's inline display and `hidden`. */
const displayed = (el: Element | null): boolean =>
  !el ||
  (!(el as HTMLElement).hidden &&
    getComputedStyle(el).display !== "none" &&
    displayed(el.parentElement));
/** The floor plans on screen, by URL. */
const shownPlans = (container: HTMLElement) =>
  FLOORS.map((f) => f.plan).filter((src) => {
    const img = container.querySelector(`img[src="${src}"]`);
    return img !== null && displayed(img);
  });

describe("NavyFloorPlans slice", () => {
  it("renders the title, the intro and the floors in authored order, on the #Lofts anchor the nav links to", () => {
    const { container, getByRole, getByText } = render(NavyFloorPlans, { props: { slice } });
    expect(getByRole("heading", { name: "Lofts" })).toBeTruthy();
    expect(getByText("Hover or click on a floor")).toBeTruthy();
    const triggers = FLOORS.map(({ name }) => getByRole("button", { name }));
    for (const [i, next] of triggers.slice(1).entries())
      expect(
        triggers[i].compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
        `${FLOORS[i + 1].name} follows ${FLOORS[i].name}`,
      ).toBeTruthy();
    const section = container.querySelector("[data-slice-type='navy_floor_plans']");
    expect(section?.getAttribute("data-slice-variation")).toBe("default");
    expect(section?.id).toBe("Lofts");
  });

  it("shows the floor flagged open_by_default at rest, and only that one", () => {
    // `._1st-floor-modal` is open at rest in the reference. A component that
    // initialises everything closed is ~750px short at 1440.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    expect(shownPlans(container)).toEqual([PLAN_1]);
    cleanup();
    const third = withFloors((f) => ({ open_by_default: f.label === "3rd Floor" }));
    expect(shownPlans(render(NavyFloorPlans, { props: { slice: third } }).container)).toEqual([
      PLAN_3,
    ]);
  });

  it("falls back to the LAST floor, never to all-closed, when nothing is flagged", () => {
    const none = withFloors(() => ({ open_by_default: false }));
    const { container } = render(NavyFloorPlans, { props: { slice: none } });
    expect(shownPlans(container)).toEqual([PLAN_1]);
  });

  it("shows exactly the clicked floor's plan", async () => {
    // The reference's class names do not name their floor: `.div-block-38` is
    // the 3RD floor, `._2nd-floor-div` the 2nd, `._11` the 1st, `.div-block-6`
    // the 4th. Wiring by name opens the wrong panel on three of four clicks,
    // and since every panel is the same 1174-wide image the geometry gate
    // stays green throughout. The floor-2 plan also ships under a stale
    // `level-1` export name, so the two `level-1` files are easy to swap.
    expect(PLAN_1).not.toBe(PLAN_2);
    const { container, getByRole } = render(NavyFloorPlans, { props: { slice } });
    const cases: Array<[string, string]> = [
      ["3rd Floor", PLAN_3],
      ["2nd Floor", PLAN_2],
      ["4th Floor - Penthouse", PLAN_4],
      ["1st Floor", PLAN_1],
    ];
    for (const [name, src] of cases) {
      await fireEvent.click(getByRole("button", { name }));
      expect(shownPlans(container), name).toEqual([src]);
    }
  });

  it("points each trigger's aria-controls at the panel holding its own plan", () => {
    const { getByRole } = render(NavyFloorPlans, { props: { slice } });
    for (const { name, plan: src } of FLOORS) {
      const id = getByRole("button", { name }).getAttribute("aria-controls")!;
      const panel = document.getElementById(id);
      expect(panel?.querySelector(`img[src="${src}"]`), `${name} → #${id}`).not.toBeNull();
    }
  });

  it("links to none of the PDFs, which 404 on the client's live site, though every floor still carries one", () => {
    // Deliberately not rendered (#8). The fixture really does supply what this
    // asserts is unrendered — without these lines the test would pass just as
    // well against an empty slice. `isFilled.link` rather than `f.pdf.url`:
    // LinkField widens to the empty variant, which has no `url`.
    const urls = slice.primary.floors.map((f) => (isFilled.link(f.pdf) ? f.pdf.url : undefined));
    for (const url of urls) expect(url).toContain("29navy.com/pdf/");
    expect(slice.primary.pdf_label).toBeTruthy();

    const { container } = render(NavyFloorPlans, { props: { slice } });
    expect(container.innerHTML).not.toContain("29navy.com/pdf/");
    // The caption went with the button: an instruction to press a control that
    // is not there is worse than neither.
    expect(container.textContent).not.toContain(slice.primary.pdf_label);
  });

  it("makes every trigger focusable and operable from the keyboard", async () => {
    const { container, getByRole } = render(NavyFloorPlans, { props: { slice } });
    for (const { name } of FLOORS) {
      const button = getByRole("button", { name });
      // In the Tab order, not merely focusable: jsdom focuses tabindex="-1" too.
      expect(button.tabIndex, name).toBeGreaterThanOrEqual(0);
      button.focus();
      expect(document.activeElement, name).toBe(button);
    }
    await fireEvent.keyDown(getByRole("button", { name: "3rd Floor" }), { key: "Enter" });
    expect(shownPlans(container)).toEqual([PLAN_3]);
    await fireEvent.keyDown(getByRole("button", { name: "2nd Floor" }), { key: " " });
    expect(shownPlans(container)).toEqual([PLAN_2]);
  });

  it("tracks the open floor in aria-expanded", async () => {
    const { getByRole } = render(NavyFloorPlans, { props: { slice } });
    const expanded = () =>
      FLOORS.map(({ name }) => getByRole("button", { name }).getAttribute("aria-expanded"));
    expect(expanded()).toEqual(["false", "false", "false", "true"]);
    await fireEvent.click(getByRole("button", { name: "4th Floor - Penthouse" }));
    expect(expanded()).toEqual(["true", "false", "false", "false"]);
  });

  it("gives every plan its authored alt text", () => {
    // The reference ships alt="" on all 23 images; this repo pre-declared real
    // alt as an accepted text-diff artifact.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    for (const { plan: src, alt } of FLOORS) {
      expect(alt.length).toBeGreaterThan(0);
      expect(container.querySelector(`img[src="${src}"]`)?.getAttribute("alt"), src).toBe(alt);
    }
  });

  it("keeps the band's text and the text trigger's label at 4.5:1 or better, hovered or not", () => {
    // The reference's hover veil on the text trigger (ref css:2321) composites
    // over the firebrick band to a ground where its inherited white label
    // measures 2.30:1. tests/a11y/home.spec.ts only sees it while floor 4 has
    // no artwork in Prismic, so the declared colours are composited here.
    const fill = (sel: string) => declared(sel, "background-color") ?? declared(sel, "background");
    const band = fill(".div-block-5") ?? fill(".section-4");
    const ink = declared(".div-block-5", "color") ?? declared(".section-4", "color");
    expect(band, "the band's ground is unmeasured").toBeTruthy();
    expect(ink, "the band's ink is unmeasured").toBeTruthy();
    expect(ruleBody(".div-block-6"), "no rule paints the text trigger").toBeDefined();

    const ground = rgba(band!).slice(0, 3);
    const restFill = fill(".div-block-6");
    const rest = restFill ? over(rgba(restFill), ground) : ground;
    const label = declared(".div-block-6", "color") ?? ink!;
    const hoverFill = fill(".div-block-6:hover");
    const hovered = hoverFill ? over(rgba(hoverFill), ground) : rest;
    const hoverLabel = declared(".div-block-6:hover", "color") ?? label;

    const pairs: Array<[string, string, number[]]> = [
      ["the title and intro on the band", ink!, ground],
      ["the text trigger's label at rest", label, rest],
      ["the text trigger's label hovered", hoverLabel, hovered],
    ];
    for (const [what, fg, bg] of pairs)
      expect(contrast(over(rgba(fg), bg), bg), what).toBeGreaterThanOrEqual(4.5);
  });

  it("carries each floor's trigger artwork to its trigger", () => {
    const { getByRole } = render(NavyFloorPlans, { props: { slice } });
    const cases: Array<[string, string]> = [
      ["3rd Floor", TRIGGER_3],
      ["2nd Floor", TRIGGER_2],
      ["1st Floor", TRIGGER_1],
    ];
    for (const [name, art] of cases)
      expect(getByRole("button", { name }).getAttribute("style"), name).toContain(art);
  });

  it("shows a floor's label as text until it has artwork, and keeps its name either way", () => {
    // The reference's 4th-floor trigger is the only one with no background PNG
    // and the only one with visible text. The other three bake their name into
    // the artwork, where only the accessible name can carry it.
    const plain = render(NavyFloorPlans, { props: { slice } });
    expect(plain.getByRole("button", { name: "4th Floor - Penthouse" }).textContent).toContain(
      "4th Floor - Penthouse",
    );
    cleanup();
    const withArt = withFloors((f) =>
      f.label === "4th Floor - Penthouse" ? { trigger_image: triggerImage(TRIGGER_1) } : {},
    );
    const art = render(NavyFloorPlans, { props: { slice: withArt } });
    const trigger = art.getByRole("button", { name: "4th Floor - Penthouse" });
    expect(trigger.getAttribute("style")).toContain(TRIGGER_1);
  });

  it("warms every hidden plan after load, with the candidate its <img> will use", () => {
    // Only the open plan is visible at rest; the other three are 2402x1392
    // PNGs inside hidden panels, so `loading="lazy"` defers each fetch until a
    // hover and the plan arrives after the swap. Measured on production before
    // the warm-up: 2 of 12 hidden images fetched before any interaction; after,
    // 12 of 12. Warming `src` alone caches the 2402w original while the <img>
    // goes on to fetch a smaller candidate, so srcset and sizes must match it.
    vi.mocked(preloadHidden).mockClear();
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const warmed = vi.mocked(preloadHidden).mock.lastCall?.[0];
    const hidden = FLOORS.filter((f) => !shownPlans(container).includes(f.plan));
    expect(hidden.length).toBeGreaterThan(0);
    for (const { plan: src } of hidden) {
      const img = container.querySelector(`img[src="${src}"]`)!;
      expect(warmed, src).toContainEqual(
        expect.objectContaining({
          src,
          srcset: img.getAttribute("srcset") ?? undefined,
          sizes: img.getAttribute("sizes") ?? undefined,
        }),
      );
    }
    // `.image-14` is hidden at ref css:2789 and nothing ever reveals it.
    expect(JSON.stringify(warmed)).not.toContain(FPO);
  });

  it("points every plan's src and srcset candidates at files that exist", () => {
    // Positive evidence: each candidate the browser may pick names a file on
    // disk, not merely the absence of a load error.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const urls = FLOORS.flatMap(({ plan: src }) => [
      src,
      ...(container.querySelector(`img[src="${src}"]`)?.getAttribute("srcset") ?? "")
        .split(",")
        .map((candidate) => candidate.trim().split(/\s+/)[0])
        .filter(Boolean),
    ]);
    const missing = urls.filter(
      (u) =>
        !existsSync(resolve(process.cwd(), "static", decodeURIComponent(u).replace(/^\//, ""))),
    );
    expect(missing).toEqual([]);
  });

  it("never displays the FPO placeholder the reference keeps in the 1st-floor panel", () => {
    // ref css:2789 hides `.image-14` and no reference JS chunk ever reveals it.
    // jsdom applies no stylesheet, so the rule that hides it is read directly.
    const { container } = render(NavyFloorPlans, { props: { slice } });
    const fpo = container.querySelector(`img[src="${FPO}"]`);
    const hiddenBy = fpo && [...fpo.classList].find((c) => declared(`.${c}`, "display") === "none");
    expect(!fpo || hiddenBy, "the FPO placeholder renders and no rule hides it").toBeTruthy();
  });

  it("keeps mocks.json aligned with model.json", () => {
    const model = JSON.parse(read("model.json"));
    const mocks = JSON.parse(read("mocks.json"));
    expect(model.id).toBe("navy_floor_plans");
    const variation = model.variations.find((v: { id: string }) => v.id === mocks[0].variation);
    expect(variation).toBeDefined();
    // A mock field with no model behind it is silently dropped by the Migration
    // API — the same failure src/lib/site-pages.test.ts guards.
    expect(Object.keys(mocks[0].primary).sort()).toEqual(Object.keys(variation.primary).sort());

    const groupFields = Object.keys(variation.primary.floors.config.fields);
    const items = mocks[0].primary.floors.value as Array<{ value: Array<[string, unknown]> }>;
    for (const item of items)
      for (const [key] of item.value) expect(groupFields, `unmodelled field ${key}`).toContain(key);

    const field = <T>(item: (typeof items)[number], name: string) =>
      item.value.find(([k]) => k === name)?.[1] as T | undefined;
    const open = items.filter(
      (item) => field<{ value: boolean }>(item, "open_by_default")?.value === true,
    );
    expect(open).toHaveLength(1);
    for (const item of items)
      expect(field<{ alt: string }>(item, "floorplan")?.alt, "a plan with no alt").toBeTruthy();
  });
});
