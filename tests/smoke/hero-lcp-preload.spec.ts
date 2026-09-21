import { test, expect } from "@playwright/test";
// Playwright runs this file as native ESM in Node, where JSON imports require
// the explicit attribute (see tests/smoke/routes.ts).
import slicemachineConfig from "../../slicemachine.config.json" with { type: "json" };

// The first hero slide is the homepage's LCP element, and it paints as a CSS
// background — invisible to the preload scanner. This block guards the
// <link rel="preload"> that starts its fetch with the document, whose one hard
// requirement is an href IDENTICAL to the URL the slide paints.
//
// The preload is the SMALLER half of #48, and it is worth saying so here because
// the issue first said otherwise. It was proposed as the whole fix, on a reading
// of Lighthouse's LCP phase breakdown ("discovered 1.1–2.4s late") that turned
// out to be scaled simulator output rather than a measurement. Measured, the
// preload alone moved five runs from 79,79,79,87,88 to 86,93,74,85,79. What
// governs the score is the second describe block in this file.
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

// THE PART THAT ACTUALLY MOVES THE SCORE. #48's first diagnosis (late discovery
// of the hero) was wrong; blocking requests on production showed the score is
// governed by what loads ALONGSIDE the first slide. With slides 2–6 (414KB) and
// the aerial (201KB) out of the first burst: 97, 96, 98. With them in: 73–94.
// And the aerial landing in an unreserved box is the 0.12–0.14 layout shift.
test.describe("the first burst is the first slide (#48)", () => {
  test.skip(isPlaceholderRepo, "no CMS content: the slides are the stylesheet defaults");

  const slideStyles = (html: string) =>
    [...html.matchAll(/<div class="[^"]*\bw-slide\b[^"]*" style="([^"]*)"/g)].map((m) =>
      decodeHtml(m[1]!),
    );

  test("the server's HTML paints the first slide and tells the other five `none`", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    const styles = slideStyles(html);
    expect(styles).toHaveLength(6);
    expect(styles[0]).toMatch(/background-image:\s*url\("/);
    // `none`, not merely absent: each slide class has a default photograph in
    // the stylesheet, and an absent declaration falls through to it.
    for (const style of styles.slice(1)) expect(style).toContain("background-image: none");
  });

  test("the browser fetches slides 2–6 only after `load`, and never the stylesheet defaults", async ({
    page,
  }) => {
    const seen: { url: string; at: number }[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "image") seen.push({ url: r.url(), at: Date.now() });
    });
    let loadedAt = 0;
    page.once("load", () => (loadedAt = Date.now()));
    await page.goto("/", { waitUntil: "load" });

    const painted = () =>
      page
        .locator(".w-slider-mask .w-slide")
        .evaluateAll((els) =>
          els.map(
            (el) => /url\("([^"]+)"\)/.exec(getComputedStyle(el).backgroundImage)?.[1] ?? null,
          ),
        );
    // Positive evidence that the release happens in a real browser: all six end
    // up painted. Without this, "nothing was fetched early" would also be
    // satisfied by a slider that never paints them at all.
    await expect
      .poll(async () => (await painted()).filter(Boolean).length, { timeout: 10_000 })
      .toBe(6);

    expect(loadedAt, "the load event was observed").toBeGreaterThan(0);
    for (const url of (await painted()).slice(1)) {
      const hits = seen.filter((s) => s.url === url);
      expect(hits.length, `requests for ${url}`).toBeGreaterThan(0);
      expect(hits[0]!.at, `${url} requested before load`).toBeGreaterThanOrEqual(loadedAt);
    }
    // The captured reference JPEGs behind the slide classes must never load
    // while authored photographs exist.
    expect(
      seen
        .map((s) => s.url)
        .filter((u) => /\/29navy\/assets\/[^?]*(gallery_|hero-main-final)/.test(u)),
      "stylesheet-default slide photographs fetched",
    ).toEqual([]);
  });

  test("the aerial is sized for the device and its box is reserved", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const tag =
      /<img\b[^>]*class="[^"]*\bimage-18\b[^"]*"[^>]*>|<img\b[^>]*\bimage-18\b[^>]*>/.exec(
        html,
      )?.[0];
    expect(tag, "the aerial <img>").toBeTruthy();
    expect(tag).toMatch(/\bsrcset="[^"]*\b480w[^"]*\b768w[^"]*\b1024w[^"]*\b1440w"/);
    expect(tag).toMatch(/\bsizes="100vw"/);
    expect(tag).toMatch(/\bwidth="\d+"/);
    expect(tag).toMatch(/\bheight="\d+"/);
    expect(tag).toMatch(/\bloading="lazy"/);
  });

  test("the aerial arriving late does not shift the page on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const w = window as unknown as { __shifts: number[] };
      w.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[])
          if (!e.hadRecentInput) w.__shifts.push(e.value);
      }).observe({ type: "layout-shift", buffered: true });
    });
    // Deterministic, where production was a race: hold the aerial's response
    // until well after first paint, so it ALWAYS lands in a laid-out page.
    let delayed = 0;
    await page.route(/location-aerial/, async (route) => {
      delayed++;
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto("/", { waitUntil: "load" });

    // A zero is only meaningful if the image was really shown and really late.
    const aerial = page.locator("#Mobile-location img.image-18");
    await expect(aerial).toBeVisible();
    await expect
      .poll(
        () => aerial.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        {
          timeout: 15_000,
        },
      )
      .toBe(true);
    expect(delayed, "the aerial request was intercepted and delayed").toBeGreaterThan(0);
    await page.waitForTimeout(300);

    const cls = await page.evaluate(() =>
      (window as unknown as { __shifts: number[] }).__shifts.reduce((a, b) => a + b, 0),
    );
    // Measured on production without the reserved box: 0.115–0.142.
    expect(cls, "cumulative layout shift").toBeLessThan(0.02);
  });
});

