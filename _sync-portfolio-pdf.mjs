/**
 * Sync Portfolio.html + images from NOHITATU PORTFOLIO MODULE PDF.
 * Rule: when multiple Options exist, ALWAYS use Option 1.
 */
import * as mupdf from "mupdf";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const PDF =
  "d:/Development/Priyanka/Profile Data/Desktop/NOHITATU PORTFOLIO MODULE.docx.pdf";
const HTML = "Portfolio.html";
const PAGES = "images/portfolio/pdf-pages";

function extractOption1(fullText) {
  const t = fullText.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  // Prefer explicit Option 1 … Option 2
  const m = t.match(/Option\s*1[^\w]?\s*(.+?)(?=\s*Option\s*2\b|$)/i);
  if (m) return cleanDesc(m[1]);
  // Restaurant numbered list: "1. Title Desc 2. ..."
  const n = t.match(/^\d+\.\s*[^.]+?\.\s*(.+?)(?=\s*\d+\.\s+[A-Z]|$)/);
  if (n && /Restaurant/i.test(t.slice(0, 40))) return cleanDesc(n[1]);
  // Restaurant: "1. Restaurant Management Platform A comprehensive..."
  const r = t.match(
    /1\.\s*Restaurant Management Platform\s+(.+?)(?=\s*2\.\s*Smart Restaurant|$)/i
  );
  if (r) return cleanDesc(r[1]);
  // Strip leading TITLE words then take rest until Option 2
  let body = t
    .replace(/^[A-Z0-9][A-Z0-9 &\-\/]+?\s+(?=A |An |The |Manual |Designed |This |CRM |Finding |Real |Healthcare |Sport |HR |Doctor |Website |Smart |Ticket |Performance |FINTECHESH )/i, "")
    .replace(/\s*Option\s*2[\s\S]*$/i, "")
    .replace(/^Option\s*1[^\w]?\s*/i, "");
  // Remove title leftovers at start
  body = body.replace(
    /^(WORKPLACE SAFETY APP|CMS 1500|TAXATION APP|MEDALLION KARATE|ECOMMERCE APP|SALES CRM|HEALTHCARE BILLING SOFTWARE|MY TASKY APP|VISITOR MANAGEMENT APP|MANAMAKKAL|DOJOMAN|TASK MANAGEMENT|REAL ESTATE\/CRM|HEALTHCARE CRM|SPORT EVENT|HR AND PAYROLL|DOCTOR APPOINTMENT|WEBSITE DESIGN & DEVELOPMENT|SMART FITNESS|TICKET BOOKING|PERFORMANCE MANAGEMENT SYSTEM|RESTAURANT MANAGEMENT|FOOD DELIVERY|FINTECHESH)\s+/i,
    ""
  );
  body = body.replace(/\s*Client:\s*India\s*$/i, "");
  return cleanDesc(body);
}

function cleanDesc(s) {
  return s
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "—")
    .replace(/\s+/g, " ")
    .replace(/^[\s·•\-–—]+/, "")
    .trim();
}

