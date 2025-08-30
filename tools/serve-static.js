const http = require('http');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const port = process.env.PORT || 5000;

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(publicDir, decodeURIComponent(reqPath));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA-like behavior
      const indexPath = path.join(publicDir, 'index.html');
      fs.readFile(indexPath, (e, data) => {
        if (e) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    fs.readFile(filePath, (e, data) => {
      if (e) {
        res.writeHead(500);
        res.end('error');
        return;
      }
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    });
  });
}).listen(port, () => console.log(`Static server running on http://localhost:${port}`));
