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

      rooms[roomCode] = {
        players: [],
        gameState: "LOBBY",
        startPage: "",
        targetPage: "",
        totalTime: 0,
        powerUpsEnabled: false,
      };
      
      // Join & Setup Host
      socket.join(roomCode);
      rooms[roomCode].players.push({ 
        id: socket.id, 
        username: username, 
        isHost: true, 
        isPlaying: false, 
        path: [], 
        wins: 0, 
        powerUps: {}, 
        currentPageTitle: "" 
      });
      
      console.log(`User ${username} created room: ${roomCode}`);
      
      // Send the new code back to the creator so they can share it
      socket.emit('room_created', roomCode); 
      io.to(roomCode).emit('update_player_list', rooms[roomCode].players);
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

      if (username.length < 1) {
         socket.emit('username_check_result', { found: true, message: "Username is too short" });
         return; 
      }

      const isTaken = rooms[roomCode].players.some(player => player.username === username);

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
        rooms[roomCode].players.push({ 
          id: socket.id, 
          username: username, 
          isHost: false, 
          isPlaying: false, 
          path: [], 
          wins: 0, 
          powerUps: {}, 
          currentPageTitle: "" 
        });

        console.log(`${username} join room ${roomCode}`);
        
        io.to(roomCode).emit('update_player_list', room.players);
        io.to(roomCode).emit('joined_room', room.startPage, room.targetPage, room.powerUpsEnabled);
        
      } else {
        socket.emit('error', "Cannot join lobby: Room not found");
      } 
    });

    // SET THE STARTING PAGE
    socket.on('set_start_page', ({ roomCode, startPage }) => {
      rooms[roomCode].startPage = startPage;
      io.to(roomCode).emit('start_page', startPage);
    })

    // SET THE TARGET PAGE
    socket.on('set_target_page', ({ roomCode, targetPage }) => {
      rooms[roomCode].targetPage = targetPage;
      io.to(roomCode).emit('target_page', targetPage);
    })

    // START GAME
    socket.on('start_game', async ({ roomCode }) => {
      const room = rooms[roomCode];
      console.log("room", room.startPage, room.targetPage);
      if (!room || !room.startPage || !room.targetPage) return;

      try {
          console.log("fetching start page", room.startPage);
          const startHtml = await fetchWikiHtml(room.startPage);

          room.gameState = "RACING";

          io.to(roomCode).emit('game_started', {
              startPage: room.startPage,
              targetPage: room.targetPage,
              initialHtml: startHtml
          });

      } catch (error) {
          console.error("Start Game Error:", error);
          socket.emit('error', "Could not load the starting page.");
      }
    });

    // HANDLE PLAYER MOVED
    socket.on('player_moved', async ({ roomCode, pageTitle, elapsedTime }) => {
      const room = rooms[roomCode];
      if (!room) return;
      
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;
      
      const win = pageTitle === room.targetPage;
      
      player.currentPageTitle = pageTitle;
      player.path.push({ title: pageTitle, html: await fetchWikiHtml(pageTitle) });
      
      if (win) {
          player.wins++;
          room.totalTime = elapsedTime;
          
          // Broadcast to everyone
          io.to(roomCode).emit('game_won', { 
              player: player, 
              totalTime: room.totalTime 
          });
      }
      
      io.to(roomCode).emit('update_player_list', room.players);
      
      console.log(`Player moved to ${pageTitle} in ${roomCode}`);
    });

    // HANDLE RETURN TO LOBBY
    socket.on('navigate_to_lobby', (roomCode) => {
      const room = rooms[roomCode];
      if (!room) return;
    
      room.gameState = "LOBBY";
      room.startPage = "";
      room.targetPage = "";
      room.totalTime = 0;
    
      io.to(roomCode).emit('return_to_lobby');
    });

    // HANDLE SURRENDER: THIS IS NOT BEING USED FOR NOW
    socket.on('surrender', (roomCode) => {
      const room = rooms[roomCode];
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      player.isPlaying = false;
      player.path = [];
      player.currentPageTitle = "";

      io.to(roomCode).emit('update_player_list', room.players);
      // ill need to send only that player to the lobby or to the game over screen
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // GET PLAYERS IN A LOBBY
    socket.on('request_player_list', (roomCode) => {
      const room = rooms[roomCode];
      if (room) {
          // Send the list ONLY to the person who asked
          socket.emit('update_player_list', room.players);
      }
  });

    // HANDLE LEAVE GAME
    // socket.on('leave_game', (roomCode) => {
    //   // Reuse your disconnect logic here, or just:
    //   const room = rooms[roomCode];
    //   if (room) {
    //       const index = room.players.findIndex(p => p.id === socket.id);
    //       if (index !== -1) {
    //           room.splice(index, 1);
    //           io.to(roomCode).emit('update_player_list', room);
    //       }
    //   }
    // });

    // HANDLE DISCONNECT 
    socket.on('disconnect', () => {
      console.log(`User Disconnected: ${socket.id}`);

      for (const roomCode in rooms) {
        const room = rooms[roomCode];
        
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          
          room.players.splice(playerIndex, 1);
          
          if (player.isHost && room.players.length > 0) {
              room.players[0].isHost = true; // Promote the next person
              io.to(roomCode).emit('update_player_list', room.players);
          }

          if (room.players.length === 0) {
              delete rooms[roomCode];
              console.log(`Room ${roomCode} deleted (empty)`);
          } else {
              io.to(roomCode).emit('update_player_list', room.players);
              console.log(`${player.username} left room ${roomCode}`);
          }
          
          break; 
        }
      }
    });
  });
};