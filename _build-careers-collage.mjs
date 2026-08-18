// One-off asset build for the Careers hero collage.
// Emits optimized webp tiles + a composed mosaic poster JPEG.
// Run: node _build-careers-collage.mjs
import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const OUT = "images/careers-collage";
const SRC_DIR = path.join(OUT, "_src");

const PHOTOS = {
  "white-shirts-lobby": "white-shirts-lobby.png",
  "lobby-onam": "lobby-onam.png",
  "onam-sarees": "onam-sarees.png",
  "halloween": "halloween.png",
  "traditional-men": "traditional-men.png",
  "teal-wall-festive": "teal-wall-festive.png",
  "anniversary-16": "anniversary-16.png",
  "teal-office-team": "teal-office-team.png",
};

// Poster mirrors the hero marquee at a 1920-wide reference: three rows of tiles
// whose widths are the same --w values used in Careers.html (--w * 1vw). Rows 2
// and 3 start part-way through their sequence so the still is not three aligned
// rows, which also matches where the live rows sit a moment after load.
const POSTER_W = 1920;
const POSTER_H = 1080;
const GAP = 8;
const ROWS = [
  {
    offset: 0,
    tiles: [
      { photo: "white-shirts-lobby", w: 22, pos: "centre" },
      { photo: "onam-sarees", w: 16, pos: "right" },
      { photo: "halloween", w: 20, pos: "centre" },
      { photo: "anniversary-16", w: 25, pos: "centre" },
      { photo: "teal-office-team", w: 17, pos: "left" },
      { photo: "traditional-men", w: 18, pos: "centre" },
    ],
  },
  {
    offset: -0.16,
    tiles: [
      { photo: "lobby-onam", w: 19, pos: "centre" },
      { photo: "teal-wall-festive", w: 24, pos: "centre" },
      { photo: "anniversary-16", w: 16, pos: "left" },
      { photo: "halloween", w: 21, pos: "right" },
      { photo: "white-shirts-lobby", w: 18, pos: "right" },
      { photo: "onam-sarees", w: 20, pos: "left" },
    ],
  },
  {
    offset: -0.08,
    tiles: [
      { photo: "teal-office-team", w: 17, pos: "right" },
      { photo: "traditional-men", w: 21, pos: "right" },
      { photo: "lobby-onam", w: 25, pos: "right" },
      { photo: "teal-wall-festive", w: 16, pos: "left" },
      { photo: "halloween", w: 19, pos: "left" },
      { photo: "anniversary-16", w: 20, pos: "right" },
    ],
  },
];

await mkdir(OUT, { recursive: true });

const srcPath = (f) => path.join(SRC_DIR, f);

for (const [name, file] of Object.entries(PHOTOS)) {
  const img = sharp(srcPath(file));
  const meta = await img.metadata();
  await sharp(srcPath(file))
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 62, effort: 6 })
    .toFile(path.join(OUT, `${name}-lg.webp`));
  await sharp(srcPath(file))
    .resize({ width: 620, withoutEnlargement: true })
    .webp({ quality: 62, effort: 6 })
    .toFile(path.join(OUT, `${name}-sm.webp`));
  console.log(`${name}: source ${meta.width}x${meta.height}`);
}

const RADIUS = 14;

// Derive each row's band from exact fractions so rounding never pushes the last
// row past the canvas (sharp drops a layer that overflows).
const BANDS = ROWS.map((_, i) => {
  const step = (POSTER_H + GAP) / ROWS.length;
  const top = Math.round(i * step);
  return { top, height: Math.round((i + 1) * step) - GAP - top };
});

const roundCorners = (buf, w, h) => {
  const mask = Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/></svg>`
  );
  return sharp(buf).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
};

const layers = [];

for (const [rowIndex, row] of ROWS.entries()) {
  const { top, height: ROW_H } = BANDS[rowIndex];
  const widths = row.tiles.map((t) => Math.round((t.w / 100) * POSTER_W));
  const seqWidth = widths.reduce((sum, w) => sum + w + GAP, 0);

  // Two passes of the sequence, exactly as the live track does, so the poster
  // stays full even when the row starts part-way through.
  let x = Math.round(row.offset * seqWidth);
  for (let pass = 0; pass < 2; pass += 1) {
    for (const [i, tile] of row.tiles.entries()) {
      const w = widths[i];
      const tileX = x;
      x += w + GAP;

      // Clip to the poster edges; a cut edge loses its rounding, which is correct.
      const left = Math.max(0, tileX);
      const right = Math.min(POSTER_W, tileX + w);
      if (right <= left) continue;

      const full = await sharp(srcPath(PHOTOS[tile.photo]))
        .resize(w, ROW_H, { fit: "cover", position: tile.pos })
        .toBuffer();
      const slice = await sharp(await roundCorners(full, w, ROW_H))
        .extract({ left: left - tileX, top: 0, width: right - left, height: ROW_H })
        .toBuffer();

      layers.push({ input: slice, left, top });
    }
    if (x >= POSTER_W) break;
  }
}

// Compose and downscale in separate passes: sharp runs resize BEFORE composite
// within one pipeline, which would shrink the canvas out from under the tiles.
const composed = await sharp({
  create: { width: POSTER_W, height: POSTER_H, channels: 3, background: { r: 19, g: 19, b: 19 } },
})
  .composite(layers)
  .png()
  .toBuffer();

await sharp(composed)
  // Poster is only the first-paint fallback behind the live marquee, so it can be lean.
  .resize({ width: 1280 })
  .jpeg({ quality: 68, mozjpeg: true, progressive: true })
  .toFile(path.join(OUT, "hero-collage-poster.jpg"));

const files = await readdir(OUT);
console.log("\nEmitted:", files.join(", "));
