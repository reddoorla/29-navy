<script lang="ts">
  import { prefersReducedMotion } from "$lib/transitions";
  import type { ImageField } from "@prismicio/client";

  // Mirrors model.json. Slice Machine's generated `Content.NavyHeroSliderSlice`
  // supersedes this once the slice is registered and src/prismicio-types.d.ts is
  // regenerated — that file is generated, so this component does not reach into it.
  type NavyHeroSliderSlice = {
    slice_type: string;
    variation: string;
    primary: {
      logo: ImageField;
      tagline_line_1: string | null;
      tagline_line_2: string | null;
      slides: Array<{ image: ImageField }>;
      mobile_location_image: ImageField;
    };
  };

  let { slice }: { slice: NavyHeroSliderSlice } = $props();

  // The reference asset each field falls back to, so a clone whose Prismic
  // repository does not exist yet still renders the real page (CLAUDE.md, "the
  // `your-prismic-repo-name` sentinel is load-bearing"). Same contract as
  // NavyLocationBand, which parks its default in the CSS url(); these two are
  // <img> src values and a CSS default is not available to them.
  const REF = "/29navy/assets/";
  const REF_LOGO = REF + "68a8b03886756d39d580f327_29-navy-logo-black.jpg";
  const REF_AERIAL = REF + "614ddffddb6b8587d3d41004_location-aerial.jpg";

  // The reference ships alt="" on every image on the page. The rebuild authors
  // real alt text (pre-declared as an accepted text-diff artifact), so a null
  // alt — Prismic's "never set" — resolves to a written default here rather than
  // to "". An author who deliberately clears alt to "" still gets "", because
  // ?? only fires on null.
  const REF_LOGO_ALT = "29 Navy";
  const REF_AERIAL_ALT =
    "Aerial photograph looking down on the 29 Navy building and the surrounding blocks, with the beach and the Pacific beyond.";

  // Webflow generated six unrelated class names for one repeated thing, and each
  // carries its own background rule (ref css:2250, :2217, :2210, :2231, :2244,
  // :2263). This array IS the reference's document order — and .slide, the
  // hero photograph, is FOURTH, not first: frame 0 is .slide-6 / gallery_roof1
  // (ref css:2251). Reordering it to put the "hero" image first renders a
  // different first frame at every viewport in the matrix.
  const SLIDE_CLASSES = ["slide-6", "slide-7", "slide-8", "slide", "slide-2", "slide-5"];

  const slides = $derived(
    (slice.primary.slides ?? []).length
      ? slice.primary.slides.map((item, i) => ({
          // A seventh authored slide has no reference class of its own, so it
          // reuses one — by then the class is only carrying background-position,
          // -size and -repeat, since the authored url overrides background-image.
          cls: SLIDE_CLASSES[i % SLIDE_CLASSES.length],
          url: item.image?.url ?? undefined,
          alt: item.image?.alt ?? undefined,
        }))
      : // No CMS yet: six bare slides, each showing the reference photograph its
        // own class already carries in the style block below.
        SLIDE_CLASSES.map((cls) => ({ cls, url: undefined, alt: undefined })),
  );

  // Deliberately NOT defaulted to the reference wording. "Creative Lofts" is the
  // harness anchor every region on this page is cut on (matching/harness.json),
  // and a hard-coded fallback would let the gate go green on a document that has
  // no tagline at all — the exact shape CLAUDE.md rules out, a pass granted by
  // the absence of an error. Missing content renders empty and fails loudly.
  const line1 = $derived(slice.primary.tagline_line_1);
  const line2 = $derived(slice.primary.tagline_line_2);

  const logoUrl = $derived(slice.primary.logo?.url ?? REF_LOGO);
  const logoAlt = $derived(slice.primary.logo?.alt ?? REF_LOGO_ALT);
  const aerialUrl = $derived(slice.primary.mobile_location_image?.url ?? REF_AERIAL);
  const aerialAlt = $derived(slice.primary.mobile_location_image?.alt ?? REF_AERIAL_ALT);

  /* ---- Motion -------------------------------------------------------------
   *
   * Every number here is read off the reference's own slider element in
   * matching/spec/index.html:
   *
   *     data-delay="3000"  data-duration="500"  data-easing="ease"
   *     data-animation="slide"  data-autoplay="true"  data-infinite="true"
   *     data-hide-arrows="false"  data-disable-swipe="false"
   *
   * HOW THE REFERENCE MOVES, measured on the live site at 1440 rather than
   * assumed: it does NOT translate the mask and it does NOT reorder the DOM.
   * Each `.w-slide` carries its own inline `transform: translateX(...)`, with an
   * inline `transition: transform 0.5s ease` that is absent at rest (computed
   * `all 0s` until the first move). At the wrap, slide 6 keeps animating left
   * while slide 1 comes in from the RIGHT — the loop runs forward, it does not
   * rewind. Measured through the wrap, in slide-widths:
   *
   *     on slide 6   -5 -4 -3 -2 -1  0
   *     after wrap    0  1  2  3  4 -1     <- the last slide moved to the LEFT
   *
   * WHERE THIS DEPARTS. The reference gets there by giving the wrapping slide a
   * one-off transform of -n*width while the rest share one value, so its
   * off-screen arrangement depends on history. This keeps a per-slide offset
   * instead, which is the standard carousel form and reaches the same visible
   * result: `.w-slider-mask` is `overflow: hidden` (ref css:1198), so every
   * position outside [0, 1) slide-widths is clipped and cannot differ on screen.
   * Recorded in matching/LEDGER.md. */
  const SLIDE_MS = 500; // ref index.html data-duration
  const DELAY_MS = 3000; // ref index.html data-delay

  const count = $derived(slides.length);
  /** Each slide's position in slide-widths. 0 is on screen, -1 is just off to
   *  the left, 1+ is queued to the right. Starts as the plain document order,
   *  which is what the reference renders before it has moved at all. */
  let offsets = $state<number[]>([]);
  /** Slides that teleported this frame and must not animate getting there. */
  let teleported = $state<number[]>([]);
  let index = $state(0);

  $effect(() => {
    // Re-seed if the authored slide count changes.
    if (offsets.length !== count) {
      offsets = Array.from({ length: count }, (_, i) => i);
      teleported = [];
      index = 0;
    }
  });

  /** Step the carousel by `delta` slides. Everything shifts by one; whichever
   *  slide falls off the near side jumps to the far end, which is the only move
   *  that must not be animated — it crosses the whole strip. */
  function step(delta: number) {
    if (count < 2) return;
    const next = [...offsets];
    const jumped: number[] = [];
    for (let i = 0; i < count; i++) {
      next[i] -= delta;
      if (next[i] < -1) {
        next[i] += count;
        jumped.push(i);
      } else if (next[i] > count - 2) {
        next[i] -= count;
        jumped.push(i);
      }
    }
    teleported = jumped;
    offsets = next;
    index = (((index + delta) % count) + count) % count;
    // Two frames, not one: the first commits the teleport with no transition,
    // the second restores it. Restoring in the same frame would let the browser
    // coalesce both style writes and animate the jump after all.
    if (typeof requestAnimationFrame === "function")
      requestAnimationFrame(() => requestAnimationFrame(() => (teleported = [])));
    else teleported = [];
  }

  /** Bumped by every user-initiated move; the autoplay effect reads it, so a
   *  bump tears the interval down and starts a fresh full delay. Same mechanism
   *  as `autoplayEpoch` in $lib/components/Slider.svelte, deliberately, so the
   *  two carousels in this repo do not drift into two different answers. */
  let autoplayEpoch = $state(0);

  /** Navigation the visitor asked for, as opposed to a tick. Only this restarts
   *  the delay — routing the interval through it would re-key the effect on
   *  every tick and rebuild the interval 20 times a minute for no reason. */
  function stepByUser(delta: number) {
    step(delta);
    autoplayEpoch++;
  }

  // Autoplay. `data-autoplay-limit="0"` is unlimited, and clicking a dot on the
  // reference does NOT stop it — measured: after jumping to slide 6 by hand, the
  // timer still wrapped to slide 1 on its own. So nothing here cancels it.
  //
  // DELIBERATE DEVIATION: the reference does not restart its delay on
  // interaction either, and that is the half this build does not copy. Measured
  // on the live site — autoplay settled slide 2 at 2192ms, the right arrow was
  // clicked at 4235ms, and the ticks carried on at 5201 / 8211 / 11222ms, a flat
  // ~3010ms cadence straight through the click. The visible result is that
  // clicking an arrow can be followed ~1s later by an unrequested jump. Recorded
  // in matching/LEDGER.md; it moves no pixels in any frame the gate photographs.
  $effect(() => {
    if (count < 2 || prefersReducedMotion()) return;
    // Re-key on user navigation so a click restarts the full delay rather than
    // racing whatever is left of the in-flight one.
    void autoplayEpoch;
    // `step` reads `index`/`offsets` inside the callback, which runs after this
    // effect has finished collecting dependencies — so the interval is created
    // once per slide count, not once per slide change.
    const id = setInterval(() => step(1), DELAY_MS);
    return () => clearInterval(id);
  });

  /** The slide's whole inline style, background included, built in ONE
   *  expression. It used to be two — a quoted attribute mixing text with
   *  `{...}` — and that renders `url("&quot;…&quot;")`: Svelte does not decode
   *  an entity written inside a template string, so the quotes reached the CSS
   *  as literal text and the background silently stopped loading. */
  const slideStyle = (i: number, url?: string) => {
    const offset = offsets[i] ?? i;
    const motion =
      teleported.includes(i) || prefersReducedMotion()
        ? "transition: none"
        : `transition: transform ${SLIDE_MS}ms ease`;
    const background = url ? `background-image: url("${url}"); ` : "";
    // MINUS i, and that subtraction is the whole slider.
    //
    // `.w-slide` is `display: inline-block` (measured on the reference), so
    // slide i is ALREADY sitting at i slide-widths before a transform is
    // applied — `translateX` adds to the flow position, it does not replace it.
    // Writing `offset * 100%` therefore put slide i at i + offset. At rest
    // offset === i, so the slides came to rest TWO slide-widths apart
    // (measured in production: 0 2 4 6 8 10) and after one step sat at
    // -1 1 3 5 7 9 — with nothing at 0 at all. The mask was empty and the
    // slider's own grey background showed through it for 14 of 21 one-second
    // samples.
    //
    // Subtracting the flow position makes the transform a DELTA, which is also
    // exactly what the reference does: at rest all six of its slides carry
    // translateX(0px), and away from a wrap all six share one value.
    return `${background}transform: translateX(${(offset - i) * 100}%); ${motion}`;
  };

  /** Enter and Space, because the arrows and dots are divs with role="button" —
   *  which is what the reference's own runtime DOM gives them. */
  const onActivate = (fn: () => void) => (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    fn();
  };

  // Swipe: `data-disable-swipe="false"`. Pointer events cover touch, pen and
  // mouse drag in one path. 40px is a deliberate floor — below about 30px a
  // tap on a dot registers as a swipe on the way past.
  /** Left/Right anywhere inside the carousel, because the dots are indicators
   *  rather than controls (see the markup) and the arrows alone would make
   *  reaching slide 5 four tab-stops of clicking. */
  const onRegionKey = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    stepByUser(event.key === "ArrowRight" ? 1 : -1);
  };

  const SWIPE_PX = 40;
  let swipeFrom: number | null = null;
  const onPointerDown = (event: PointerEvent) => {
    swipeFrom = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (swipeFrom === null) return;
    const dx = event.clientX - swipeFrom;
    swipeFrom = null;
    if (Math.abs(dx) >= SWIPE_PX) stepByUser(dx < 0 ? 1 : -1);
  };
