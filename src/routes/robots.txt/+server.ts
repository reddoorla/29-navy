import { isNetlifyHost } from "$lib/indexability";
import type { RequestHandler } from "./$types";

// Rendered per request, NOT prerendered, and that is the whole mechanism. A
// prerendered robots.txt bakes ONE origin (kit.prerender.origin, from Netlify's
// URL env) into one file at build time, and Netlify then serves those same
// bytes on every host the build is reachable from. This file has to say
// different things on different hosts — see $lib/indexability — so it cannot be
// a build-time artifact. A robots.txt is one request per crawler visit; the
// function invocation is not worth the trap that prerendering reintroduces.
export const prerender = false;

// Replaces static/robots.txt so the Sitemap line can carry an absolute URL —
// the robots spec requires one, and a static file can't know its own origin.
export const GET: RequestHandler = ({ url }) => {
  // On the Netlify host, refuse the whole site: it is a byte-identical copy of
  // the client's domain, and indexing it competes with the original. Note a
  // disallowed URL can still be indexed URL-only if something links to it, so
  // this is paired with an `X-Robots-Tag: noindex` on the same hosts (see
  // src/hooks.server.ts), which is the signal that actually deindexes.
  const body = isNetlifyHost(url.hostname)
    ? `User-agent: *
Disallow: /
`
    : // Fence crawlers off the dev/tooling routes (which `prerender = "auto"`
      // still emits as public static HTML) and Prismic preview URLs (which
      // canonicalize to the real page anyway). Content routes stay open.
      // (#39 also fenced /contact, the starter's unlinked form; #32 deleted that
      // route, so the line went with it.)
      `User-agent: *
Disallow: /dev/
Disallow: /slice-simulator
Disallow: /preview/

Sitemap: ${url.origin}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
};
