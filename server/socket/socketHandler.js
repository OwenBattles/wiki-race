module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log(`User Connected: ${socket.id}`);
  
      // JOIN ROOM
      socket.on('join_room', (roomCode) => {
        socket.join(roomCode);
        console.log(`User ${socket.id} joined room: ${roomCode}`);
        
        // Optional: Broadcast to others in the room that someone joined
        // socket.to(roomCode).emit('user_joined', socket.id);
      });
  
      // GAME START (We will add this later)
      socket.on('start_game', (roomCode) => {
        console.log(`Game started in room: ${roomCode}`);
        io.in(roomCode).emit('game_started'); // Notify everyone in room
      });
  
      // DISCONNECT
      socket.on('disconnect', () => {
        console.log("User Disconnected", socket.id);
      });
    });
  };