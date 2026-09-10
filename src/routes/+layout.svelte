<script lang="ts">
  import { PrismicPreview } from "@prismicio/svelte/kit";
  import { page } from "$app/state";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { repositoryName } from "$lib/prismicio";
  import "../app.css";
  import Seo from "$lib/components/Seo.svelte";
  import { composeTitle, DEFAULT_OG_IMAGE } from "$lib/seo";
  import LandscapeModal from "$lib/components/LandscapeModal.svelte";
  import TransitionOverlay from "$lib/components/TransitionOverlay.svelte";
  import Nav from "$lib/components/Nav.svelte";
  import { loadSiteConfig } from "$lib/site-config";
  import { disableSmoothScroll, restoreSmoothScroll } from "$lib/utils/instantNavScroll";

  let { data, children } = $props();

  // Site chrome from src/lib/site-config.json — for 29 Navy that is the six
  // reference nav links and the wordmark. A route's own page data still takes
  // precedence. There is no footer on this site; see the note below the <main>.
  const siteConfig = loadSiteConfig();

  // Kit's own post-nav scroll (top / hash anchor / popstate restore) runs
  // instantly instead of gliding under app.css's smooth-scroll. See the util.
  beforeNavigate(disableSmoothScroll);
  afterNavigate(restoreSmoothScroll);
</script>

<!-- Single head source for the whole app. Static routes feed their title
     (and optional description/image) through `page.data`; per-page <svelte:head>
     title overrides would desync og:title, so pages set data, not tags. -->
<Seo
  title={composeTitle(page.data.meta_title || page.data.title)}
  description={page.data.meta_description}
  image={page.data.meta_image || DEFAULT_OG_IMAGE || undefined}
  imageAlt={page.data.meta_image_alt}
  url={page.url}
/>
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:bg-white focus:text-primary focus:px-4 focus:py-2 focus:rounded focus:shadow"
>
  Skip to main content
</a>
<!-- Chrome renders from page data when a route supplies navLinks, else from
     site-config. Nav applies its own page-data-over-config precedence. -->
<div class="flex flex-col min-h-screen">
  <Nav navLinks={page.data.navLinks} items={siteConfig.nav.items} logo={siteConfig.nav.logo} />

  <main id="main-content" tabindex="-1" class="flex-1">
    {@render children?.()}
  </main>

  <!-- NO FOOTER. Sourced from the reference DOM, not inferred:
       matching/spec/index.html ends `…</div><script …></script></body>` — the
       last element is `#contact.section-7` and there is no <footer> anywhere in
       the document. 29 Navy is a one-page site whose contact block IS the
       footer.

       This is a geometry fact, not a styling preference. <Footer> renders
       unconditionally at `px-8 py-12` and, with the empty site-config stub,
       still emits `© <year> Company Name` — about 140px of height the reference
       does not have, at the bottom of the page, inside the last cut region. It
       would also ship the literal words "Company Name" on a live site.

       The shared component is left alone: src/lib/components/Footer.test.ts has
       three assertions that the placeholder renders, so that behaviour is the
       starter's intent and changing it belongs upstream, not here. -->
</div>
<TransitionOverlay />
<LandscapeModal />
{#if data.isPreviewSession}
  <PrismicPreview {repositoryName} />
{/if}
