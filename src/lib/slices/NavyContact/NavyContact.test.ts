import { render, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps } from "svelte";
import NavyContact from "./index.svelte";

afterEach(() => cleanup());

type Slice = ComponentProps<typeof NavyContact>["slice"];

const PHOTO = "/29navy/assets/68b712e52ecd74e0d37afd1d_matthew-lejune-dv1r5Pftdzk-unsplash.jpg";
const ALT = "Sunlight falling across the brick facade of the 29 Navy building.";
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

const ADDRESS = ["29 Navy Street ", "Venice, California 90291 "];
const LINKS = [
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
];

const slice = {
  slice_type: "navy_contact",
  variation: "default",
  primary: {
    heading: [{ type: "heading1", text: "Contact", spans: [] }],
    address_line_1: ADDRESS[0],
    address_line_2: ADDRESS[1],
    links: LINKS,
    photo: {
      url: PHOTO,
      alt: ALT,
      dimensions: { width: 4240, height: 2832 },
    },
  },
} as unknown as Slice;

const view = (s: Slice = slice) => render(NavyContact, { props: { slice: s } });
const mount = (s: Slice = slice) => view(s).container;

describe("NavyContact slice", () => {
  it("renders the heading and both address lines", () => {
    const { container, getByRole } = view();
    expect(getByRole("heading", { name: "Contact" })).toBeTruthy();
    for (const line of ADDRESS) expect(container.textContent).toContain(line.trim());
  });

  it("links every authored entry to its own target, with no U+200D in any href", () => {
    const anchors = [...mount().querySelectorAll("a")];
    const hrefs = anchors.map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining(LINKS.map((l) => l.target.url)));
    for (const link of LINKS) {
      const a = anchors.find((el) => el.getAttribute("href") === link.target.url)!;
      expect(a.textContent).toContain(link.label.trim());
      expect(a.textContent).toContain(link.value);
    }
    // The tel: href agrees with the DISPLAYED number.
    const phone = anchors.find((a) => a.getAttribute("href")!.startsWith("tel:"))!;
    expect(phone.getAttribute("href")!.replace(/\D/g, "")).toContain(
      phone.textContent!.replace(/\D/g, "").slice(-10),
    );
    // The component appends a joiner to the link TEXT; it must never reach the
    // href, where it breaks the mail client.
    for (const href of hrefs) expect(href!.includes(ZWJ)).toBe(false);
  });

  it("carries the id the navbar's Contact link targets, and no field can move it", () => {
    const { nav } = JSON.parse(readFileSync(resolve(ROOT, "src/lib/site-config.json"), "utf8")) as {
      nav: { items: Array<{ href: string }> };
    };
    expect(nav.items.map((item) => item.href)).toContain("/#contact");
    expect(mount().querySelector("#contact")).not.toBeNull();
    const model = JSON.parse(read("model.json"));
    expect(Object.keys(model.variations[0].primary)).not.toContain("id");
  });

  it("ends the contact block with a link to the privacy policy, whatever is authored", () => {
    // 29 Navy has no footer, so this block carries the /privacy link
    // (reddoor-maintenance#1055); its height cost is in matching/LEDGER.md.
    const bare = {
      ...slice,
      primary: { ...slice.primary, heading: [], photo: {}, links: [] },
    } as unknown as Slice;
    for (const s of [slice, bare]) {
      const anchors = [...mount(s).querySelectorAll("#contact a")];
      const last = anchors[anchors.length - 1]!;
      expect(last.getAttribute("href")).toBe("/privacy");
      expect(last.textContent).toBe("Privacy Policy");
    }
  });

  it("sets slice data attributes", () => {
    const section = mount().querySelector("[data-slice-type='navy_contact']");
    expect(section?.getAttribute("data-slice-variation")).toBe("default");
  });

  it('shows the authored photo with its alt, and alt="" when none is authored', () => {
    const img = mount().querySelector("img")!;
    expect(img.getAttribute("src")).toContain(PHOTO);
    expect(img.getAttribute("alt")).toBe(ALT);
    const bare = {
      ...slice,
      primary: { ...slice.primary, photo: { ...slice.primary.photo, alt: null } },
    } as unknown as Slice;
    // A null alt must still render alt="", never drop the attribute.
    expect(mount(bare).querySelector("img")!.getAttribute("alt")).toBe("");
  });

  it("renders no <img> and no empty heading when those fields are unfilled", () => {
    const bare = {
      ...slice,
      primary: { ...slice.primary, heading: [], photo: {}, links: [] },
    } as unknown as Slice;
    const { container, queryByRole } = view(bare);
    expect(container.querySelector("img")).toBeNull();
    expect(queryByRole("heading")).toBeNull();
    // The address still stands.
    for (const line of ADDRESS) expect(container.textContent).toContain(line.trim());
  });

  it("renders a link for every authored entry, never a hard-coded three", () => {
    const extra = {
      label: "Visit:",
      value: "Instagram",
      target: { link_type: "Web", url: "https://x.test" },
    };
    const four = {
      ...slice,
      primary: { ...slice.primary, links: [...LINKS, extra] },
    } as unknown as Slice;
    const hrefs = [...mount(four).querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining([...LINKS, extra].map((l) => l.target.url)));
  });

  it("keeps mocks.json aligned with model.json, with working hrefs and real alt", () => {
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

    const group = mocks[0].primary.links.value as Array<{
      value: Array<[string, { value: unknown }]>;
    }>;
    // The group's field names match the model's group fields exactly.
    const groupFields = Object.keys(
      (variation.primary.links as { config: { fields: object } }).config.fields,
    ).sort();
    for (const item of group) expect(item.value.map(([k]) => k).sort()).toEqual(groupFields);

    // The reference ships href="https://(310) 393-9653" — an invalid URL with a
    // different number from the one it displays — and a mailto with U+200D
    // inside the address. mocks.json is what the dev route renders, so it is
    // the file that can quietly reintroduce either.
    const flat = group.map((item) => Object.fromEntries(item.value));
    for (const f of flat) {
      const target = f.target.value as { __TYPE__: string; url: string };
      if (target.__TYPE__ !== "ExternalLink") continue;
      const url = target.url;
      expect(URL.canParse(url), url).toBe(true);
      expect(url.includes(ZWJ), `U+200D in ${url}`).toBe(false);
      if (url.startsWith("tel:"))
        expect(url.replace(/\D/g, "")).toContain(String(f.value.value).replace(/\D/g, ""));
    }
    expect(JSON.stringify(mocks)).not.toContain("https://(310)");

    expect(mocks[0].primary.photo.alt.trim()).not.toBe("");
  });

  it("resolves the photo's src and every srcset candidate to a file on disk", () => {
    // .section-7 has no background of its own, so a 404 leaves white showing
    // through the band beside the black panel. Positive evidence: each URL
    // names a file that exists, not merely the absence of a load error.
    const mocks = JSON.parse(read("mocks.json"));
    const img = mount().querySelector("img")!;
    const urls = [
      mocks[0].primary.photo.url as string,
      img.getAttribute("src"),
      ...(img.getAttribute("srcset") ?? "").split(",").map((c) => c.trim().split(/\s+/)[0]),
    ].filter((u): u is string => Boolean(u));
    expect(urls.length).toBeGreaterThanOrEqual(2);
    const missing = urls.filter(
      (u) =>
        !statSync(resolve(ROOT, "static", u.replace(/^\//, "")), {
          throwIfNoEntry: false,
        })?.isFile(),
    );
    expect(missing).toEqual([]);
  });
});
