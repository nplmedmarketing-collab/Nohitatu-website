# Nohitatu site admin (internal)

Single super-admin CRUD for **portfolio projects** and **career positions**. Express serves the static site and APIs on one origin.

## Quick start

```bash
cd server
npm install
copy .env.example .env
```

Edit `.env` and set:

| Variable | Purpose |
|---|---|
| `ADMIN_USER` | Login username (default `admin`) |
| `ADMIN_PASSWORD` | Plain password **only used on first run** (then hashed into `data/admin-auth.json`) |
| `SESSION_SECRET` | Long random secret for session cookies |
| `PORT` | HTTP port (default `5173`) |
| `NODE_ENV` | Set `production` to require `Secure` cookies over HTTPS |

```bash
cd server
npm start
```

Open:

- Admin login: http://localhost:5173/adminlogin  
- Admin dashboard: http://localhost:5173/admin (redirects to login if unauthenticated)  
- Portfolio: http://localhost:5173/Portfolio.html  
- Careers: http://localhost:5173/Careers.html  
- Public APIs: `/api/projects`, `/api/careers`  

You should see a page titled **Nohitatu Admin Login** with username/password — not the marketing homepage.

Use the same origin (do not open HTML via `file://` if you need live data).

## GitHub Pages admin

GitHub Pages is static-only — `/api/admin/*` will not exist there. The live admin UI at
`https://…github.io/…/admin/` talks to the Node API host instead:

1. Deploy this repo’s Express app on Render (see below). Service name must be `nohitatu-website-admin`.
2. On `*.github.io`, `admin/admin.js` defaults API base to `https://nohitatu-website-admin.onrender.com`.
3. Override with `<meta name="nh-admin-api" content="https://your-api.example">` or `window.NH_ADMIN_API`.
4. Server must allow the Pages origin via `ADMIN_CORS_ORIGINS` (set in `render.yaml`).

Local Express (`cd server && npm start`) still uses same-origin `/api` with no override.

### Deploy admin API on Render (required)

A probe of `https://nohitatu-website-admin.onrender.com` returning **404** with header
`x-render-routing: no-server` means **no Web Service exists yet** — not a code bug and not
free-tier sleep. Create the service once:

