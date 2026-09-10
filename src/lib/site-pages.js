// The page assemblies for this site — the SINGLE source of truth for both
// consumers: src/routes/dev/match/[uid], the local matching surface, and the
// seed that publishes them through Prismic's Migration API. Because both read
// from here, any fix made to pass a gate is a fix to what ships.
//
// THE SEED DOES NOT EXIST YET. Earlier comments here, in svelte.config.js and
// in two harness-owned files name `reddoor-maint prismic-seed`; verified
// against reddoor-maint 0.93.1's own --help, there is no such command and never
// was. The machinery is all present — scripts/import/migrate.example.ts is a
// worked createWriteClient/createMigration/createAsset example — but nothing
// wires THIS module to it. Writing that is the work, not running it.
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
 * @param {(url: string) => unknown} img resolves an image URL to whatever the
 *   caller needs — an asset `{id}` for the seed, a `{url}` for the dev route.
 * @returns {Array<{type: string, uid: string, title: string, data: Record<string, unknown>}>}
 */
export function documents(img) {
  return [
    {
      type: "page",
      uid: "home",
      title: "29 Navy",
      data: {
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
              logo: img("/29navy/assets/68a8b03886756d39d580f327_29-navy-logo-black.jpg"),
              tagline_line_1: "Creative Lofts",
              tagline_line_2: "for Lease",
              slides: [
                { image: img("/29navy/assets/614de02ec8febc5e1427ffc8_gallery_roof1.jpg") },
                { image: img("/29navy/assets/614de02ec8febc767427ffcd_gallery_colvu2.jpg") },
                { image: img("/29navy/assets/614de02ec8febc401227ffd2_gallery_colvu1.jpg") },
                { image: img("/29navy/assets/614ddfc369005a542460176f_hero-main-final.jpg") },
                {
                  image: img("/29navy/assets/614de02ec8febcca7527ffb4_gallery_29navy_interior.jpg"),
                },
                { image: img("/29navy/assets/614de02ec8febce2c327ffc3_gallery_13A9553p.jpg") },
              ],
              mobile_location_image: img(
                "/29navy/assets/614ddffddb6b8587d3d41004_location-aerial.jpg",
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
              background_image: img("/29navy/assets/614ddffddb6b8587d3d41004_location-aerial.jpg"),
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
                  ),
                  floorplan: img(
                    "/29navy/assets/68a8ab2eb4bb6bfe07128d9b_floorplan-level-3_label.png",
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
                  ),
                  floorplan: img(
                    "/29navy/assets/68a8a9f0547387a3619409d7_floorplan-level-1_label.png",
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
                  ),
                  floorplan: img(
                    "/29navy/assets/68a8ab2e8c93e2fcae3bc02d_floorplan-level-1_label.png",
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
              laundry_logo: img("/29navy/assets/614def0e7bf7b30746beec9d_logo-modal-washio.png"),
              laundry_link: {
                link_type: "Web",
                url: "https://www.rinse.com/getwashio?utm_source=www.getwashio.com&utm_campaign=washio_redirect&utm_promo=getwashio",
              },
              gym_title: "Looking for a gym?",
              gym_logo_1: img(
                "/29navy/assets/614dfdbeeca57714e0b275e0_golds-gym-logo-png-11552727817xfevltaaqp-removebg-preview.png",
              ),
              gym_link_1: {
                link_type: "Web",
                url: "http://www.goldsgym.com/veniceca/",
                target: "_blank",
              },
              gym_logo_2: img("/29navy/assets/614dfca76c78053dab7d696f_logo-modal-classpass.png"),
              gym_link_2: { link_type: "Web", url: "https://classpass.com/" },
              tv_title: "connecting cable tv?",
              tv_logo: img("/29navy/assets/614e015fb3f528b5d65f8192_logo-modal-fios.png"),
              tv_link: { link_type: "Web", url: "http://fios.verizon.com/", target: "_blank" },
              tv_body: [
                {
                  type: "paragraph",
                  text: "Contact Building Management at 310-393-9653 and a dedicated Verizon Account Representative will respond to your inquiry and provide information and set-up your account.",
                  spans: [],
                },
              ],
              ride_title: "need a ride?",
              ride_logo_1: img("/29navy/assets/614e04a52a076aebf5fb883e_logo-modal-lyft.png"),
              ride_link_1: { link_type: "Web", url: "https://www.lyft.com/", target: "_blank" },
              ride_logo_2: img("/29navy/assets/614e04ae200f160bc3dd791f_logo-modal-uber.png"),
              ride_link_2: { link_type: "Web", url: "https://www.uber.com/", target: "_blank" },
              food_title: "Hungry?",
              food_logo_1: img("/29navy/assets/614e083adb033884c9babd48_logo-modal-postmates.png"),
              food_link_1: {
                link_type: "Web",
                url: "https://postmates.com/los-angeles",
                target: "_blank",
              },
              food_logo_2: img("/29navy/assets/614e0828dc5ca9db01c4b415_logo-modal-uber-eats.png"),
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
              ),
            },
            items: [],
          },
        ],
      },
    },
  ];
}
