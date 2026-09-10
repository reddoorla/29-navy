/**
 * Warm the browser cache for images that are IN the DOM but not visible, so
 * revealing them does not show a blank box first.
 *
 * `loading="lazy"` on an image inside a `display: none` container is never
 * "near the viewport", so the browser defers the fetch until the container is
 * shown — and then the user watches it arrive. On this site that is 14 images
 * behind the six resident modals and three of the four floor plans (2402×1392
 * PNGs, 50–161KB each), all of which appear on a click or a hover.
 *
 * Deliberately AFTER `load`, not on mount. These images are, by construction,
 * not needed for first paint, and fetching them early would compete with the
 * hero slides and the LCP image for connections on exactly the slow links where
 * that matters most. `requestIdleCallback` then waits for a quiet main thread.
 * The result is a cache warm-up that costs the initial render nothing.
 *
 * Uses `new Image()` rather than `<link rel="preload">`: a preload the browser
 * does not use within a few seconds logs a console warning, and these may never
 * be used at all if nobody opens a modal. An Image() fetch is the same request
 * with the same cache entry and no warning.
 *
 * PASS THE SRCSET WHERE THERE IS ONE. An entry may be a bare URL or
 * `{src, srcset, sizes}`, and the responsive form matters: the floor plans
 * render with `sizes="100vw"` over a five-candidate ladder, so warming `src`
 * alone caches the 2402w original while the browser goes on to request the
 * 1600w candidate — a second fetch, and the pop-in it was meant to prevent.
 * Setting srcset and sizes on the Image() makes it resolve the same candidate
 * the <img> will.
 */
export type PreloadTarget = string | { src?: string | null; srcset?: string; sizes?: string };

export function preloadHidden(targets: readonly (PreloadTarget | null | undefined)[]): () => void {
  if (typeof window === "undefined") return () => {};

  let idleHandle: number | undefined;
  let cancelled = false;
  const images: HTMLImageElement[] = [];

  const warm = () => {
    if (cancelled) return;
    for (const target of targets) {
      const t = typeof target === "string" ? { src: target } : target;
      if (!t?.src) continue;
      const img = new Image();
      // Keep them out of the way of anything the user is actually waiting for.
      img.fetchPriority = "low";
      img.decoding = "async";
      // sizes and srcset BEFORE src: the browser resolves the candidate when
      // src is assigned, so setting them after would fetch the wrong one first.
      if (t.sizes) img.sizes = t.sizes;
      if (t.srcset) img.srcset = t.srcset;
      img.src = t.src;
      images.push(img);
    }
  };

  const schedule = () => {
    if (cancelled) return;
    idleHandle = window.requestIdleCallback
      ? window.requestIdleCallback(warm, { timeout: 3000 })
      : window.setTimeout(warm, 1000);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleHandle === undefined) return;
    if (window.cancelIdleCallback) window.cancelIdleCallback(idleHandle);
    else window.clearTimeout(idleHandle);
    // Abandon in-flight fetches: a component torn down mid-warm should not keep
    // the connection. Setting src to "" is the documented way to do that.
    for (const img of images) {
      img.srcset = "";
      img.src = "";
    }
  };
}
