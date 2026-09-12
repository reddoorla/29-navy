/**
 * Builds static/og-default.jpg — the site's social share card (1200×630).
 *
 *   node scripts/og-card.mjs
 *
 * Why a script and not a hand-made file: the card is composed from assets this
 * repo already ships, so it can be rebuilt when either changes, and the exact
 * crop is recorded rather than remembered.
 *
 * Both source images are the CLIENT'S OWN, from the reference capture:
 *   - the hero photograph of the building, which carries the building's real
 *     "29 NAVY" plate beside the entrance;
 *   - the wordmark, which is white marks on solid black — so it is COMPOSITED,
 *     not retypeset. CLAUDE.md: never redraw an asset when the real file is on
 *     disk. `screen` drops its black ground, so the band behind it can be any
 *     value without a seam.
 *
 * The only drawn element is the tagline, set in Arial — which is not a
 * substitution either: the reference ships no text webfont at all and every
 * word on the site is Arial (ref css:227, transcribed in src/app.css).
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { statSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const asset = (f) => join(root, "static/29navy/assets", f);

const W = 1200;
const H = 630;
const BAND = 148; // the black plate along the bottom, echoing the building's own signage

const PHOTO = asset("614ddfc369005a542460176f_hero-main-final.jpg"); // 1600×1068
const LOGO = asset("68a8b03886756d39d580f327_29-navy-logo-black.jpg"); // 776×800, white on black
const TAGLINE = "Creative Lofts for Lease  ·  Venice, California";

// The photo is 1600×1068 (1.498:1) and the card's photo area is 1200×482
// (2.49:1), so a `cover` fit would throw away 60% of the height and pick its
// own window. Extract a 1600×642 band explicitly instead. top=248 is not a
// guess: it is the highest crop that still contains the ENTRANCE and the
// building's own black "29 NAVY" plate beside it (they sit at y≈640-1010 in
// the 1068-tall original), which is the one part of the frame that identifies
// the address. A top-weighted crop keeps more sky and cuts exactly that.
const photo = await sharp(PHOTO)
  .extract({ left: 0, top: 248, width: 1600, height: 642 })
  .resize(W, H - BAND)
  .toBuffer();

const logo = await sharp(LOGO).resize({ height: 104 }).toBuffer();

const tagline = Buffer.from(
  `<svg width="${W}" height="${BAND}" xmlns="http://www.w3.org/2000/svg">
     <text x="232" y="${BAND / 2}" dominant-baseline="central"
           font-family="Arial, Helvetica, sans-serif" font-size="30"
           letter-spacing="0.06em" fill="#ffffff">${TAGLINE}</text>
   </svg>`,
);

await sharp({
  create: { width: W, height: H, channels: 3, background: "#000000" },
})
  .composite([
    { input: photo, top: 0, left: 0 },
    // `screen` over the black band: the wordmark's own ground disappears.
    { input: logo, top: H - BAND + (BAND - 104) / 2, left: 64, blend: "screen" },
    { input: tagline, top: H - BAND, left: 0 },
  ])
  .jpeg({ quality: 86, chromaSubsampling: "4:4:4" })
  .toFile(join(root, "static/og-default.jpg"));

const out = join(root, "static/og-default.jpg");
const { size } = statSync(out);
console.log(`static/og-default.jpg written — ${W}×${H}, ${Math.round(size / 1024)}KB`);
