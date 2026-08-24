import fs from "fs";

const html = fs.readFileSync("Portfolio.html", "utf8");
const re =
  /<article class="pf-card"[^>]*>/g;
let m;
const rows = [];
while ((m = re.exec(html))) {
  const tag = m[0];
  const title = (tag.match(/data-title="([^"]*)"/) || [])[1];
  const cat = (tag.match(/data-category="([^"]*)"/) || [])[1];
  const desc = (tag.match(/data-desc="([^"]*)"/) || [])[1] || "";
  rows.push({ title, cat, desc: desc.slice(0, 130) });
}
for (const r of rows) {
  console.log(r.cat.padEnd(8), r.title);
  console.log("         ", r.desc.replace(/&amp;/g, "&").replace(/&quot;/g, '"'));
  console.log("");
}
console.log("count", rows.length, "FINTECHESH", /data-title="FINTECHESH"/.test(html));
