// The page assemblies for this site — the SINGLE source of truth for both
// consumers: src/routes/dev/match/[uid], the local matching surface, and the
// seed that publishes them through Prismic's Migration API. Because both read
// from here, any fix made to pass a gate is a fix to what ships.
//
// The seed is scripts/import/seed-home.ts, in THIS repo. There is no
// `reddoor-maint prismic-seed` — earlier comments here and in two harness-owned
// files named one, and reddoor-maint's own --help has never listed it
// (reddoorla/reddoor-maintenance#763).
//
// THE MIGRATION API DROPS SILENTLY. It validates against the slice models
// registered in Prismic and discards every field the model does not declare —
// HTTP 200, no warning. A fixture field with no model behind it renders here and
// vanishes on the published route. src/lib/site-pages.test.ts is the mechanical
// check; run it before every seed.
//
// PURE by contract: no node:*, no fetch, no token, no side effects at import,
// so Vite can bundle it into the dev route and node can import it into the seed.

export const lang = "en-us";

/**
 * ALT TEXT IS AN ARGUMENT, not a lookup. Every image the reference ships carries
 * `alt=""` — all 23 of them — and authoring real alt text is a deviation this
 * repo took on purpose and recorded in matching/LEDGER.md. It lived only in each
 * slice's mocks.json for a while, which is Slice Machine preview data: read by
 * the previewer and by the slice tests, and by nothing that renders the site.
 * 25 images' worth of it could not reach a page (#13). It travels through `img`
 * now because `img` is the one channel both consumers share.
 *
 * ONE ALT PER URL. Prismic stores alt on the ASSET, not on the field
 * (@prismicio/client's Migration.js: `config.alt = config.alt || …`, so a second
 * createAsset for the same file cannot re-alt it). The aerial is used twice —
 * the hero's mobile band and the location band — and mocks.json had authored two
 * slightly different strings for it; the more specific one won. `documents()`
 * emitting one URL with two alt strings is a mistake Prismic silently resolves
 * in favour of whichever came first, so site-pages.test.ts fails on it instead.
 *
 * @param {(url: string, alt: string) => unknown} img resolves an image to
 *   whatever the caller needs — a migration asset for the seed, a `{url, alt}`
 *   for the dev route. A resolver that takes only `url` still works: JS drops
 *   the second argument, which is exactly what the recipe-owned `devImg` in
 *   src/routes/dev/match/[uid] does today.
 * @returns {Array<{type: string, uid: string, title: string, data: Record<string, unknown>}>}
 */
