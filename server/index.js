// server/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const wikiRoutes = require('./routes/wikiRoutes'); 

// 1. Import your socket logic file
// (Ensure the path matches where you saved that file!)
const socketHandler = require('./socket/socketHandler'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/wiki', wikiRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

socketHandler(io); 

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});