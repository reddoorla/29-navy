import type { Handle } from "@sveltejs/kit";
import { isNetlifyHost } from "$lib/indexability";

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Deindex the Netlify copy of the site (see $lib/indexability). This covers
  // the responses this hook actually reaches — everything rendered by the
  // function, including /health and the two crawl-signal endpoints. Pages the
  // build prerendered to static HTML are served by the CDN without running
  // this hook, and their bytes are identical on both hosts, so they carry no
  // host-specific header: robots.txt `Disallow: /` is what fences those.
  if (isNetlifyHost(event.url.hostname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
};
