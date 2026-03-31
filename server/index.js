// server/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const wikiRoutes = require('./routes/wikiRoutes'); 

// 1. Import your socket logic file
// (Ensure the path matches where you saved that file!)
const socketHandler = require('./socket/socketHandler'); 

const app = express();
// Fly sets PORT=8080 automatically. Locally we default to 3000.
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/wiki', wikiRoutes);

// Serve built frontend (single-service deploy)
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../client/dist');
  // Avoid stale SPAs: never cache the HTML shell; hashed Vite assets can cache long-term.
  app.use(
    express.static(clientDistPath, {
      etag: true,
      lastModified: true,
      setHeaders(res, filepath) {
        if (filepath.endsWith(`${path.sep}index.html`)) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return;
        }
        if (filepath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  // Express 5: use middleware for SPA fallback (app.get('*') throws)
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // In single-service deploy (same origin), allow the browser origin by default.
    // If you want to lock this down, set CLIENT_URL (or comma-separated list).
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

socketHandler(io); 

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});