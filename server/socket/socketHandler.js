// Store room state in memory
const rooms = {}; 

module.exports = (io) => {
  io.on('connection', (socket) => {

    // CREATE ROOM EVENT
    socket.on('create_room', ({ username }) => {
      const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      // Safety check: rare collision
      if (rooms[roomCode]) {
          socket.emit('error', 'Room generation failed, try again');
          return;
      }

      rooms[roomCode] = [];
      
      // Join & Setup Host
      socket.join(roomCode);
      rooms[roomCode].push({ id: socket.id, username, isHost: true });
      
      console.log(`User ${username} created room: ${roomCode}`);
      
      // Send the new code back to the creator so they can share it
      socket.emit('room_created', roomCode); 
      io.to(roomCode).emit('update_player_list', rooms[roomCode]);
    });

    // CHECK IF LOBBY CODE IS VALID
    socket.on('find_lobby', (lobbyCode) => {
      if (rooms[lobbyCode]) {
        socket.emit('lobby_check_result', { found: true, message: "Lobby found" });
      } else {
        socket.emit('lobby_check_result', { found: false, message: "Lobby not found" });
      }
    });

    // CHECK IF USERNAME IS UNIQUE
    socket.on('check_username', (lobbyCode, username) => {
      if (!rooms[lobbyCode]) {
         return; 
      }

      if (username.length < 4) {
         socket.emit('username_check_result', { found: true, message: "Username is too short" });
         return; 
      }

      const isTaken = rooms[lobbyCode].some(player => player.username === username);

      if (isTaken) {
        socket.emit('username_check_result', { found: true, message: "Username already taken" });
      } else {
        socket.emit('username_check_result', { found: false, message: "Username available" });
      }
    });

    // JOIN LOBBY
    socket.on('join_lobby', ({ lobbyCode, username }) => {
      console.log("Attempting join:", lobbyCode);
      console.log("Current active rooms:", Object.keys(rooms));
      const room = rooms[lobbyCode];
      
      if (room) {
        socket.join(lobbyCode);
        room.push({ id: socket.id, username, isHost: false });
        
        socket.emit('join_success', lobbyCode);
        io.to(lobbyCode).emit('update_player_list', room);
        
      } else {
        socket.emit('error', "Cannot join lobby: Room not found");
      }
    });
  });
};