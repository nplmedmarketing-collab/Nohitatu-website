import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
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
    }
  ]
});
