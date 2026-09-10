<script lang="ts">
  import { asLinkAttrs, isFilled } from "@prismicio/client";
  import type { BooleanField, ImageField, KeyTextField, LinkField } from "@prismicio/client";
  import { srcset as prismicSrcset } from "$lib/utils/image";
  import { preloadHidden } from "$utils/preloadHidden";

  // Mirrors model.json. Slice Machine's generated `Content.NavyFloorPlansSlice`
  // supersedes this once the slice is registered and src/prismicio-types.d.ts is
  // regenerated — that file is generated, so this component does not reach into it.
  type Floor = {
    label: KeyTextField;
    trigger_image: ImageField;
    floorplan: ImageField;
    pdf: LinkField;
    open_by_default: BooleanField;
  };
  type NavyFloorPlansSlice = {
    slice_type: string;
    variation: string;
    primary: {
      title: KeyTextField;
      intro: KeyTextField;
      pdf_label: KeyTextField;
      floors: Floor[];
    };
  };

  let { slice }: { slice: NavyFloorPlansSlice } = $props();

  const floors = $derived(slice.primary.floors ?? []);

  /**
   * Per-position facts read straight out of the reference's own Lofts subtree
   * (matching/spec/index.html, bytes 4811-10755). Index is the reference's DOM
   * order, which is DESCENDING by floor: 0 = 4th floor … 3 = 1st floor.
   *
   * THE REFERENCE CLASS NAMES DO NOT NAME THEIR FLOOR. `.div-block-38` is the
   * 3rd-floor trigger, `._2nd-floor-div` the 2nd, `._11` the 1st, `.div-block-6`
   * the 4th. That mapping is not guessed from the names: it is the Webflow ix2
   * wiring in matching/spec/js/29navy-8c2435.b450607e.3cb35528df4a8f16.js
   * (e-53 → a-17 "1st floor left animation" → `._1st-floor-modal`; e-47 → a-19 →
   * `._3rd-floor-modal`; e-45 → a-18 → `.second-floor-modal`; e-49 → a-20 →
   * `._4th-floor-modal`), and it is independently confirmed by the plans
   * themselves: the four PNGs on disk carry unit numbers 45 / 31-38 / 21-28 /
   * 1-8, so `68a8a9f0…_floorplan-level-1_label.png` — a stale export name — is
   * the SECOND floor and `68a8ab2e8c93…_floorplan-level-1_label.png` is the
   * first. Wiring by class name or by filename opens the wrong panel on three
   * of four clicks, and every panel is the same 1174-wide image, so the
   * geometry gate stays green while the interaction is wrong.
   *
   * The three per-position classes here are, in the reference, four separate
   * hand-authored rule sets that differ in painting and in hover/focus/active
   * behaviour (ref css:2964-3041). They are deliberately NOT unified: because
   * every border is 4px inside a border-box 216×50 box, a uniform rule passes
   * every geometry gate and fails only the interaction-state comparison.
   */
  const REF = [
    // 0 — reference 4th floor: `<div class="div-block-6"><div>4th Floor - Penthouse</div></div>`,
    //     the only trigger with visible text and the only one with no background PNG.
    //     `imageTrigger` is the documented fallback if an author does fill its image.
    {
      imageTrigger: "_11",
      panel: "_4th-floor-modal",
      planWidth: 1331,
      planClass: "",
      planId: "",
      glyph: "_4the-floor-pdf", // sic — the typo is the reference's
      link: "",
      trailingFpo: false,
    },
    // 1 — reference 3rd floor: `<div class="div-block-38">`
    {
      imageTrigger: "div-block-38",
      panel: "_3rd-floor-modal",
      planWidth: 1325,
      planClass: "",
      planId: "",
      glyph: "floor-pds",
      link: "",
      trailingFpo: false,
    },
    // 2 — reference 2nd floor: `<div class="_2nd-floor-div">`
    {
      imageTrigger: "_2nd-floor-div",
      panel: "second-floor-modal",
      planWidth: 1345,
      planClass: "_2nd-floor-plan",
      planId: "",
      glyph: "_2nd-floor-pdf",
      link: "",
      trailingFpo: false,
    },
    // 3 — reference 1st floor: `<div class="_11">`. The only panel open at rest,
    //     the only PDF link carrying `.link-block-14` (ref css:3058-3060) and the
    //     only one without `target="_blank"`, and the only one holding the dead
    //     `.image-14` FPO jpg.
    {
      imageTrigger: "_11",
      panel: "_1st-floor-modal",
      planWidth: 1214,
      planClass: "",
      planId: "floor-1",
      glyph: "",
      link: "link-block-14",
      trailingFpo: true,
    },
  ];
  /** A fifth floor has no counterpart in the reference; it gets the plainest
      trigger and panel, and never a second copy of the dead FPO image. */
  const FALLBACK = {
    imageTrigger: "_11",
    panel: "_1st-floor-modal",
    planWidth: 1214,
    planClass: "",
    planId: "",
    glyph: "",
    link: "",
    trailingFpo: false,
  };
  const refAt = (i: number) => REF[i] ?? FALLBACK;

  /**
   * Webflow writes `-p-<w>` siblings next to every image it resizes, and each of
   * the four floor plans ships 500/800/1080/1600/2000 plus the full-size
   * original at its intrinsic width — read off the four `<img srcset>` in
   * matching/spec/index.html and verified against static/29navy/assets/.
   * Restricted to `.png` on purpose: the one JPEG in this subtree (`.image-14`)
   * was re-encoded by Webflow as `.jpeg` variants with NO 500w candidate, so it
   * carries the reference's srcset literally instead of going through here.
   */
  const CAPTURE_WIDTHS = [500, 800, 1080, 1600, 2000];
  function captureSrcset(image: ImageField): string | undefined {
    const url = image?.url;
    if (typeof url !== "string") return undefined;
    const stem = /^(\/29navy\/assets\/.+)\.png$/.exec(url)?.[1];
    if (!stem) return undefined;
    const candidates = CAPTURE_WIDTHS.map((w) => `${stem}-p-${w}.png ${w}w`);
    const intrinsic = image?.dimensions?.width;
    if (intrinsic) candidates.push(`${url} ${intrinsic}w`);
    return candidates.join(", ");
  }
  /** Capture assets keep the reference's own variants; a Prismic-hosted image
      falls through to the repo's imgix helper. */
  const planSrcset = (image: ImageField) => captureSrcset(image) ?? prismicSrcset(image?.url);

  /** `._1st-floor-modal` is open at rest — inline `style="display:flex"` in the
      reference HTML and `display: flex` at ref css:2338, against `display: none`
      for the other three (ref css:3065, ref css:3081). Initialising every panel
      closed loses ~750px of page height at 1440 and blows the whole page's
      height delta, reading as a layout bug rather than a missing initial state.
      So: the first floor flagged `open_by_default`, and if an author flags none,
      the LAST floor — never "all closed". */
  const defaultOpen = $derived(
    floors.findIndex((f) => f.open_by_default === true) !== -1
      ? floors.findIndex((f) => f.open_by_default === true)
      : floors.length - 1,
  );
  let clicked = $state<number | null>(null);
  const open = $derived(clicked ?? defaultOpen);

  const panelId = (i: number) => `lofts-floor-panel-${i}`;

  function select(i: number) {
    clicked = i;
  }
  function activate(event: KeyboardEvent, i: number) {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      select(i);
    }
  }

  /* Three of the four floor plans are hidden at rest — only the
     `open_by_default` one is shown — and each is a 2402×1392 PNG. Hovering a
     floor therefore starts the fetch and the plan arrives after the swap, which
     is the whole interaction the section exists for. Warmed after `load`, with
     the srcset so the browser resolves the SAME candidate the <img> will (see
     $utils/preloadHidden); the already-visible plan is a cache hit and costs
     nothing. `.image-14` is deliberately absent — ref css:2789 hides it and
     nothing in any reference JS chunk ever un-hides it. */
  const hiddenPlans = $derived(
    floors.map((floor) => ({
      src: floor.floorplan?.url,
      srcset: planSrcset(floor.floorplan),
      sizes: "100vw",
    })),
  );

  $effect(() => preloadHidden(hiddenPlans));