// The aerial has a SECOND consumer: the desktop Location band paints it as a CSS
// background, and the band is `display: none` at <=767. Its url used to be an
// inline `background-image`, which the browser resolves when the element is
// parsed, whether or not the stylesheet that hides the band has arrived yet.
// Measured on the 2026-09-21 deploy, a phone downloaded that 201KB original in
// 13 of 20 loads, every fetch starting BEFORE the stylesheet finished. It went
// unseen while the mobile <img> used the same URL, because the two shared one
// request; giving the <img> its own renditions is what split them apart.
test.describe("a phone never downloads the desktop band's photograph (#48)", () => {
  test.skip(isPlaceholderRepo, "no CMS content: the band has no authored photograph");

  const bandPhoto = (html: string) => {
    const tag = /<div id="Location"[^>]*>/.exec(html)?.[0] ?? "";
    const style = decodeHtml(/\bstyle="([^"]*)"/.exec(tag)?.[1] ?? "");
    return { style, url: /--band-photo:\s*url\("([^"]+)"\)/.exec(style)?.[1] };
  };

  test("the server's HTML carries the photograph as a custom property", async ({ request }) => {
    const { style, url } = bandPhoto(await (await request.get("/")).text());
    expect(url, "an authored photograph on --band-photo").toBeTruthy();
    expect(style).not.toContain("background-image");
  });

  test("a phone makes no request for it before any stylesheet has arrived", async ({
    page,
    request,
  }) => {
    const { url } = bandPhoto(await (await request.get("/")).text());
    expect(url, "an authored photograph on --band-photo").toBeTruthy();

    // The defect is a race against the stylesheet, and THIS HARNESS CANNOT LOSE
    // IT: `vite dev` inlines the page's CSS into the document, so `display: none`
    // is always known at first style resolution. Holding `.css` responses back
    // was tried first and passed with the defect restored, i.e. it was vacuous.
    // So the losing side of the race is modelled instead: the document is served
    // with every stylesheet removed, which is exactly the moment in which
    // production fetched the photograph. The markup alone must request nothing.
    let stripped = 0;
    await page.route(
      (u) => u.pathname === "/",
      async (route) => {
        const response = await route.fetch();
        const body = (await response.text())
          .replace(/<style\b[\s\S]*?<\/style>/g, () => (stripped++, ""))
          .replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, () => (stripped++, ""));
        await route.fulfill({ response, body });
      },
    );
    const images: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "image") images.push(r.url());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "load" });

    expect(stripped, "stylesheets removed from the served document").toBeGreaterThan(0);
    // Positive evidence that the listener saw this load's images at all.
    expect(images.length, "image requests observed").toBeGreaterThan(0);
    expect(images.filter((u) => u === url)).toEqual([]);
  });

  test("the desktop band still paints it, fetched by the stylesheet", async ({ page, request }) => {
    const { url } = bandPhoto(await (await request.get("/")).text());
    expect(url, "an authored photograph on --band-photo").toBeTruthy();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "load" });

    const band = page.locator("#Location");
    await expect(band).toBeVisible();
    expect(await band.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe(`url("${url}")`);
    const initiators = await page.evaluate(
      (name) =>
        (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
          .filter((e) => e.name === name)
          .map((e) => e.initiatorType),
      url!,
    );
    expect(initiators).toEqual(["css"]);
  });
});
