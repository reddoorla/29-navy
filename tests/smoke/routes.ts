// Committed per-site smoke manifest. `tests/smoke/pages.spec.ts` iterates this
// list, asserting each route returns its expected status and paints a hydration
// marker with no console errors. This ships the SAFE DEFAULT every reddoor-starter
// clone inherits; each site's figma-slices build grows the list as real routes
// land (add `{ path, name, hydrationMarker }` entries).
//
// NOTE on the default `/` entry: on the bare placeholder starter, `/`
// intentionally 404s (getByUID("page","home") can't resolve against the
// placeholder repo → error(404)), so the entry below gates its expectation on
// the repository name — mirroring `isPlaceholderRepo` in src/lib/prismicio.ts
// and the entries() prerender guard in the home route. The moment a fork wires
// a real Prismic repo in slicemachine.config.json, the same entry expects 200
// with zero edits.
//
// The hydration marker is `nav`, not the starter's `footer`. 29 Navy HAS NO
// FOOTER: the reference document ends at #contact.section-7 and has no <footer>
// anywhere, so src/routes/+layout.svelte does not render one (the reasoning is
// there, at the point of removal). `nav` serves the identical purpose — it is
// rendered by the same layout, above <main>, so it is present on every page
// including the error page — and it still fails if the layout never paints.

// Playwright runs this file as native ESM in Node, where JSON imports require
// the explicit attribute (unlike Vite-bundled src/lib/prismicio.ts).
import slicemachineConfig from "../../slicemachine.config.json" with { type: "json" };

export type SmokeRoute = {
  /** Route path to visit, e.g. "/" or "/about". */
  path: string;
  /** Human-readable label used in the test title. */
  name: string;
  /** CSS selector asserted visible after load (hydration proof). Default: skip. */
  hydrationMarker?: string;
  /** Expected HTTP status. Default: 200. */
  expectStatus?: number;
};

// Same resolution order as src/lib/prismicio.ts (VITE_PRISMIC_ENVIRONMENT
// override, then slicemachine.config.json). This file runs in the Playwright
// process, so read process.env rather than import.meta.env.
const repositoryName = process.env.VITE_PRISMIC_ENVIRONMENT || slicemachineConfig.repositoryName;
const isPlaceholderRepo = repositoryName === "your-prismic-repo-name";

export const smokeRoutes: SmokeRoute[] = [
  isPlaceholderRepo
    ? // Bare starter: home intentionally 404s until Prismic is wired (see the
      // NOTE above). Surface that in the test title so a green run can't be
      // mistaken for a wired-up 200.
      {
        path: "/",
        name: "home — placeholder repo, expecting 404",
        hydrationMarker: "nav",
        expectStatus: 404,
      }
    : { path: "/", name: "home", hydrationMarker: "nav" },
];