1. Open [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
2. Connect GitHub repo `nplmedmarketing-collab/Nohitatu-website` (branch `main`).
3. Render reads root `render.yaml` and proposes service **`nohitatu-website-admin`**.
4. When prompted for secrets (or **Environment** after create), set values that are **not** stored in git:
   - `ADMIN_PASSWORD` — **required** (`sync: false` in `render.yaml`). Paste your chosen password in the Render Dashboard only; first boot hashes it into `data/admin-auth.json`. Do not put this value in the repo.
   - `SESSION_SECRET` — Blueprint can auto-generate (`generateValue`); or paste a long random string (≥32 chars)
   - Confirm `ADMIN_CORS_ORIGINS=https://nplmedmarketing-collab.github.io`
   - Confirm `NODE_ENV=production`, `ADMIN_USER=admin` (username is already set in `render.yaml`)
5. Apply / create. Wait until status is **Live**.
6. Verify: `https://nohitatu-website-admin.onrender.com/api/health` → `{"ok":true,...}`
7. Login from Pages admin; first free-tier hit after idle may take ~30–60s to wake.

**Manual alternative (no Blueprint):** New → Web Service → same repo → Root Directory empty →
Build `cd server && npm install` → Start `cd server && npm start` → name exactly
`nohitatu-website-admin` → free plan → same env vars → health check `/api/health`.

If the public URL differs (custom name), update `DEFAULT_PAGES_API` in `admin/admin.js` or set
`<meta name="nh-admin-api" …>` and redeploy Pages.

## If `/adminlogin` shows the homepage

**Root cause is almost always the wrong process on port 5173**, not Express route order.

| Process | How started | What `/adminlogin` does |
|---|---|---|
| **Express admin** (correct) | `cd server && npm start` | Serves `admin/index.html` login form + `/api/admin/*` |
| **Vite** (wrong for admin) | root `npm run dev` | Falls through to marketing `index.html` (Vite default 5173) |
| **Other project** | another app’s Vite/Webpack | Unrelated homepage |

Vite’s default port is **5173** — same as this server’s default `PORT`. Only one process can bind the port.

**Fix:**

1. Check what owns 5173 (Windows): `netstat -ano | findstr :5173` then look up the PID (Vite command lines look like `…\vite\bin\vite.js`).
2. Stop that process (Ctrl+C in its terminal, or `taskkill /PID <pid> /F`).
3. Start Express only: `cd server && npm start`
4. Confirm the console prints `Admin login: http://localhost:5173/adminlogin` and the listener is `node server/index.js` (not Vite).
5. Hard-refresh the browser.

Optional: set `PORT=5174` in `server/.env` and open `http://localhost:5174/adminlogin` if something else must keep 5173.

**Do not use** root `npm run dev` for admin. That is frontend-only Vite and does not run the login API.
## Reset admin password

1. Stop the server  
2. Delete `data/admin-auth.json`  
3. Set a new `ADMIN_PASSWORD` in `server/.env`  
4. Start again (password is re-hashed on first boot)

## Storage

- Prefer **SQLite** via `better-sqlite3` → `data/projects.db` (tables: `projects`, `careers`)  
- If native install fails, falls back to **JSON** → `data/projects.json` + `data/careers.json`  
- Project seed: `data/seed/projects.json`  
- Careers seed: `data/seed/careers.json` (6 roles from `Careers.html` + `js/career-details.js`)  
- Uploads: `uploads/portfolio/` (served at `/uploads/portfolio/...`)

## Career fields

| Field | Notes |
|---|---|
| `title` | Role name |
| `job_code` | Public code used in URLs (`Careerdetails.html?id=…`) |
| `department` | Optional |
| `location` | e.g. Chennai |
| `experience` | e.g. Fresher, 1-2 Years |
| `employment_type` | full-time / part-time / contract / remote / internship |
| `shift_timings` | Optional (shown on listing cards when set) |
| `description` | Optional short blurb |
| `responsibilities` | HTML or plain (detail page) |
| `requirements` | Must-have skills (HTML or plain) |
| `status` | `open` (public) or `closed` (hidden on site) |
| `sort_order` | Listing order |
| `apply_url` | Defaults to `PostResume.html?id={job_code}` |
| `created_at` / `updated_at` | ISO timestamps |

## Security notes

- No public signup — one admin user  
- Password stored with bcrypt  
- Session cookie: `httpOnly`, `sameSite=lax`, `secure` when `NODE_ENV=production`  
- CSRF token required on mutating admin requests  
- Same-origin checks on mutating methods  
- Login rate-limited  
- `/data` and `server/` are not world-readable over HTTP  
- Never commit `.env` or `data/admin-auth.json`

## Admin API (authenticated)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/csrf` | CSRF token |
| POST | `/api/admin/login` | `{ username, password }` |
| POST | `/api/admin/logout` | |
| GET | `/api/admin/me` | session check |
| GET | `/api/admin/projects` | list |
| POST | `/api/admin/projects` | create (multipart or JSON fields) |
| PUT | `/api/admin/projects/:id` | update |
| DELETE | `/api/admin/projects/:id` | remove |
| GET | `/api/admin/careers` | list all positions |
| POST | `/api/admin/careers` | create |
| PATCH | `/api/admin/careers/:id` | update |
| DELETE | `/api/admin/careers/:id` | remove |

Public (no auth):

- `GET /api/projects`  
- `GET /api/careers` — open positions only (or `?status=all|closed`)  
- `GET /api/careers/:idOrCode` — one open position with full detail  

## Re-seed

```bash
cd server
node scripts/extract-seed.cjs
node scripts/extract-careers-seed.cjs
```

Then, only when the store is empty (or after deleting DB/JSON career data), restart to re-import seed:

- Delete `data/projects.db` and/or `data/projects.json` for projects  
- For careers alone: clear the `careers` table, or delete `data/careers.json`, or wipe the DB  
