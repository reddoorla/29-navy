<script lang="ts">
  import { PrismicText } from "@prismicio/svelte";
  import {
    asLink,
    isFilled,
    type ImageField,
    type KeyTextField,
    type LinkField,
    type RichTextField,
  } from "@prismicio/client";

  // Mirrors model.json. Slice Machine's generated `Content.NavyContactSlice`
  // supersedes this once the slice is registered and src/prismicio-types.d.ts is
  // regenerated — that file is generated, so this component does not reach into it.
  type ContactLink = {
    label: KeyTextField;
    value: KeyTextField;
    target: LinkField;
  };

  type NavyContactSlice = {
    slice_type: string;
    variation: string;
    primary: {
      heading: RichTextField;
      address_line_1: KeyTextField;
      address_line_2: KeyTextField;
      links: ContactLink[];
      photo: ImageField;
    };
  };

  let { slice }: { slice: NavyContactSlice } = $props();

  /** U+200D ZERO WIDTH JOINER — LOAD-BEARING GEOMETRY, not cruft.
      matching/spec/index.html closes each contact anchor with `<br/>` + U+200D, and
      that joiner generates a THIRD line box: each `.text-block-11` wrapping an
      anchor measures 84px, not 56px. Removing it takes 84px off the black panel
      (462 → 378 at ≤991). It is written as an escape rather than as a literal
      character so no prettier/eslint/CMS pass that trims invisible characters
      can silently delete it. */
  const ZWJ = "\u200d";

  /** The reference's own candidate ladder, read off the <img srcset> in
      matching/spec/index.html (the contact subtree, UTF-16 18647–20588): seven
      Webflow `-p-<w>` renditions, then the original at its intrinsic width.

      Shipping a w-descriptor srcset is not an optimisation here, it is the
      geometry. `.div-block-12` is `width: 35%` (ref css:2404) — a flex BASE, not
      a used width. The photo div's base is the img's own intrinsic width, and
      `sizes="100vw"` collapses that to exactly the viewport, so flex-shrink
      splits the overflow between 504px and 1440px and lands the panel on
      373.34px at 1440. Serve the same <img> with no srcset and the panel falls
      to its min-content floor of 228.17px and the section grows to 809.41px.
      The eight renditions also differ in aspect ratio (1.49673–1.49813), and the
      chosen candidate drives the section's height — so the ladder is reproduced
      candidate for candidate rather than regenerated. */
  const CAPTURE_RENDITIONS = [500, 800, 1080, 1600, 2000, 2600, 3200];

  function srcsetFor(image: ImageField): string | undefined {
    const url = image?.url;
    if (!url) return undefined;
    const intrinsic = (image as { dimensions?: { width?: number } })?.dimensions?.width;
    const stem = url.replace(/\.jpg$/, "");
    // A captured Webflow asset: expand the reference's own rendition ladder.
    if (url.startsWith("/29navy/assets/") && stem !== url && !/-p-\d+$/.test(stem)) {
      const candidates = CAPTURE_RENDITIONS.map((w) => `${stem}-p-${w}.jpg ${w}w`);
      if (intrinsic) candidates.push(`${url} ${intrinsic}w`);
      return candidates.join(", ");
    }
    // Anything else (a Prismic CDN asset): a single w-descriptor candidate at
    // the asset's intrinsic width. Verified to reproduce the 373.34px panel
    // exactly; only the height then follows the new asset's aspect ratio.
    return intrinsic ? `${url} ${intrinsic}w` : undefined;
  }

  const linkTarget = (link: ContactLink) =>
    (link.target as { target?: string } | undefined)?.target ?? undefined;

  const photo = $derived(slice.primary.photo);
  const srcset = $derived(srcsetFor(photo));
  const links = $derived(slice.primary.links ?? []);
</script>

<!-- Reference subtree, verbatim (matching/spec/index.html, UTF-16 18647–20588):
       <div id="contact" class="section-7">
         <div class="div-block-12">
           <h1 class="heading-3">Contact</h1>
           <div class="text-block-11">29 Navy Street </div>
           <div class="text-block-11 venice">Venice, California 90291 </div>
           <div class="text-block-11"><a href=… class="contact-link">Call us: <br/>(310) 393-9657<br/>U+200D</a></div>
           …two more of the same shape…
         </div>
         <div><img src=… loading="lazy" sizes="100vw" srcset=… alt=""/></div>
       </div>
     `id="contact"` is a structural contract with the navbar's <a href="#contact">
     (one of five in-page hrefs in index.html), not content — hard-coded, never
     authored, so no author can silently break the nav. The photo's parent div
     deliberately carries NO class: it has no rule of its own in the reference,
     and its width comes entirely from flex-shrink against the img's intrinsic
     size. The text is reproduced byte for byte, INCLUDING the trailing space on
     "29 Navy Street ", "Venice, California 90291 " and "Call us: ", and its
     absence after "Email us:". -->
