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
