import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import CtaBanner from "./index.svelte";

afterEach(() => cleanup());

/** A theme value as #rrggbb: hex (#rgb expanded), white/black, or an
 *  achromatic `oklch(L% 0 0)`, whose relative luminance is L³. */
function toHex(value: string): string | undefined {
  const v = value.trim().toLowerCase();
  if (v === "white") return "#ffffff";
  if (v === "black") return "#000000";
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${[...v.slice(1)].map((c) => c + c).join("")}`;
  const l = /^oklch\(\s*([\d.]+)%\s+0\s+0\s*\)$/.exec(v)?.[1];
  if (l === undefined) return undefined;
  const y = (Number(l) / 100) ** 3;
  const c = y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055;
  return `#${Math.round(c * 255)
    .toString(16)
    .padStart(2, "0")
    .repeat(3)}`;
}

/** Every colour a class can name: Tailwind's palette with app.css's @theme
 *  over it (cwd-relative: under jsdom `import.meta.url` is not a file: URL). */
const THEME: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const file of ["node_modules/tailwindcss/theme.css", "src/app.css"]) {
    const css = readFileSync(resolve(process.cwd(), file), "utf8");
    const body = /@theme[^{]*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
    for (const m of body.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/gi)) out[m[1]] = m[2];
  }
  return out;
})();

/** WCAG 2.x contrast between two #rrggbb values. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** A colour name's #rrggbb, or an arbitrary value's (`bg-[#0b1d3a]`); undefined
 *  when toHex cannot read it. */
const hexOf = (token: string) => toHex(token.startsWith("#") ? token : (THEME[token] ?? ""));

/** The colour of an element's own resting `<prefix>-*` class, if it paints one:
 *  `transparent` and `current` show what is behind or above them. */
const own = (el: Element, prefix: string) =>
  (el.getAttribute("class") ?? "")
    .split(/\s+/)
    .map((c) => new RegExp(`^${prefix}-(?:([a-z0-9-]+)|\\[(#[0-9a-f]{3,6})\\])$`, "i").exec(c))
    .map((m) => m?.[2] ?? m?.[1])
    .find(
      (token) =>
        token !== undefined &&
        (token.startsWith("#") ||
          (token in THEME && !/^(transparent|currentcolor|inherit)$/i.test(THEME[token].trim()))),
    );

/** The nearest such token on the element or an ancestor: what it is painted in. */
const painted = (el: Element | null, prefix: string): string | undefined =>
  el ? (own(el, prefix) ?? painted(el.parentElement, prefix)) : undefined;

const heading = [{ type: "heading2", text: "Ready to start your project?", spans: [] }];
const link = { link_type: "Web", url: "https://example.com" };

const makeSlice = (primary: Record<string, unknown> = {}) =>
  ({
    slice_type: "cta_banner",
    variation: "default",
    primary: {
      heading,
      buttonLabel: "Talk with us",
      buttonLink: link,
      background: "light",
      ...primary,
    },
    items: [],
  }) as never;

describe("CtaBanner slice", () => {
  it("renders the heading and the CTA as an anchor", () => {
    const { container, getByRole } = render(CtaBanner, {
      props: { slice: makeSlice() },
    });

    expect(getByRole("heading", { level: 2 }).textContent).toContain(
      "Ready to start your project?",
    );
    const cta = getByRole("link", { name: "Talk with us" });
    expect(cta.tagName).toBe("A");
    expect(cta.getAttribute("href")).toBe("https://example.com");
    // A navigating CTA is an <a>, never a <button> nested inside one.
    expect(cta.querySelector("button")).toBeNull();
    expect(container.querySelector('[data-slice-type="cta_banner"]')).not.toBeNull();
  });

  it("paints the selected ground, and keeps the heading and the CTA legible on each", () => {
    const grounds: Record<string, string | undefined> = {};
    for (const background of ["light", "dark", "white"]) {
      const { getByRole, unmount } = render(CtaBanner, {
        props: { slice: makeSlice({ background }) },
      });
      const heading = getByRole("heading", { level: 2 });
      const cta = getByRole("link", { name: "Talk with us" });
      // Nothing painted on the way up means the body's own colour and ground.
      const fgOf = (el: Element) => painted(el, "text") ?? "primary";
      const bgOf = (el: Element | null) => painted(el, "bg") ?? "background";
      const ground = bgOf(cta.parentElement);
      grounds[background] = ground;
      const pairs: [string, string, string, number][] = [
        ["heading", fgOf(heading), bgOf(heading), 4.5],
        ["CTA label", fgOf(cta), bgOf(cta), 4.5],
      ];
      // WCAG 1.4.11: the outline, or the CTA's own fill, is what draws the
      // button. With neither it is a text link, and its label is the measure.
      const outline =
        own(cta, "border") ??
        (cta.classList.contains("border-current") ? fgOf(cta) : own(cta, "bg"));
      if (outline) pairs.push(["CTA outline", outline, ground, 3]);
      for (const [what, fg, bg, floor] of pairs) {
        expect(
          hexOf(fg) && hexOf(bg),
          `${what} on the ${background} ground is unmeasured: ${fg} on ${bg}`,
        ).toBeTruthy();
        expect(
          contrast(hexOf(fg)!, hexOf(bg)!),
          `${what} on the ${background} ground: ${fg} on ${bg}`,
        ).toBeGreaterThanOrEqual(floor);
      }
      unmount();
    }
    expect(grounds.dark).not.toBe(grounds.light);
  });

  it("omits the CTA when the link or the label is missing", () => {
    const { container: noLabel } = render(CtaBanner, {
      props: { slice: makeSlice({ buttonLabel: "" }) },
    });
    expect(noLabel.querySelector(`a[href="${link.url}"]`)).toBeNull();
    cleanup();

    const { container: noLink } = render(CtaBanner, {
      props: { slice: makeSlice({ buttonLink: null }) },
    });
    expect(noLink.textContent).not.toContain("Talk with us");
  });
});
