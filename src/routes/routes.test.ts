import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// 29 Navy is a one-page site whose only "Contact" is the #contact band on the
// home page (site-config's nav item is `/#contact`); the reference design has no
// form. The reddoor-starter's /contact route shipped here anyway: unlinked,
// absent from the sitemap, answering 200 with a real <form> that posted into
// central form ingest as genuine 29-navy leads. #32 decided to delete it. These
// tests pin that decision to the source tree, so a template forward-port cannot
// quietly bring the route — or any other form action — back.

// process.cwd(), as in src/app.test.ts: under the jsdom environment
// import.meta.url is not a file: URL.
const ROUTES = resolve(process.cwd(), "src/routes");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const abs = join(dir, entry);
    return statSync(abs).isDirectory() ? [abs, ...walk(abs)] : [abs];
  });
}

const paths = walk(ROUTES).map((abs) => relative(ROUTES, abs).split("\\").join("/"));
const sources = paths.filter((p) => /\.(svelte|ts|js)$/.test(p) && !/\.test\.[jt]s$/.test(p));

describe("the route tree", () => {
  // Control: a walker that found nothing would pass every "absent" assertion
  // below. It must see the routes this site actually serves.
  it("is actually walked (control: the home page and /health are found)", () => {
    expect(paths).toContain("[[preview=preview]]/+page.svelte");
    expect(paths).toContain("health/+server.ts");
  });

  it("has no /contact route at any depth", () => {
    const contact = paths.filter((p) => p.split("/").includes("contact"));
    expect(contact).toEqual([]);
  });

  // The route was only half the problem; the other half was a form action that
  // forwards into central ingest. /health's `forms.testMode` may only be `true`
  // where such an action forwards the probe marker (see health/+server.ts), so
  // the declaration and this assertion must change together.
  it("defines no form action and forwards nothing to central form ingest", () => {
    const offenders = sources.filter((p) => {
      const src = readFileSync(join(ROUTES, p), "utf8");
      return (
        /export const actions\b/.test(src) ||
        src.includes("createIngestAction") ||
        src.includes("@reddoorla/maintenance/forms")
      );
    });
    expect(offenders).toEqual([]);
  });
});
