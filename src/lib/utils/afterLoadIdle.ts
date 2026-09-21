/**
 * Run `callback` once the page has finished loading AND the main thread has
 * gone quiet. Returns a cancel function; safe to return straight from `$effect`.
 *
 * For work that is, by construction, not needed for first paint — and that
 * would cost first paint something if it ran sooner. Every byte requested
 * before `load` competes with the LCP image for the connection, on exactly the
 * slow links where that matters most. Two callers, one reason:
 *
 *  - `preloadHidden` warms images sitting behind `display: none`.
 *  - `NavyHeroSlider` paints slides 2–6. Measured on production 2026-09-21
 *    (#48): with those five photographs and the aerial out of the first burst,
 *    Lighthouse performance read 97, 96, 98; with them in it, 73 to 94.
 *
 * This was lifted out of `preloadHidden` unchanged rather than written again
 * beside it. `load` first, because before it the browser is still busy with the
 * things the visitor is waiting for; then `requestIdleCallback`, with a 3s
 * timeout so a page that never idles still gets there; and a 1s timer where
 * `requestIdleCallback` does not exist (Safari).
 *
 * On the server this is a no-op: there is no `load` to wait for, and the point
 * of every caller is that the work is absent from the first response.
 */
export function afterLoadIdle(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let idleHandle: number | undefined;
  let cancelled = false;

  const run = () => {
    if (!cancelled) callback();
  };

  const schedule = () => {
    if (cancelled) return;
    idleHandle = window.requestIdleCallback
      ? window.requestIdleCallback(run, { timeout: 3000 })
      : window.setTimeout(run, 1000);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleHandle === undefined) return;
    if (window.cancelIdleCallback) window.cancelIdleCallback(idleHandle);
    else window.clearTimeout(idleHandle);
  };
}
