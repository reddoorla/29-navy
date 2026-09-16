import { describe, it, expect, vi, beforeEach } from "vitest";

// Same shape as the /health test's mocks: hoisted so the (also hoisted)
// vi.mock factory closes over the same objects, with `isPlaceholderRepo`
// exposed as a getter so the endpoint's live ES binding re-reads it.
const mocks = vi.hoisted(() => ({
  isPlaceholderRepo: false,
  getAllByType: vi.fn<() => Promise<unknown[]>>(),
}));

vi.mock("$lib/prismicio", () => ({
  createClient: () => ({ getAllByType: mocks.getAllByType }),
  get isPlaceholderRepo() {
    return mocks.isPlaceholderRepo;
  },
}));

import { GET } from "./+server";

function get(origin: string) {
  return GET({
    fetch: vi.fn(),
    url: new URL(`${origin}/sitemap.xml`),
  } as unknown as Parameters<typeof GET>[0]);
}

const locsIn = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

beforeEach(() => {
  mocks.isPlaceholderRepo = false;
  mocks.getAllByType.mockReset();
  mocks.getAllByType.mockResolvedValue([
    { uid: "home", last_publication_date: "2026-09-12T17:49:00.000Z" },
    { uid: "terms", last_publication_date: "2026-09-12T17:49:00.000Z" },
  ]);
});

describe("GET /sitemap.xml", () => {
  it("lists one absolute URL per page document, home at the root", async () => {
    const xml = await (await get("https://29navy.com")).text();
    expect(locsIn(xml)).toEqual(["https://29navy.com/", "https://29navy.com/terms"]);
  });

  it("serves application/xml", async () => {
    const response = await get("https://29navy.com");
    expect(response.headers.get("Content-Type")).toBe("application/xml");
  });

  // A sitemap is a crawl invitation. On the Netlify host it invites indexing of
  // a duplicate of the client's site, so it must offer nothing there — while
  // staying well-formed, since an unparseable sitemap is a different defect.
  it("offers no URLs on a Netlify host", async () => {
    for (const origin of [
      "https://29-navy.netlify.app",
      "https://deploy-preview-42--29-navy.netlify.app",
    ]) {
      const xml = await (await get(origin)).text();
      expect(locsIn(xml)).toEqual([]);
      expect(xml).toContain("<urlset");
    }
  });

  it("does not ask Prismic for documents it would not list anyway", async () => {
    await get("https://29-navy.netlify.app");
    expect(mocks.getAllByType).not.toHaveBeenCalled();
  });
});
