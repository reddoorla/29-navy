import { test, expect } from "@playwright/test";
// Playwright runs this file as native ESM in Node, where JSON imports require
// the explicit attribute (see tests/smoke/routes.ts).
import slicemachineConfig from "../../slicemachine.config.json" with { type: "json" };

// The first hero slide is the homepage's LCP element, and it paints as a CSS
// background — invisible to the preload scanner. #48 measured the cost: found
// 1.1–2.4s late, LCP 5.3–5.7s in the slow mode, Lighthouse performance flipping
// between ~90 and ~72. The fix is one <link rel="preload"> whose href is the
// IDENTICAL URL the slide paints.
//
// WHAT THIS FILE CAN AND CANNOT PROVE. The shared harness boots `vite dev`, not
// a production build (configs/playwright-a11y: `npm run vite:dev`). So this
// guards the SSR markup and the browser's behaviour against a regression; it is
// NOT the production proof. That was taken separately on `vite preview` and on
// the Netlify deploy preview, and is recorded in docs/workJournal.md.

// A fresh clone has no CMS, "/" 404s by design (tests/smoke/routes.ts), and the
// slides paint stylesheet defaults with no authored URL to preload.
const isPlaceholderRepo = slicemachineConfig.repositoryName === "your-prismic-repo-name";

const decodeHtml = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

test.describe("hero LCP preload (#48)", () => {
  test.skip(isPlaceholderRepo, "no CMS content: nothing authored to preload");

  test("the server's HTML preloads the first slide from the exact URL it paints", async ({
    request,
  }) => {
    // The RAW response, not the DOM: a preload only helps if it is in the bytes
    // the preload scanner reads, before any script has run.
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const html = await response.text();
    const head = html.slice(0, html.indexOf("</head>"));

    const imagePreloads = (head.match(/<link\b[^>]*>/g) ?? []).filter(
      (tag) => /\brel="preload"/.test(tag) && /\bas="image"/.test(tag),
    );
    // Exactly one: every extra high-priority preload competes with the LCP.
    expect(imagePreloads, "image preloads in <head>").toHaveLength(1);
    const tag = imagePreloads[0]!;
    expect(tag).toMatch(/\bfetchpriority="high"/);
    // A CSS background cannot consume a srcset candidate, so offering one
    // guarantees the preloaded URL is not the painted one.
    expect(tag).not.toMatch(/\bimagesrcset=/);

    const href = decodeHtml(/\bhref="([^"]*)"/.exec(tag)![1]!);
    const firstSlideStyle = /<div class="[^"]*\bw-slide\b[^"]*" style="([^"]*)"/.exec(html);
    expect(firstSlideStyle, "first .w-slide with an inline style").not.toBeNull();
    const painted = /background-image:\s*url\("([^"]+)"\)/.exec(
      decodeHtml(firstSlideStyle![1]!),
    )?.[1];
    expect(painted, "first slide's background-image URL").toBeTruthy();
    expect(href).toBe(painted);
  });

  test("the browser fetches that photograph once, and the preload is what fetched it", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    const painted = await page
      .locator(".w-slider-mask .w-slide")
      .first()
      .evaluate((el) => /url\("([^"]+)"\)/.exec(getComputedStyle(el).backgroundImage)?.[1]);
    expect(painted, "first slide's computed background-image URL").toBeTruthy();

    // "Fetched once" alone is vacuous — with NO preload the stylesheet also
    // fetches it exactly once. The positive evidence is WHO fetched it: a
    // resource the <link> loaded reports initiatorType "link", one the
    // stylesheet loaded reports "css". A preload whose URL is off by one
    // character leaves this entry as "css"; a fetch the stylesheet could not
    // reuse (a credentials-mode mismatch, say) leaves two entries.
    const entries = await page.evaluate(
      (url) =>
        performance
          .getEntriesByType("resource")
          .filter((e) => e.name === url)
          .map((e) => (e as PerformanceResourceTiming).initiatorType),
      painted!,
    );
    expect(entries, `resource timing entries for ${painted}`).toEqual(["link"]);
  });
});
