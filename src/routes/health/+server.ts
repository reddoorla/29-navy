import { json } from "@sveltejs/kit";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { createClient, isPlaceholderRepo } from "$lib/prismicio";
import type { RequestHandler } from "./$types";

// Deploys as a Netlify function under adapter-netlify v6 — a live probe, so it
// must never be prerendered.
export const prerender = false;

type PrismicHealth = "ok" | "error" | "skipped";

// Server-side Prismic reachability probe. Hits the PUBLIC repository-metadata
// endpoint (getRepository — no token), time-boxed, and returns ONLY a status
// string. The repository body is never included: /health is public and
// unauthenticated, so it exposes booleans and status strings, nothing more.
async function probePrismic(fetch: typeof globalThis.fetch): Promise<PrismicHealth> {
  if (isPlaceholderRepo) return "skipped";
  const client = createClient({ fetch });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("prismic health probe timed out")), 5000);
    });
    await Promise.race([client.getRepository(), timeout]);
    return "ok";
  } catch {
    return "error";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const GET: RequestHandler = async ({ fetch }) => {
  const prismic = await probePrismic(fetch);
  const forms = {
    ingestUrl: !!privateEnv.FORMS_INGEST_URL,
    ingestToken: !!privateEnv.FORMS_INGEST_TOKEN,
    // Trimmed to match the widget's own check (see TurnstileWidget.svelte) so a
    // stray-whitespace value reports dark here too, not falsely present.
    turnstile: !!publicEnv.PUBLIC_TURNSTILE_SITE_KEY?.trim(),
    // Declares whether this deploy has a form that forwards the `testMode`
    // marker to central ingest. The fleet form-e2e probe preflights /health and
    // submits only where this is strictly `true`. 29 Navy has NO form: the
    // starter's /contact route was deleted in #32 (src/routes/routes.test.ts
    // pins that), so this is false. Kept explicit rather than omitted — the
    // probe reads absent and false the same way, but `false` states it. Never
    // flip it to true without a form action that actually forwards the marker,
    // or the probe's submission lands as a real lead.
    testMode: false,
  };
  // The downstream function-health audit treats an unreachable endpoint as "not
  // present"; since we are inside the handler, the function ran, so ok is false
  // only when the Prismic probe actively errored.
  const ok = prismic !== "error";
  return json({ ok, prismic, forms });
};
