<script lang="ts">
  import { Menu, X, ChevronDown } from "@lucide/svelte";
  import { trapFocus } from "$lib/actions/trapFocus";
  import { fade } from "$lib/transitions";
  import type { NavItem } from "$lib/site-config";

  interface NavLink {
    text: string;
    href: string;
  }

  interface Props {
    /** Optional per-route override of the `$lib/site-config.json` nav (no
     * route in the bare template supplies this). When non-empty they take
     * precedence — inline links on desktop, a focus-trapped full-screen menu
     * on mobile. */
    navLinks?: NavLink[];
    /** Nav entries — a leaf is a link; an entry with `children` is a dropdown.
     * Omit for a logo-only bar (the bare-template default; comes from
     * site-config). */
    items?: NavItem[];
    /** The site logo (resolved from site-config); falls back to the "Logo"
     * wordmark. */
    logo?: { url: string; maxWidth?: string };
  }

  // POSITION: STICKY, NOT FIXED. The reference's own bar is
  // `position: sticky; top: 0` with `display: flex` — matching/spec/…shared…css:2154-2162
  // — so it sits in NORMAL FLOW and the page's first section begins BELOW it.
  // A `fixed` bar is out of flow and contributes zero height, which is not a
  // styling difference but a structural one: measured at 1440, it put the hero
  // at y=0 instead of y=68, shifted every anchor on the page up by ~68px, and
  // left the harness with no `top` region at all. page-diff then saw 5 regions
  // on the reference against 4 on the candidate and marked the whole run
  // TRUNCATED — uncountable, so the page could not be scored at any viewport.
  let { navLinks = [], items = [], logo }: Props = $props();

  let isMenuOpen = $state(false);
  let openButtonEl = $state<HTMLButtonElement>();
  // Which dropdown is expanded. Desktop click-toggles + hover/focus reveal;
  // mobile is a tap accordion.
  let openMobileIndex = $state<number | null>(null);
  let openDesktopIndex = $state<number | null>(null);

  // A route's flat `navLinks` prop override wins when supplied; every other
  // route falls back to the site-config `items`/`logo` dropdown nav.
  const useNavLinks = $derived(navLinks.length > 0);

  const openMenu = () => (isMenuOpen = true);
  const closeMenu = () => {
    isMenuOpen = false;
    openMobileIndex = null;
  };
</script>