</script>

<!-- Reference subtree, matching/spec/index.html chars 2663..4701:
       <div id="Gallery" class="section-2"><div … class="slider w-slider">
         <div class="_29-navy-logo-hero"><img … width="143" …/><div class="text-block">Creative Lofts <br/>for Lease</div></div>
         <div class="w-slider-mask"><div class="slide-6 w-slide"></div>…×6</div>
         <div class="left-arrow w-slider-arrow-left"><div class="w-icon-slider-left"></div></div>
         <div class="right-arrow w-slider-arrow-right"><div class="w-icon-slider-right"></div></div>
         <div class="slide-nav w-slider-nav w-shadow w-round"></div>
       </div></div>
       <div id="Mobile-location" class="mobile-location"><img … class="image-18"/></div>
     #Mobile-location is a SIBLING of #Gallery and follows it in document order,
     so it belongs to this slice and must stay after the section-2 markup.
     Neither id is an anchor target — the page's only hash hrefs are #Location,
     #Lofts, #Residents and #contact — but both are reproduced for DOM fidelity.
     The data-* slider settings are reproduced verbatim from the reference markup;
     they are Webflow slider configuration, not authorable content. -->
<div
  id="Gallery"
  class="section-2"
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
>
  <div
    data-delay="3000"
    data-animation="slide"
    class="slider w-slider"
    data-autoplay="true"
    data-easing="ease"
    data-hide-arrows="false"
    data-disable-swipe="false"
    data-autoplay-limit="0"
    data-nav-spacing="3"
    data-duration="500"
    data-infinite="true"
    role="region"
    aria-label="carousel"
    onpointerdown={onPointerDown}
    onpointerup={onPointerUp}
    onpointercancel={() => (swipeFrom = null)}
    onkeydown={onRegionKey}
  >
    <div class="_29-navy-logo-hero">
      <!-- width="143" is a presentation ATTRIBUTE, and it is the only thing
           sizing this image: grep of `_29-navy-logo-hero` in the reference
           stylesheet returns ref css:2104 and ref css:3402 only, neither of them
           a descendant selector, so no CSS width exists. There is no height
           attribute either, so the used height resolves from the intrinsic
           776×800 to 147.42px. Dropping the attribute renders the mark at 776px
           and bursts the flex column. The reference's srcset/sizes pair is NOT
           reproduced: its 500w entry is a Webflow-generated derivative that only
           exists for the captured asset, so it cannot be built for an authored
           Prismic image. It selects which file downloads, never the 143px layout
           box, so no geometry follows from dropping it. -->
      <img src={logoUrl} loading="lazy" width="143" alt={logoAlt} />
      <div class="text-block">{line1} <br />{line2}</div>
    </div>
    <!-- ZERO characters between the six .w-slide divs, exactly as the reference
         is minified. They are display:inline-block (ref css:1213) inside a
         white-space:nowrap mask (ref css:1198), so any whitespace between two of
         them becomes a ~4px Arial word-space at the 14px inherited font size and
         walks every slide after the first off its offset. The gate at rest would
         still pass — slide 1 sits at x=0 either way — so this only surfaces once
         the slider moves. prettier formats .svelte files in this repo; the
         prettier-ignore on the next line is what stops it reintroducing the
         whitespace, and NavyHeroSlider.test.ts fails the moment a text node
         carrying characters appears in here. -->
    <!-- prettier-ignore -->
    <div class="w-slider-mask" id="w-slider-mask-0">{#each slides as slide, i (i)}<div class="{slide.cls} w-slide" style={slideStyle(i, slide.url)} role={slide.alt ? "img" : undefined} aria-label={slide.alt || undefined} aria-hidden={i === index ? undefined : "true"}></div>{/each}</div>
    <div
      class="left-arrow w-slider-arrow-left"
      role="button"
      tabindex="0"
      aria-label="previous slide"
      aria-controls="w-slider-mask-0"
      onclick={() => stepByUser(-1)}
      onkeydown={onActivate(() => stepByUser(-1))}
    >
      <!-- The chevron is an icon-font glyph in the Unicode private use area
           (U+E601, ref css:195). aria-hidden keeps a screen reader from
           announcing an unassigned code point; it changes no geometry. -->
      <div class="w-icon-slider-left" aria-hidden="true"></div>
    </div>
    <div
      class="right-arrow w-slider-arrow-right"
      role="button"
      tabindex="0"
      aria-label="next slide"
      aria-controls="w-slider-mask-0"
      onclick={() => stepByUser(1)}
      onkeydown={onActivate(() => stepByUser(1))}
    >
      <div class="w-icon-slider-right" aria-hidden="true"></div>
    </div>
    <!-- INDICATORS, NOT CONTROLS, and that is a deliberate deviation. The
         reference's runtime DOM gives every dot role="button", tabindex="0" and
         aria-label="Show slide N of 6", and they are clickable. Reproducing that
         fails this repo's axe gate on `target-size` (WCAG 2.2 AA, 2.5.8): the
         dots are `1em` = 14px with `margin: 0 3px` (ref css:1262), so they are
         14px across on a 20px pitch where the rule wants 24 of either. Neither
         the size nor the spacing exemption can be met without moving pixels the
         gate measures, so the reference cannot pass this rule as drawn.
         Interaction lives on the arrows instead, which are large enough and
         carry role/tabindex/aria-label/aria-controls exactly as the reference's
         runtime does. Recorded in matching/LEDGER.md; reversing it is an
         operator call, and it costs the click-to-slide-N affordance.

         .slide-nav is EMPTY in the reference's static HTML; Webflow's slider JS
         builds six .w-slider-dot divs into it at runtime, the current one also
         carrying .w-active. The gate measures the reference WITH its JS running,
         so the dots are part of what is being matched — they are server-rendered
         here, which also satisfies this repo's no-JS rule. Their runtime inline
         margin-left/right:3px (from data-nav-spacing="3") is byte-identical to
         the 3px already in ref css:1262, so it is not reproduced. No role or
         tabindex: without slider behaviour a role="button" would be an
         affordance that does nothing. -->
    <div class="slide-nav w-slider-nav w-shadow w-round">
      {#each slides as _slide, i (i)}
        <div class="w-slider-dot" class:w-active={i === index}></div>
      {/each}
    </div>
  </div>
</div>
<div id="Mobile-location" class="mobile-location">
  <!-- No width/height attributes, matching the reference. Adding them would be
       actively wrong: nothing in the reference stylesheet sets `img { height:
       auto }`, so a height attribute would hold this image at 861px while
       max-width:100% (ref css:234) shrank its width, distorting it. -->
  <img src={aerialUrl} loading="lazy" alt={aerialAlt} class="image-18" />
</div>

<style>
  /* Every declaration below is transcribed from the captured reference
     stylesheet, matching/spec/29navy-8c2435.shared.46514381b.css, and cites the
     line it came from. A declaration with no line behind it does not belong in
     this block. Rules are kept in the reference's own source order wherever two
     of them collide at equal specificity (.w-slider before .slider, the three
     media blocks in 991 → 767 → 479 order), because that order is what decides
     the cascade there. */

  /* ref css:171-176 — the arrow glyphs. The src is a base64 data: URI in the
     reference too, so no font file is shipped or fetched for this section. */
  @font-face {
    font-family: webflow-icons;
    src: url("data:application/x-font-ttf;charset=utf-8;base64,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")
      format("truetype");
    font-weight: normal;
    font-style: normal;
  }

  /* ref css:214-216 — `* { box-sizing: border-box }`. Load-bearing for the
     arrows: it is what makes width:80px (ref css:1288) a BORDER-box width, so
     the ≤767 paddings swell the arrow to 160px instead of 80+160. */
  .section-2,
  .slider,
  ._29-navy-logo-hero,
  .text-block,
  .w-slider-mask,
  .w-slide,
  .left-arrow,
  .right-arrow,
  .slide-nav,
  .w-slider-dot,
  .w-icon-slider-left,
  .w-icon-slider-right,
  .mobile-location,
  img {
    box-sizing: border-box;
  }

  /* ref css:78-79 and ref css:232-236 — the only img rules in the reference that
     touch box size. Note the absence of `height: auto`, which is why the two
     <img> elements above carry the width/height attributes they do (and do not
     carry the ones they do not). */
  img {
    border: 0;
    vertical-align: middle;
    max-width: 100%;
    display: inline-block;
  }

  /* ref css:222-230 — the reference's body typography. A slice cannot set
     `body`, so it is applied at this section's two roots instead; it is
     transcribed because it is load-bearing, not decorative: `.w-slider-dot`
     sizes itself in em (ref css:1260-1262), so the 14px here is what makes a dot
     14×14 with a 7px bottom margin rather than 16×16 with 8px. Everything else
     under these roots declares its own font-size (ref css:1290, ref css:2121). */
  .section-2,
  .mobile-location {
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 20px;
  }

  /* ref css:178-188 — the reference targets these by class prefix,
     `[class^="w-icon-"], [class*=" w-icon-"]`; the two elements it selects in
     this section are named directly so Svelte's scoping cannot be defeated by
     where it appends its own class. Same set of elements, same declarations. */
  .w-icon-slider-left,
  .w-icon-slider-right {
    font-variant: normal;
    text-transform: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-style: normal;
    font-weight: normal;
    line-height: 1;
    font-family: webflow-icons !important;
  }

  /* ref css:190-192 — raw bytes EE 98 80 = U+E600. */
  .w-icon-slider-right:before {
    content: "\e600";
  }

  /* ref css:194-196 — raw bytes EE 98 81 = U+E601. */
  .w-icon-slider-left:before {
    content: "\e601";
  }

  /* ref css:1186-1194. height:300px is overridden by .slider (ref css:2198)
     below, and is kept only because the reference keeps it. background:#ddd is
     NOT overridden anywhere: it is the ground behind the mask, and it is what a
     slide with a broken image URL shows — grey is a failure, not the design. */
  .w-slider {
    text-align: center;
    clear: both;
    -webkit-tap-highlight-color: #0000;
    background: #ddd;
    height: 300px;
    position: relative;
  }

  /* ref css:1196-1205 */
  .w-slider-mask {
    z-index: 1;
    white-space: nowrap;
    height: 100%;
    display: block;
    position: relative;
    left: 0;
    right: 0;
    overflow: hidden;
  }

  /* ref css:1207-1215 — inline-block inside the nowrap mask above. See the
     markup comment: this pair is why inter-element whitespace is load-bearing. */
  .w-slide {
    vertical-align: top;
    white-space: normal;
    text-align: left;
    width: 100%;
    height: 100%;
    display: inline-block;
    position: relative;
  }

  /* ref css:1217-1227 */
  .w-slider-nav {
    z-index: 2;
    text-align: center;
    -webkit-tap-highlight-color: #0000;
    height: 40px;
    margin: auto;
    padding-top: 10px;
    position: absolute;
    inset: auto 0 0;
  }

  /* ref css:1229-1231 */
  .w-slider-nav.w-round > div {
    border-radius: 100%;
  }

  /* ref css:1241-1243 */
  .w-slider-nav.w-shadow > div {
    box-shadow: 0 0 3px #3336;
  }

  /* ref css:1257-1266 — 1em against the 14px inherited above, so 14×14 with a
     0 3px 7px margin. */
  .w-slider-dot {
    cursor: pointer;
    background-color: #fff6;
    width: 1em;
    height: 1em;
    margin: 0 3px 0.5em;
    transition:
      background-color 0.1s,
      color 0.1s;
    display: inline-block;
    position: relative;
  }

  /* ref css:1268-1270 */
  .w-slider-dot.w-active {
    background-color: #fff;
  }

  /* ref css:1281-1294 — width:80px is a border-box width (see box-sizing above),
     and font-size:40px is what sizes the 1em glyph at ref css:1315-1316. */
  .w-slider-arrow-left,
  .w-slider-arrow-right {
    cursor: pointer;
    color: #fff;
    -webkit-tap-highlight-color: #0000;
    -webkit-user-select: none;
    user-select: none;
    width: 80px;
    margin: auto;
    font-size: 40px;
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  /* ref css:1296-1298 — same prefix-selector transcription as ref css:178-188
     above. This is the declaration that makes the arrow paddings inert for the
     glyph: absolutely positioned, its containing block is the arrow's PADDING
     box, so .left-arrow's padding-top:100px (ref css:2258) does not move it. */
  .left-arrow .w-icon-slider-left,
  .right-arrow .w-icon-slider-right {
    position: absolute;
  }

  /* ref css:1304-1307 — with inset:0 above, right:auto pins it to the left edge. */
  .w-slider-arrow-left {
    z-index: 3;
    right: auto;
  }

  /* ref css:1309-1312 */
  .w-slider-arrow-right {
    z-index: 4;
    left: auto;
  }

  /* ref css:1314-1319 — 1em at the 40px of ref css:1290 is a 40×40 box, centred
     in the arrow's padding box by margin:auto + inset:0. */
  .w-icon-slider-left,
  .w-icon-slider-right {
    width: 1em;
    height: 1em;
    margin: auto;
    inset: 0;
  }

  /* ref css:2104-2113 — absolutely positioned against .slider (ref css:2199).
     align-items:center is what centres the mark over the tagline; .w-slider's
     text-align:center (ref css:1187) is not. */
  ._29-navy-logo-hero {
    z-index: 10;
    flex-direction: column;
    align-items: center;
    display: flex;
    position: absolute;
    top: 50%;
    right: 140px;
    transform: translate(0%, -50%);
  }

  /* ref css:2115-2124 — .text-block occurs exactly once in index.html, so these
     are effectively section-scoped in the reference too. */
  .text-block {
    color: #000;
    text-align: center;
    margin-top: 10px;
    padding-bottom: 10px;
    font-family:
      Arial,
      Helvetica Neue,
      Helvetica,
      sans-serif;
    font-size: 32px;
    font-weight: 700;
    line-height: 38px;
  }

  /* ref css:2197-2200 — overrides .w-slider's height:300px (ref css:1192).
     Literally vh, not dvh: they are not the same on mobile Safari. */
  .slider {
    height: 100vh;
    position: relative;
  }

  /* ref css:2202-2204 — a no-op against margin:auto + inset:auto 0 0
     (ref css:1223, :1226), reproduced because the reference declares it. */
  .slide-nav {
    margin-bottom: 0;
  }

  /* ref css:2206-2208 */
  .section-2 {
    height: 100vh;
  }

  /* The six slide backgrounds, in the reference's own source order. Each
     background-image is the reference default; an authored Prismic image
     overrides it through the inline style in the markup, leaving the position,
     size and repeat below in force. The asymmetry is reproduced deliberately:
     .slide (ref css:2231-2234) and .slide-2 (ref css:2244-2247) declare NO
     background-repeat, while the other four do. It is inert under
     background-size:cover, but a computed-style diff would flag a shared class
     that added it to all six. */

  /* ref css:2210-2215 */
  .slide-8 {
    background-image: url("/29navy/assets/614de02ec8febc401227ffd2_gallery_colvu1.jpg");
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
  }

  /* ref css:2217-2222 */
  .slide-7 {
    background-image: url("/29navy/assets/614de02ec8febc767427ffcd_gallery_colvu2.jpg");
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
  }

  /* ref css:2231-2235 — the hero photograph, and it is the FOURTH slide. No
     background-repeat in the reference. */
  .slide {
    background-image: url("/29navy/assets/614ddfc369005a542460176f_hero-main-final.jpg");
    background-position: 50%;
    background-size: cover;
  }

  /* ref css:2244-2248 — no background-repeat in the reference. */
  .slide-2 {
    background-image: url("/29navy/assets/614de02ec8febcca7527ffb4_gallery_29navy_interior.jpg");
    background-position: 50%;
    background-size: cover;
  }

  /* ref css:2250-2255 — slide ONE in document order, i.e. frame 0. */
  .slide-6 {
    background-image: url("/29navy/assets/614de02ec8febc5e1427ffc8_gallery_roof1.jpg");
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
  }

  /* ref css:2257-2261 — 20+20 ≤ the 80px of ref css:1288, so the used
     border-box width stays 80px at 1440 and 991. padding-top:100px is inert for
     the glyph (see ref css:1296-1298 above). */
  .left-arrow {
    padding-top: 100px;
    padding-left: 20px;
    padding-right: 20px;
  }

  /* ref css:2263-2268 */
  .slide-5 {
    background-image: url("/29navy/assets/614de02ec8febce2c327ffc3_gallery_13A9553p.jpg");
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
  }

  /* ref css:2878-2880 — the base state. The aerial is HIDDEN at 1440 and 991. */
  .mobile-location {
    display: none;
  }

  /* ref css:2882-2885 — padding-right:20px is never overridden at any
     breakpoint and still applies at 390. */
  .right-arrow {
    padding-left: 20px;
    padding-right: 20px;
  }

  /* ref css:3116 opens `@media screen and (max-width: 991px)`. */
  @media screen and (max-width: 991px) {
    /* ref css:3117-3119 — `color: var(--white)`, and --white is declared as the
       keyword `white` at ref css:2074. The literal is used rather than the
       custom property because :root belongs to the document, not to a slice.
       The logo does NOT follow the tagline white: it is an opaque JPEG of a
       black mark on a white field and there is no white variant in the capture,
       so it stays a white tile over the photo at every viewport. */
    .text-block {
      color: white;
    }

    /* ref css:3170-3172 — redundant while the parent .mobile-location is
       display:none, and it is exactly why ref css:3361-3363 has to name both. */
    .image-18 {
      display: none;
    }
  }

  /* ref css:3218 opens `@media screen and (max-width: 767px)`. */
  @media screen and (max-width: 767px) {
    /* ref css:3219-3221 */
    .text-block {
      color: white;
    }

    /* ref css:3231-3234 */
    .slider {
      width: auto;
      height: 50vh;
    }

    /* ref css:3236-3238 — the section becomes exactly its 50vh child. Any
       min-height:100vh surviving in this chain doubles the band. */
    .section-2 {
      height: auto;
    }

    /* ref css:3240-3243 — padding-left stays 20px from ref css:2259, so
       20+140 = 160 > 80 and the border-box arrow swells to 160px here. */
    .left-arrow {
      padding-top: 20px;
      padding-right: 140px;
    }

    /* ref css:3361-3363 — ONE rule flips BOTH, and it is the only thing that
       reveals the aerial. It also overrides img's display:inline-block
       (ref css:235), which is what keeps an inline baseline gap from opening
       under the image. */
    .mobile-location,
    .image-18 {
      display: block;
    }

    /* ref css:3365-3367 — 140+20 = 160 > 80, so this arrow swells to 160px too. */
    .right-arrow {
      padding-left: 140px;
    }
  }

  /* ref css:3396 opens `@media screen and (max-width: 479px)`. At 390 BOTH this
     block and the ≤767 one apply, and the arrow paddings resolve across the two
     of them — reading only the nearest block gives 140px paddings and a 160px
     arrow box that should be 80px. */
  @media screen and (max-width: 479px) {
    /* ref css:3402-3407 — `left` is NEVER declared, so the used left is the
       abspos static position, .slider's content-box left edge. top:50% and
       transform:translate(0%,-50%) from ref css:2110/:2112 are not overridden
       and still apply, so writing left:50% or inset-inline:0 as a "clearer
       equivalent" would shift the block. */
    ._29-navy-logo-hero {
      flex-flow: column;
      align-items: center;
      width: 100vw;
      right: auto;
    }

    /* ref css:3409-3411 */
    .text-block {
      color: white;
    }

    /* ref css:3413-3415 — restates the 50vh; width:auto from ref css:3232
       still applies. */
    .slider {
      height: 50vh;
    }

    /* ref css:3417-3420 — padding-right:10px beats ref css:3242's 140px on
       source order; padding-top:20px from ref css:3241 SURVIVES. Net 20/10/0/10,
       so the used width drops back to 80px. */
    .left-arrow {
      padding-left: 10px;
      padding-right: 10px;
    }

    /* ref css:3516-3520 — padding-left:10px beats ref css:3366's 140px;
       padding-right stays 20px from ref css:2884. Net 0/20/0/10, used width back
       to 80px. position/inset restate ref css:1291-1292 and ref css:1311. */
    .right-arrow {
      padding-left: 10px;
      position: absolute;
      inset: 0% 0% 0% auto;
    }
  }
</style>
