import { describe, it, expect } from "vitest";
import { handle } from "./hooks.server";

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