</script>

<!--
  Reference subtree: `<div id="Lofts" class="section-4">` — a left column
  (`.div-block-5`) of four floor triggers, and four sibling floor panels of
  which exactly one is displayed. `id="Lofts"` is a structural contract with the
  navbar's `<a href="#Lofts">`, not content: hard-coded, never authored.

  Deviations from the reference, all deliberate:
  • The four triggers are `<div>`s with `cursor: pointer` in the reference and
    are therefore neither focusable nor operable by keyboard — which also makes
    the reference's own `.div-block-38:focus` (ref css:2990) and `._11:focus`
    (ref css:3037) rules dead. They are `role="button" tabindex="0"` here with
    Enter/Space handling, which costs no box (a `<button>` would have dragged in
    UA font, border and padding that no reference line could justify) and makes
    those two focus rules reachable.
  • `.text-block-3` is an `<h2>`, not a `<div>`, for the document outline; the
    two declarations that restore the reference div's computed margin and weight
    are cited below.
  • Image `alt` is real text; the reference ships `alt=""` on all 23 images, and
    this repo pre-declared that as an accepted text-diff artifact.
  • The `<a>` wrapping the download glyph gets an `aria-label`; in the reference
    its whole accessible name is the bare U+F15B private-use codepoint.
  • Panel DOM order here follows the authored floors (4, 3, 2, 1). The reference
    orders the panels 2, 3, 4, 1 while ordering the triggers 4, 3, 2, 1. Since at
    most one panel is ever `display: flex` and the other three generate no box,
    no rect at any state depends on that order.
