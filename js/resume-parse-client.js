/* Browser-side resume parse (PDF/DOCX) so autofill works on static hosts
   even when the Render /api/resume-parse route is unavailable. */
(() => {
  const MAMMOTH_URL = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
  const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
  const PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-nh-src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute("data-nh-ready") === "1") return resolve();
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load " + src)));
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.setAttribute("data-nh-src", src);
      s.onload = () => {
        s.setAttribute("data-nh-ready", "1");
        resolve();
      };
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  async function loadPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    const mod = await import(PDFJS_URL);
    const lib = mod && (mod.default || mod);
    if (lib && lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    }
    window.pdfjsLib = lib;
    return lib;
  }

  function firstMatch(text, patterns) {
    for (let i = 0; i < patterns.length; i++) {
      const m = text.match(patterns[i]);
      if (m && m[1]) return String(m[1]).trim();
    }
    return "";
  }

  function cleanPhone(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    if (digits.length >= 10) return digits.slice(-10);
    return digits;
  }

  function guessName(text) {
    const lines = String(text)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i];
      if (/@|http|linkedin|github|resume|curriculum|objective|summary/i.test(line)) continue;
      if (/^\+?\d[\d\s\-()]{7,}$/.test(line)) continue;
      if (/^[A-Za-z][A-Za-z.\s'-]{2,48}$/.test(line) && line.split(/\s+/).length <= 5) {
        return line.replace(/\s+/g, " ").trim();
      }
    }
    return "";
  }

  function extractSkills(text) {
    const block = firstMatch(text, [
      /(?:skills|technical skills|core competencies|technologies)\s*[:\-]?\s*([\s\S]{3,600}?)(?=\n\s*\n|\n(?:experience|education|projects|certifications|languages)\b|$)/i,
    ]);
    if (!block) return [];
    return block
      .split(/[,|•·\n\/]/)
      .map((s) => s.replace(/^[\-\*\d.)\s]+/, "").trim())
      .filter((s) => s.length >= 2 && s.length <= 40)
      .filter((s) => !/^(and|or|with|using|skills?)$/i.test(s))
      .slice(0, 15);
  }

  function extractAbout(text) {
    const block = firstMatch(text, [
      /(?:summary|profile|about me|objective|professional summary)\s*[:\-]?\s*([\s\S]{20,1200}?)(?=\n\s*\n|\n(?:experience|education|skills|projects)\b|$)/i,
    ]);
    if (!block) return "";
    return block
      .replace(/^\s*[:\-]\s*/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  }

  function mapExperience(text) {
    const lower = text.toLowerCase();
    if (/\bfresher\b|\bno experience\b|\bfresh graduate\b/.test(lower)) return "1";
    const years = firstMatch(text, [
      /(\d{1,2})\+?\s*(?:\+|–|-|to)?\s*(?:\d{0,2})?\s*years?\s+(?:of\s+)?experience/i,
      /experience\s*[:\-]?\s*(\d{1,2})\+?\s*years?/i,
    ]);
    const n = parseInt(years, 10);
    if (!Number.isFinite(n)) return "";
    if (n < 1) return "1";
    if (n <= 2) return "2";
    if (n <= 4) return "3";
    if (n <= 6) return "4";
    if (n <= 10) return "5";
    return "6";
  }

  function mapGender(text) {
    if (/\bgender\s*[:\-]?\s*male\b|\bsex\s*[:\-]?\s*male\b/i.test(text)) return "1";
    if (/\bgender\s*[:\-]?\s*female\b|\bsex\s*[:\-]?\s*female\b/i.test(text)) return "2";
    return "";
  }

  function mapHighestQualification(text) {
    const lower = text.toLowerCase();
    if (/ph\.?\s*d|doctorate|doctoral/.test(lower)) return "Doctorate";
    if (/m\.?\s*tech|m\.?\s*e\.?\b|mba|m\.?\s*sc|m\.?\s*com|post[\s-]?graduate|master/.test(lower)) {
      return "Post Graduate";
    }
    if (/b\.?\s*tech|b\.?\s*e\.?\b|b\.?\s*sc|b\.?\s*com|b\.?\s*a\.?\b|under[\s-]?graduate|bachelor/.test(lower)) {
      return "Under Graduate";
    }
    if (/\bdiploma\b/.test(lower)) return "Diploma";
    if (/12th|hsc|higher secondary|\+2/.test(lower)) return "12th Standard";
    if (/10th|sslc|secondary/.test(lower)) return "10th Standard";
    return "";
  }

  function heuristicFields(text) {
    const email = firstMatch(text, [/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/]);
    const phone = cleanPhone(
      firstMatch(text, [
        /(?:phone|mobile|contact|tel)\s*[:\-]?\s*(\+?\d[\d\s\-()]{8,18})/i,
        /(\+91[\s\-.]?\d{10}|\b[6-9]\d{9}\b)/,
      ])
    );
    const dob = firstMatch(text, [
      /(?:dob|date of birth|born)\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
      /(?:dob|date of birth|born)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i,
    ]);
    let dobIso = "";
    if (dob) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        dobIso = dob;
      } else {
        const parts = dob.split(/[\/\-.]/);
        if (parts.length === 3) {
          let d = parts[0];
          let m = parts[1];
          let y = parts[2];
          if (y.length === 2) y = Number(y) > 50 ? "19" + y : "20" + y;
          if (d.length === 4) {
            dobIso = [d, m.padStart(2, "0"), y.padStart(2, "0")].join("-");
          } else {
            dobIso = [y, m.padStart(2, "0"), d.padStart(2, "0")].join("-");
          }
        }
      }
    }
    const address = firstMatch(text, [/(?:address|location)\s*[:\-]?\s*([^\n]{10,120})/i]);
    const fields = {
      Name: guessName(text),
      Email: email,
      Phoneno: phone.length === 10 ? phone : "",
      Dob: dobIso,
      Gender: mapGender(text),
      Experience: mapExperience(text),
      AboutYourSelf: extractAbout(text),
      Address: address,
      HighestQualification: mapHighestQualification(text),
      skills: extractSkills(text),
    };
    return fields;
  }

  async function extractPdfText(arrayBuffer) {
    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const parts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items || [])
        .map((item) => (item && item.str ? item.str : ""))
        .join(" ");
      parts.push(pageText);
    }
    return parts.join("\n").replace(/\s+\n/g, "\n").trim();
  }

  async function extractDocxText(arrayBuffer) {
    await loadScript(MAMMOTH_URL);
    if (!window.mammoth || typeof window.mammoth.extractRawText !== "function") {
      throw new Error("DOCX parser failed to load.");
    }
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return String((result && result.value) || "").trim();
  }

  async function parseResumeFile(file) {
    const name = String((file && file.name) || "").toLowerCase();
    if (!file) throw new Error("Please choose a resume file first.");
    if (name.endsWith(".doc") && !name.endsWith(".docx")) {
      throw new Error("Old .doc files are not supported. Please upload PDF or DOCX.");
    }
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      throw new Error("Please upload a PDF or DOCX resume.");
    }
    const buffer = await file.arrayBuffer();
    const text = name.endsWith(".pdf")
      ? await extractPdfText(buffer)
      : await extractDocxText(buffer);
    if (!text || text.length < 20) {
      throw new Error(
        "Could not read enough text from this resume. Try a text-based PDF or DOCX."
      );
    }
    const fields = heuristicFields(text);
    return {
      success: true,
      fields,
      meta: { chars: text.length, refined: false, filename: String(file.name || ""), client: true },
    };
  }

  window.NH_parseResumeClient = parseResumeFile;
})();
