import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  // Relative base keeps assets working on GH project pages (/Nohitatu-website/) and root custom domains.
  base: './',
  optimizeDeps: {
    entries: ['index.html']
  },
  server: {
    fs: {
      allow: ['.']
    }
  },
  plugins: [
    {
      name: 'serve-videos-folder',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/videos/')) {
            const relativePath = req.url.replace('/videos/', '');
            const projectVideoPath = path.join(process.cwd(), 'videos', relativePath);
            if (fs.existsSync(projectVideoPath)) {
              res.setHeader('Content-Type', 'video/mp4');
              return fs.createReadStream(projectVideoPath).pipe(res);
            }
          }
          next();
        });
      }
    },
    {
      // Vite dev (npm run dev) is NOT the Express admin server.
      // Without this, unknown paths like /adminlogin fall through to the marketing index.html.
      name: 'adminlogin-is-not-vite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const raw = (req.url || '').split('?')[0];
          const p = raw.replace(/\/+$/, '') || '/';
          if (p === '/adminlogin' || p === '/admin' || p.startsWith('/api/admin')) {
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Wrong server — use Express admin</title>
</head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;line-height:1.5;background:#0b1220;color:#e8eefc">
  <p style="letter-spacing:.08em;font-size:.75rem;color:#6bb0ff;font-weight:700">NH-ADMIN · WRONG SERVER</p>
  <h1 style="margin-top:.5rem">Admin is not served by Vite</h1>
  <p>You opened <code style="color:#6bb0ff">${p}</code> on the <strong>Vite</strong> dev server (often port 5173 via <code>npm run dev</code>).</p>
  <p>That process shows the marketing site and does <em>not</em> host the admin login API.</p>
  <ol>
    <li>Stop Vite (Ctrl+C in that terminal) or free port 5173.</li>
    <li>Run: <code style="color:#6bb0ff">cd server &amp;&amp; npm start</code></li>
    <li>Open: <a style="color:#6bb0ff" href="http://localhost:5173/adminlogin">http://localhost:5173/adminlogin</a></li>
  </ol>
  <p>You should see <strong>Nohitatu Admin Login</strong> with a username/password form — not the public homepage.</p>
</body>
</html>`;
            const body = Buffer.from(html, 'utf8');
            res.statusCode = 503;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Length', String(body.length));
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('X-Nohitatu-Wrong-Server', 'vite');
            res.end(body);
            return;
          }
          next();
        });
      }
    }
  ]
});
