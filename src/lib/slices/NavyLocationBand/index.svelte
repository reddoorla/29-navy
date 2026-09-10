<script lang="ts">
  import { PrismicText } from "@prismicio/svelte";
  import { isFilled, type ImageField, type RichTextField } from "@prismicio/client";

  // Mirrors model.json. Slice Machine's generated `Content.NavyLocationBandSlice`
  // supersedes this once the slice is registered and src/prismicio-types.d.ts is
  // regenerated — that file is generated, so this component does not reach into it.
  type NavyLocationBandSlice = {
    slice_type: string;
    variation: string;
    primary: {
      heading: RichTextField;
      background_image: ImageField;
    };
  };

  let { slice }: { slice: NavyLocationBandSlice } = $props();

  // The ONLY authored geometry input. Everything measurable — the crop, the
  // repeat, the fit and the 100vh height — stays in the style block below where
  // it can be cited line by line (ref css:2173-2176). An authored photo simply
  // overrides the reference's own url() from ref css:2172.
  const photo = $derived(slice.primary.background_image?.url ?? undefined);
  const bandStyle = $derived(photo ? `background-image: url("${photo}")` : undefined);
</script>

<!-- Reference subtree, verbatim (matching/spec/index.html):
       <div id="Location" class="section"><div class="div-block-3"><h1 class="heading">Location</h1></div></div>
     Three elements, no <img>, no <a>, no <svg>. The photo is a CSS background
     (ref css:2172), so it is decorative and carries no accessible name; the
     Prismic asset's own alt travels with the field for any future <img>
     variation. `id="Location"` is a structural contract with the navbar's
     <a href="#Location">, not content — hard-coded, never authored. And this
     section deliberately registers NO harness anchor: the navbar's own
     "Location" link text sits earlier in document order (SPEC.md), so an anchor
     here would cut the measured region at the navbar. -->
<div
  id="Location"
  class="section"
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  style={bandStyle}
>
  <div class="div-block-3">
    {#if isFilled.richText(slice.primary.heading)}
      <h1 class="heading"><PrismicText field={slice.primary.heading} /></h1>
    {/if}
  </div>
</div>

<style>
  /* Every declaration here is transcribed from the captured reference
     stylesheet, matching/spec/29navy-8c2435.shared.46514381b.css, and cites its
     line. A declaration with no line behind it does not belong in this block. */

  .section,
  .div-block-3,
  .heading {
    box-sizing: border-box; /* ref css:214-216 — `* { box-sizing: border-box }` */
  }

  .section {
    background-image: url("/29navy/assets/614ddffddb6b8587d3d41004_location-aerial.jpg"); /* ref css:2172 */
    background-position: 50%; /* ref css:2173 — one value means 50% 50%, dead centre */
    background-repeat: no-repeat; /* ref css:2174 */
    background-size: cover; /* ref css:2175 */
    height: 100vh; /* ref css:2176 — vh literally, not dvh/svh/lvh */
  }

  /* ref css:3218 opening `@media screen and (max-width: 767px)`, ref css:3227-3229
     `.section { display: none }`. The band is ABSENT at 767 and at 390, and the
     mobile substitute (`.mobile-location`, ref css:2878-2880, block only at
     <=479 per ref css:3361-3363) is a different census section. Between 480 and
     767 the reference simply has no location content at all. That is the
     reference, not a bug to fix. */
  @media screen and (max-width: 767px) {
    .section {
      display: none; /* ref css:3228 */
    }
  }

  .div-block-3 {
    margin-top: 0; /* ref css:2180 */
    padding-top: 20px; /* ref css:2181 — interior, because of ref css:214-216 */
  }

  .heading {
    color: #000; /* ref css:2185 */
    margin-top: 0; /* ref css:2186 — overrides the 20px at ref css:385 */
    margin-right: 0; /* ref css:50 — `margin: .67em 0`, whose horizontal 0 survives */
    margin-bottom: 10px; /* ref css:380 — never overridden; collapses through .div-block-3 */
    margin-left: 20px; /* ref css:2187 — the h1 is LEFT-offset, never centred */
    font-family: Arial, sans-serif; /* ref css:227 — inherited from body on the reference */
    font-size: 32px; /* ref css:2188 — overrides the 38px at ref css:386 */
    font-weight: 400; /* ref css:2189 — overrides `bold` at ref css:381 */
    line-height: 44px; /* ref css:387 — .heading never restates it: 44px box on 32px type */
  }
</style>
