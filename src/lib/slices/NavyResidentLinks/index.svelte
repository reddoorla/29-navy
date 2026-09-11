<script lang="ts">
  import { prefersReducedMotion } from "$lib/transitions";
  import { trapFocus } from "$lib/actions/trapFocus";
  import { asLink, type ImageField, type LinkField, type RichTextField } from "@prismicio/client";
  import { PrismicText } from "@prismicio/svelte";

  import { preloadHidden } from "$utils/preloadHidden";

  /** The six popups this section can open. Keyed exactly as model.json's
   *  `modal` Select options. SEVEN triggers map onto SIX popups: the reference's
   *  `.link-block-5` ("Connecting cable tv?") and `.link-block-6` ("Plugging in
   *  internet?") both fire IX2 actionList "a-8" against `.pop-up-modal---tv-internet`
   *  (matching/spec/js/29navy-8c2435.b450607e.3cb35528df4a8f16.js, events for
   *  data-w-id 78f28952-… and f6f92df2-…). That is not a modelling slip. */
  type ModalKey = "electric" | "laundry" | "gym" | "tv_internet" | "ride" | "food";

  type Tile = {
    label?: string | null;
    link?: LinkField;
    modal?: ModalKey | "" | null;
  };

  // Mirrors model.json. Slice Machine's generated `Content.NavyResidentLinksSlice`
  // supersedes this once the slice is registered and src/prismicio-types.d.ts is
  // regenerated — that file is generated, so this component does not reach into it.
  type NavyResidentLinksSlice = {
    slice_type: string;
    variation: string;
    primary: {
      heading: RichTextField;
      tiles: Tile[];
      electric_title?: string | null;
      electric_body: RichTextField;
      laundry_title?: string | null;
      laundry_logo: ImageField;
      laundry_link?: LinkField;
      gym_title?: string | null;
      gym_logo_1: ImageField;
      gym_link_1?: LinkField;
      gym_logo_2: ImageField;
      gym_link_2?: LinkField;
      tv_title?: string | null;
      tv_logo: ImageField;
      tv_link?: LinkField;
      tv_body: RichTextField;
      ride_title?: string | null;
      ride_logo_1: ImageField;
      ride_link_1?: LinkField;
      ride_logo_2: ImageField;
      ride_link_2?: LinkField;
      food_title?: string | null;
      food_logo_1: ImageField;
      food_link_1?: LinkField;
      food_logo_2: ImageField;
      food_link_2?: LinkField;
    };
  };

  let { slice }: { slice: NavyResidentLinksSlice } = $props();

  /** The shared close glyph, referenced six times by the reference
   *  (matching/spec/index.html: `…614de9548befc939ad34bd31_Untitled%20design%20(8).png`).
   *  ONE shared UI asset, not content, so it is hard-coded rather than fielded.
   *  The path is the reference's own, URL-encoded exactly as the reference
   *  encodes it.
   *
   *  CORRECTION (2026-09-11): this block used to say "KNOWN GAP: the file is NOT
   *  yet in static/29navy/assets/ — the Phase 0 capture missed it… Until then the
   *  `alt` text renders in its place". The asset landed in 800ceb5 and ships
   *  today at static/29navy/assets/614de9548befc939ad34bd31_Untitled design
   *  (8).png (literal spaces on disk, percent-encoded here — the same
   *  decodeURIComponent trap src/lib/site-pages-images.test.ts guards). The old
   *  sentence is left described rather than deleted because a reader who
   *  remembers it needs to know it stopped being true. */
  const CLOSE_ICON = "/29navy/assets/614de9548befc939ad34bd31_Untitled%20design%20(8).png";

  /** Per-tile anchor class and IX2 id, in the reference's DOCUMENT order
   *  (matching/spec/index.html, `#Residents`). The right column's class
   *  numbering is deliberately out of order — 5, 6, 8, 7 — so `.link-block-8`
   *  is "Need a ride?" and `.link-block-7` is "Hungry?". Wiring by class number
   *  instead of by this list silently swaps the ride and food popups. Each of
   *  these classes carries `text-decoration: none` and nothing else
   *  (ref css:2456, :2518, :2618, :2678), so the order is fidelity, not layout. */
  const ANCHORS: Array<{ className: string; wId?: string }> = [
    { className: "link-block" },
    { className: "link-block-2", wId: "c88d4373-280c-a519-1cb4-57d3e2a24ea5" },
    { className: "link-block-3", wId: "14ba19ab-09b3-b87a-5217-29bbcd828c7e" },
    { className: "link-block-4", wId: "439d8d07-5233-3d21-d1d7-d674daa7f95f" },
    { className: "link-block-5", wId: "78f28952-81a8-febc-467b-dd4abfa4bd95" },
    { className: "link-block-6", wId: "f6f92df2-d97d-4d84-e4f5-f94412183575" },
    { className: "link-block-8", wId: "fe7975ee-45f1-d457-5dc3-20fe6f208fe6" },
    { className: "link-block-7", wId: "a2f6f957-3c69-b2eb-3109-ff183138288a" },
  ];

  const tiles = $derived(slice.primary.tiles ?? []);
  /** The 4/4 split across the two `.w-col.w-col-6` is STRUCTURE, not content —
   *  the reference hard-codes two columns of four (matching/spec/index.html), so
   *  it is not a field. Halving keeps the reference's 4/4 and degrades sanely. */
  const half = $derived(Math.ceil(tiles.length / 2));
  const columns = $derived([tiles.slice(0, half), tiles.slice(half)]);

  const href = (field?: LinkField) => asLink(field ?? null) ?? undefined;
  const target = (field?: LinkField) =>
    field && "target" in field ? ((field as { target?: string }).target ?? undefined) : undefined;

  /** The reference joins the electric popup's two paragraphs with a literal
   *  `<br/><br/>` inside an UNCLASSED div, NOT with `<p>` elements — and `p`
   *  carries `margin-bottom: 10px` (ref css:420-423), so rendering them as `<p>`
   *  would add 10px of margin inside a fixed 300px box (ref css:2487). The two
   *  `<br/>` are emitted in the template, and the markup there is deliberately
   *  unwrapped and `prettier-ignore`d: a newline either side of a `<br/>`
   *  becomes a text node, and the one AFTER the break renders as a visible
   *  leading space on the next line. */
  const paragraphs = (field?: RichTextField) =>
    (field ?? [])
      .filter((block) => block.type === "paragraph")
      .map((block) => ("text" in block ? block.text : ""));

  // ---- Popup state. IX2's open sequence (actionList "a") is three groups:
  // group 1 is `useFirstGroupAsInitialState`, i.e. the inline display:none +
  // opacity:0; group 2 sets display:block with duration 0; group 3 tweens
  // opacity 0 -> 1 over 500ms, easing inOutQuad. The close sequence ("a-2")
  // reverses it: opacity -> 0 over 500ms, THEN display:none at duration 0.
  // `openKey` is group 2 and `shown` is group 3, which is why they are two
  // pieces of state and not one.
  let openKey = $state<ModalKey | null>(null);
  let shown = $state(false);
  let lastTrigger: HTMLElement | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  /** Click on the overlay itself — never on the panel inside it. Matches
   *  components/Modal.svelte:37-39, so a visitor who learns the gesture on one
   *  dialog in this site gets it on all of them. Keyboard users are served by
   *  Escape, which is why the svelte-ignore on each overlay is a reasoned
   *  exemption rather than a shrug. */
  const onBackdrop = (event: MouseEvent) => {
    if (event.target === event.currentTarget) closeModal();
  };

  function openModal(key: ModalKey, event: MouseEvent) {
    // The reference's triggers are `<a href="#">`; without this the browser
    // would jump to the top of the document behind the popup.
    event.preventDefault();
    clearTimeout(closeTimer);
    lastTrigger = event.currentTarget as HTMLElement;
    openKey = key;
    shown = prefersReducedMotion();
    if (!shown) requestAnimationFrame(() => (shown = true));
    // Focus is NOT moved here. `use:trapFocus` on each popup owns it, keyed on
    // `enabled` — see the markup. The hand-rolled version was
    // `queueMicrotask(() => closeRefs[key]?.focus())`, which raced Svelte's
    // flush: the popup is `display:none` until `popupStyle` lands, and .focus()
    // inside a display:none ancestor is a silent no-op — no throw, no return
    // value, nothing to assert on. trapFocus focuses inside requestAnimationFrame
    // after layout, and also does the containment this never had.
  }

  function closeModal() {
    const closing = openKey;
    if (!closing) return;
    shown = false;
    const restore = lastTrigger;
    lastTrigger = null;
    const finish = () => {
      if (openKey === closing) openKey = null;
      // AFTER openKey clears, not before. Restoring synchronously handed focus
      // back to the trigger while the popup was still painted and still
      // focusable for the whole 500ms fade, so Shift+Tab walked back into a
      // dialog that was on its way out.
      restore?.focus();
    };
    clearTimeout(closeTimer);
    if (prefersReducedMotion()) finish();
    else closeTimer = setTimeout(finish, 500);
  }

  function onWindowKey(event: KeyboardEvent) {
    if (event.key === "Escape" && openKey) closeModal();
  }

  /** The at-rest inline pair is reproduced VERBATIM from the reference HTML —
   *  `style="display:none;opacity:0"` on all six popups. It is IX2 output, not
   *  hand-authored CSS, and it is what actually hides them: an inline
   *  `display` beats every stylesheet rule, including the `display:none` those
   *  same popups get at <=767 (ref css:3297, :3306, :3314, :3322, :3330, :3338).
   *  Those media rules are therefore DEAD at runtime — every trigger event
   *  carries mediaQueries ["main","medium","small","tiny"], so the popups DO
   *  open at 767 and 390. They are transcribed below for cascade fidelity only;
   *  nothing gates on them. */
  const popupStyle = (key: ModalKey) =>
    openKey === key ? `display:block;opacity:${shown ? 1 : 0}` : "display:none;opacity:0";

  /** Marks the popup that is tweening TOWARDS opacity 1, so the stylesheet can
   *  give the two directions different easings — which the reference does. Set
   *  in the same frame as the opacity change, so the timing function is already
   *  in effect when the transition starts. */
  const openAttr = (key: ModalKey) => (openKey === key && shown ? "" : undefined);

  /* All thirteen images behind the six popups, plus the close icon they share.
     Every one of them sits inside a `display: none` container at rest, so
     `loading="lazy"` defers the fetch until the popup opens and the logo
     arrives visibly late — the modal animates in over a blank space. Warming
     them after `load` costs first paint nothing; see $utils/preloadHidden. */
  const hiddenImages = $derived([
    CLOSE_ICON,
    slice.primary.laundry_logo?.url,
    slice.primary.gym_logo_1?.url,
    slice.primary.gym_logo_2?.url,
    slice.primary.tv_logo?.url,
    slice.primary.ride_logo_1?.url,
    slice.primary.ride_logo_2?.url,
    slice.primary.food_logo_1?.url,
    slice.primary.food_logo_2?.url,
  ]);

  $effect(() => preloadHidden(hiddenImages));
