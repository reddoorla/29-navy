/**
 * Which hosts this build is willing to be indexed on.
 *
 * Netlify serves every site on `<name>.netlify.app` — and every pull request on
 * `deploy-preview-<n>--<name>.netlify.app` — for the life of the site. A custom
 * domain is added *alongside* that host; it never replaces it. Both answer 200
 * for every route from the same build, so an indexed Netlify copy is duplicate
 * content competing with the client's own domain for the client's own words.
 *
 * The rule is deliberately "the Netlify host is not indexable" and NOT "anything
 * that is not <the client's domain> is not indexable". The second form is the
 * trap: it has to be taken out again at the DNS cutover, and a noindex that
 * outlives its cutover silently delists the launched site — a far more expensive
 * failure than the one it prevents. This form never has to be removed, cannot
 * match the client's domain, and keeps protecting the netlify.app mirror after
 * launch, when the duplicate-content risk is highest.
 *
 * Note it matches on the host of the request that arrived, so it can only be
 * applied by code that runs per request — see the `prerender = false` notes in
 * `routes/robots.txt` and `routes/sitemap.xml`.
 */
export function isNetlifyHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  // Suffix match on a dot-prefixed label, never a bare `includes`: `netlify.app`
  // appearing anywhere in a hostname (`netlify.app.example.com`) is a different
  // host owned by someone else, and must not silently noindex a real domain.
  return host === "netlify.app" || host.endsWith(".netlify.app");
}
