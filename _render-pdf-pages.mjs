import fs from "fs";
import path from "path";
import canvasPkg from "canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const { createCanvas, Image, DOMMatrix, ImageData } = canvasPkg;

globalThis.Image = Image;
if (DOMMatrix) globalThis.DOMMatrix = DOMMatrix;
if (ImageData) globalThis.ImageData = ImageData;

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext("2d") };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

const pdfPath =
  "d:/Development/Priyanka/Profile Data/Desktop/NOHITATU PORTFOLIO MODULE.docx.pdf";
const outDir = "d:/Developer/Nohitatu website/images/portfolio/pdf-pages";
fs.mkdirSync(outDir, { recursive: true });

const data = new Uint8Array(fs.readFileSync(pdfPath));
const canvasFactory = new NodeCanvasFactory();
const doc = await getDocument({
  data,
  disableWorker: true,
  useSystemFonts: true,
  canvasFactory,
}).promise;
console.log("pages", doc.numPages);

const scale = 1.35;
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const viewport = page.getViewport({ scale });
  const canvasAndContext = canvasFactory.create(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height)
  );
  await page.render({
    canvasContext: canvasAndContext.context,
    viewport,
    canvasFactory,
  }).promise;
  const file = path.join(outDir, `page-${String(i).padStart(2, "0")}.png`);
  fs.writeFileSync(file, canvasAndContext.canvas.toBuffer("image/png"));
  console.log("wrote", path.basename(file), `${canvasAndContext.canvas.width}x${canvasAndContext.canvas.height}`);
  canvasFactory.destroy(canvasAndContext);
}
console.log("done");
