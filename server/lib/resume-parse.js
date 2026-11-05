/**
 * Extract text from a resume (PDF / DOCX) and map common application fields.
 * Optional: if OPENAI_API_KEY is set, refine the mapping with a small JSON prompt.
 */
const mammoth = require("mammoth");

async function extractPdfText(buffer) {
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return String((result && result.text) || "").trim();
  } finally {
    if (parser && typeof parser.destroy === "function") {
      try {
        await parser.destroy();
      } catch (_) {
        /* ignore */
      }
    }
  }
}

async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return String((result && result.value) || "").trim();
}

async function extractText(buffer, filename) {
  const name = String(filename || "").toLowerCase();
  if (name.endsWith(".pdf")) return extractPdfText(buffer);
  if (name.endsWith(".docx")) return extractDocxText(buffer);
  if (name.endsWith(".doc")) {
    const err = new Error(
      "Old .doc Word files are not supported for auto-fill. Please upload PDF or DOCX."
    );
    err.code = "unsupported-format";
    throw err;
  }
  const err = new Error("Please upload a PDF or DOCX resume.");
  err.code = "unsupported-format";
  throw err;
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
    if (/@|http|linkedin|github|resume|curriculum|objective|summary/i.test(line)) {
      continue;
    }
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
  const email = firstMatch(text, [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
  ]);
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
          // yyyy-mm-dd already handled; yyyy/mm/dd
          dobIso = [d, m.padStart(2, "0"), y.padStart(2, "0")].join("-");
        } else {
          dobIso = [y, m.padStart(2, "0"), d.padStart(2, "0")].join("-");
        }
      }
    }
  }

  const address = firstMatch(text, [
    /(?:address|location)\s*[:\-]?\s*([^\n]{10,120})/i,
  ]);

  return {
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
}

async function refineWithOpenAI(text, baseFields) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return baseFields;

  const excerpt = String(text || "").slice(0, 12000);
  const prompt = {
    model: process.env.OPENAI_RESUME_MODEL || "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract job-application fields from a resume. Return JSON only with keys: Name, Email, Phoneno (10-digit India mobile if possible), Dob (YYYY-MM-DD or empty), Gender (Male/Female/Others or empty), ExperienceYears (number or empty), AboutYourSelf, Address, HighestQualification (one of: 10th Standard, 12th Standard, Diploma, Under Graduate, Post Graduate, Doctorate or empty), skills (string array). Leave unknown values as empty string or [].",
      },
      {
        role: "user",
        content: excerpt,
      },
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prompt),
  });
  if (!res.ok) {
    console.warn("OpenAI resume refine failed:", res.status);
    return baseFields;
  }
  const data = await res.json();
  const raw = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : "";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    return baseFields;
  }

  const genderMap = { Male: "1", Female: "2", Others: "3" };
  const years = parseInt(parsed.ExperienceYears, 10);
  let experience = baseFields.Experience;
  if (Number.isFinite(years)) {
    if (years < 1) experience = "1";
    else if (years <= 2) experience = "2";
    else if (years <= 4) experience = "3";
    else if (years <= 6) experience = "4";
    else if (years <= 10) experience = "5";
    else experience = "6";
  }

  return {
    Name: String(parsed.Name || baseFields.Name || "").trim(),
    Email: String(parsed.Email || baseFields.Email || "").trim(),
    Phoneno: cleanPhone(parsed.Phoneno || baseFields.Phoneno),
    Dob: String(parsed.Dob || baseFields.Dob || "").trim(),
    Gender: genderMap[parsed.Gender] || baseFields.Gender || "",
    Experience: experience,
    AboutYourSelf: String(parsed.AboutYourSelf || baseFields.AboutYourSelf || "")
      .trim()
      .slice(0, 6000),
    Address: String(parsed.Address || baseFields.Address || "").trim(),
    HighestQualification:
      String(parsed.HighestQualification || baseFields.HighestQualification || "").trim(),
    skills: Array.isArray(parsed.skills) && parsed.skills.length
      ? parsed.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 15)
      : baseFields.skills || [],
  };
}

async function parseResumeBuffer(buffer, filename) {
  const text = await extractText(buffer, filename);
  if (!text || text.length < 20) {
    const err = new Error(
      "Could not read enough text from this resume. Try a text-based PDF or DOCX."
    );
    err.code = "empty-text";
    throw err;
  }
  const base = heuristicFields(text);
  const fields = await refineWithOpenAI(text, base);
  if (fields.Phoneno && fields.Phoneno.length !== 10) fields.Phoneno = "";
  return {
    fields,
    meta: {
      chars: text.length,
      refined: !!process.env.OPENAI_API_KEY,
      filename: String(filename || ""),
    },
  };
}

module.exports = { parseResumeBuffer, extractText, heuristicFields };