{#if useNavLinks}
  <!-- navLinks (per-route override) chrome: inline links on desktop,
       focus-trapped full-screen menu on mobile. -->
  <nav class="sticky top-0 left-0 z-50 flex w-full items-center justify-between px-8 py-4">
    <a href="/" class="text-lg font-bold">Logo</a>

    <div class="hidden items-center gap-8 lg:flex">
      {#each navLinks as link (link.href)}
        <a href={link.href}>{link.text}</a>
      {/each}
    </div>

    {#if !isMenuOpen}
      <button
        bind:this={openButtonEl}
        type="button"
        class="flex min-h-11 min-w-11 items-center justify-center lg:hidden"
        onclick={openMenu}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
    {/if}
  </nav>
{:else}
  <!-- site-config (#71) chrome: logo + dropdown nav. -->
  <nav class="navbar-ref sticky top-0 left-0 flex w-full items-center justify-center">
    <a href="/" class="navbar-logo flex items-center text-lg font-bold">
      {#if logo}
        <img
          src={logo.url}
          alt="Home"
          width="164"
          class="navbar-logo-img"
          style={logo.maxWidth ? `max-width:${logo.maxWidth}` : undefined}
        />
      {:else}
        Logo
      {/if}
    </a>

    {#if items.length > 0}
      <!-- Desktop: inline top items. An item with children is a disclosure —
           click toggles it (aria-expanded), and hover/focus-within also reveal it
           for pointer/keyboard-tab users. Keyed by index: nav labels/hrefs aren't
           unique (two "" heading hrefs or repeated labels would collide and Svelte
           throws each_key_duplicate at hydration). -->
      <!-- md (768px), not lg (1024px). The reference collapses its bar to the
           hamburger inside `@media screen and (max-width: 767px)` — that block
           is where `.menu-button` (ref css:3345) and `.nav-menu` (ref css:3353)
           get their mobile rules — so the inline links survive down to 768 and
           the burger appears at 767. Measured at 991 before this: the reference
           kept all six links and wrapped to h=124, while this bar had already
           swapped to the burger at h=80. -->
      <ul class="nav-menu-ref hidden flex-wrap items-center justify-center md:flex">
        {#each items as item, i (i)}
          {#if item.children && item.children.length > 0}
            <li class="group relative">
              <button
                type="button"
                class="flex items-center gap-1"
                aria-expanded={openDesktopIndex === i}
                aria-controls="nav-dropdown-{i}"
                onclick={() => (openDesktopIndex = openDesktopIndex === i ? null : i)}
                onkeydown={(e) => {
                  if (e.key === "Escape") openDesktopIndex = null;
                }}
              >
                {item.label}
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <ul
                id="nav-dropdown-{i}"
                class="absolute top-full left-0 flex min-w-48 flex-col gap-1 bg-background p-2 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                class:invisible={openDesktopIndex !== i}
                class:opacity-0={openDesktopIndex !== i}
              >
                {#each item.children as child, ci (ci)}
                  <li>
                    {#if child.href}
                      <a href={child.href} class="block px-3 py-2 hover:opacity-70">{child.label}</a
                      >
                    {:else}
                      <span class="block px-3 py-2">{child.label}</span>
                    {/if}
                  </li>
                {/each}
              </ul>
            </li>
          {:else if item.href}
            <!-- The reference marks exactly two of its six links with `.button`
                 — "Apply Now" (rentspree) and "Pay Rent" (gozego) — and both
                 are the only two that leave the site. Keyed on that rather than
                 on the label, so the rule is a property of the link, not of the
                 copy. -->
            <li>
              <a href={item.href} class="nav-link-ref" class:nav-button={/^https?:/.test(item.href)}
                >{item.label}</a
              >
            </li>
          {:else}
            <li><span>{item.label}</span></li>
          {/if}
        {/each}
      </ul>

      {#if !isMenuOpen}
        <button
          bind:this={openButtonEl}
          type="button"
          class="nav-burger flex min-h-11 min-w-11 items-center justify-center md:hidden"
          onclick={openMenu}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      {/if}
    {/if}
  </nav>
{/if}

{#if isMenuOpen}
  <!-- The open trigger above unmounts while the menu is open, so the element
       trapFocus captured is detached by close time — `restoreFocus` hands it
       the re-mounted trigger instead. -->
  {#if useNavLinks}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      class="fixed inset-0 z-50 flex h-dvh w-screen flex-col items-center justify-center gap-8 bg-background lg:hidden"
      transition:fade
      use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
    >
      <button
        type="button"
        class="absolute top-4 right-8 flex min-h-11 min-w-11 items-center justify-center"
        onclick={closeMenu}
        aria-label="Close menu"
      >
        <X size={24} />
      </button>

      {#each navLinks as link (link.href)}
        <a href={link.href} class="px-4 py-3" onclick={closeMenu}>{link.text}</a>
      {/each}
    </div>
  {:else}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      class="fixed inset-0 z-50 flex h-dvh w-screen flex-col items-center justify-center gap-4 overflow-y-auto bg-background py-20 lg:hidden"
      transition:fade
      use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
    >
      <button
        type="button"
        class="absolute top-4 right-8 flex min-h-11 min-w-11 items-center justify-center"
        onclick={closeMenu}
        aria-label="Close menu"
      >
        <X size={24} />
      </button>

      {#each items as item, i (i)}
        {#if item.children && item.children.length > 0}
          <!-- Mobile: a dropdown becomes an accordion — tap to expand its links. -->
          <div class="flex flex-col items-center gap-2">
            <button
              type="button"
              class="flex items-center gap-1 px-4 py-2"
              aria-expanded={openMobileIndex === i}
              onclick={() => (openMobileIndex = openMobileIndex === i ? null : i)}
            >
              {item.label}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {#if openMobileIndex === i}
              {#each item.children as child, ci (ci)}
                {#if child.href}
                  <a href={child.href} class="px-4 py-2 opacity-80" onclick={closeMenu}
                    >{child.label}</a
                  >
                {:else}
                  <span class="px-4 py-2 opacity-80">{child.label}</span>
                {/if}
              {/each}
            {/if}
          </div>
        {:else if item.href}
          <a href={item.href} class="px-4 py-3" onclick={closeMenu}>{item.label}</a>
        {:else}
          <span class="px-4 py-3">{item.label}</span>
        {/if}
      {/each}
    </div>
  {/if}
{/if}

<style>
  /* The 29 Navy bar, transcribed from the reference stylesheet. Every rule
     names the line it came from — matching/spec/29navy-8c2435.shared.46514381b.css.
     `position: sticky` is load-bearing and is explained where it is set in the
     script above: a `fixed` bar leaves normal flow, contributes no height, and
     costs the harness its whole `top` region. */
  .navbar-ref {
    z-index: 13; /* ref css:2155 */
    background-color: #000; /* ref css:2156 */
    justify-content: center; /* ref css:2157 */
    align-items: center; /* ref css:2158 */
    display: flex; /* ref css:2159 */
    position: sticky; /* ref css:2160 */
    top: 0; /* ref css:2161 */
  }

  /* In the reference the logo is the LAST child of .navbar and is pulled to the
     front by order:-1 (ref css:2127). Here it is already first, so the rule is
     transcribed rather than relied on — it costs nothing and keeps the two
     renders describable by the same line. */
  .navbar-logo {
    order: -1; /* ref css:2127 */
    margin-left: 10px; /* ref css:2128 */
    padding-top: 0; /* ref css:2129 */
  }

  /* Not a measured rect: the reference's own <img width="164">, and the file's
     intrinsic 986x253, give 164 x 42.1 rendered. The bar's 68px height is
     emergent from this plus the links' box — it is never set directly. */
  .navbar-logo-img {
    width: 164px;
    height: auto;
  }

  /* ref css:2164-2167 — .container.w-container.
     `display: flex` (ref css:2168) is deliberately NOT set here: this element's
     display is owned by the `hidden md:flex` utilities that collapse the bar at
     the reference's own 767 boundary. Setting it in this block won the cascade
     against `hidden`, so at 390 the six links stayed on screen and stacked —
     measured, a 384px bar against the reference's 60px. Two owners for one
     property is the bug; the utility keeps it, and `md:flex` IS ref css:2168. */
  .nav-menu-ref {
    justify-content: center; /* ref css:2165 */
    margin-left: auto; /* ref css:2166 */
    margin-right: auto; /* ref css:2167 */
  }

  /* .w-nav-link — Webflow's own base for every link in the bar, ref css:1823-1832.
     This is where the navbar's 68px comes from, and it is why the height must
     never be typed in as a number: 28px line-height + 20px padding top + 20px
     bottom = 68. Measured before this rule landed, the bar was 42px — exactly
     the logo alone — because the links were `display: inline` with no padding
     and contributed no box at all. */
  .nav-link-ref {
    vertical-align: top; /* ref css:1824 */
    text-align: left; /* ref css:1826 */
    padding: 20px; /* ref css:1829 */
    text-decoration: none; /* ref css:1830 */
    display: inline-block; /* ref css:1831 */
    position: relative; /* ref css:1832 */
    color: #fff; /* ref css:2133 — .nav-link-2 overrides w-nav-link's #222 */
    margin-bottom: 0; /* ref css:2440 */
    margin-left: 20px; /* ref css:2441 */
    margin-right: 20px; /* ref css:2442 */
    font-size: 20px; /* ref css:2443 */
    line-height: 1.4em; /* ref css:2444 */
  }

  /* .nav-link-2.text-block-11.button — ref css:2140-2147 */
  .nav-link-ref.nav-button {
    cursor: pointer; /* ref css:2141 */
    border: 1px solid #aa4133; /* ref css:2142 */
    margin-top: 10px; /* ref css:2143 */
    padding: 10px; /* ref css:2144 */
    line-height: 1.2em; /* ref css:2145 */
    transition:
      color 0.2s,
      background-color 0.2s; /* ref css:2146 */
  }

  /* .w-nav-button — ref css:1895-1905. This is where the mobile bar's 60px
     comes from: a 24px glyph inside 18px of padding on every side. Measured
     before it landed, the burger was Tailwind's 44px touch target and the bar
     was 44 against the reference's 60, at both 767 and 390.
     `display` is NOT transcribed here (ref css:1904 says `none`) — it belongs
     to `md:hidden`, for the same reason .nav-menu-ref does not set it. 60px
     also clears the 44px minimum touch target, so the a11y floor still holds. */
  .nav-burger {
    cursor: pointer; /* ref css:1897 */
    padding: 18px; /* ref css:1902 */
    font-size: 24px; /* ref css:1903 */
    position: relative; /* ref css:1905 */
    color: #fff; /* ref css:3346 — .menu-button, var(--white) */
  }

  /* ref css:2149-2152 */
  .nav-link-ref.nav-button:hover {
    color: #000; /* ref css:2150 — var(--black) */
    background-color: #fff; /* ref css:2151 */
  }
</style>