<div
  id="contact"
  class="section-7"
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
>
  <div class="div-block-12">
    {#if isFilled.richText(slice.primary.heading)}
      <h1 class="heading-3"><PrismicText field={slice.primary.heading} /></h1>
    {/if}
    <div class="text-block-11">{slice.primary.address_line_1}</div>
    <div class="text-block-11 venice">{slice.primary.address_line_2}</div>
    {#each links as link, i (i)}
      <div class="text-block-11">
        <!-- The href is the ONE place this rebuild departs from the reference,
             and it departs twice. matching/spec/index.html ships
             href="https://(310) 393-9653" on the phone anchor — an invalid URL
             carrying a DIFFERENT number from the "(310) 393-9657" it displays —
             and href="mailto:29navy@worthe.com<U+200D>" with a U+200D inside the
             address, which breaks the mail client. mocks.json supplies
             "tel:+13103939657" (matching the DISPLAYED number) and a clean
             mailto. Note the asymmetry: the joiner is dropped from the HREF
             only. The one in the link TEXT stays, because it is 28px of line
             box. Both deviations are text-only and cannot move a rect. -->
        <a
          href={asLink(link.target) ?? undefined}
          target={linkTarget(link)}
          rel={linkTarget(link) === "_blank" ? "noopener noreferrer" : undefined}
          class="contact-link">{link.label}<br />{link.value}<br />{ZWJ}</a
        >
      </div>
    {/each}
  </div>
  <div>
    {#if isFilled.image(photo)}
      <!-- NEVER add width/height attributes without height:auto: with the
           aspect-ratio box that pair produces, max-width:100% honours the
           intrinsic HEIGHT and the section renders 2832px tall at 1440 and
           3254px at 390. loading="lazy" is the reference's own (ref index.html)
           and stays; the gate must settle before capture and assert a non-zero
           measured image height rather than merely not throwing. -->
      <img src={photo.url} loading="lazy" sizes="100vw" {srcset} alt={photo.alt ?? ""} />
    {/if}
  </div>
</div>

<style>
  /* Every declaration here is transcribed from the captured reference
     stylesheet, matching/spec/29navy-8c2435.shared.46514381b.css, and cites its
     line. A declaration with no line behind it does not belong in this block.

     Svelte scopes this block, which is what keeps ref css:2439-2444 off the
     navbar: index.html gives all six nav links `class="nav-link-2 text-block-11
     w-nav-link"` and ref css:2140-2152 styles that combination. The navbar
     slice must carry its own copy of the .text-block-11 type rule — nothing in
     this section's gate would catch its absence. */

  .section-7,
  .div-block-12,
  .heading-3,
  .text-block-11,
  .contact-link {
    box-sizing: border-box; /* ref css:214-216 — `* { box-sizing: border-box }` */
  }

  .section-7 {
    /* ref css:2073-2075 declares these on :root. A scoped block cannot reach
       :root, so they are declared on the slice root, from which they inherit
       into .contact-link identically. */
    --white: white; /* ref css:2074 */
    --firebrick: #aa4133; /* ref css:2075 */

    /* The body context this subtree renders inside on the reference. It is
       re-established here because Tailwind's preflight otherwise supplies a
       different stack and a different strut, and the text metrics ARE the
       height ladder: `line-height: 1.4em` below resolves against font-size, and
       the 20px strut is the line box the <img> sits in (ref css:233,235). */
    font-family: Arial, sans-serif; /* ref css:227 */
    font-size: 14px; /* ref css:228 */
    line-height: 20px; /* ref css:229 */

    display: flex; /* ref css:2452 — the whole of the .section-7 rule. No
                      flex-direction (so row), no wrap, no gap, no padding, and
                      NO background-color: the black belongs to .div-block-12
                      alone (ref css:2403) and the photo covers the rest exactly
                      (373.34 + 1066.66 = 1440). */
  }

  /* ref css:232-236. Scoped to this subtree rather than left to a global reset.
     `max-width: 100%` is load-bearing for the flex shrink, and `inline-block`
     is not a typo — the img sits in a line box with the 20px strut above.
     Tailwind's preflight sets `display: block` on img; that is an undeclared
     deviation, so the reference's value is restated explicitly. */
  .section-7 img {
    vertical-align: middle; /* ref css:233 */
    max-width: 100%; /* ref css:234 */
    display: inline-block; /* ref css:235 */
  }

  .div-block-12 {
    color: #fff; /* ref css:2402 */
    background-color: #000; /* ref css:2403 */
    width: 35%; /* ref css:2404 — a flex BASE, not a used width; see srcsetFor above */
    padding-top: 60px; /* ref css:2405 */
  }

  .heading-3 {
    margin-top: 0; /* ref css:2433 — overrides the 20px at ref css:385 */
    margin-right: 0; /* ref css:50 — `margin: .67em 0`, whose horizontal 0 survives */
    margin-bottom: 10px; /* ref css:2434, restating ref css:380 */
    margin-left: 20px; /* ref css:2435 */
    font-size: 38px; /* ref css:386 — an ELEMENT rule; Tailwind preflight zeroes it */
    font-weight: 400; /* ref css:2436 — overrides `bold` at ref css:381 */
    line-height: 44px; /* ref css:387 */
  }

  .text-block-11 {
    margin-bottom: 0; /* ref css:2440 */
    margin-left: 20px; /* ref css:2441 */
    margin-right: 20px; /* ref css:2442 — NEVER reset at any breakpoint. With
                           margin-left going to 0 (ref css:3161, 3288, 3446) and
                           text-align:center (ref css:3155) this puts the address
                           and every link 10px LEFT of true centre at ≤991. That
                           is the reference; do not "centre" it. */
    font-size: 20px; /* ref css:2443 */
    line-height: 1.4em; /* ref css:2444 — computed 28px against the 20px above */
  }

  .text-block-11.venice {
    margin-bottom: 60px; /* ref css:2448 */
  }

  .contact-link {
    background-color: #0000; /* ref css:30 */
    color: var(--white); /* ref css:3089 */
    cursor: pointer; /* ref css:3090 */
    text-decoration: none; /* ref css:3091 */
  }

  .contact-link:hover {
    color: var(
      --firebrick
    ); /* ref css:3095 — #aa4133 on #000 is ~3.1:1, below
                                4.5:1. axe does not test hover states, so this is
                                a known reference floor, logged rather than
                                silently "fixed". */
    text-decoration: none; /* ref css:3096 */
  }

  /* ref css:3116 opens `@media screen and (max-width: 991px)`. Measured
     inclusive: 991 already stacks, 990 likewise. */
  @media screen and (max-width: 991px) {
    .section-7 {
      flex-direction: column; /* ref css:3166 */
      align-items: center; /* ref css:3167 */
    }

    .div-block-12 {
      text-align: center; /* ref css:3155 */
      width: 100vw; /* ref css:3156 — vw, NOT 100%. On an engine with a classic
                       reserved scrollbar this exceeds the content box and the
                       page scrolls horizontally; the reference has that too, so
                       it is a LEDGER floor, not a bug to fix. */
      padding-top: 20px; /* ref css:3157 — overrides the 60px at ref css:2405 */
      padding-bottom: 20px; /* ref css:3158 */
    }

    .heading-3,
    .text-block-11,
    .text-block-11.venice {
      margin-left: 0; /* ref css:3161-3163 */
    }
  }

  /* ref css:3218 opens `@media screen and (max-width: 767px)`. Measured
     inclusive: 767 already runs the inner flex column, 766 likewise. */
  @media screen and (max-width: 767px) {
    .div-block-12 {
      flex-direction: column; /* ref css:3271 */
      align-items: center; /* ref css:3272 */
      padding-top: 20px; /* ref css:3273 */
      padding-bottom: 20px; /* ref css:3274 */
      display: flex; /* ref css:3275 — the panel itself becomes a flex column, so
                        its children shrink-to-fit instead of filling */
    }

    .heading-3,
    .text-block-11 {
      margin-left: 0; /* ref css:3288-3290 */
    }

    .text-block-11.venice {
      margin-bottom: 20px; /* ref css:3293 — overrides the 60px at ref css:2448 */
    }
  }

  /* ref css:3396 opens `@media screen and (max-width: 479px)`. The gate's 390
     viewport is the ONLY one inside this block, so a mistake in the 10px side
     padding shows up at 390 and nowhere else. */
  @media screen and (max-width: 479px) {
    .div-block-12 {
      padding-left: 10px; /* ref css:3433 */
      padding-right: 10px; /* ref css:3434 */
    }

    .heading-3,
    .text-block-11 {
      margin-left: 0; /* ref css:3446-3448 — a redundant restatement of ref css:3288-3290 */
    }
  }
</style>
