// Local development static HTTP server (zero external dependencies)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // Default to index.html for root
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, pathname);

  // Security: prevent path traversal outside project root
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If file not found, try appending .html
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath)) {
        serveFile(htmlPath, '.html', res);
        return;
      }

      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title><style>body{font-family:sans-serif;text-align:center;padding:50px;color:#1e293b;}</style></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>Requested path: <code>${pathname}</code></p>
          <p><a href="/">Return to Home Page</a> | <a href="/admin.html">Admin Dashboard</a></p>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    serveFile(filePath, ext, res);
  });
});

function serveFile(filePath, ext, res) {
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    res.statusCode = 500;
    res.end('Server Error: ' + err.message);
  });
  stream.pipe(res);
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Smart College Navigation & Management Server Running!`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Home Page: http://localhost:${PORT}/index.html`);
  console.log(`Admin Portal: http://localhost:${PORT}/admin.html`);
  console.log(`Login: http://localhost:${PORT}/login.html`);
  console.log(`=======================================================`);
});
