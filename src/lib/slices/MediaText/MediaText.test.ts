import { render } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import MediaText from "./index.svelte";

function makeSlice(variation: "imageRight" | "imageLeft") {
  return {
    slice_type: "media_text",
    variation,
    primary: {
      heading: [{ type: "heading2", text: "Amenities", spans: [] }],
      body: [{ type: "paragraph", text: "A resort-style pool.", spans: [] }],
      media: {
        url: "https://img.example/pool.jpg",
        alt: "Pool",
        dimensions: { width: 800, height: 600 },
      },
    },
    items: [],
  } as unknown as Content.MediaTextSlice;
}

describe("MediaText slice", () => {
  it("renders heading, body, and image with alt", () => {
    const { getByRole } = render(MediaText, {
      props: { slice: makeSlice("imageRight") },
    });
    expect(getByRole("heading", { level: 2 }).textContent).toContain("Amenities");
    expect(getByRole("img").getAttribute("alt")).toBe("Pool");
  });

  it("puts the image first for imageLeft and second for imageRight", () => {
    const order = (el: Element) => {
      const t = /(?:^|\s)lg:order-(first|last|\d+)(?=\s|$)/.exec(el.className)?.[1];
      return t === "first" ? -Infinity : t === "last" ? Infinity : Number(t ?? 0);
    };
    const imageLeads = (variation: "imageRight" | "imageLeft") => {
      const { container, unmount } = render(MediaText, { props: { slice: makeSlice(variation) } });
      const media = container.querySelector(".mt-media")!;
      const copy = container.querySelector(".mt-copy")!;
      const leads =
        order(media) < order(copy) ||
        (order(media) === order(copy) &&
          !!(media.compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING));
      unmount();
      return leads;
    };
    expect(imageLeads("imageLeft")).toBe(true);
    expect(imageLeads("imageRight")).toBe(false);
  });
});
