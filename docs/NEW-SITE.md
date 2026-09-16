# Per-site checklist

Everything in this repo that still carries a template default. `/new-site`
automates most of it; this file is the checklist that survives without the
skill, and the thing to re-read when a site "looks like the starter".

Find what is still unset:

```bash
grep -rn "your-prismic-repo-name\|reddoor-wireframer\|<Site name>\|<Client>" \
  --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude-dir=build .
```

## Identity

| File                       | Change                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` → `name`    | The site slug. Fleet audits match sites to Airtable rows by this.                                                                              |
| `.github/workflows/ci.yml` | `netlify-site: "<slug>"` — drives the deploy-preview link CI comments on every PR.                                                             |
| `slicemachine.config.json` | `repositoryName` → the real Prismic repo. **See "Placeholder builds" below.**                                                                  |
| `src/lib/seo.ts`           | `SITE_NAME` (defaults to `"Reddoor"` — every `<title>` says so until you change it), `SITE_LOCALE`, `DEFAULT_DESCRIPTION`, `DEFAULT_OG_IMAGE`. |
| `src/app.html`             | `<html lang>` if the primary language is not English.                                                                                          |
| `static/favicon.png`       | The client's icon.                                                                                                                             |
| `README.md`                | `<Site name>` and `<Client>`.                                                                                                                  |

## Design

| File                           | Change                                                                                                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app.css` → `@theme`       | Brand palette and `--font-heading` / `--font-body`. The shipped values are a deliberately mismatched placeholder set, so a token you forgot to set is visible rather than silent.                                                         |
| `src/lib/site-config.json`     | Nav items and footer columns/socials. Ships empty (logo-only Nav, placeholder Footer). Swap the module for a Prismic `settings` loader behind the same exports if the client edits chrome.                                                |
| `svelte.config.js` → `kit.csp` | Add every third-party host the design needs. The baseline allows Prismic, Vimeo, Turnstile and Google Fonts only — a font kit, YouTube embed, donation platform or analytics tag is blocked until listed. Self-hosted fonts need nothing. |

## Deploy

Netlify environment variables (set on the site, not in the repo):

- `FORMS_INGEST_URL` = `https://reddoor-maintenance.netlify.app/api/forms/<slug>`
- `FORMS_INGEST_TOKEN` = the shared ingest token (same value as the dashboard's)
- `PUBLIC_TURNSTILE_SITE_KEY` (optional) — per-domain widget from dash.cloudflare.com

See [`.env.example`](../.env.example) for the annotated list.

Renovate needs nothing per-repo: it authenticates as the org-wide
`reddoor-renovate` GitHub App.

### Build hook: a Prismic publish must trigger a build

`src/routes/+layout.server.ts` sets `prerender = "auto"`, so `/` is baked at
build time. A Prismic publish reaches visitors only when Netlify builds, and
out of the box only a git push does that. The client can publish all day and
production will not change, while every surface an editor checks shows the new
content: the document reads published, the Prismic preview renders it, and the
next code PR's deploy preview shows it too. Found the hard way on 29-navy
(reddoorla/29-navy#31). The hook `Prismic publish` → `main` has existed on this site since 2026-09-15; step 2 below is done in the Prismic dashboard and is not something a repo can verify.

1. Create the hook. Body fields go under `body`. Passed flat, the CLI accepts
   them and silently creates a hook with `title: null, branch: null`:

   ```bash
   netlify api createSiteBuildHook \
     --data '{"site_id":"0627e670-a816-48b2-bd32-b2e52c8d2103","body":{"title":"Prismic publish","branch":"main"}}'
   netlify api listSiteBuildHooks --data '{"site_id":"0627e670-a816-48b2-bd32-b2e52c8d2103"}'
   ```

   The response's `url` is the hook. Never POST to it by hand
   except to deploy production on purpose.

2. Prismic → Settings → Webhooks → Add a webhook: paste the hook URL and
   trigger it on document publish (and unpublish). No secret is needed;
   Netlify ignores the payload.

3. Prove it the way the gap was found, not by reading settings. Publish a
   trivial content change, wait for the build to finish, then:

   ```bash
   curl -s https://29-navy.netlify.app/ | grep -a -c "<the new string>"
   ```

   `0` means the hook did not fire, or fired before the publish landed.
   Prismic's webhook log and Netlify's deploy list say which.

## Placeholder builds

`slicemachine.config.json`'s `your-prismic-repo-name` sentinel is load-bearing.
While it is in place, Prismic-backed routes 404 during prerender and the build
tolerates it, so a fresh clone is green before the CMS exists. Replacing it with
a real repository name re-arms loud-fail prerendering by design — after that, a
404 during prerender fails the build. The sentinel is read in four places
(`svelte.config.js`, `src/lib/prismicio.ts`, the route loaders, and
`tests/smoke/routes.ts`); change it in `slicemachine.config.json` only.

## Before pushing

```bash
pnpm verify
```

Runs exactly what CI runs, in CI's order. See [STARTER.md](STARTER.md#scripts).
