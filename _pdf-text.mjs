import * as mupdf from "mupdf";
import fs from "fs";

const pdfPath =
  "d:/Development/Priyanka/Profile Data/Desktop/NOHITATU PORTFOLIO MODULE.docx.pdf";
const doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");

function pageText(i) {
  return doc.loadPage(i).toStructuredText().asText().replace(/\s+/g, " ").trim();
}

for (let i = 0; i < doc.countPages(); i++) {
  const t = pageText(i);
  console.log(`\n===== PAGE ${i + 1} =====`);
  console.log(t.slice(0, 1200));
}
