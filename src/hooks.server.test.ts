import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { handle } from "./hooks.server";
import {
  CMS_FRAMED_ROUTES,
  CMS_FRAME_ANCESTORS,
  isCmsFramedRoute,
  widenFrameAncestors,
} from "$lib/security/cms-framing";

function respond(href: string, routeId: string | null) {
  const input = {
    event: { url: new URL(href), route: { id: routeId } },
    resolve: async () =>
      new Response("<!doctype html>", { headers: { "Content-Type": "text/html" } }),
  } as unknown as Parameters<typeof handle>[0];

  return handle(input);
}

describe("handle", () => {
  it("sets the baseline security headers on every response", async () => {
    const response = await respond("https://29navy.com/", "/[[preview=preview]]");

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("tells crawlers not to index the Netlify host", async () => {
    const response = await respond("https://29-navy.netlify.app/health", "/health");

    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("tells crawlers not to index a deploy preview", async () => {
    const response = await respond(
      "https://deploy-preview-42--29-navy.netlify.app/",
      "/[[preview=preview]]",
    );

    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("leaves the real domain indexable", async () => {
    for (const [href, routeId] of [
      ["https://29navy.com/", "/[[preview=preview]]"],
      ["https://www.29navy.com/health", "/health"],
    ]) {
      const response = await respond(href, routeId);
      expect(response.headers.get("X-Robots-Tag")).toBeNull();
    }
  });
});

const POLICY =
  "default-src 'self'; frame-src 'self' https://repo.prismic.io; frame-ancestors 'self'; base-uri 'self'";

async function headersFor(
  pathname: string,
  routeId: string | null,
  policy: string | null = POLICY,
) {
  const response = await handle({
    event: { url: new URL(`https://29navy.com${pathname}`), route: { id: routeId } } as never,
    resolve: async () =>
      new Response("<html></html>", {
        headers: {
          "content-type": "text/html",
          ...(policy ? { "Content-Security-Policy": policy } : {}),
        },
      }),
  });
  return response.headers;
}

describe("CMS framing", () => {
  it("keeps every ordinary page SAMEORIGIN with frame-ancestors 'self'", async () => {
    const headers = await headersFor("/about", "/[[preview=preview]]/[uid]");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Content-Security-Policy")).toBe(POLICY);
  });

  it("lets Prismic frame /slice-simulator: no X-Frame-Options, widened frame-ancestors", async () => {
    const headers = await headersFor("/slice-simulator", "/slice-simulator");
    expect(headers.get("X-Frame-Options")).toBeNull();
    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain(CMS_FRAME_ANCESTORS);
    expect(csp.match(/frame-ancestors/g)).toHaveLength(1);
    expect(csp).toContain("frame-src 'self' https://repo.prismic.io");
    expect(csp).toContain("base-uri 'self'");
  });

  it("frames the route SvelteKit resolved, so an encoded path gets the same headers", async () => {
    const headers = await headersFor("/slice%2Dsimulator", "/slice-simulator");
    expect(headers.get("X-Frame-Options")).toBeNull();
    expect(headers.get("Content-Security-Policy")).toContain(CMS_FRAME_ANCESTORS);
  });

  it("keeps a path that only looks like the simulator SAMEORIGIN when no route matched", async () => {
    const headers = await headersFor("/slice-simulator", null);
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Content-Security-Policy")).toBe(POLICY);
  });

  it("names only route ids that exist, so moving the page cannot silently unframe it", () => {
    for (const id of CMS_FRAMED_ROUTES) {
      const dir = join("src/routes", ...id.split("/").filter(Boolean));
      expect(
        readdirSync(dir).some((file) => file.startsWith("+page.")),
        id,
      ).toBe(true);
    }
  });

  it("matches the route id exactly", () => {
    expect(isCmsFramedRoute("/slice-simulator")).toBe(true);
    expect(isCmsFramedRoute("/slice-simulator/")).toBe(false);
    expect(isCmsFramedRoute("/slice-simulator-x")).toBe(false);
    expect(isCmsFramedRoute("/slice-simulator/x")).toBe(false);
    expect(isCmsFramedRoute("/[[preview=preview]]/[uid]")).toBe(false);
    expect(isCmsFramedRoute(null)).toBe(false);
  });

  it("adds frame-ancestors when the policy has none", () => {
    expect(widenFrameAncestors("default-src 'self'")).toBe(
      `default-src 'self'; ${CMS_FRAME_ANCESTORS}`,
    );
  });

  it("leaves a response without a CSP without one", async () => {
    const headers = await headersFor("/slice-simulator", "/slice-simulator", null);
    expect(headers.get("Content-Security-Policy")).toBeNull();
    expect(headers.get("X-Frame-Options")).toBeNull();
  });
});
