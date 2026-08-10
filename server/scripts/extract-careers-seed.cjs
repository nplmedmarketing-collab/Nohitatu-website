/**
 * Parse Careers.html cards + js/career-details.js into data/seed/careers.json
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "../..");
const careersHtmlPath = path.join(root, "Careers.html");
const detailsJsPath = path.join(root, "js", "career-details.js");
const outDir = path.join(root, "data", "seed");
const outPath = path.join(outDir, "careers.json");

function decode(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .trim();
}

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(detailsJsPath, "utf8"), sandbox);
const catalog = sandbox.window.NOHITATU_CAREER_DETAILS || {};

const html = fs.readFileSync(careersHtmlPath, "utf8");
const articles = [...html.matchAll(/<article class="careers-job">([\s\S]*?)<\/article>/g)].map(
  (a) => a[1]
);

const listMeta = articles.map((block) => {
  const title = (block.match(/careers-job-title">([^<]+)/) || [])[1] || "";
  const code = (block.match(/careers-job-code">([^<]+)/) || [])[1] || "";
  const exp = (block.match(/Experience<\/dt>\s*<dd>([^<]+)/) || [])[1] || "";
  const loc = (block.match(/Location<\/dt>\s*<dd>([^<]+)/) || [])[1] || "";
  const shift = (block.match(/Shift Timings<\/dt>\s*<dd>([^<]+)/) || [])[1] || "";
  return {
    code: String(code).trim(),
    title: decode(title),
    experience: decode(exp),
    location: decode(loc),
    shift_timings: decode(shift),
  };
});

function typeFromValidation(v, title) {
  if (String(v).toUpperCase() === "I") return "internship";
  if (/intern/i.test(title || "")) return "internship";
  return "full-time";
}

const now = new Date().toISOString();
const rows = listMeta.map((meta, i) => {
  const d = catalog[meta.code] || {};
  const title = decode(d.post || meta.title);
  const validation = d.validationType || (/intern/i.test(title) ? "I" : "J");
  return {
    job_code: meta.code,
    title,
    department: "",
    location: meta.location || decode(d.location) || "Chennai",
    experience: meta.experience || decode(d.experience) || "",
    employment_type: typeFromValidation(validation, title),
    shift_timings: meta.shift_timings || "",
    description: "",
    responsibilities: d.responsibilities || "",
    requirements: d.musthave || "",
    status: "open",
    sort_order: i + 1,
    apply_url: d.applyUrl || `PostResume.html?id=${meta.code}`,
    validation_type: validation,
    expire_date: d.expireDate || "",
    created_at: now,
    updated_at: now,
  };
});

// Include any catalog-only jobs not shown on Careers.html cards
const seen = new Set(rows.map((r) => r.job_code));
let extraOrder = rows.length;
for (const key of Object.keys(catalog)) {
  if (seen.has(String(key))) continue;
  const d = catalog[key];
  const title = decode(d.post || "");
  const validation = d.validationType || (/intern/i.test(title) ? "I" : "J");
  extraOrder += 1;
  rows.push({
    job_code: String(d.jobid || key),
    title,
    department: "",
    location: decode(d.location) || "Chennai",
    experience: decode(d.experience) || "",
    employment_type: typeFromValidation(validation, title),
    shift_timings: "",
    description: "",
    responsibilities: d.responsibilities || "",
    requirements: d.musthave || "",
    status: "open",
    sort_order: extraOrder,
    apply_url: d.applyUrl || `PostResume.html?id=${d.jobid || key}`,
    validation_type: validation,
    expire_date: d.expireDate || "",
    created_at: now,
    updated_at: now,
  });
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");
console.log(`Wrote ${rows.length} careers → ${outPath}`);
rows.forEach((r) => {
  console.log(`  ${r.sort_order}. [${r.job_code}] ${r.title} (${r.employment_type})`);
});
