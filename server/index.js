// server/index.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const wikiRoutes = require('./routes/wikiRoutes'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/wiki', wikiRoutes);

const server = http.createServer(app);
const socketHandler = require('./socket/socketHandler');

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);
  
  socket.on('join_room', (data) => {
    socket.join(data);
    console.log(`User ${socket.id} joined room: ${data}`);
  });
});

socketHandler(io);

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});