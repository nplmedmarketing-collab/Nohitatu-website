/**
 * Verify a Google reCAPTCHA v3 response token server-side.
 * Requires RECAPTCHA_SECRET_KEY in the environment.
 */

const DEFAULT_MIN_SCORE = 0.5;
const EXPECTED_ACTION = "contact";

async function verifyRecaptchaToken(token, remoteip) {
  const secret = String(process.env.RECAPTCHA_SECRET_KEY || "").trim();
  if (!secret) {
    return { ok: true, skipped: true, score: null };
  }

  const trimmed = String(token || "").trim();
  if (!trimmed) {
    return { ok: false, skipped: false, error: "missing-input-response" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", trimmed);
  if (remoteip) body.set("remoteip", String(remoteip));

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    return { ok: false, skipped: false, error: "siteverify-http-" + response.status };
  }

  const data = await response.json();
  if (!data || data.success !== true) {
    const codes = Array.isArray(data && data["error-codes"]) ? data["error-codes"] : [];
    return {
      ok: false,
      skipped: false,
      error: codes.join(",") || "verification-failed",
      score: typeof data.score === "number" ? data.score : null,
    };
  }

  const score = typeof data.score === "number" ? data.score : null;
  const action = String(data.action || "");
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || DEFAULT_MIN_SCORE);

  // v3 always returns score + action; reject low-score / wrong-action traffic.
  if (score !== null && score < minScore) {
    return { ok: false, skipped: false, error: "low-score", score, action };
  }
  if (action && action !== EXPECTED_ACTION) {
    return { ok: false, skipped: false, error: "bad-action", score, action };
  }

  return {
    ok: true,
    skipped: false,
    score,
    action: action || null,
  };
}

module.exports = { verifyRecaptchaToken };
