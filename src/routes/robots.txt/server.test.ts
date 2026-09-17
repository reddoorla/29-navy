import { describe, it, expect } from "vitest";
import { GET } from "./+server";

function get(origin: string) {
  return GET({
    url: new URL(`${origin}/robots.txt`),
  } as Parameters<typeof GET>[0]);
}

describe("GET /robots.txt", () => {
  it("targets all agents", async () => {
    const body = await (await get("https://example.com")).text();
    expect(body).toContain("User-agent: *");
  });

  it("fences off the dev/tooling and preview routes, nothing else", async () => {
    const body = await (await get("https://example.com")).text();
    const disallowed = [...body.matchAll(/Disallow: (\S+)/g)].map((m) => m[1]);
    expect(disallowed).toEqual(["/dev/", "/slice-simulator", "/preview/"]);
  });

  // #39 added `Disallow: /contact` for the starter's unlinked contact route
  // while #32 was undecided. #32 deleted the route, so the line would now fence
  // a URL that 404s — noise that reads as if something still lives there.
  it("no longer fences /contact, which no longer exists", async () => {
    const body = await (await get("https://example.com")).text();
    expect(body).not.toContain("/contact");
  });

  it("points at the sitemap with an absolute URL on the request origin", async () => {
    const body = await (await get("https://example.com")).text();
    expect(body).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("serves text/plain", async () => {
    const response = await get("https://example.com");
    expect(response.headers.get("Content-Type")).toBe("text/plain");
  });
});

// The site is served on two hosts: the client's domain and the Netlify host it
// was built on, which keeps serving the same build forever. Both answer 200 for
// every route, so an indexed `29-navy.netlify.app` is duplicate content
// competing with the client's own domain.
describe("GET /robots.txt on a Netlify host", () => {
  const netlifyHosts = [
    "https://29-navy.netlify.app",
    "https://deploy-preview-42--29-navy.netlify.app",
  ];

  it("disallows the whole host", async () => {
    for (const origin of netlifyHosts) {
      const body = await (await get(origin)).text();
      const disallowed = [...body.matchAll(/Disallow: (\S+)/g)].map((m) => m[1]);
      expect(disallowed).toEqual(["/"]);
    }
  });

  it("does not advertise a sitemap, which would invite the crawl it just refused", async () => {
    for (const origin of netlifyHosts) {
      const body = await (await get(origin)).text();
      expect(body).not.toContain("Sitemap:");
    }
  });

  it("still targets all agents", async () => {
    const body = await (await get(netlifyHosts[0])).text();
    expect(body).toContain("User-agent: *");
  });
});
