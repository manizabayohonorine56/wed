const http = require('http');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const portArg = parseInt(process.argv[2], 10);
const port = Number.isInteger(portArg) ? portArg : (process.env.PORT ? parseInt(process.env.PORT,10) : 5050);

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(publicDir, decodeURIComponent(reqPath));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
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
});

server.listen(port, '127.0.0.1', () => console.log(`Static server running on http://127.0.0.1:${port}`));

server.on('error', (err) => {
  console.error('Server error', err.message);
  process.exit(1);
});
