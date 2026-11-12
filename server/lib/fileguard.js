/**
 * FileGuard — Server-side upload security & malware signature validator.
 *
 * Enforces:
 * 1. Filename hygiene: blocks null bytes, path traversal, and dangerous double extensions
 *    (e.g. `resume.php.pdf`, `photo.jpg.exe`).
 * 2. True binary magic-byte verification (PDF, DOCX, DOC, PNG, JPEG, GIF, WebP, BMP, SVG).
 * 3. Executable / web-shell / script payload blocking (PE `MZ`, ELF, Mach-O, shebangs,
 *    `<?php`, `<script`, VBA macros `vbaProject.bin`, and risky PDF `/Launch` or `/JavaScript` actions).
 */

const fs = require("fs");
const path = require("path");

const DANGEROUS_MID_EXT_RE =
  /\.(php\d*|phtml|phar|exe|dll|bat|cmd|sh|bash|ps1|vbs|vbe|js|jse|wsf|wsh|msc|scr|msi|com|cpl|hta|jar|py|pl|rb|cgi|asp|aspx|jsp|jspx|war|htaccess|svg|html|htm|xhtml|docm|xlsm|pptm)(?=\.)/i;

const MALICIOUS_PAYLOAD_RE =
  /<\?php|<\?=|<script[\s>]|javascript\s*:|vbscript\s*:|onload\s*=|onerror\s*=|eval\s*\(\s*base64_decode|shell_exec\s*\(|passthru\s*\(|system\s*\(\s*\$|powershell(?:\.exe)?\s+-(?:e|enc|encodedcommand)/i;

const PDF_DANGEROUS_ACTION_RE =
  /\/(?:Launch|JavaScript|JS|RichMedia|AA|OpenAction)\b[\s\S]{0,120}(?:\/(?:S\s*\/Launch|JS|JavaScript)|cmd\.exe|powershell|\/F\s*\()/i;

function startsWithBytes(buf, bytes, offset = 0) {
  if (!Buffer.isBuffer(buf) || buf.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buf[offset + i] !== bytes[i]) return false;
  }
  return true;
}

function isExecutableHeader(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return false;
  // Windows PE/MZ executable (4D 5A)
  if (buf[0] === 0x4d && buf[1] === 0x5a) return true;
  // Linux ELF binary (7F 45 4C 46)
  if (startsWithBytes(buf, [0x7f, 0x45, 0x4c, 0x46])) return true;
  // Mach-O binaries
  if (
    startsWithBytes(buf, [0xfe, 0xed, 0xfa, 0xce]) ||
    startsWithBytes(buf, [0xfe, 0xed, 0xfa, 0xcf]) ||
    startsWithBytes(buf, [0xce, 0xfa, 0xed, 0xfe]) ||
    startsWithBytes(buf, [0xcf, 0xfa, 0xed, 0xfe])
  ) {
    return true;
  }
  // Shell script shebang (#!)
  if (buf[0] === 0x23 && buf[1] === 0x21) return true;
  return false;
}

function validateFilename(filename) {
  const raw = String(filename || "").trim();
  if (!raw) {
    return { ok: false, reason: "Missing filename." };
  }
  if (raw.includes("\0") || raw.includes("%00")) {
    return { ok: false, reason: "File rejected by FileGuard: invalid null-byte in filename." };
  }
  const base = path.basename(raw);
  if (DANGEROUS_MID_EXT_RE.test(base)) {
    return {
      ok: false,
      reason: "File rejected by FileGuard: suspicious double extension detected.",
    };
  }
  return { ok: true };
}

function sampleAscii(buf, maxBytes = 262144) {
  if (!Buffer.isBuffer(buf)) return "";
  const slice = buf.subarray(0, Math.min(buf.length, maxBytes));
  return slice.toString("latin1");
}

/**
 * Inspect a resume buffer (.pdf, .docx, .doc) for valid magic bytes and absence of malware/macros.
 */
function inspectResumeBuffer(buffer, filename) {
  const nameCheck = validateFilename(filename);
  if (!nameCheck.ok) return nameCheck;

  if (!Buffer.isBuffer(buffer) || buffer.length < 8) {
    return { ok: false, reason: "File rejected by FileGuard: file is empty or corrupted." };
  }

  if (isExecutableHeader(buffer)) {
    return {
      ok: false,
      reason: "File rejected by FileGuard: executable binary disguised as a document.",
    };
  }

  const ext = path.extname(String(filename || "")).toLowerCase();
  const headSample = sampleAscii(buffer, 524288);

  if (MALICIOUS_PAYLOAD_RE.test(headSample)) {
    return {
      ok: false,
      reason: "File rejected by FileGuard: embedded script or web-shell signature detected.",
    };
  }

  if (ext === ".pdf") {
    // Allow %PDF- within the first 1024 bytes (some PDFs have a tiny leading header)
    const firstKb = buffer.subarray(0, Math.min(buffer.length, 1024)).toString("latin1");
    if (!firstKb.includes("%PDF-")) {
      return {
        ok: false,
        reason: "File rejected by FileGuard: file does not have a valid PDF signature.",
      };
    }
    if (PDF_DANGEROUS_ACTION_RE.test(headSample)) {
      return {
        ok: false,
        reason: "File rejected by FileGuard: PDF contains embedded active scripts or launch actions.",
      };
    }
    return { ok: true, format: "pdf" };
  }

  if (ext === ".docx") {
    // DOCX is a PKZIP archive (50 4B 03 04)
    if (!startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04])) {
      return {
        ok: false,
        reason: "File rejected by FileGuard: file does not have a valid DOCX signature.",
      };
    }
    if (/vbaProject\.bin/i.test(headSample)) {
      return {
        ok: false,
        reason: "File rejected by FileGuard: macro-enabled Word documents (VBA) are not permitted.",
      };
    }
    return { ok: true, format: "docx" };
  }

  if (ext === ".doc") {
    // Legacy Word OLE2 Compound Document (D0 CF 11 E0 A1 B1 1A E1)
    if (!startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
      return {
        ok: false,
        reason: "File rejected by FileGuard: file does not have a valid Word (.doc) signature.",
      };
    }
    return { ok: true, format: "doc" };
  }

  return {
    ok: false,
    reason: "File rejected by FileGuard: unsupported resume file format.",
  };
}

/**
 * Inspect an image buffer (.jpg, .jpeg, .png, .webp, .gif, .bmp, .svg) for valid magic bytes
 * and absence of embedded scripts / polyglot web shells.
 */
function inspectImageBuffer(buffer, filename) {
  const nameCheck = validateFilename(filename);
  if (!nameCheck.ok) return nameCheck;

  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return { ok: false, reason: "File rejected by FileGuard: image file is empty or corrupted." };
  }

  if (isExecutableHeader(buffer)) {
    return {
      ok: false,
      reason: "File rejected by FileGuard: executable file disguised as an image.",
    };
  }

  const ext = path.extname(String(filename || "")).toLowerCase();
  const headSample = sampleAscii(buffer, 262144);

  if (MALICIOUS_PAYLOAD_RE.test(headSample)) {
    return {
      ok: false,
      reason: "File rejected by FileGuard: image contains embedded script or malicious payload.",
    };
  }

  const isJpeg = startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
  const isPng = startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const isGif =
    startsWithBytes(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWithBytes(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  const isWebp =
    startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWithBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8);
  const isBmp = startsWithBytes(buffer, [0x42, 0x4d]);

  if (ext === ".svg") {
    const trimmed = headSample.trimStart();
    if (!/^<(?:svg|\?xml|!DOCTYPE\s+svg)/i.test(trimmed)) {
      return { ok: false, reason: "File rejected by FileGuard: invalid SVG structure." };
    }
    if (/<script\b|on[a-z]+\s*=|javascript\s*:|foreignObject\b/i.test(headSample)) {
      return {
        ok: false,
        reason: "File rejected by FileGuard: SVG contains active scripts or event handlers.",
      };
    }
    return { ok: true, format: "svg" };
  }

  if (!isJpeg && !isPng && !isGif && !isWebp && !isBmp) {
    return {
      ok: false,
      reason: "File rejected by FileGuard: file header does not match a valid image format.",
    };
  }

  return { ok: true };
}

/**
 * Inspect a disk-stored multer file (`file.path`) and automatically delete it if unsafe.
 */
function inspectDiskImageFile(file) {
  if (!file || !file.path) return { ok: true };
  try {
    const buf = fs.readFileSync(file.path);
    const res = inspectImageBuffer(buf, file.originalname || file.filename);
    if (!res.ok) {
      try {
        fs.unlinkSync(file.path);
      } catch (_e) {}
    }
    return res;
  } catch (err) {
    try {
      fs.unlinkSync(file.path);
    } catch (_e) {}
    return { ok: false, reason: "File rejected by FileGuard: could not verify uploaded file." };
  }
}

module.exports = {
  validateFilename,
  inspectResumeBuffer,
  inspectImageBuffer,
  inspectDiskImageFile,
};