</script>

<svelte:window onkeydown={onWindowKey} />

<!-- ===================================================================== -->
<!-- The six amenity popups. In the reference they precede `#Residents` in
     document order (matching/spec/index.html, char 10798 onward) and are all
     `position: fixed`, so they contribute NO height and their order among
     themselves only settles stacking — all six share `z-index: 3`. Rendered
     here as preceding siblings, exactly as captured.

     They are NOT interchangeable, and normalising them would be wrong:
     `.popup-modal---electric` is a 63%-alpha scrim with no width/height
     (ref css:2468-2474) where the other five are OPAQUE black at 100vw/100vh;
     `.div-block-24` is align-items:stretch (ref css:2696) and `.div-block-27`
     sets no align-items at all (ref css:2743-2754); and their <=479 heights are
     600 / 400 / 400 / 500 / unchanged / unchanged (ref css:3451, :3460, :3469,
     :3486). Six containers, six rule sets.                                   -->
<!-- ===================================================================== -->

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="popup-modal---electric"
  data-open={openAttr("electric")}
  style={popupStyle("electric")}
  onclick={onBackdrop}
>
  <div
    class="div-block-15"
    role="dialog"
    aria-modal="true"
    aria-labelledby="navy-residents-electric-title"
    aria-hidden={openKey === "electric" ? undefined : "true"}
    use:trapFocus={{ enabled: openKey === "electric", onEscape: closeModal }}
  >
    <button
      type="button"
      class="div-block-16"
      data-w-id="50272090-acdb-b0ff-f218-9c15fe749fa2"
      onclick={closeModal}
    >
      <img class="image-4" src={CLOSE_ICON} loading="lazy" width="26" alt="Close" />
    </button>
    <div class="text-block-14" id="navy-residents-electric-title">
      {slice.primary.electric_title}
    </div>
    <!-- prettier-ignore -->
    <div>{#each paragraphs(slice.primary.electric_body) as line, i (i)}{#if i > 0}<br /><br />{/if}{line}{/each}</div>
  </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="popup-modal---laundry"
  data-open={openAttr("laundry")}
  style={popupStyle("laundry")}
  onclick={onBackdrop}
>
  <div
    class="div-block-17"
    role="dialog"
    aria-modal="true"
    aria-labelledby="navy-residents-laundry-title"
    aria-hidden={openKey === "laundry" ? undefined : "true"}
    use:trapFocus={{ enabled: openKey === "laundry", onEscape: closeModal }}
  >
    <button
      type="button"
      class="div-block-18"
      data-w-id="ff109a3f-326f-6707-4a0c-768258d47b13"
      onclick={closeModal}
    >
      <img class="image-5" src={CLOSE_ICON} loading="lazy" width="35" alt="Close" />
    </button>
    <div class="text-block-16" id="navy-residents-laundry-title">
      {slice.primary.laundry_title}
    </div>
    <a
      href={href(slice.primary.laundry_link)}
      target={target(slice.primary.laundry_link)}
      class="w-inline-block"
    >
      <img
        class="image-19"
        src={slice.primary.laundry_logo?.url}
        loading="lazy"
        width="335"
        alt={slice.primary.laundry_logo?.alt ?? ""}
      />
    </a>
  </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="popup-modal---gym"
  data-open={openAttr("gym")}
  style={popupStyle("gym")}
  onclick={onBackdrop}
>
  <div
    class="div-block-19"
    role="dialog"
    aria-modal="true"
    aria-labelledby="navy-residents-gym-title"
    aria-hidden={openKey === "gym" ? undefined : "true"}
    use:trapFocus={{ enabled: openKey === "gym", onEscape: closeModal }}
  >
    <button
      type="button"
      class="div-block-21"
      data-w-id="1e1d936e-6967-19b7-4b11-209cdd3e0318"
      onclick={closeModal}
    >
      <img class="image-7" src={CLOSE_ICON} loading="lazy" width="41" alt="Close" />
    </button>
    <div class="text-block-17" id="navy-residents-gym-title">{slice.primary.gym_title}</div>
    <div class="div-block-20">
      <a
        href={href(slice.primary.gym_link_1)}
        target={target(slice.primary.gym_link_1)}
        class="w-inline-block"
      >
        <img
          class="image-20"
          src={slice.primary.gym_logo_1?.url}
          loading="lazy"
          width="80"
          alt={slice.primary.gym_logo_1?.alt ?? ""}
        />
      </a>
      <a
        href={href(slice.primary.gym_link_2)}
        target={target(slice.primary.gym_link_2)}
        class="w-inline-block"
      >
        <img
          class="image-6"
          src={slice.primary.gym_logo_2?.url}
          loading="lazy"
          width="254"
          alt={slice.primary.gym_logo_2?.alt ?? ""}
        />
      </a>
    </div>
  </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="pop-up-modal---tv-internet"
  data-open={openAttr("tv_internet")}
  style={popupStyle("tv_internet")}
  onclick={onBackdrop}
>
  <div
    class="div-block-22"
    role="dialog"
    aria-modal="true"
    aria-labelledby="navy-residents-tv-title"
    aria-hidden={openKey === "tv_internet" ? undefined : "true"}
    use:trapFocus={{ enabled: openKey === "tv_internet", onEscape: closeModal }}
  >
    <button
      type="button"
      class="div-block-23"
      data-w-id="c9544345-319a-312b-b9fe-34054ad98fad"
      onclick={closeModal}
    >
      <img class="image-9" src={CLOSE_ICON} loading="lazy" width="40" alt="Close" />
    </button>
    <div class="text-block-18" id="navy-residents-tv-title">{slice.primary.tv_title}</div>
    <a
      href={href(slice.primary.tv_link)}
      target={target(slice.primary.tv_link)}
      class="w-inline-block"
    >
      <img
        class="image-8"
        src={slice.primary.tv_logo?.url}
        loading="lazy"
        width="178"
        alt={slice.primary.tv_logo?.alt ?? ""}
      />
    </a>
    <!-- prettier-ignore -->
    <div class="text-block-19">{#each paragraphs(slice.primary.tv_body) as line, i (i)}{#if i > 0}<br /><br />{/if}{line}{/each}</div>
  </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="ride---modal"
  data-open={openAttr("ride")}
  style={popupStyle("ride")}
  onclick={onBackdrop}
>
  <div
    class="div-block-24"
    role="dialog"
    aria-modal="true"
    aria-labelledby="navy-residents-ride-title"
    aria-hidden={openKey === "ride" ? undefined : "true"}
    use:trapFocus={{ enabled: openKey === "ride", onEscape: closeModal }}
  >
    <button
      type="button"
      class="div-block-26"
      data-w-id="711bfe94-497b-efe3-5bae-93776ae6abce"
      onclick={closeModal}
    >
      <img class="image-10" src={CLOSE_ICON} loading="lazy" width="42" alt="Close" />
    </button>
    <div class="text-block-20" id="navy-residents-ride-title">{slice.primary.ride_title}</div>
    <!-- DOM order is Lyft then Uber, and it stays that way: `.link-block-9`
         (the Uber anchor, SECOND here) carries `order: -1` (ref css:2729-2731),
         which paints Uber to the LEFT. Reordering the markup to "fix" the
         visual order would double the swap. -->
    <div class="div-block-25">
      <a
        href={href(slice.primary.ride_link_1)}
        target={target(slice.primary.ride_link_1)}
        class="w-inline-block"
      >
        <img
          src={slice.primary.ride_logo_1?.url}
          loading="lazy"
          width="78"
          alt={slice.primary.ride_logo_1?.alt ?? ""}
        />
      </a>
      <a
        href={href(slice.primary.ride_link_2)}
        target={target(slice.primary.ride_link_2)}
        class="link-block-9 w-inline-block"
      >
        <img
          class="image-11"
          src={slice.primary.ride_logo_2?.url}
          loading="lazy"
          width="286"
          alt={slice.primary.ride_logo_2?.alt ?? ""}
        />
      </a>
    </div>
  </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="food-modal---popup"
  data-open={openAttr("food")}
  style={popupStyle("food")}
  onclick={onBackdrop}
>
  <div
    class="div-block-27"
    role="dialog"
    aria-modal="true"
    aria-labelledby="navy-residents-food-title"
    aria-hidden={openKey === "food" ? undefined : "true"}
    use:trapFocus={{ enabled: openKey === "food", onEscape: closeModal }}
  >
    <button
      type="button"
      class="div-block-29"
      data-w-id="c7761aa8-add5-2f4b-1fd3-b3cbe77a56b2"
      onclick={closeModal}
    >
      <img class="image-13" src={CLOSE_ICON} loading="lazy" width="36" alt="Close" />
    </button>
    <div class="text-block-21" id="navy-residents-food-title">{slice.primary.food_title}</div>
    <div class="div-block-28">
      <a
        href={href(slice.primary.food_link_1)}
        target={target(slice.primary.food_link_1)}
        class="w-inline-block"
      >
        <img
          class="image-21"
          src={slice.primary.food_logo_1?.url}
          loading="lazy"
          width="87"
          alt={slice.primary.food_logo_1?.alt ?? ""}
        />
      </a>
      <a
        href={href(slice.primary.food_link_2)}
        target={target(slice.primary.food_link_2)}
        class="link-block-10 w-inline-block"
      >
        <img
          class="image-12"
          src={slice.primary.food_logo_2?.url}
          loading="lazy"
          width="159"
          alt={slice.primary.food_logo_2?.alt ?? ""}
        />
      </a>
    </div>
  </div>
</div>

<!-- ===================================================================== -->
<!-- The visible section. The `<h1>` sits OUTSIDE `.w-container` and carries
     `margin-left: 20px` (ref css:2187), so at 1440 it starts at x=20 while the
     tiles start at x=260 (a 940px auto-centred container, ref css:690-692, plus
     the column's 10px padding, ref css:729). The 240px misalignment is the
     reference's real behaviour — moving the h1 inside the container to tidy it
     shifts it 240px right.                                                   -->
<!-- ===================================================================== -->
<div
  id="Residents"
  class="section-5"
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
>
  <h1 class="heading residents"><PrismicText field={slice.primary.heading} /></h1>
  <div class="w-container">
    <div class="columns w-row">
      {#each columns as column, columnIndex (columnIndex)}
        <div class="w-col w-col-6">
          {#each column as tile, tileIndex (tileIndex)}
            {@const anchor = ANCHORS[columnIndex * half + tileIndex] ?? ANCHORS[0]}
            {@const modal = (tile.modal || null) as ModalKey | null}
            <div class="div-block-9">
              <a
                href={modal ? "#" : href(tile.link)}
                target={modal ? undefined : target(tile.link)}
                data-w-id={anchor.wId}
                class="{anchor.className} w-inline-block"
                aria-haspopup={modal ? "dialog" : undefined}
                onclick={modal ? (event) => openModal(modal, event) : undefined}
              >
                <div class="text-block-8">{tile.label}</div>
              </a>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  /* Every declaration in this block is transcribed from the captured reference
     stylesheet, matching/spec/29navy-8c2435.shared.46514381b.css, and cites the
     line that WINS the cascade there — not the first line that mentions the
     property. A declaration with no line behind it does not belong here. */

  /* ref css:214-216 `* { box-sizing: border-box }`. Svelte scopes the `*` to
     this component's own elements, which is exactly the subtree it governs. */
  * {
    box-sizing: border-box; /* ref css:215 */
  }

  /* ref css:2073-2078 `:root`. Only the two this subtree consumes are declared;
     `--firebrick` and `--white-2` are read by other sections. Declared on the
     roots rather than `:root` because a scoped block cannot reach the document
     root — same computed values, same indirection. */
  .section-5,
  .popup-modal---electric,
  .popup-modal---laundry,
  .popup-modal---gym,
  .pop-up-modal---tv-internet,
  .ride---modal,
  .food-modal---popup {
    --white: white; /* ref css:2074 */
    --black: black; /* ref css:2076 — OPAQUE, no alpha */
    color: #333; /* ref css:223 — inherited from body on the reference */
    font-family: Arial, sans-serif; /* ref css:227 — the ONLY font-family in this cascade */
    font-size: 14px; /* ref css:228 */
    line-height: 20px; /* ref css:229 */
  }

  /* ref css:232-236 `img`. `max-width: 100%` is what keeps a 335px logo inside
     a 600px popup that goes `width: auto` at <=767 (ref css:3310). */
  img {
    vertical-align: middle; /* ref css:233 */
    max-width: 100%; /* ref css:234 */
    display: inline-block; /* ref css:235 */
  }

  /* ref css:29-31 `a`. Normalize sets no colour and no text-decoration here;
     the tiles' white comes from `.text-block-8` (ref css:2368). */
  a {
    background-color: #0000; /* ref css:30 */
  }

  /* ---- The section ------------------------------------------------------ */

  .section-5 {
    background-color: #fff; /* ref css:2342 */
    padding-top: 40px; /* ref css:2343 */
    padding-bottom: 40px; /* ref css:2344 — no width, no max-width, no side padding: full bleed */
  }

  /* `.heading.residents`, final values with the winning line for each.
     line-height is the trap: `.heading` (ref css:2184-2190) sets font-size and
     never line-height, so the h1 keeps 44px from ref css:387 — a 44px box on
     32px glyphs. `line-height: 1` or a Tailwind heading preset loses 12px of
     section height and reads as a whole-section offset, not a heading bug. */
  .heading.residents {
    color: #aa4133; /* ref css:2193 — beats the #000 at ref css:2185 */
    margin-top: 0; /* ref css:2186 — beats the 20px at ref css:385 */
    margin-right: 0; /* ref css:50 — `margin: .67em 0`, whose horizontal 0 survives */
    margin-bottom: 40px; /* ref css:2194 — beats the 10px at ref css:380 */
    margin-left: 20px; /* ref css:2187 — the h1 is LEFT-offset, never centred */
    font-size: 32px; /* ref css:2188 — beats the 38px at ref css:386 */
    font-weight: 400; /* ref css:2189 — beats `bold` at ref css:381 */
    line-height: 44px; /* ref css:387 — never restated by .heading or .heading.residents */
  }

  /* ---- Webflow's grid ---------------------------------------------------- */

  .w-container {
    max-width: 940px; /* ref css:690 */
    margin-left: auto; /* ref css:691 */
    margin-right: auto; /* ref css:692 */
  }

  /* ref css:695-699. The `display: table` :before is what stops the h1's 40px
     bottom margin collapsing INTO the container. */
  .w-container:before,
  .w-container:after {
    content: " "; /* ref css:696 */
    grid-area: 1 / 1 / 2 / 2; /* ref css:697 */
    display: table; /* ref css:698 */
  }

  .w-container:after {
    clear: both; /* ref css:702 — clears the two floated columns */
  }

  .w-container .w-row {
    margin-left: -10px; /* ref css:706 — the row is 960px inside a 940px container */
    margin-right: -10px; /* ref css:707 */
  }

  .w-row:before,
  .w-row:after {
    content: " "; /* ref css:711 */
    grid-area: 1 / 1 / 2 / 2; /* ref css:712 */
    display: table; /* ref css:713 */
  }

  .w-row:after {
    clear: both; /* ref css:717 */
  }

  /* ref css:725-732. `float: left` establishes a block formatting context, so
     the LAST `.div-block-9`'s 20px bottom margin (ref css:2357) is CONTAINED in
     the column height instead of collapsing out. Rebuilding the row as flex or
     grid drops that 20px and makes the section 20px short. */
  .w-col {
    float: left; /* ref css:726 */
    width: 100%; /* ref css:727 */
    min-height: 1px; /* ref css:728 */
    padding-left: 10px; /* ref css:729 */
    padding-right: 10px; /* ref css:730 */
    position: relative; /* ref css:731 */
  }

  .w-col-6 {
    width: 50%; /* ref css:760 */
  }

  .w-inline-block {
    max-width: 100%; /* ref css:247 */
    display: inline-block; /* ref css:248 */
  }

  /* ref css:2347-2350. A Webflow no-op guard on the `.w-row`. It looks
     deletable and is not: it is the only thing between the row and any
     utility/reset that would add horizontal padding and break the -10px gutter
     maths at ref css:706-707. */
  .columns {
    padding-left: 0; /* ref css:2348 */
    padding-right: 0; /* ref css:2349 */
  }

  /* ref css:2352-2361. `#030303`, NOT `#000`. No left/right padding, so a
     wrapped label runs edge to edge. 40 + 44.8 + 40 = 124.8px on one line. */
  .div-block-9 {
    text-align: left; /* ref css:2353 */
    background-color: #030303; /* ref css:2354 */
    justify-content: center; /* ref css:2355 */
    align-items: center; /* ref css:2356 */
    margin-bottom: 20px; /* ref css:2357 */
    padding-top: 40px; /* ref css:2358 */
    padding-bottom: 40px; /* ref css:2359 */
    display: flex; /* ref css:2360 */
    position: relative; /* repo a11y: containing block for the stretched link */
  }

  /* ref css:2363-2365. Hover is on the TILE, not on the `<a>`. */
  .div-block-9:hover {
    background-color: #aa4133; /* ref css:2364 */
  }

  /* ref css:2367-2372. `text-align: left` inside a flex tile that centres its
     items: the block is centred as a flex item while its own text is
     left-aligned. Invisible on one line, visible the moment a label wraps.
     1.4em of 32px = 44.8px — note the unit; the popup titles use 1.4REM. */
  .text-block-8 {
    color: #fff; /* ref css:2368 */
    text-align: left; /* ref css:2369 */
    font-size: 32px; /* ref css:2370 */
    line-height: 1.4em; /* ref css:2371 */
    position: relative; /* repo a11y: paint the label above the hit overlay */
  }

  /* ref css:2455-2457, :2517-2519, :2617-2619, :2677-2679. All eight trigger
     classes get `text-decoration: none` and NOTHING else — they are
     inline-block wrappers with no box of their own. */
  .link-block,
  .link-block-2,
  .link-block-3,
  .link-block-4,
  .link-block-5,
  .link-block-6,
  .link-block-7,
  .link-block-8 {
    text-decoration: none; /* ref css:2456, :2518, :2618, :2678 */
  }

  /* DEVIATION from the reference, which sets no `position` on any of these
     (ref css:2352-2361 for the tile, :2456/:2518/:2618/:2678 for the anchors —
     `text-decoration: none` and nothing else). Recorded in matching/LEDGER.md.

     The reference lights the WHOLE tile on hover (`.div-block-9:hover`,
     ref css:2363-2365) while only the centred text is clickable: measured
     against matching/spec/index.html in Chromium, the anchor's box IS the
     text's box — 9.4% of the 460x124.8 tile for "Hungry?" at 1440, 34.5% at
     the widest. Hit-testing the tile's four corners returns something other
     than the anchor at every viewport in the matrix. The tile promises a hit
     area it does not have; this gives it the one it promises.

     NOT by stretching the anchor. 80 of the tile's 124.8px are the tile's own
     `padding-top/bottom: 40px`, and a flex ITEM cannot cover its parent's
     padding — so `flex: 1; align-self: stretch` reaches 64% of the box at best,
     and it moves glyphs 93.02px left at 1440 (`.text-block-8` is
     `text-align: left`, ref css:2369) while moving them 0.00px at 991/767/390
     (ref css:3141-3143 flips it to `center`). A pixel regression that passes
     three of the gate's four viewports is worse than no fix.

     An absolutely-positioned generated box contributes nothing to flow, and
     `inset: 0` resolves against `.div-block-9`'s PADDING box — the full
     460x124.8 including both 40px bands. Measured before/after: tile and text
     rects byte-identical, #Residents 743.19px -> 743.19px at 1440/991 and
     1322.38 -> 1322.38 at 767/390, corner hit-test `....A` -> `AAAAA`. */
  .link-block::after,
  .link-block-2::after,
  .link-block-3::after,
  .link-block-4::after,
  .link-block-5::after,
  .link-block-6::after,
  .link-block-7::after,
  .link-block-8::after {
    content: ""; /* repo a11y: the tile-sized hit area the reference lacks */
    position: absolute; /* repo a11y: out of flow, so no box moves */
    inset: 0; /* repo a11y: the tile's padding box, both 40px bands included */
  }

  /* Keeps the label painting above the overlay. Without it the generated box
     is the topmost thing in the tile and the text stops being selectable. */

  /* ---- Electric popup ---------------------------------------------------- */

  /* ref css:2468-2474. THE ODD ONE OUT: 63%-alpha black, and NO width/height —
     it relies on `position: fixed` + `inset: 0%`. The other five are opaque
     black at 100vw/100vh. Normalising them would turn this scrim solid. */
  .popup-modal---electric {
    z-index: 3; /* ref css:2469 */
    background-color: #000000a1; /* ref css:2470 */
    display: none; /* ref css:2471 — redundant with the inline style, which is what actually hides them at rest */
    position: fixed; /* ref css:2472 */
    inset: 0%; /* ref css:2473 */
  }

  .div-block-15 {
    background-color: #fff; /* ref css:2481 */
    border: 10px solid #000; /* ref css:2482 */
    flex-direction: column; /* ref css:2483 */
    justify-content: center; /* ref css:2484 */
    align-items: center; /* ref css:2485 */
    width: 600px; /* ref css:2486 */
    height: 300px; /* ref css:2487 */
    margin: auto; /* ref css:2488 */
    padding-left: 20px; /* ref css:2489 — .div-block-17 has none; not a typo */
    padding-right: 20px; /* ref css:2490 */
    display: flex; /* ref css:2491 */
    position: absolute; /* ref css:2492 */
    inset: 0%; /* ref css:2493 */
  }

  /* ref css:2500-2504. 1.4REM = 22.4px, NOT 1.4em. Same numeral as
     `.text-block-8`, different unit, 22px apart — unifying them breaks all six
     popups' internal layout inside their fixed 300px boxes. */
  .text-block-14 {
    margin-bottom: 20px; /* ref css:2501 */
    font-size: 32px; /* ref css:2502 */
    line-height: 1.4rem; /* ref css:2503 */
  }

  /* The six close controls are real <button>s now (they were
     `<div role="button" tabindex="0">` with hand-rolled Enter/Space that fired
     on Space KEYDOWN, where a real button fires on keyup — so a user who
     pressed Space, changed their mind and moved off still closed the dialog).
     A UA button brings its own border, padding, background and font, none of
     which the reference's divs had, so they are zeroed here: the rendered box
     must stay exactly what `inset: 0% 0% auto auto` + the img's width gave it.
     `display: block` because a button is inline-block by default and would
     otherwise pick up the line-height leading below the icon. */
  .div-block-16,
  .div-block-18,
  .div-block-21,
  .div-block-23,
  .div-block-26,
  .div-block-29 {
    appearance: none; /* repo a11y: <button> for a control the ref left a div */
    border: 0; /* repo a11y: zero the UA button box */
    margin: 0; /* repo a11y: zero the UA button box */
    padding: 0; /* repo a11y: zero the UA button box */
    background: none; /* repo a11y: zero the UA button box */
    font: inherit; /* repo a11y: zero the UA button box */
    color: inherit; /* repo a11y: zero the UA button box */
    display: block; /* repo a11y: no inline-block leading under the icon */
  }

  .div-block-16 {
    cursor: pointer; /* ref css:2507 */
    position: absolute; /* ref css:2508 */
    inset: 0% 0% auto auto; /* ref css:2509 — top-right hit area */
  }

  .image-4 {
    padding-top: 10px; /* ref css:2513 */
    padding-right: 10px; /* ref css:2514 */
  }

  /* ---- Laundry popup ----------------------------------------------------- */

  .popup-modal---laundry {
    z-index: 3; /* ref css:2522 */
    background-color: var(--black); /* ref css:2523 */
    width: 100vw; /* ref css:2524 */
    height: 100vh; /* ref css:2525 */
    display: none; /* ref css:2526 */
    position: fixed; /* ref css:2527 */
    inset: 0%; /* ref css:2528 */
  }

  .div-block-17 {
    background-color: var(--white); /* ref css:2532 */
    border: 10px solid #000; /* ref css:2533 */
    flex-direction: column; /* ref css:2534 */
    justify-content: center; /* ref css:2535 */
    align-items: center; /* ref css:2536 */
    width: 600px; /* ref css:2537 */
    height: 300px; /* ref css:2538 */
    margin: auto; /* ref css:2539 — no side padding here, unlike .div-block-15 */
    display: flex; /* ref css:2540 */
    position: absolute; /* ref css:2541 */
    inset: 0%; /* ref css:2542 */
  }

  .text-block-16 {
    margin-bottom: 20px; /* ref css:2550 */
    font-size: 32px; /* ref css:2551 */
    line-height: 1.4rem; /* ref css:2552 */
  }

  .div-block-18 {
    cursor: pointer; /* ref css:2556 */
    position: absolute; /* ref css:2557 */
    inset: 0% 0% auto auto; /* ref css:2558 */
  }

  .image-5 {
    padding-top: 10px; /* ref css:2562 */
    padding-right: 10px; /* ref css:2563 */
  }

  /* ---- Gym popup --------------------------------------------------------- */

  .popup-modal---gym {
    z-index: 3; /* ref css:2567 */
    background-color: var(--black); /* ref css:2568 */
    width: 100vw; /* ref css:2569 */
    height: 100vh; /* ref css:2570 */
    display: none; /* ref css:2571 */
    position: fixed; /* ref css:2572 */
    inset: 0%; /* ref css:2573 */
  }

  .div-block-19 {
    background-color: var(--white); /* ref css:2577 */
    border: 10px solid #000; /* ref css:2578 */
    flex-direction: column; /* ref css:2579 */
    justify-content: center; /* ref css:2580 */
    align-items: center; /* ref css:2581 */
    width: 600px; /* ref css:2582 */
    height: 300px; /* ref css:2583 */
    margin: auto; /* ref css:2584 */
    display: flex; /* ref css:2585 */
    position: absolute; /* ref css:2586 */
    inset: 0%; /* ref css:2587 */
  }

  .text-block-17 {
    margin-bottom: 20px; /* ref css:2591 */
    font-size: 32px; /* ref css:2592 */
    line-height: 1.4rem; /* ref css:2593 */
  }

  /* ref css:2596-2600. `display: BLOCK`, so the justify/align above it are
     inert at base and the two gym logos sit inline, side by side. They only
     take effect at <=479, where this flips to flex (ref css:3476-3479). */
  .div-block-20 {
    justify-content: center; /* ref css:2597 */
    align-items: center; /* ref css:2598 */
    display: block; /* ref css:2599 */
  }

  .image-6 {
    margin-left: 20px; /* ref css:2603 — the ONLY gap between Gold's and ClassPass */
  }

  .div-block-21 {
    cursor: pointer; /* ref css:2607 */
    position: absolute; /* ref css:2608 */
    inset: 0% 0% auto auto; /* ref css:2609 */
  }

  .image-7 {
    padding-top: 10px; /* ref css:2613 */
    padding-right: 10px; /* ref css:2614 */
  }

  /* ---- TV / internet popup ----------------------------------------------- */

  .pop-up-modal---tv-internet {
    z-index: 3; /* ref css:2622 */
    background-color: var(--black); /* ref css:2623 */
    width: 100vw; /* ref css:2624 */
    height: 100vh; /* ref css:2625 */
    display: none; /* ref css:2626 */
    position: fixed; /* ref css:2627 */
    inset: 0%; /* ref css:2628 */
  }

  .div-block-22 {
    background-color: var(--white); /* ref css:2632 */
    border: 10px solid #000; /* ref css:2633 */
    flex-direction: column; /* ref css:2634 */
    justify-content: center; /* ref css:2635 */
    align-items: center; /* ref css:2636 */
    width: 600px; /* ref css:2637 */
    height: 300px; /* ref css:2638 */
    margin: auto; /* ref css:2639 */
    padding-left: 20px; /* ref css:2640 */
    padding-right: 20px; /* ref css:2641 */
    display: flex; /* ref css:2642 */
    position: absolute; /* ref css:2643 */
    inset: 0%; /* ref css:2644 */
  }

  .text-block-18 {
    margin-bottom: 10px; /* ref css:2648 — 10px, not the 20px the other titles use */
    font-size: 32px; /* ref css:2649 */
    line-height: 1.4rem; /* ref css:2650 */
  }

  .text-block-19 {
    text-align: center; /* ref css:2654 — inherits body 14px/20px from ref css:228-229 */
  }

  .image-8 {
    padding-bottom: 10px; /* ref css:2658 */
  }

  /* ref css:2661-2668. The only close hit area carrying a background image —
     Webflow's transparent placeholder, shipped as a real file in static/, never
     redrawn in CSS. */
  .div-block-23 {
    cursor: pointer; /* ref css:2662 */
    background-image: url("/29navy/assets/background-image.svg"); /* ref css:2663 */
    background-position: 0 0; /* ref css:2664 */
    background-size: auto; /* ref css:2665 */
    position: absolute; /* ref css:2666 */
    inset: 0% 0% auto auto; /* ref css:2667 */
  }

  /* ref css:2670-2675. The only close icon with a white plate behind it. */
  .image-9 {
    background-color: var(--white); /* ref css:2671 */
    padding-top: 10px; /* ref css:2672 */
    padding-right: 10px; /* ref css:2673 */
    display: block; /* ref css:2674 */
  }

  /* ---- Ride popup -------------------------------------------------------- */

  .ride---modal {
    z-index: 3; /* ref css:2682 */
    background-color: var(--black); /* ref css:2683 */
    width: 100vw; /* ref css:2684 */
    height: 100vh; /* ref css:2685 */
    display: none; /* ref css:2686 */
    position: fixed; /* ref css:2687 */
    inset: 0%; /* ref css:2688 */
  }

  .div-block-24 {
    background-color: var(--white); /* ref css:2692 */
    border: 10px solid #000; /* ref css:2693 */
    flex-direction: column; /* ref css:2694 */
    justify-content: center; /* ref css:2695 */
    align-items: stretch; /* ref css:2696 — STRETCH here, center in the others */
    width: 600px; /* ref css:2697 */
    height: 300px; /* ref css:2698 */
    margin: auto; /* ref css:2699 */
    display: flex; /* ref css:2700 */
    position: absolute; /* ref css:2701 */
    inset: 0%; /* ref css:2702 */
  }

  .text-block-20 {
    text-align: center; /* ref css:2706 */
    margin-bottom: 40px; /* ref css:2707 — 40px, unique among the popup titles */
    font-size: 32px; /* ref css:2708 */
    line-height: 1.4rem; /* ref css:2709 */
  }

  .div-block-25 {
    flex-direction: row; /* ref css:2713 */
    justify-content: space-around; /* ref css:2714 */
    display: flex; /* ref css:2715 */
  }

  .div-block-26 {
    cursor: pointer; /* ref css:2719 */
    position: absolute; /* ref css:2720 */
    inset: 0% 0% auto auto; /* ref css:2721 */
  }

  .image-10 {
    padding-top: 10px; /* ref css:2725 */
    padding-right: 10px; /* ref css:2726 */
  }

  /* ref css:2729-2731. `order: -1` on `.link-block-9` — the UBER anchor, SECOND
     in the DOM — paints Uber LEFT of Lyft. The same declaration's `order` on
     `.image-11` is inert: it is an only child. Reproducing document order
     without this silently swaps the two logos. */
  .image-11,
  .link-block-9 {
    order: -1; /* ref css:2730 */
  }

  /* ---- Food popup -------------------------------------------------------- */

  .food-modal---popup {
    z-index: 3; /* ref css:2734 */
    background-color: var(--black); /* ref css:2735 */
    width: 100vw; /* ref css:2736 */
    height: 100vh; /* ref css:2737 */
    display: none; /* ref css:2738 */
    position: fixed; /* ref css:2739 */
    inset: 0%; /* ref css:2740 */
  }

  /* ref css:2743-2754. NO align-items at all here — the odd one out again. */
  .div-block-27 {
    background-color: var(--white); /* ref css:2744 */
    border: 10px solid #000; /* ref css:2745 */
    flex-direction: column; /* ref css:2746 */
    justify-content: center; /* ref css:2747 */
    width: 600px; /* ref css:2748 */
    height: 300px; /* ref css:2749 */
    margin: auto; /* ref css:2750 */
    display: flex; /* ref css:2751 */
    position: absolute; /* ref css:2752 */
    inset: 0%; /* ref css:2753 */
  }

  .text-block-21 {
    text-align: center; /* ref css:2757 */
    margin-bottom: 20px; /* ref css:2758 */
    font-size: 32px; /* ref css:2759 */
    line-height: 1.4rem; /* ref css:2760 */
  }

  .div-block-28 {
    justify-content: center; /* ref css:2764 */
    display: flex; /* ref css:2765 */
  }

  .image-12 {
    margin-left: 20px; /* ref css:2769 */
  }

  .div-block-29 {
    cursor: pointer; /* ref css:2773 */
    position: absolute; /* ref css:2774 */
    inset: 0% 0% auto auto; /* ref css:2775 */
  }

  .image-13 {
    padding-top: 10px; /* ref css:2779 */
    padding-right: 10px; /* ref css:2780 */
  }

  /* ref css:2783-2786. The Uber Eats anchor is a flex box; its Postmates
     sibling is not. */
  .link-block-10 {
    align-items: center; /* ref css:2784 */
    display: flex; /* ref css:2785 */
  }

  /* ---- The opening and closing tween ------------------------------------- */

  /* Not a stylesheet rule: the six popups are tweened by IX2, read out of
     matching/spec/js/29navy-8c2435.b450607e.3cb35528df4a8f16.js. All twelve
     STYLE_OPACITY actions run duration 500, delay 0. The EASINGS are not
     uniform, and an earlier version of this block read one action list and
     applied its easing to all six in both directions:

         open   .popup-modal---gym            outQuad
         open   the other five                inOutQuad
         close  all six                       "" (empty)

     Measured against the live reference at 1440 to confirm the reading, gym
     opening: reference opacity 0.63976 at 200ms, which is easeOutQuad exactly
     (0.4 * (2 - 0.4) = 0.64); this block used to produce 0.334882 there.
     Closing, sampled every 100ms: reference 0.7834 / 0.5834 / 0.3832 / 0.1686 /
     0 — a straight line, so the empty easing is LINEAR, not the default.

     `display` is switched by the inline style one frame ahead, because
     `display` is not animatable. `data-open` marks the opening direction and is
     set in the same frame as the opacity, so the timing function is in effect
     before the transition starts. */
  .popup-modal---electric,
  .popup-modal---laundry,
  .popup-modal---gym,
  .pop-up-modal---tv-internet,
  .ride---modal,
  .food-modal---popup {
    transition: opacity 500ms linear; /* ref js: close easing "" — measured linear */
  }

  .popup-modal---electric[data-open],
  .popup-modal---laundry[data-open],
  .pop-up-modal---tv-internet[data-open],
  .ride---modal[data-open],
  .food-modal---popup[data-open] {
    transition-timing-function: cubic-bezier(
      0.455,
      0.03,
      0.515,
      0.955
    ); /* easeInOutQuad — ref js open easing "inOutQuad" */
  }

  /* Gym alone. Not a slip in the reference to be normalised away: its open
     action carries easing "outQuad" where the other five carry "inOutQuad". */
  .popup-modal---gym[data-open] {
    transition-timing-function: cubic-bezier(
      0.25,
      0.46,
      0.45,
      0.94
    ); /* easeOutQuad — ref js open easing "outQuad" */
  }

  /* Not in the reference either way — the reference has no reduced-motion
     handling at all. Added under docs/accessibility.md, "prefers-reduced-motion
     honored"; the component's own open path sets opacity 1 in the same frame,
     so this only stops the CSS half. */
  @media (prefers-reduced-motion: reduce) {
    .popup-modal---electric,
    .popup-modal---laundry,
    .popup-modal---gym,
    .pop-up-modal---tv-internet,
    .ride---modal,
    .food-modal---popup {
      transition: none; /* repo docs/accessibility.md */
    }
  }

  /* ---- Breakpoints, reproduced from the reference's own media queries ----- */

  /* ref css:3116 opens `@media screen and (max-width: 991px)`. */
  @media screen and (max-width: 991px) {
    .w-container {
      max-width: 728px; /* ref css:793 — each .w-col-6 is then 374px, 354px of content */
    }

    /* ref css:3141-3143. Overrides the left at ref css:2369. There is NO 767 or
       479 variant, so centred persists all the way down to 390. */
    .text-block-8 {
      text-align: center; /* ref css:3142 */
    }
  }

  /* ref css:859 opens `@media screen and (max-width: 767px)`. */
  @media screen and (max-width: 767px) {
    .w-container .w-row {
      margin-left: 0; /* ref css:869 — the -10px gutter is cancelled */
      margin-right: 0; /* ref css:870 */
    }

    /* ref css:873-877. THIS is where the two columns stack: `.w-col-6`'s 50% at
       ref css:760 loses on source order, not on specificity. */
    .w-col {
      width: 100%; /* ref css:874 */
      left: auto; /* ref css:875 */
      right: auto; /* ref css:876 */
    }

    /* ref css:3296-3343. Transcribed for cascade fidelity and DEAD at runtime:
       the inline `display` from the open sequence beats a stylesheet rule, and
       every trigger event carries mediaQueries ["main","medium","small","tiny"],
       so the popups DO open at 767 and 390 on the reference. Never gate the
       behaviour on these. */
    .popup-modal---electric,
    .popup-modal---laundry,
    .popup-modal---gym,
    .pop-up-modal---tv-internet,
    .ride---modal,
    .food-modal---popup {
      display: none; /* ref css:3297, :3306, :3314, :3322, :3330, :3338 */
    }

    .div-block-15 {
      width: auto; /* ref css:3301 */
      height: 300px; /* ref css:3302 — beaten by the 600px at ref css:3451 below 480 */
    }

    .div-block-17,
    .div-block-19,
    .div-block-22,
    .div-block-24,
    .div-block-27 {
      width: auto; /* ref css:3310, :3318, :3326, :3334, :3342 */
    }
  }

  /* ref css:928 opens `@media screen and (max-width: 479px)` for the Webflow
     grid, and ref css:3396 opens the site's own 479 block. */
  @media screen and (max-width: 479px) {
    .w-container {
      max-width: none; /* ref css:930 — full viewport width, no 728px cap */
    }

    .w-col {
      width: 100%; /* ref css:942 */
    }

    .div-block-15 {
      height: 600px; /* ref css:3451 — beats the 300px at ref css:3302 on source order */
    }

    .text-block-14 {
      text-align: center; /* ref css:3455 */
      line-height: 2rem; /* ref css:3456 */
    }

    .div-block-17 {
      height: 400px; /* ref css:3460 */
    }

    .text-block-16 {
      text-align: center; /* ref css:3464 */
      line-height: 2rem; /* ref css:3465 */
    }

    .div-block-19 {
      height: 400px; /* ref css:3469 */
    }

    /* ref css:3472-3474 — text-align only; no line-height change here, unlike
       .text-block-14 / -16 / -18. */
    .text-block-17 {
      text-align: center; /* ref css:3473 */
    }

    /* ref css:3476-3479. The gym logos stack, and this is where the
       justify/align at ref css:2597-2598 finally take effect. */
    .div-block-20 {
      flex-direction: column; /* ref css:3477 */
      display: flex; /* ref css:3478 */
    }

    .image-6 {
      margin-left: 0; /* ref css:3482 */
    }

    .div-block-22 {
      height: 500px; /* ref css:3486 */
    }

    .text-block-18 {
      text-align: center; /* ref css:3490 */
      line-height: 2rem; /* ref css:3491 */
    }

    .div-block-25 {
      flex-direction: column; /* ref css:3499 */
      align-items: center; /* ref css:3500 */
    }

    .image-11 {
      margin-bottom: 20px; /* ref css:3504 */
    }

    .div-block-28 {
      flex-direction: column; /* ref css:3512 */
      align-items: center; /* ref css:3513 */
    }

    /* ref css:3522-3525. `.image-19` has NO base rule anywhere in the reference
       — this 479 block is its only appearance. Same for `.image-20` and
       `.image-21` at ref css:3527-3529. Their size at every other breakpoint
       comes entirely from the HTML `width` attribute, which is why those
       attributes live in the markup above and are not fields. */
    .image-19 {
      padding-left: 10px; /* ref css:3523 */
      padding-right: 10px; /* ref css:3524 */
    }

    .image-20,
    .image-21 {
      margin-bottom: 20px; /* ref css:3528 */
    }
  }
</style>
