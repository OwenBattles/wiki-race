const { fetchWikiHtml } = require('../controllers/wikiController');
const { use } = require('../routes/wikiRoutes');

// Store room state in memory
const rooms = {};
// room: { 
//   players: [], 
//   gameState: "", // LOBBY, PLAYING, FINISHED
//   startPage: "", 
//   targetPage: "",
//   powerUpsEnabled: bool, // default false
// }

// player: { 
//   id: "", 
//   username: "", 
//   isHost: bool, 
//   isPlaying: bool, 
//   path : [], 
//   wins: int, 
//   powerUps: {}
//   currentPage: ""
// }

// powerUps : {
//   swap : int, // default 0
//   scramble : int, // default 0
//   freeze : int, // default 0
// }

module.exports = (io) => {
  io.on('connection', (socket) => {

    // CREATE ROOM EVENT
    socket.on('create_room', ({ username }) => {
      const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      
      // Safety check: rare collision
      if (rooms[roomCode]) {
          socket.emit('error', 'Room generation failed, try again');
          return;
      }

      rooms[roomCode] = [];
      
      // Join & Setup Host
      socket.join(roomCode);
      const player = { 
        id: socket.id, 
        username: username, 
        isHost: true, 
        isPlaying: false, 
        path: [], 
        wins: 0, 
        powerUps: {}, 
        currentPageTitle: "" 
      };
      rooms[roomCode].push(player);
      
      console.log(`User ${username} created room: ${roomCode}`);
      
      // Send the new code back to the creator so they can share it
      socket.emit('room_created', roomCode); 
      io.to(roomCode).emit('update_player_list', rooms[roomCode]);
    });

    // CHECK IF LOBBY CODE IS VALID
    socket.on('find_room', (lobbyCode) => {
      if (rooms[lobbyCode]) {
        socket.emit('found_room', true);
      } else {
        socket.emit('found_room', false);
      }
    });

    // NOT BEING USED FOR NOW
    // CHECK IF USERNAME IS UNIQUE
    socket.on('check_username', (roomCode, username) => {
      if (!rooms[roomCode]) {
         return; 
      }

      if (username.length < 4) {
         socket.emit('username_check_result', { found: true, message: "Username is too short" });
         return; 
      }

      const isTaken = rooms[roomCode].some(player => player.username === username);

      if (isTaken) {
        socket.emit('username_check_result', { found: true, message: "Username already taken" });
      } else {
        socket.emit('username_check_result', { found: false, message: "Username available" });
      }
    });

    // JOIN LOBBY
    socket.on('join_room', ({ roomCode, username }) => {
      console.log("made it to backend")
      const room = rooms[roomCode];
      
      if (room) {
        socket.join(roomCode);
        const player = { 
          id: socket.id, 
          username: username, 
          isHost: false, 
          isPlaying: false, 
          path: [], 
          wins: 0, 
          powerUps: {}, 
          currentPageTitle: "" 
        };

        console.log(`${username} join room ${roomCode}`);

        room.push(player);
        
        io.to(roomCode).emit('update_player_list', room);
        
      } else {
        socket.emit('error', "Cannot join lobby: Room not found");
      } 
    });

    // GET PLAYERS IN A LOBBY
    socket.on('request_player_list', (roomCode) => {
      const room = rooms[roomCode];
      if (room) {
          // Send the list ONLY to the person who asked
          socket.emit('update_player_list', room);
      }
  });

    

    // START GAME
    socket.on('start_game', async ({ roomCode, startPage, endPage }) => {
      const room = rooms[roomCode];
      if (!room) return;

      console.log(`Starting game in ${roomCode}: ${startPage} -> ${endPage}`);

      try {
          // CORRECT: Use the helper that returns a string
          const startHtml = await fetchWikiHtml(startPage);

          room.targetPage = endPage;
          room.startPage = startPage;
          room.gameState = "RACING";

          io.to(roomCode).emit('game_started', {
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
    socket.on('game_won', (roomCode) => {
      const room = rooms[roomCode];
      if (room) {
          const index = room.findIndex(p => p.id === socket.id);
          const player = room[index].username;
          console.log(`${player} has won the game`)
          if (index !== -1) {
              room.splice(index, 1);
              io.to(roomCode).emit('game_over', { player });
          }
      }
    })

    // HANDLE RETURN TO LOBBY
    socket.on('navigate_to_lobby', (roomCode) => {
      const room = rooms[roomCode];
      if (!room) return;
    
      room.gameState = "LOBBY";
      room.startPage = "";
      room.targetPage = "";
    
      io.to(roomCode).emit('return_to_lobby');
    });

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

      for (const roomCode in rooms) {
        const room = rooms[roomCode];
        
        const playerIndex = room.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== -1) {
          const player = room[playerIndex];
          
          room.splice(playerIndex, 1);
          
          if (player.isHost && room.length > 0) {
              room[0].isHost = true; // Promote the next person
          }

          if (room.length === 0) {
              delete rooms[roomCode];
              console.log(`Room ${roomCode} deleted (empty)`);
          } else {
              io.to(roomCode).emit('update_player_list', room);
              console.log(`${player.username} left room ${roomCode}`);
          }
          
          break; 
        }
      }
    });
  });
};