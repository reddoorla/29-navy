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

  it("fences off the dev/tooling, preview and starter-contact routes, nothing else", async () => {
    const body = await (await get("https://example.com")).text();
    const disallowed = [...body.matchAll(/Disallow: (\S+)/g)].map((m) => m[1]);
    expect(disallowed).toEqual(["/dev/", "/slice-simulator", "/preview/", "/contact"]);
  });

  // /contact is a reddoor-starter default this site never adopted: no nav item
  // points at it (site-config's "Contact" is the /#contact anchor), nothing in
  // src/ links to it, and it is absent from sitemap.xml — but it answers 200 and
  // renders the starter's unstyled form instead of this build's design. Whether
  // it should be deleted or built out for real is an open question (#32); either
  // answer leaves it wrong to have it indexed on the client's domain meanwhile.
  it("fences off the unlinked starter contact route", async () => {
    const body = await (await get("https://example.com")).text();
    const disallowed = [...body.matchAll(/Disallow: (\S+)/g)].map((m) => m[1]);
    expect(disallowed).toContain("/contact");
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
