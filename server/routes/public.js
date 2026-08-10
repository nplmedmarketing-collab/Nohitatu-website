const express = require("express");
const { VERTICALS, toPublicCareerDetail } = require("../db");

function slimCareer(c) {
  return {
    id: c.id,
    job_code: c.job_code,
    title: c.title,
    department: c.department,
    location: c.location,
    experience: c.experience,
    employment_type: c.employment_type,
    shift_timings: c.shift_timings,
    description: c.description,
    status: c.status,
    sort_order: c.sort_order,
    apply_url: c.apply_url,
    details_url: `Careerdetails.html?id=${encodeURIComponent(c.job_code)}`,
  };
}

function createPublicRouter({ store }) {
  const router = express.Router();

  router.get("/projects", (_req, res) => {
    const projects = store.list().map((p) => ({
      id: p.id,
      order: p.order,
      frame_id: p.frame_id,
      title: p.title,
      description: p.description,
      client: p.client,
      vertical: p.vertical,
      platform: p.platform,
      code: p.code,
      platform_long: p.platform_long,
      image: p.image,
      thumb: p.thumb || p.image,
      alt: p.alt || p.title,
      cta: p.cta || "Contact-us.html",
    }));
    res.set("Cache-Control", "public, max-age=30");
    res.json({ projects, verticals: VERTICALS, count: projects.length });
  });

  /** Open positions by default; ?status=all|closed|open */
  router.get("/careers", (req, res) => {
    const statusParam = String(req.query.status || "open")
      .toLowerCase()
      .trim();
    const status = statusParam === "all" || statusParam === "closed" ? statusParam : "open";
    const careers = store.listCareers({ status }).map(slimCareer);
    res.set("Cache-Control", "public, max-age=30");
    res.json({ careers, count: careers.length, status });
  });

  /** Single open career by id or job_code (includes detail body fields). */
  router.get("/careers/:idOrCode", (req, res) => {
    const key = String(req.params.idOrCode || "").trim();
    let career = null;
    if (/^\d+$/.test(key)) {
      career = store.getCareer(key) || store.getCareerByCode(key);
    } else {
      career = store.getCareerByCode(key);
    }
    if (!career || career.status !== "open") {
      return res.status(404).json({ error: "Not found" });
    }
    res.set("Cache-Control", "public, max-age=30");
    return res.json({
      career: {
        ...slimCareer(career),
        responsibilities: career.responsibilities,
        requirements: career.requirements,
        validation_type: career.validation_type,
        expire_date: career.expire_date,
        created_at: career.created_at,
        updated_at: career.updated_at,
        detail: toPublicCareerDetail(career),
      },
    });
  });

  return router;
}

module.exports = { createPublicRouter };
