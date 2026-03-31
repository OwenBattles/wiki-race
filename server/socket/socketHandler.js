const { fetchWikiHtml, fetchRandomPageHtml, fetchRandomPage } = require('../controllers/wikiController');
const { use } = require('../routes/wikiRoutes');

// Store room state in memory
const rooms = {};
// room: { 
//   players: [], 
//   gameState: "", // LOBBY, PLAYING, FINISHED
//   startPage: "", 
//   targetPage: "",
//   totalTime: 0,
//   powerUps: {}, // default { swap: 0, scramble: 0, freeze: 0 }
// }

// player: { 
//   id: "", 
//   username: "", 
//   isHost: bool, 
//   isPlaying: bool, 
//   path : [], 
//   wins: int, 
//   powerUps: {}
//   currentPageTitle : ""
// }

// powerUps : {
//   swap : int, // default 0
//   scramble : int, // default 0
//   freeze : int, // default 0
// }

module.exports = (io) => {
  io.on('connection', (socket) => {
    const getEffectiveCurrentTitle = (player) => {
      const last = player?.path?.[player.path.length - 1]?.title;
      return last || player?.currentPageTitle || "";
    };

    const syncCurrentTitleFromPath = (player) => {
      const last = player?.path?.[player.path.length - 1]?.title;
      if (last) player.currentPageTitle = last;
    };

    // CREATE ROOM EVENT
    socket.on('create_room', ({ username }) => {
      const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      
      // check for room code collision
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
        powerUps: {
          swap: 0,
          scramble: 0,
          freeze: 0
        },
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
        powerUps: {
          swap: 0,
          scramble: 0,
          freeze: 0
        }, 
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

    socket.on('check_username', ({ roomCode, username }) => {
      const room = rooms[roomCode];
      if (!room) return;

      const isTaken = room.players.some(player => player.username === username);
      if (isTaken) {
        socket.emit('username_taken', { found: true, message: "Username already taken" });
      } else {
        socket.emit('username_taken', { found: false, message: "Username available" });
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
          powerUps: {
            swap: 0,
            scramble: 0,
            freeze: 0
          }, 
          currentPageTitle: "" 
        });

        console.log(`${username} join room ${roomCode}`);
        
        io.to(roomCode).emit('update_player_list', room.players);
        io.to(roomCode).emit('joined_room', room.startPage, room.targetPage, room.powerUps);
        
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

      for (const player of room.players) {
        player.powerUps = room.powerUps;
      }

      try {
          console.log("fetching start page", room.startPage);
          const startHtml = await fetchWikiHtml(room.startPage);

          room.gameState = "RACING";

          for (const player of room.players) {
            player.path = [{ title: room.startPage, html: startHtml }];
            player.currentPageTitle = room.startPage;
            player.isPlaying = true;
          }

          io.to(roomCode).emit('update_player_list', room.players);

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
      if (!player || !player.isPlaying) return;
      
      const win = pageTitle === room.targetPage;
      
      player.path.push({ title: pageTitle, html: await fetchWikiHtml(pageTitle) });
      syncCurrentTitleFromPath(player);
      
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

    socket.on('set_power_up', ({ roomCode, powerUpType, value }) => {
      rooms[roomCode].powerUps[powerUpType] = value;
      io.to(roomCode).emit('power_up_changed', { powerUpType, value });
    })

    // HANDLE POWER UP USE
    socket.on('use_power_up', async ({ roomCode, powerUpType, victimId }) => {
      const room = rooms[roomCode];
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player || !player.isPlaying) return;
      player.powerUps[powerUpType]--;
      socket.emit('power_up_changed', { powerUpType, value: player.powerUps[powerUpType] });

      // handle backend logic for the power up
      if (powerUpType === "swap") {
        const victimPlayer = room.players.find(p => p.id === victimId);
        if (!victimPlayer) return;
        const attackerTitle = getEffectiveCurrentTitle(player);
        const victimTitle = getEffectiveCurrentTitle(victimPlayer);
        console.log("swapping", attackerTitle, victimTitle);
        [player.currentPageTitle, victimPlayer.currentPageTitle] = [victimTitle, attackerTitle];
        try {
          const playerHtml = await fetchWikiHtml(player.currentPageTitle);
          const victimHtml = await fetchWikiHtml(victimPlayer.currentPageTitle);
          player.path.push({ title: player.currentPageTitle, html: playerHtml });
          victimPlayer.path.push({ title: victimPlayer.currentPageTitle, html: victimHtml });
          syncCurrentTitleFromPath(player);
          syncCurrentTitleFromPath(victimPlayer);
          
          // Emit dedicated swap event to affected players with their new page data
          io.to(player.id).emit('pages_swapped', { 
            newPageTitle: player.currentPageTitle, 
            newPageHtml: playerHtml 
          });
          io.to(victimPlayer.id).emit('pages_swapped', { 
            newPageTitle: victimPlayer.currentPageTitle, 
            newPageHtml: victimHtml 
          });
          io.to(victimPlayer.id).emit('power_up_used_on_you', {
            attackerUsername: player.username,
            powerUpType,
          });
          
        } catch (error) {
          console.error("Swap power-up error:", error);
          socket.emit('error', "Could not load swapped pages.");
          [player.currentPageTitle, victimPlayer.currentPageTitle] = [victimPlayer.currentPageTitle, player.currentPageTitle];
          player.powerUps[powerUpType]++; // Refund the power-up
        }
      }

      if (powerUpType === "scramble") {
        const victimPlayer = room.players.find(p => p.id === victimId);
        if (!victimPlayer) return;

        try {
          const randomPage = fetchRandomPage ? await fetchRandomPage() : null;
          if (randomPage) {
            victimPlayer.path.push({ title: randomPage.title, html: randomPage.html });
          } else {
            // Back-compat: older helper only returned html
            const victimHtml = await fetchRandomPageHtml();
            const prevTitle = getEffectiveCurrentTitle(victimPlayer);
            victimPlayer.path.push({ title: prevTitle, html: victimHtml });
          }
          syncCurrentTitleFromPath(victimPlayer);
          
          // Emit dedicated swap event to affected players with their new page data
          io.to(victimPlayer.id).emit('pages_swapped', { 
            newPageTitle: victimPlayer.currentPageTitle, 
            newPageHtml: victimPlayer.path[victimPlayer.path.length - 1].html 
          });
          io.to(victimPlayer.id).emit('power_up_used_on_you', {
            attackerUsername: player.username,
            powerUpType,
          });
          
        } catch (error) {
          console.error("Scramble power-up error:", error);
          socket.emit('error', "Could not load scrambled page.");
          player.powerUps[powerUpType]++; // Refund the power-up
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
      room.totalTime = 0;
      room.powerUps = {
        swap: room.powerUps.swap,
        scramble: room.powerUps.scramble,
        freeze: room.powerUps.freeze,
      };

      // for (const player of room.players) {
      //   player.powerUps = room.powerUps;
      // }
    
      for (const p of room.players) {
        p.isPlaying = false;
      }

      io.to(roomCode).emit('return_to_lobby', room.powerUps);
    });

    // HANDLE SURRENDER: THIS IS NOT BEING USED FOR NOW
    socket.on('surrender', (roomCode, elapsedTime) => {
      const room = rooms[roomCode];
      if (!room || room.gameState !== "RACING") return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || !player.isPlaying) return;

      player.isPlaying = false;
      player.path = [];
      player.currentPageTitle = "";

      totalPlayingPlayers = room.players.filter(p => p.isPlaying).length;
      console.log("totalPlayingPlayers", totalPlayingPlayers);

      if (totalPlayingPlayers == 0) {
        placeholderPlayer = {
          id: "placeholder",
          username: "Nobody",
          isHost: false,
          isPlaying: false,
          path: [],
          wins: 0,
          powerUps: {
            swap: 0,
            scramble: 0,
          }
        }
        io.to(roomCode).emit('game_won', { 
          player: placeholderPlayer, 
          totalTime: elapsedTime 
        });
      } else {
        io.to(roomCode).emit('update_player_list', room.players);
        socket.emit('surrendered_to_lobby', {
          startPage: room.startPage,
          targetPage: room.targetPage,
          powerUps: room.powerUps,
        });
      }
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