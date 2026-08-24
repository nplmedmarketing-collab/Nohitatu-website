import * as mupdf from "mupdf";
import fs from "fs";
import path from "path";

const pdfPath =
  process.argv[2] ||
  "d:/Development/Priyanka/Profile Data/Desktop/NOHITATU PORTFOLIO MODULE.docx.pdf";
const outDir = "images/portfolio/pdf-pages";
fs.mkdirSync(outDir, { recursive: true });

const doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
const n = doc.countPages();
console.log("pages", n);

for (let i = 0; i < n; i++) {
  const page = doc.loadPage(i);
  const pixmap = page.toPixmap(
    mupdf.Matrix.scale(1.5, 1.5),
    mupdf.ColorSpace.DeviceRGB,
    false,
    true
  );
  const png = pixmap.asPNG();
  const file = path.join(outDir, `page-${String(i + 1).padStart(2, "0")}.png`);
  fs.writeFileSync(file, png);
  console.log("wrote", file, png.length);
}
console.log("done");
