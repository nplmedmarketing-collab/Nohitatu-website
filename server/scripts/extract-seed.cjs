/**
 * One-shot: parse Portfolio.html atlas items into data/seed/projects.json
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const htmlPath = path.join(root, "Portfolio.html");
const outDir = path.join(root, "data", "seed");
const outPath = path.join(outDir, "projects.json");

const html = fs.readFileSync(htmlPath, "utf8");
const blocks = html.match(/<button type="button" class="atlas-item[\s\S]*?<\/button>/g) || [];

function attr(block, name) {
  const re = new RegExp(`data-${name}="([^"]*)"`);
  const m = block.match(re);
  return m ? m[1] : "";
}

function decode(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const projects = blocks.map((b, i) => {
  const thumbM = b.match(/<img[^>]+src="([^"]+)"/);
  return {
    order: i + 1,
    frame_id: attr(b, "id"),
    title: decode(attr(b, "title")),
    description: decode(attr(b, "desc")),
    client: decode(attr(b, "client")),
    vertical: attr(b, "vertical"),
    platform: attr(b, "platform"),
    code: attr(b, "code"),
    platform_long: decode(attr(b, "long")),
    image: attr(b, "src"),
    thumb: thumbM ? thumbM[1] : "",
    alt: decode(attr(b, "alt")),
    cta: attr(b, "cta") || "Contact-us.html",
  };
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(projects, null, 2));
console.log(`Wrote ${projects.length} projects to ${outPath}`);