-->
<div
  id="Lofts"
  class="section-4"
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
>
  <div class="div-block-5">
    <h2 class="text-block-3">{slice.primary.title}</h2>
    <div class="text-block-4">{slice.primary.intro}</div>

    {#each floors as floor, i (i)}
      {@const r = refAt(i)}
      {#if isFilled.image(floor.trigger_image)}
        <!-- The floor's name is baked into the 216×50 PNG, so it reaches the
             accessibility tree as the button's name and nowhere else — no extra
             element, no visually-hidden rule this stylesheet could not cite.
             The url travels as a custom property rather than as
             `background-image` directly: an inline `background-image` would
             outrank `.div-block-38:active` (ref css:2984) and `._11:focus`
             (ref css:3038), which restate the same url under an overlay. -->
        <div
          class={r.imageTrigger}
          role="button"
          tabindex="0"
          aria-expanded={open === i}
          aria-controls={panelId(i)}
          aria-label={floor.label}
          style="--trigger-bg: url('{floor.trigger_image.url}')"
          onclick={() => select(i)}
          onkeydown={(event) => activate(event, i)}
        ></div>
      {:else}
        <div
          class="div-block-6"
          role="button"
          tabindex="0"
          aria-expanded={open === i}
          aria-controls={panelId(i)}
          onclick={() => select(i)}
          onkeydown={(event) => activate(event, i)}
        >
          <div>{floor.label}</div>
        </div>
      {/if}
    {/each}
  </div>

  {#each floors as floor, i (i)}
    {@const r = refAt(i)}
    <!-- `style="display:…"` is the reference's own mechanism, not a shortcut:
         the captured HTML ships `style="display:flex"` on `._1st-floor-modal`
         and `style="display:none"` on `.second-floor-modal`, and Webflow's
         actionLists a-17…a-20 switch the panels by writing exactly this
         property inline. The at-rest CSS values are transcribed below too, so
         the panel is correct with the inline attribute stripped. -->
    <div class={r.panel} id={panelId(i)} style={open === i ? "display:flex" : "display:none"}>
      {#if isFilled.image(floor.floorplan)}
        <!-- `width` is the reference's own presentational hint and differs per
             panel (1331 / 1325 / 1345 / 1214) for four images that are all the
             identical 2402×1392 — reproduced verbatim, not normalised. NO
             `height` attribute: with `max-width: 100%` (ref css:234) and no
             height anywhere, the clamped width is what regenerates the height
             from the intrinsic ratio (1174 × 1392/2402 = 680.3 at 1440). -->
        <img
          class={r.planClass || undefined}
          id={r.planId || undefined}
          src={floor.floorplan.url}
          srcset={planSrcset(floor.floorplan)}
          sizes="100vw"
          width={r.planWidth}
          alt={floor.floorplan.alt ?? ""}
          loading="lazy"
        />
      {/if}
      {#if isFilled.link(floor.pdf)}
        <!-- A plain `<a>` built from `asLinkAttrs` rather than `<PrismicLink>`,
             which resolves the field identically but renders the anchor inside
             its own component — where this stylesheet's scoping class does not
             reach, so `.link-block-14` (ref css:3058) and `.w-inline-block`
             (ref css:246) would silently never match it. -->
        <a
          {...asLinkAttrs(floor.pdf)}
          class={r.link ? `${r.link} w-inline-block` : "w-inline-block"}
          aria-label={floor.label
            ? `${slice.primary.pdf_label} — ${floor.label}`
            : slice.primary.pdf_label}
        >
          <!-- U+F15B, fa-file (solid), rendered through the self-hosted
               "Fa solid 900" face declared below. The reference's div looks
               empty in a terminal because the codepoint is in the private-use
               area; it is not empty. Never substituted with an SVG or an icon
               component — the real font file is on disk. -->
          <div class={r.glyph ? `_3 ${r.glyph}` : "_3"} aria-hidden="true">&#xf15b;</div>
        </a>
      {/if}
      <div>{slice.primary.pdf_label}</div>
      {#if r.trailingFpo}
        <!-- `.image-14`: the fourth child of `._1st-floor-modal`, `display: none`
             at ref css:2789, and grep across all three reference JS chunks
             returns zero hits for `image-14` — nothing ever un-hides it. It
             contributes to no rect, but it is one of the page's 23 `<img>` in
             matching/CAPTURE.md, so it is kept, hard-coded and hidden, rather
             than silently dropped. `alt=""` is correct here and is not the
             reference artifact noted above: the element is never rendered and
             never exposed. Its srcset is the reference's own — Webflow emitted
             `.jpeg` variants of a `.jpg` original and no 500w candidate. -->
        <img
          class="image-14"
          src="/29navy/assets/614de03e7978b7a0d3de6cce_29N_floor_plan_fpo.jpg"
          srcset="/29navy/assets/614de03e7978b7a0d3de6cce_29N_floor_plan_fpo-p-800.jpeg 800w, /29navy/assets/614de03e7978b7a0d3de6cce_29N_floor_plan_fpo-p-1080.jpeg 1080w, /29navy/assets/614de03e7978b7a0d3de6cce_29N_floor_plan_fpo-p-1600.jpeg 1600w, /29navy/assets/614de03e7978b7a0d3de6cce_29N_floor_plan_fpo-p-2000.jpeg 2000w, /29navy/assets/614de03e7978b7a0d3de6cce_29N_floor_plan_fpo.jpg 2402w"
          sizes="100vw"
          width="1199"
          alt=""
          loading="lazy"
        />
      {/if}
    </div>
  {/each}
</div>

<style>
  /* Every declaration in this block is transcribed from the captured reference
     stylesheet, matching/spec/29navy-8c2435.shared.46514381b.css, and cites its
     line. A declaration with no line behind it does not belong here. Where the
     reference resolves a custom property, the property's own definition is
     cited alongside the use: `--white` is `white` at ref css:2074 and
     `--white-2` is `#ffffff78` at ref css:2077, both under `:root` at
     ref css:2073. They are written out rather than referenced, because this
     build has no `:root` block carrying the reference's names. */

  /* ref css:2049-2055. Only the woff2 source is shipped: the .eot/.woff/.ttf/
     .svg fallbacks are on disk under static/29navy/fonts/ but target browsers
     that cannot run this bundle. Without this face the U+F15B glyph falls back
     to `sans-serif` (ref css:3049) and renders as tofu at a different advance
     width — while the 50px line box at ref css:3051 holds, so every height gate
     stays green and only the icon is wrong. */
  @font-face {
    font-family: "Fa solid 900"; /* ref css:2050 */
    src: url("/29navy/fonts/6153165404074dc8073ec349_fa-solid-900.woff2") format("woff2"); /* ref css:2051 */
    font-weight: 400; /* ref css:2052 */
    font-style: normal; /* ref css:2053 */
    font-display: swap; /* ref css:2054 */
  }

  /* ref css:214-216 — `* { box-sizing: border-box }`. Load-bearing: the 216px
     trigger widths, the 5px/10px paddings and every 4px hover border are
     border-box, so no hover state shifts a single box. */
  #Lofts,
  #Lofts * {
    box-sizing: border-box; /* ref css:215 */
  }

  .section-4 {
    color: #fff; /* ref css:2278 */
    background-color: #aa4133; /* ref css:2279 */
    flex-direction: row; /* ref css:2280 */
    height: auto; /* ref css:2281 */
    margin-top: 0; /* ref css:2282 */
    padding: 40px 20px 60px; /* ref css:2283 */
    display: flex; /* ref css:2284 */
    /* Inherited from the reference's own body rule. Restated at the section
       root because the height ladder of this band is built out of them: the
       20px line box is a term in all four modal heights and the 14px sizes the
       4th-floor trigger's label. */
    font-family: Arial, sans-serif; /* ref css:227 */
    font-size: 14px; /* ref css:228 */
    line-height: 20px; /* ref css:229 */
  }

  /* ref css:232-235. Restated inside this component because the app's Tailwind
     preflight sets `img { display: block }` at the same specificity; Svelte's
     scoping class makes this rule win. `max-width: 100%` is what clamps the
     floor plan to the panel, and there is deliberately NO `height` declaration
     — the intrinsic 2402/1392 ratio is what produces the 680.3px. */
  img {
    vertical-align: middle; /* ref css:233 */
    max-width: 100%; /* ref css:234 */
    display: inline-block; /* ref css:235 */
  }

  /* ref css:246-248 — the wrapper class on all four PDF anchors. */
  .w-inline-block {
    max-width: 100%; /* ref css:247 */
    display: inline-block; /* ref css:248 */
  }

  /* NO width and NO display of its own: `.div-block-5` is a plain block that is
     a flex ITEM of `.section-4`. Its automatic minimum size is 216 (ref
     css:2972) + 5 + 5 = 226px, which is the whole reason the open panel settles
     at 1400 − 226 = 1174 at x = 246. Pinning a width here, or dropping either
     auto margin, moves the panel at three of the four gate viewports. */
  .div-block-5 {
    background-color: #aa4133; /* ref css:2288 */
    max-width: 33.3%; /* ref css:2289 */
    margin-left: auto; /* ref css:2290 */
    margin-right: auto; /* ref css:2291 */
    padding-left: 5px; /* ref css:2292 */
    padding-right: 5px; /* ref css:2293 */
  }

  .text-block-3 {
    padding-left: 0; /* ref css:2297 */
    font-size: 32px; /* ref css:2298 */
    line-height: 44px; /* ref css:2299 */
    /* The reference element is `<div class="text-block-3">Lofts</div>` and
       ref css:2296-2299 declares no margin and no weight, so the reference box
       computes to margin 0 / weight 400. This build promotes it to `<h2>`,
       which in the reference sheet would pick up `margin-bottom: 10px` and
       `font-weight: bold` (ref css:380-381) plus `margin-top: 20px`
       (ref css:391). These two restore the reference's computed values. */
    margin: 0; /* ref css:2296 — the reference `.text-block-3` block declares no margin */
    font-weight: 400; /* ref css:2296 — and no weight; a div computes 400 */
  }

  .text-block-4 {
    padding-left: 0; /* ref css:2303 */
    font-size: 20px; /* ref css:2304 */
    line-height: 1.2em; /* ref css:2305 — 24px per line on 20px type */
  }

  /* The 4th-floor trigger. No width and no height: it fills `.div-block-5`'s
     216px content box, and its height is 5 + 20 (ref css:229) + 10 = 35px plus
     40px of margins — which is why an empty `trigger_image` selects THIS
     rendering and a filled one selects the fixed 216×50 boxes below. */
  .div-block-6 {
    cursor: pointer; /* ref css:2309 */
    background-color: #000; /* ref css:2310 */
    justify-content: center; /* ref css:2311 */
    margin-top: 20px; /* ref css:2312 */
    margin-bottom: 20px; /* ref css:2313 */
    margin-left: 0; /* ref css:2314 */
    padding-top: 5px; /* ref css:2315 */
    padding-bottom: 10px; /* ref css:2316 */
    display: flex; /* ref css:2317 */
  }

  .div-block-6:hover {
    background-color: #ffffff7d; /* ref css:2321 — background only, never a border */
  }

  /* The 3rd-floor trigger. Note `cover` at `50%` here against `auto` at `0 0`
     on the other two: same box, different painting. */
  .div-block-38 {
    color: #000; /* ref css:2965 */
    cursor: pointer; /* ref css:2966 */
    background-color: #000; /* ref css:2967 */
    background-image: var(--trigger-bg); /* ref css:2968 — url supplied by the field */
    background-position: 50%; /* ref css:2969 */
    background-repeat: no-repeat; /* ref css:2970 */
    background-size: cover; /* ref css:2971 */
    width: 216px; /* ref css:2972 */
    height: 50px; /* ref css:2973 */
    padding-left: 5px; /* ref css:2974 */
    padding-right: 5px; /* ref css:2975 */
    transition: border 0.2s; /* ref css:2976 */
  }

  .div-block-38:hover {
    border: 4px solid white; /* ref css:2980 — var(--white), ref css:2074 */
  }

  .div-block-38:active {
    background-image:
      linear-gradient(to bottom, #ffffff78, #ffffff78), var(--trigger-bg); /* ref css:2984 — var(--white-2), ref css:2077 */
    background-position:
      0 0,
      50%; /* ref css:2985 */
    background-repeat: repeat, no-repeat; /* ref css:2986 */
    background-size: auto, cover; /* ref css:2987 */
  }

  .div-block-38:focus {
    border: 4px solid white; /* ref css:2991 — border, where `._11:focus` swaps background */
  }

  /* The 2nd-floor trigger. NO transition, NO :active and NO :focus in the
     reference — the asymmetry is deliberate and is not unified here. */
  ._2nd-floor-div {
    cursor: pointer; /* ref css:2995 */
    background-color: #000; /* ref css:2996 */
    background-image: var(--trigger-bg); /* ref css:2997 */
    background-position: 0 0; /* ref css:2998 */
    background-size: auto; /* ref css:2999 */
    width: 216px; /* ref css:3000 */
    height: 50px; /* ref css:3001 */
    padding-left: 5px; /* ref css:3002 */
    padding-right: 5px; /* ref css:3003 */
  }

  ._2nd-floor-div:hover {
    border: 4px solid white; /* ref css:3007 — var(--white), ref css:2074 */
  }

  /* The 1st-floor trigger. */
  ._11 {
    cursor: pointer; /* ref css:3021 */
    background-color: #000; /* ref css:3022 */
    background-image: var(--trigger-bg); /* ref css:3023 */
    background-position: 0 0; /* ref css:3024 */
    background-size: auto; /* ref css:3025 */
    width: 216px; /* ref css:3026 */
    height: 50px; /* ref css:3027 */
    padding-left: 5px; /* ref css:3028 */
    padding-right: 5px; /* ref css:3029 */
    transition: border 0.2s; /* ref css:3030 */
  }

  ._11:hover {
    border: 4px solid white; /* ref css:3034 — var(--white), ref css:2074 */
  }

  ._11:focus {
    background-image:
      linear-gradient(to bottom, #ffffff78, #ffffff78), var(--trigger-bg); /* ref css:3038 — background, where `.div-block-38:focus` swaps border */
    background-position:
      0 0,
      0 0; /* ref css:3039 */
    background-size: auto, auto; /* ref css:3040 */
  }

  /* The 2nd-floor plan carries its own display toggle in the reference, which
     actionList a-17 sets to `none` and a-18 sets back to `block`. That toggle
     is not ported: this build switches at the panel only, which is observably
     identical (the plan is visible exactly when its panel is) and cannot leave
     floor 2 permanently blank after one floor-1 click. The at-rest value stays. */
  ._2nd-floor-plan {
    display: block; /* ref css:3044 */
  }

  ._3 {
    color: white; /* ref css:3048 — var(--white), ref css:2074 */
    font-family: "Fa solid 900", sans-serif; /* ref css:3049 */
    font-size: 50px; /* ref css:3050 */
    line-height: 50px; /* ref css:3051 — the second term in every modal height */
  }

  ._3:hover {
    color: #050101db; /* ref css:3055 */
  }

  /* Only the 1st-floor link carries this class, and nothing in the reference
     sheet removes the UA underline from a bare `<a>` (ref css:273 is
     `.w-button`), so the glyph is UNDERLINED in the 2nd/3rd/4th panels and
     clean in the 1st. The 1st panel is the one open at rest, so no at-rest
     gate can see this; it shows up only after a click. */
  .link-block-14 {
    text-decoration: none; /* ref css:3059 */
  }

  .second-floor-modal {
    flex-direction: column; /* ref css:3063 */
    align-items: center; /* ref css:3064 */
    display: none; /* ref css:3065 */
  }

  ._3rd-floor-modal,
  ._4th-floor-modal {
    flex-direction: column; /* ref css:3079 */
    align-items: center; /* ref css:3080 */
    display: none; /* ref css:3081 */
  }

  /* Open at rest, and the only panel with auto margins. */
  ._1st-floor-modal {
    flex-direction: column; /* ref css:2334 */
    align-items: center; /* ref css:2335 */
    margin-left: auto; /* ref css:2336 */
    margin-right: auto; /* ref css:2337 */
    display: flex; /* ref css:2338 */
  }

  .image-14 {
    display: none; /* ref css:2789 */
  }

  /* ref css:3116 opens `@media screen and (max-width: 991px)`. Everything in
     here applies at 991, 767 AND 390 — the ≤767 and ≤479 blocks do not restate
     it. `._3 { margin-top: 20px }` therefore adds 20px to EVERY panel at three
     of the four gate viewports, while `.second-floor-modal { padding-top }` and
     `.div-block-38 { display: flex }` apply to exactly one element each.
     Hoisting either into a shared rule inflates the wrong boxes. */
  @media screen and (max-width: 991px) {
    .section-4 {
      flex-direction: column; /* ref css:3122 */
      height: auto; /* ref css:3123 */
      padding-right: 20px; /* ref css:3124 — top 40 / left 20 / bottom 60 still come from ref css:2283 */
    }

    /* `max-width` goes, but `margin-left/right: auto` (ref css:2290-2291)
       survives — on the cross axis of a now-column flex those auto margins
       suppress the default stretch, so this box is fit-content and centred,
       never filling the 951/727/370px content box. */
    .div-block-5 {
      max-width: none; /* ref css:3128 */
      padding-left: 10px; /* ref css:3129 */
      padding-right: 10px; /* ref css:3130 */
    }

    .text-block-3,
    .text-block-4 {
      text-align: center; /* ref css:3134 — no font-size change at any breakpoint */
    }

    .div-block-38 {
      justify-content: center; /* ref css:3188 */
      display: flex; /* ref css:3189 — this trigger only */
    }

    .div-block-38:hover {
      border-style: none; /* ref css:3193 */
    }

    .div-block-38:active {
      border-style: solid; /* ref css:3197 */
    }

    ._2nd-floor-div:hover {
      border-style: none; /* ref css:3201 */
      border-width: 0; /* ref css:3202 */
    }

    ._11:hover {
      border-style: none; /* ref css:3206 */
    }

    ._3 {
      margin-top: 20px; /* ref css:3210 — +20px to every panel at 991, 767 and 390 */
    }

    .second-floor-modal {
      padding-top: 20px; /* ref css:3214 — the 2nd-floor panel ONLY */
    }
  }

  /* ref css:3218 opens `@media screen and (max-width: 767px)`. */
  @media screen and (max-width: 767px) {
    .section-4 {
      flex-direction: column; /* ref css:3246 */
      align-items: center; /* ref css:3247 */
      height: auto; /* ref css:3248 */
      padding-top: 20px; /* ref css:3249 */
    }

    .div-block-5 {
      max-width: none; /* ref css:3253 */
    }

    .text-block-3,
    .text-block-4 {
      text-align: center; /* ref css:3257 */
    }
  }

  /* ref css:3396 opens `@media screen and (max-width: 479px)`. `.section-4` at
     ref css:3422 is the ONLY rule in that whole block touching any class in this
     subtree — every one of the 19 class names was scanned against it. */
  @media screen and (max-width: 479px) {
    .section-4 {
      padding-top: 20px; /* ref css:3423 */
      padding-left: 10px; /* ref css:3424 */
      padding-right: 10px; /* ref css:3425 */
    }
  }
</style>
