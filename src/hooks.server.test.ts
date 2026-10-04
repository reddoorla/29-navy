import { describe, it, expect } from "vitest";
import { handle } from "./hooks.server";
import {
  CMS_FRAME_ANCESTORS,
  isCmsFramedRoute,
  widenFrameAncestors,
} from "$lib/security/cms-framing";

function respond(href: string) {
  const input = {
    event: { url: new URL(href) },
    resolve: async () =>
      new Response("<!doctype html>", { headers: { "Content-Type": "text/html" } }),
  } as unknown as Parameters<typeof handle>[0];

  return handle(input);
}

describe("handle", () => {
  it("sets the baseline security headers on every response", async () => {
    const response = await respond("https://29navy.com/");

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("tells crawlers not to index the Netlify host", async () => {
    const response = await respond("https://29-navy.netlify.app/health");

    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("tells crawlers not to index a deploy preview", async () => {
    const response = await respond("https://deploy-preview-42--29-navy.netlify.app/");

    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("leaves the real domain indexable", async () => {
    for (const href of ["https://29navy.com/", "https://www.29navy.com/health"]) {
      const response = await respond(href);
      expect(response.headers.get("X-Robots-Tag")).toBeNull();
    }
  });
});

const POLICY =
  "default-src 'self'; frame-src 'self' https://repo.prismic.io; frame-ancestors 'self'; base-uri 'self'";

async function headersFor(pathname: string, policy: string | null = POLICY) {
  const response = await handle({
    event: { url: new URL(`https://29navy.com${pathname}`) } as never,
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
    const headers = await headersFor("/about");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Content-Security-Policy")).toBe(POLICY);
  });

  it("lets Prismic frame /slice-simulator: no X-Frame-Options, widened frame-ancestors", async () => {
    const headers = await headersFor("/slice-simulator");
    expect(headers.get("X-Frame-Options")).toBeNull();
    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain(CMS_FRAME_ANCESTORS);
    expect(csp.match(/frame-ancestors/g)).toHaveLength(1);
    expect(csp).toContain("frame-src 'self' https://repo.prismic.io");
    expect(csp).toContain("base-uri 'self'");
  });

  it("treats a trailing slash as the same route, and nothing else", () => {
    expect(isCmsFramedRoute("/slice-simulator/")).toBe(true);
    expect(isCmsFramedRoute("/slice-simulator-x")).toBe(false);
    expect(isCmsFramedRoute("/slice-simulator/x")).toBe(false);
    expect(isCmsFramedRoute("/")).toBe(false);
  });

  it("adds frame-ancestors when the policy has none", () => {
    expect(widenFrameAncestors("default-src 'self'")).toBe(
      `default-src 'self'; ${CMS_FRAME_ANCESTORS}`,
    );
  });

  it("leaves a response without a CSP without one", async () => {
    const headers = await headersFor("/slice-simulator", null);
    expect(headers.get("Content-Security-Policy")).toBeNull();
    expect(headers.get("X-Frame-Options")).toBeNull();
  });
});