function escapeHtmlAttr(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Prefer image-only follow-up page; else crop lower portion of text page. */
const ITEMS = [
  {
    titleMatch: "WorkPlace Safety App",
    category: "project",
    // p1 has stacked bands: old site chrome (top) + device cluster (bottom).
    // Prefer bottom Singapore Facility Safety Hub mockup — avoid full-page stack.
    pages: [1],
    crop: "mockup",
    dataSrc: "images/portfolio/WorkPlace-Safety-App.png",
    reel: "images/portfolio/reel/16-workplace-safety-app.webp",
    wall: "images/portfolio/wall/mobile-workplace-safety-app.webp",
  },
  {
    titleMatch: "CMS 1500",
    category: "product",
    pages: [3, 2], // prefer image page 3, else 2
    crop: "auto",
    dataSrc: "images/portfolio/CMS.png",
    reel: "images/portfolio/reel/1-cms-1500.webp",
    wall: "images/portfolio/wall/web-cms-1500.webp",
  },
  {
    titleMatch: "Taxation App",
    category: "project",
    // p4 text above + TaxCana device hero; mockup crop fills frame (bottom left white void).
    pages: [4],
    crop: "mockup",
    dataSrc: "images/portfolio/Taxation-app.png",
    reel: "images/portfolio/reel/17-taxation-app.webp",
    wall: "images/portfolio/wall/mobile-taxation-app.webp",
  },
  {
    titleMatch: "Medallion Karate",
    category: "project",
    // Prefer p5 filled dark device mockup; p6 old chrome leaves large white void.
    pages: [5],
    crop: "mockup",
    dataSrc: "images/portfolio/Medallion-Karate.png",
    reel: "images/portfolio/reel/2-medallion-karate.webp",
    wall: "images/portfolio/wall/web-medallion-karate.webp",
  },
  {
    titleMatch: "Ecommerce App",
    category: "project",
    pages: [8, 7],
    crop: "auto",
    dataSrc: "images/portfolio/Ecommerce-app.png",
    reel: "images/portfolio/reel/4-ecommerce-app.webp",
    wall: null,
  },
  {
    titleMatch: "Sales CRM",
    category: "product",
    // p9 case-study banner (monitor mockup); mockup crop drops title + white void.
    pages: [9],
    crop: "mockup",
    dataSrc: "images/portfolio/Sales-CRM.png",
    reel: "images/portfolio/reel/3-sales-crm.webp",
    wall: "images/portfolio/wall/web-sales-crm.webp",
  },
  {
    titleMatch: "Healthcare billing software",
    category: "product",
    pages: [11, 10],
    crop: "auto",
    dataSrc: "images/portfolio/Healthcare-billing-software.png",
    reel: "images/portfolio/reel/7-healthcare-billing-software.webp",
    wall: "images/portfolio/wall/web-healthcare-billing-software.webp",
  },
  {
    titleMatch: "Mytasky App",
    category: "product",
    // Prefer light MyTasky hero mockup (first band); avoid stacked dark void below.
    pages: [12],
    crop: "top",
    dataSrc: "images/portfolio/Mytasky.png",
    reel: "images/portfolio/reel/18-mytasky-app.webp",
    wall: "images/portfolio/wall/mobile-mytasky.webp",
  },
  {
    titleMatch: "Visitors management app",
    category: "product",
    pages: [14, 13],
    crop: "auto",
    dataSrc: "images/portfolio/Visitors-management-app.png",
    reel: "images/portfolio/reel/19-visitors-management-app.webp",
    wall: "images/portfolio/wall/mobile-visitors-management-app.webp",
  },
  {
    titleMatch: "Manamakkal",
    category: "project",
    pages: [16, 15],
    crop: "auto",
    dataSrc: "images/portfolio/Manamakkal.png",
    reel: "images/portfolio/reel/5-manamakkal.webp",
    wall: "images/portfolio/wall/web-manamakkal.webp",
  },
  {
    titleMatch: "Dojoman Event Management software",
    category: "product",
    // Prefer p17 dark hero banner (filled); p18 stacked mockups leave large white voids.
    pages: [17, 18],
    crop: "mockup",
    dataSrc: "images/portfolio/Dojoman-event-management-software.png",
    reel: "images/portfolio/reel/6-dojoman-event-management-software.webp",
    wall: "images/portfolio/wall/web-dojoman-event-management.webp",
  },
  {
    titleMatch: "Task Management",
    category: "product",
    // p19 Option 1/2 text above; mockup band below (low chroma — fallback to largest band).
    pages: [19],
    crop: "mockup",
    dataSrc: "images/portfolio/web/task-management/task-management.png",
    reel: "images/portfolio/reel/8-task-management.webp",
    wall: "images/portfolio/wall/web-task-management.webp",
  },
  {
    titleMatch: "Real Estate",
    category: "product",
    pages: [22, 23, 20],
    crop: "auto",
    dataSrc: "images/portfolio/web/real-estatesales-crm/real-estatesales-crm.png",
    reel: "images/portfolio/reel/21-real-estate-crm.webp",
    wall: "images/portfolio/wall/web-real-estate-sales-crm.webp",
  },
  {
    titleMatch: "Healthcare CRM",
    category: "product",
    pages: [25, 24], // prefer mockup page 25 over text Option page 24
    crop: "mockup",
    dataSrc: "images/portfolio/healthcaresw.png",
    reel: "images/portfolio/reel/9-healthcare-crm.webp",
    wall: "images/portfolio/wall/web-healthcare-crm.webp",
  },
  {
    titleMatch: "Sport event",
    category: "product",
    pages: [28, 26],
    crop: "auto",
    dataSrc: "images/portfolio/web/sport-event-software/event-management-software-dojoman.png",
    // Portfolio.html + projects.json use reel/12-sport-event.webp (not 22)
    reel: "images/portfolio/reel/12-sport-event.webp",
    wall: "images/portfolio/wall/mobile-sport-event-app.webp",
  },
  {
    titleMatch: "HR and Payroll",
    category: "product",
    // PDF has text-only Option pages (p29–30); no adjacent UI spread.
    // Keep committed product mockup so re-sync never reverts to Option text.
    pages: [],
    sourceFile: "images/portfolio/pdf-pages/fixed/hr-and-payroll-ui.png",
    crop: "full",
    dataSrc: "images/portfolio/web/hr-payroll/hr-and-payroll-app.png",
    reel: "images/portfolio/reel/10-hr-and-payroll.webp",
    wall: "images/portfolio/wall/web-hr-and-payroll.webp",
  },
  {
    titleMatch: "Doctor Appointment",
    category: "product",
    pages: [31, 30], // prefer mockup on p31 (crop mid band; avoid Website Design below)
    crop: "mockup",
    dataSrc: "images/portfolio/mobile/doctor-appointment-app/Doctor-appointment-app.png",
    reel: "images/portfolio/reel/20-doctor-appointment.webp",
    wall: "images/portfolio/wall/mobile-doctor-appointment-app.webp",
  },
  {
    titleMatch: "Website Design",
    category: "project",
    pages: [33, 31],
    crop: "auto",
    dataSrc: "images/portfolio/web/web-development/Website-development-2.png",
    reel: "images/portfolio/reel/11-website-design-development.webp",
    wall: "images/portfolio/wall/web-website-design-and-development.webp",
  },
  {
    titleMatch: "Smart Fitness",
    category: "product",
    // Prefer p35 filled dark mockup (top band); p34 is Option text only.
    // Use "top" — mockup chroma prefers Ticket Booking on the same page.
    pages: [35, 34],
    crop: "top",
    dataSrc: "images/portfolio/mobile/fitness-app/fitness-app.png",
    reel: "images/portfolio/reel/23-smart-fitness.webp",
    wall: "images/portfolio/wall/mobile-smart-fitness-app.webp",
  },
  {
    titleMatch: "Ticket Booking",
    category: "product",
    pages: [35, 36],
    crop: "auto",
    dataSrc: "images/portfolio/mobile/ticket-booking-app/ticket-booking-app.png",
    reel: "images/portfolio/reel/25-ticket-booking.webp",
    wall: "images/portfolio/wall/mobile-ticket-booking-app.webp",
  },
  {
    titleMatch: "Performance Management System",
    category: "product",
    // Prefer p37 filled hero mockup (below Ticket Option text); p38 is Option text only.
    pages: [37, 38],
    crop: "mockup",
    dataSrc: "images/portfolio/web/performance-management-system/performance-management-system.png",
    reel: "images/portfolio/reel/14-performance-management-system.webp",
    wall: "images/portfolio/wall/web-performance-management-system.webp",
  },
  {
    titleMatch: "Restaurant Management",
    category: "product",
    pages: [40, 39],
    crop: "auto",
    dataSrc: "images/portfolio/web/restaurant-management/Restaurant-management.png",
    reel: "images/portfolio/reel/15-restaurant-management.webp",
    wall: "images/portfolio/wall/web-restaurant-management.webp",
  },
  {
    titleMatch: "Food delivery",
    category: "product",
    pages: [41],
    crop: "bottom",
    dataSrc: "images/portfolio/Food-delivery-app.png",
    reel: "images/portfolio/reel/26-food-delivery.webp",
    wall: "images/portfolio/wall/mobile-food-delivery-app.webp",
  },
];

// Page text sources for Option 1 (1-based page numbers)
const DESC_PAGE = {
  "WorkPlace Safety App": 1,
  "CMS 1500": 2,
  "Taxation App": 4,
  "Medallion Karate": 5,
  "Ecommerce App": 7,
  "Sales CRM": 9,
  "Healthcare billing software": 10,
  "Mytasky App": 12,
  "Visitors management app": 13,
  Manamakkal: 15,
  "Dojoman Event Management software": 17,
  "Task Management": 19,
  "Real Estate": 20,
  "Healthcare CRM": 24,
  "Sport event": 26,
  "HR and Payroll": 29,
  "Doctor Appointment": 30,
  "Website Design": 31,
  "Smart Fitness": 34,
  "Ticket Booking": 36,
  "Performance Management System": 38,
  "Restaurant Management": 39,
  "Food delivery": 41,
};

const FINTECHESH = {
  title: "FINTECHESH",
  category: "product",
  pageText: 43,
  pages: [44, 43],
  crop: "auto",
  dataSrc: "images/portfolio/financials2.png",
  reel: "images/portfolio/reel/29-fintechesh.webp",
  wall: "images/portfolio/wall/desktop-fintechesh-desktop.webp",
};

/** First substantial non-white content band (for pages with stacked mockups). */
async function extractTopBand(file) {
  const meta = await sharp(file).metadata();
  const w = meta.width;
  const h = meta.height;
  const { data, info } = await sharp(file)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const isWhite = (i) => data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245;
  const thresh = Math.floor(w * 0.02);
  let start = null;
  let end = null;
  for (let y = 0; y < h; y++) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      if (!isWhite((y * w + x) * ch)) count++;
    }
    const active = count > thresh;
    if (active && start === null) start = y;
    if (!active && start !== null) {
      if (y - 1 - start + 1 >= 80) {
        end = y - 1;
        break;
      }
      start = null;
    }
  }
  if (start === null || end === null) return null;

  const padY = 8;
  const top = Math.max(0, start - padY);
  const bottom = Math.min(h - 1, end + padY);
  const height = bottom - top + 1;
  let minX = w,
    maxX = 0;
  for (let y = top; y <= bottom; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      if (!isWhite(i)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  const padX = 6;
  const left = Math.max(0, minX - padX);
  const width = Math.min(w - 1, maxX + padX) - left + 1;
  return sharp(file).extract({ left, top, width, height });
}

/** Largest non-white content band that looks like a colored mockup (not gray body text). */
async function extractMockupBand(file) {
  const meta = await sharp(file).metadata();
  const w = meta.width;
  const h = meta.height;
  const { data, info } = await sharp(file)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const isWhite = (i) => data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245;
  const thresh = Math.floor(w * 0.02);
  const bands = [];
  let start = null;
  for (let y = 0; y < h; y++) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      if (!isWhite(i)) count++;
    }
    const active = count > thresh;
    if (active && start === null) start = y;
    if (!active && start !== null) {
      bands.push([start, y - 1]);
      start = null;
    }
  }
  if (start !== null) bands.push([start, h - 1]);

  let best = null;
  let bestScore = 0;
  let bestFallback = null;
  let bestFallbackArea = 0;
  for (const [a, b] of bands) {
    const bh = b - a + 1;
    if (bh < 80) continue;
    const mid = Math.floor((a + b) / 2);
    let r = 0,
      g = 0,
      bl = 0,
      n = 0;
    for (let x = 0; x < w; x += 4) {
      const i = (mid * w + x) * ch;
      if (!isWhite(i)) {
        r += data[i];
        g += data[i + 1];
        bl += data[i + 2];
        n++;
      }
    }
    if (!n) continue;
    const avgR = r / n,
      avgG = g / n,
      avgB = bl / n;
    const chroma = Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB);
    const area = bh * w;
    // Largest substantial band as fallback (e.g. low-chroma Task Management mockup)
    if (area > bestFallbackArea) {
      bestFallbackArea = area;
      bestFallback = { top: a, bottom: b };
    }
    // Prefer colorful mockup bands over gray text.
    // Weight by chroma so near-equal stacked bands pick the richer device mockup
    // (e.g. WorkPlace p1: bottom cluster over top website chrome).
    if (chroma < 18) continue;
    const score = area * (1 + chroma / 50);
    if (score > bestScore) {
      bestScore = score;
      best = { top: a, bottom: b };
    }
  }
  if (!best) best = bestFallback;
  if (!best) return null;

  const padY = 8;
  const top = Math.max(0, best.top - padY);
  const bottom = Math.min(h - 1, best.bottom + padY);
  const height = bottom - top + 1;
  let minX = w,
    maxX = 0;
  for (let y = top; y <= bottom; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      if (!isWhite(i)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  const padX = 6;
  const left = Math.max(0, minX - padX);
  const width = Math.min(w - 1, maxX + padX) - left + 1;
  return sharp(file).extract({ left, top, width, height });
}

async function pickPageImage(pageNums, cropMode, sourceFile) {
  if (sourceFile) {
    if (!fs.existsSync(sourceFile)) {
      throw new Error("Missing sourceFile: " + sourceFile);
    }
    let img = sharp(sourceFile);
    if (cropMode === "full") img = img.trim({ threshold: 12 });
    return img;
  }
  let best = null;
  let bestScore = -1;
  for (const p of pageNums) {
    const file = path.join(PAGES, `page-${String(p).padStart(2, "0")}.png`);
    if (!fs.existsSync(file)) continue;
    const meta = await sharp(file).metadata();
    const textLen = pageTextCache[p]?.length || 0;
    // Prefer nearly-empty text pages (image spreads)
    const score = (textLen < 40 ? 1e9 : 0) + (meta.width || 0) * (meta.height || 0);
    if (score > bestScore) {
      bestScore = score;
      best = { file, page: p, textLen, w: meta.width, h: meta.height };
    }
  }
  if (!best) throw new Error("No page image for " + pageNums);
  let img = sharp(best.file);
  const { w, h, textLen } = best;
  const mode = cropMode === "auto" ? (textLen < 40 ? "full" : "bottom") : cropMode;
  if (mode === "top") {
    const band = await extractTopBand(best.file);
    if (band) return band;
    img = img.extract({ left: 0, top: 0, width: w, height: Math.round(h * 0.48) });
  } else if (mode === "mockup") {
    const band = await extractMockupBand(best.file);
    if (band) return band;
    // fall through to bottom if no colored band found
    const top = Math.round(h * 0.28);
    img = img.extract({ left: 0, top, width: w, height: h - top });
  } else if (mode === "bottom") {
    // Drop top ~28% (title + paragraph), keep visual mockups
    const top = Math.round(h * 0.28);
    img = img.extract({ left: 0, top, width: w, height: h - top });
  } else if (mode === "full") {
    // trim white margins a bit
    img = img.trim({ threshold: 12 });
  }
  return img;
}

const pageTextCache = {};

async function writeOutputs(imgPipeline, item) {
  const pngBuf = await imgPipeline
    .clone()
    .resize({ width: 1400, withoutEnlargement: true })
    .png({ quality: 90 })
    .toBuffer();
  fs.mkdirSync(path.dirname(item.dataSrc), { recursive: true });
  fs.writeFileSync(item.dataSrc, pngBuf);

  if (item.reel) {
    const webp = await sharp(pngBuf)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    fs.mkdirSync(path.dirname(item.reel), { recursive: true });
    fs.writeFileSync(item.reel, webp);
  }
  if (item.wall) {
    const webp = await sharp(pngBuf)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    fs.mkdirSync(path.dirname(item.wall), { recursive: true });
    fs.writeFileSync(item.wall, webp);
  }
  console.log("images →", item.titleMatch || item.title, item.dataSrc);
}

function updateCardHtml(html, titleMatch, desc, category) {
  // Find article by data-title containing titleMatch
  const re = new RegExp(
    `(<article\\s+class="pf-card"[^>]*data-title="[^"]*${titleMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"]*"[^>]*>)([\\s\\S]*?)(</article>)`,
    "i"
  );
  const m = html.match(re);
  if (!m) {
    console.warn("CARD NOT FOUND:", titleMatch);
    return html;
  }
  let open = m[1];
  let inner = m[2];
  const attrDesc = escapeHtmlAttr(desc);
  const textDesc = escapeHtmlText(desc);

  open = open.replace(/data-category="[^"]*"/, `data-category="${category}"`);
  if (/data-desc="/.test(open)) {
    open = open.replace(/data-desc="[^"]*"/, `data-desc="${attrDesc}"`);
  } else {
    open = open.replace(/>$/, ` data-desc="${attrDesc}">`);
  }
  inner = inner.replace(
    /(<p class="pf-card__desc">)[\s\S]*?(<\/p>)/,
    `$1${textDesc}$2`
  );
  return html.replace(m[0], open + inner + m[3]);
}

function buildFintecheshCard(desc) {
  const attrDesc = escapeHtmlAttr(desc);
  const textDesc = escapeHtmlText(desc);
  return `
                        <article class="pf-card" data-category="product" data-platform="web desktop" data-vertical="finance" data-id="F28" data-code="WEB·DSK" data-long="Web · Desktop" data-title="FINTECHESH" data-client="In-house product" data-cta="Contact-us.html" data-desc="${attrDesc}" data-src="images/portfolio/financials2.png" data-alt="FINTECHESH financial automation platform">
                            <div class="pf-card__media">
                                <img src="images/portfolio/reel/29-fintechesh.webp" alt="" width="600" height="375" loading="lazy" decoding="async">
                                <span class="pf-card__code">F28 &middot; WEB·DSK</span>
                            </div>
                            <div class="pf-card__body">
                                <p class="pf-card__vertical">Finance</p>
                                <h3 class="pf-card__title">FINTECHESH</h3>
                                <p class="pf-card__client">In-house product</p>
                                <p class="pf-card__desc">${textDesc}</p>
                                <div class="pf-card__foot">
                                    <div class="pf-card__tags"><span class="tech-tag">React</span><span class="tech-tag">Node.js</span><span class="tech-tag">Finance API</span></div>
                                    <span class="pf-card__cta" aria-hidden="true">Quick view<span class="pf-card__arrow">&#8594;</span></span>
                                </div>
                            </div>
                            <button type="button" class="pf-card__hit" aria-label="Quick view FINTECHESH &mdash; Web · Desktop"></button>
                        </article>`;
}

async function main() {
  const doc = mupdf.Document.openDocument(fs.readFileSync(PDF), "application/pdf");
  for (let i = 0; i < doc.countPages(); i++) {
    pageTextCache[i + 1] = doc.loadPage(i).toStructuredText().asText();
  }

  const descs = {};
  for (const [title, page] of Object.entries(DESC_PAGE)) {
    descs[title] = extractOption1(pageTextCache[page] || "");
    console.log(`\n[${title}] p${page}:\n  ${descs[title].slice(0, 140)}…`);
  }
  descs.FINTECHESH = extractOption1(pageTextCache[43] || "");
  console.log(`\n[FINTECHESH]:\n  ${descs.FINTECHESH.slice(0, 140)}…`);

  // Images
  for (const item of ITEMS) {
    const pipe = await pickPageImage(item.pages, item.crop, item.sourceFile);
    await writeOutputs(pipe, item);
  }
  {
    const pipe = await pickPageImage(FINTECHESH.pages, FINTECHESH.crop);
    await writeOutputs(pipe, { ...FINTECHESH, titleMatch: "FINTECHESH" });
  }

  // HTML updates
  let html = fs.readFileSync(HTML, "utf8");
  for (const item of ITEMS) {
    const key = item.titleMatch;
    // Website Design card title is "Website Design &amp; development"
    const match =
      key === "Website Design" ? "Website Design" : key;
    html = updateCardHtml(html, match, descs[key], item.category);
  }

  // Prefer updating an existing FinTechesh/FINTECHESH card; never add a second one.
  if (/data-title="FINTECHESH"/i.test(html)) {
    html = updateCardHtml(html, "FINTECHESH", descs.FINTECHESH, "product");
  } else if (/data-title="FinTechesh"/i.test(html)) {
    // Normalize legacy casing, then refresh Option 1 copy.
    html = html.replace(/data-title="FinTechesh"/g, 'data-title="FINTECHESH"');
    html = html.replace(/>FinTechesh</g, ">FINTECHESH<");
    html = updateCardHtml(html, "FINTECHESH", descs.FINTECHESH, "product");
  } else {
    const idx = html.lastIndexOf("</article>");
    if (idx !== -1) {
      const end = idx + "</article>".length;
      html = html.slice(0, end) + buildFintecheshCard(descs.FINTECHESH) + html.slice(end);
      console.log("Added FINTECHESH card");
    }
  }

  // Cache-bust style if present
  html = html.replace(
    /(href="css\/(?:style|portfolio-page)\.css)(?:\?v=[^"]*)?(")/g,
    `$1?v=20260824pdf1$2`
  );

  fs.writeFileSync(HTML, html);
  console.log("\nUpdated", HTML);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
