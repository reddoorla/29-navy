import { createClient, isPlaceholderRepo } from "$lib/prismicio";
import { isNetlifyHost } from "$lib/indexability";
import type { RequestHandler } from "./$types";

// Per request rather than prerendered, for the same reason as robots.txt: a
// prerendered sitemap bakes one origin at build time, so it would advertise
// whichever host the LAST build ran on — to crawlers on every other host, and
// until someone remembers to redeploy. `url.origin` is the host that asked.
export const prerender = false;

export const GET: RequestHandler = async ({ fetch, url }) => {
  const origin = url.origin;

  // One entry per page document ("home" renders at "/"). Empty on an
  // unconfigured starter so the prerender succeeds before Prismic is wired,
  // and empty on the Netlify host, where a sitemap would be an invitation to
  // index a duplicate of the client's site (robots.txt refuses the same host).
  // The document fetch is skipped in both cases — nothing would be listed.
  const entries: { path: string; lastmod: string }[] =
    isPlaceholderRepo || isNetlifyHost(url.hostname)
      ? []
      : (await createClient({ fetch }).getAllByType("page")).map((page) => ({
          path: page.uid === "home" ? "/" : `/${page.uid}`,
          lastmod: new Date(page.last_publication_date ?? Date.now()).toISOString(),
        }));

  const urls = entries.map(
    ({ path, lastmod }) => `  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
};
