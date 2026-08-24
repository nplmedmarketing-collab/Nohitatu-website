import * as mupdf from "mupdf";
import fs from "fs";
import path from "path";

const pdfPath =
  "d:/Development/Priyanka/Profile Data/Desktop/NOHITATU PORTFOLIO MODULE.docx.pdf";
const outDir = "images/portfolio/pdf-assets";
fs.mkdirSync(outDir, { recursive: true });

const doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
const n = doc.countPages();

for (let i = 0; i < n; i++) {
  const page = doc.loadPage(i);
  const json = JSON.parse(page.toStructuredText("preserve-images").asJSON());
  let imgIdx = 0;
  const found = [];
  for (const block of json.blocks || []) {
    if (block.type !== "image") continue;
    imgIdx++;
    const bbox = block.bbox; // [x0,y0,x1,y1]
    const w = Math.round((bbox[2] - bbox[0]) * 2);
    const h = Math.round((bbox[3] - bbox[1]) * 2);
    if (w < 80 || h < 80) continue;
    // Render just that region via full page pixmap crop
    const mat = mupdf.Matrix.scale(2, 2);
    const pixmap = page.toPixmap(mat, mupdf.ColorSpace.DeviceRGB, false, true);
    // clip: use ImageData from pixmap manually
    const x0 = Math.max(0, Math.floor(bbox[0] * 2));
    const y0 = Math.max(0, Math.floor(bbox[1] * 2));
    const x1 = Math.min(pixmap.getWidth(), Math.ceil(bbox[2] * 2));
    const y1 = Math.min(pixmap.getHeight(), Math.ceil(bbox[3] * 2));
    const cw = x1 - x0;
    const ch = y1 - y0;
    if (cw < 40 || ch < 40) continue;
    // Create cropped pixmap via getPixels
    const pixels = pixmap.getPixels(); // Uint8ClampedArray RGBA?
    const pw = pixmap.getWidth();
    const ph = pixmap.getHeight();
    const ncomp = pixmap.getNumberOfComponents(); // likely 3 RGB
    const alpha = pixmap.getAlpha();
    const stride = pw * (ncomp + (alpha ? 1 : 0));
    // Use Image from cropped region - easier: write temp and use sharp? 
    // Actually mupdf Pixmap has clear / copy?
    const cropped = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, [0, 0, cw, ch], false);
    // copy pixel by pixel - slow but ok
    const src = Buffer.from(pixels);
    const dst = Buffer.alloc(cw * ch * 3);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const si = ((y0 + y) * pw + (x0 + x)) * ncomp;
        const di = (y * cw + x) * 3;
        dst[di] = src[si];
        dst[di + 1] = src[si + 1];
        dst[di + 2] = src[si + 2];
      }
    }
    // set pixels on cropped - check API
    cropped.clear(255);
    // Try writing via Image
    const file = path.join(outDir, `p${String(i + 1).padStart(2, "0")}_i${imgIdx}_${cw}x${ch}.png`);
    // Fallback: render full page and note bbox - use canvas-less approach with pngjs
    found.push({ imgIdx, w: cw, h: ch, bbox, file });
  }
  console.log(`page ${i + 1}: ${found.length} images`, found.map((f) => `${f.w}x${f.h}`).join(", "));
}
