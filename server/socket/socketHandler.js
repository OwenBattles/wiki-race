const { fetchWikiHtml } = require('../controllers/wikiController');

// Store room state in memory
const rooms = {}; 

module.exports = (io) => {
  io.on('connection', (socket) => {

    // CREATE ROOM EVENT
    socket.on('create_room', ({ username }) => {
      const lobbyCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      // Safety check: rare collision
      if (rooms[lobbyCode]) {
          socket.emit('error', 'Room generation failed, try again');
          return;
      }

      rooms[lobbyCode] = [];
      
      // Join & Setup Host
      socket.join(lobbyCode);
      rooms[lobbyCode].push({ id: socket.id, username, isHost: true });
      
      console.log(`User ${username} created room: ${lobbyCode}`);
      
      // Send the new code back to the creator so they can share it
      socket.emit('room_created', lobbyCode); 
      io.to(lobbyCode).emit('update_player_list', rooms[lobbyCode]);
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

    // GET PLAYERS IN A LOBBY
    socket.on('request_player_list', (lobbyCode) => {
      const room = rooms[lobbyCode];
      if (room) {
          // Send the list ONLY to the person who asked
          socket.emit('update_player_list', room);
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

    // START GAME
    socket.on('start_game', async ({ lobbyCode, startPage, endPage }) => {
      const room = rooms[lobbyCode];
      if (!room) return;

      console.log(`Starting game in ${lobbyCode}: ${startPage} -> ${endPage}`);

      try {
          // CORRECT: Use the helper that returns a string
          const startHtml = await fetchWikiHtml(startPage);

          room.targetPage = endPage;
          room.startPage = startPage;
          room.gameState = "RACING";

          io.to(lobbyCode).emit('game_started', {
              startPage,
              endPage,
              initialHtml: startHtml // Send the raw HTML string
          });

      } catch (error) {
          console.error("Start Game Error:", error);
          socket.emit('error', "Could not load the starting page.");
      }
    });

    // HANDLE GAME WIN
    socket.on('game_won', (lobbyCode) => {
      const room = rooms[lobbyCode];
      if (room) {
          const index = room.findIndex(p => p.id === socket.id);
          const player = room[index].username;
          console.log(`${player} has won the game`)
          if (index !== -1) {
              room.splice(index, 1);
              io.to(lobbyCode).emit('game_over', room, player);
          }
      }
    })

    // HANDLE LEAVE GAME
    socket.on('leave_game', (roomCode) => {
      // Reuse your disconnect logic here, or just:
      const room = rooms[roomCode];
      if (room) {
          const index = room.findIndex(p => p.id === socket.id);
          if (index !== -1) {
              room.splice(index, 1);
              io.to(roomCode).emit('update_player_list', room);
          }
      }
    });

    // HANDLE DISCONNECT 
    socket.on('disconnect', () => {
      console.log(`User Disconnected: ${socket.id}`);

      for (const lobbyCode in rooms) {
        const room = rooms[lobbyCode];
        
        const playerIndex = room.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== -1) {
          const player = room[playerIndex];
          
          room.splice(playerIndex, 1);
          
          if (player.isHost && room.length > 0) {
              room[0].isHost = true; // Promote the next person
          }

          if (room.length === 0) {
              delete rooms[lobbyCode];
              console.log(`Room ${lobbyCode} deleted (empty)`);
          } else {
              io.to(lobbyCode).emit('update_player_list', room);
              console.log(`${player.username} left room ${lobbyCode}`);
          }
          
          break; 
        }
      }
    });
  });
};