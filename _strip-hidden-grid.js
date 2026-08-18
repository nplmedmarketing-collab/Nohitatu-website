const fs = require("fs");
const p = "d:/Developer/Nohitatu website/Careers.html";
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const start = lines.findIndex((l) => l.includes("data-careers-grid") && l.includes("display:none"));
const dept = lines.findIndex((l) => l.includes("data-careers-departments"));
if (start < 0 || dept < 0 || dept <= start) {
  console.error({ start, dept });
  process.exit(1);
}
const out = [...lines.slice(0, start), ...lines.slice(dept)];
fs.writeFileSync(p, out.join("\n"));
console.log("removed", dept - start, "lines; dept now at", start + 1);