export function documents(img) {
  return [
    {
      type: "page",
      uid: "home",
      title: "29 Navy",
      data: {
        // SEO metadata, and it is NOT transcribed — it is written. The whole
        // reference carries exactly two <meta> tags, charset and viewport, and
        // a <title> of "29Navy". There is no description to copy, so matching
        // the reference here would mean shipping none either; that is a gap in
        // the original rather than a spec to reproduce, and meta tags render
        // nothing the geometry gate measures.
        //
        // Every phrase below is lifted from copy already on the page — the hero
        // tagline ("Creative Lofts", "for Lease"), the contact block ("29 Navy
        // Street", "Venice, California 90291") and the Lofts section ("4th
        // Floor - Penthouse", "Download a PDF of this floor"). Nothing is
        // claimed that the page does not already say. DRAFT COPY: it is
        // client-facing and nobody has approved it.
        meta_title: "29 Navy — Creative Lofts for Lease in Venice",
        meta_description:
          "Creative lofts for lease at 29 Navy Street, Venice, California. " +
          "Browse floor plans for all four floors, including the penthouse, " +
          "and download a PDF of any floor.",
        // The reference is ONE page in six sections plus shared chrome
        // (matching/SPEC.md). Order here is reference document order, which is
        // also cut order for the harness: the four anchors occur once each at
        // strictly increasing indices, and a section moved here silently
        // misaligns every region after it.
        slices: [
          {
            slice_type: "navy_hero_slider",
            slice_label: null,
            variation: "default",
            version: "initial",
            primary: {
              logo: img(
                "/29navy/assets/68a8b03886756d39d580f327_29-navy-logo-black.jpg",
                "29 Navy",
              ),
              tagline_line_1: "Creative Lofts",
              tagline_line_2: "for Lease",
              slides: [
                {
                  image: img(
                    "/29navy/assets/614de02ec8febc5e1427ffc8_gallery_roof1.jpg",
                    "The roof deck at 29 Navy, looking out over the neighbouring rooftops toward the ocean.",
                  ),
                },
                {
                  image: img(
                    "/29navy/assets/614de02ec8febc767427ffcd_gallery_colvu2.jpg",
                    "A loft interior with exposed structural columns and full-height windows along one wall.",
                  ),
                },
                {
                  image: img(
                    "/29navy/assets/614de02ec8febc401227ffd2_gallery_colvu1.jpg",
                    "An open loft floor, its concrete columns marching back toward a bank of windows.",
                  ),
                },
                {
                  image: img(
                    "/29navy/assets/614ddfc369005a542460176f_hero-main-final.jpg",
                    "The 29 Navy building seen from the street, its brick facade lit by late afternoon sun.",
                  ),
                },
                {
                  image: img(
                    "/29navy/assets/614de02ec8febcca7527ffb4_gallery_29navy_interior.jpg",
                    "A furnished loft interior with polished concrete floors and a high open ceiling.",
                  ),
                },
                {
                  image: img(
                    "/29navy/assets/614de02ec8febce2c327ffc3_gallery_13A9553p.jpg",
                    "A corner workspace at 29 Navy, daylight falling across the floor from two window walls.",
                  ),
                },
              ],
              mobile_location_image: img(
                "/29navy/assets/614ddffddb6b8587d3d41004_location-aerial.jpg",
                "Aerial photograph looking down on the 29 Navy building and the surrounding Santa Monica blocks, with the beach and the Pacific beyond.",
              ),
            },
            items: [],
          },
          {
            slice_type: "navy_location_band",
            slice_label: null,
            variation: "default",
            version: "initial",
            primary: {
              heading: [{ type: "heading1", text: "Location", spans: [] }],
              background_image: img(
                "/29navy/assets/614ddffddb6b8587d3d41004_location-aerial.jpg",
                "Aerial photograph looking down on the 29 Navy building and the surrounding Santa Monica blocks, with the beach and the Pacific beyond.",
              ),
            },
            items: [],
          },
          {
            slice_type: "navy_floor_plans",
            slice_label: null,
            variation: "default",
            version: "initial",
            primary: {
              title: "Lofts",
              intro: "Hover or click on a floor",
              pdf_label: "Download a PDF of this floor",
              floors: [
                {
                  label: "4th Floor - Penthouse",
                  floorplan: img(
                    "/29navy/assets/68a8ab2e97a0127295e1fc5a_floorplan-level-4_label.png",
                    "Floor plan of the fourth floor at 29 Navy: one full-floor penthouse loft, numbered 45, wrapping the stair and elevator core at the east end.",
                  ),
                  pdf: {
                    link_type: "Web",
                    url: "https://29navy.com/pdf/file4.pdf",
                    target: "_blank",
                  },
                  open_by_default: false,
                },
                {
                  label: "3rd Floor",
                  trigger_image: img(
                    "/29navy/assets/615330625afda8f3e747c53f_Untitled%20design%20(16).png",
                    "Button artwork reading 3rd Floor in white stencil type on black.",
                  ),
                  floorplan: img(
                    "/29navy/assets/68a8ab2eb4bb6bfe07128d9b_floorplan-level-3_label.png",
                    "Floor plan of the third floor at 29 Navy: eight lofts numbered 31 to 38, in two facing rows off a central corridor.",
                  ),
                  pdf: {
                    link_type: "Web",
                    url: "https://29navy.com/pdf/file3.pdf",
                    target: "_blank",
                  },
                  open_by_default: false,
                },
                {
                  label: "2nd Floor",
                  trigger_image: img(
                    "/29navy/assets/6153308fcb691617e9de8587_Untitled%20design%20(17).png",
                    "Button artwork reading 2nd Floor in white stencil type on black.",
                  ),
                  floorplan: img(
                    "/29navy/assets/68a8a9f0547387a3619409d7_floorplan-level-1_label.png",
                    "Floor plan of the second floor at 29 Navy: eight lofts numbered 21 to 28, in two facing rows off a central corridor.",
                  ),
                  pdf: {
                    link_type: "Web",
                    url: "https://29navy.com/pdf/file2.pdf",
                    target: "_blank",
                  },
                  open_by_default: false,
                },
                {
                  label: "1st Floor",
                  trigger_image: img(
                    "/29navy/assets/615330c04bb71e65b9ff085c_Untitled%20design%20(18).png",
                    "Button artwork reading 1st Floor in white stencil type on black.",
                  ),
                  floorplan: img(
                    "/29navy/assets/68a8ab2e8c93e2fcae3bc02d_floorplan-level-1_label.png",
                    "Floor plan of the first floor at 29 Navy: eight lofts numbered 1 to 8, in two facing rows off a central corridor.",
                  ),
                  pdf: { link_type: "Web", url: "https://29navy.com/pdf/file1.pdf" },
                  open_by_default: true,
                },
              ],
            },
            items: [],
          },
          {
            slice_type: "navy_resident_links",
            slice_label: null,
            variation: "default",
            version: "initial",
            primary: {
              heading: [{ type: "heading1", text: "Residents", spans: [] }],
              tiles: [
                {
                  label: "Paying rent online?",
                  link: { link_type: "Web", url: "https://payments.gozego.com/", target: "_blank" },
                },
                { label: "Hooking up electricity?", modal: "electric" },
                { label: "Too busy to do laundry?", modal: "laundry" },
                { label: "Looking for a gym?", modal: "gym" },
                { label: "Connecting cable tv?", modal: "tv_internet" },
                { label: "Plugging in internet?", modal: "tv_internet" },
                { label: "Need a ride?", modal: "ride" },
                { label: "Hungry?", modal: "food" },
              ],
              electric_title: "Hooking up electricity?",
              electric_body: [
                {
                  type: "paragraph",
                  text: "Call LA DWP at 800.342.5397 and provide your new address, including unit number. They will ask for your contact information and the service start date. Once the account is active, you will receive a bi-monthly bill with electricity charges, as well as a bulky item collection fee of approximately $1.33 (subject to change based on current LA DWP rates).",
                  spans: [],
                },
                {
                  type: "paragraph",
                  text: "If you have any large items to be disposed, you can call “800-773-2489” and make arrangements to have items picked up (pick-ups are every Tuesday).",
                  spans: [],
                },
              ],
              laundry_title: "Too busy to do your laundry?",
              laundry_logo: img(
                "/29navy/assets/614def0e7bf7b30746beec9d_logo-modal-washio.png",
                "Rinse, formerly Washio — pickup and delivery laundry service",
              ),
              laundry_link: {
                link_type: "Web",
                url: "https://www.rinse.com/getwashio?utm_source=www.getwashio.com&utm_campaign=washio_redirect&utm_promo=getwashio",
              },
              gym_title: "Looking for a gym?",
              gym_logo_1: img(
                "/29navy/assets/614dfdbeeca57714e0b275e0_golds-gym-logo-png-11552727817xfevltaaqp-removebg-preview.png",
                "Gold’s Gym Venice",
              ),
              gym_link_1: {
                link_type: "Web",
                url: "http://www.goldsgym.com/veniceca/",
                target: "_blank",
              },
              gym_logo_2: img(
                "/29navy/assets/614dfca76c78053dab7d696f_logo-modal-classpass.png",
                "ClassPass",
              ),
              gym_link_2: { link_type: "Web", url: "https://classpass.com/" },
              tv_title: "connecting cable tv?",
              tv_logo: img(
                "/29navy/assets/614e015fb3f528b5d65f8192_logo-modal-fios.png",
                "Verizon Fios",
              ),
              tv_link: { link_type: "Web", url: "http://fios.verizon.com/", target: "_blank" },
              tv_body: [
                {
                  type: "paragraph",
                  text: "Contact Building Management at 310-393-9653 and a dedicated Verizon Account Representative will respond to your inquiry and provide information and set-up your account.",
                  spans: [],
                },
              ],
              ride_title: "need a ride?",
              ride_logo_1: img(
                "/29navy/assets/614e04a52a076aebf5fb883e_logo-modal-lyft.png",
                "Lyft",
              ),
              ride_link_1: { link_type: "Web", url: "https://www.lyft.com/", target: "_blank" },
              ride_logo_2: img(
                "/29navy/assets/614e04ae200f160bc3dd791f_logo-modal-uber.png",
                "Uber",
              ),
              ride_link_2: { link_type: "Web", url: "https://www.uber.com/", target: "_blank" },
              food_title: "Hungry?",
              food_logo_1: img(
                "/29navy/assets/614e083adb033884c9babd48_logo-modal-postmates.png",
                "Postmates",
              ),
              food_link_1: {
                link_type: "Web",
                url: "https://postmates.com/los-angeles",
                target: "_blank",
              },
              food_logo_2: img(
                "/29navy/assets/614e0828dc5ca9db01c4b415_logo-modal-uber-eats.png",
                "Uber Eats",
              ),
              food_link_2: {
                link_type: "Web",
                url: "https://ubereats.com/eats/la/",
                target: "_blank",
              },
            },
            items: [],
          },
          {
            slice_type: "navy_contact",
            slice_label: null,
            variation: "default",
            version: "initial",
            primary: {
              heading: [{ type: "heading1", text: "Contact", spans: [] }],
              address_line_1: "29 Navy Street ",
              address_line_2: "Venice, California 90291 ",
              links: [
                {
                  label: "Call us: ",
                  value: "(310) 393-9657",
                  target: { link_type: "Web", url: "tel:+13103939657" },
                },
                {
                  label: "Email us:",
                  value: "29navy@worthe.com",
                  target: { link_type: "Web", url: "mailto:29navy@worthe.com" },
                },
                {
                  label: "Find us on:",
                  value: "Zillow",
                  target: {
                    link_type: "Web",
                    url: "https://www.zillow.com/apartments/venice-ca/29-navy-creative-lofts/ChqQtg/",
                  },
                },
              ],
              photo: img(
                "/29navy/assets/68b712e52ecd74e0d37afd1d_matthew-lejune-dv1r5Pftdzk-unsplash.jpg",
                "Sunlight falling across the brick facade and steel-framed windows of the 29 Navy building.",
              ),
            },
            items: [],
          },
        ],
      },
    },
  ];
}
