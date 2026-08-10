const { randomUUID } = require('crypto');
const {
  fetchWikiHtml,
  fetchWikiPage,
  fetchWikiLinks,
  fetchRandomPage,
  resolveTitle,
} = require('../controllers/wikiController');

// Store room state in memory
const rooms = {};
// room: {
//   players: [],
//   gameState: "", // LOBBY, RACING, FINISHED
//   startPage: "",
//   targetPage: "",   // canonical title, resolved at start_game
//   startedAt: null,  // ms timestamp, so a rejoining client can resync its timer
//   totalTime: 0,
//   winner: null,     // retained so a rejoin during FINISHED can show the result
//   powerUps: {},     // the host's per-round allowance, never spent from
// }

// player: {
//   token: "",          // stable identity across sockets — survives a refresh
//   id: "",             // current socket id, reassigned on every (re)connect
//   username: "",
//   isHost: bool,
//   isPlaying: bool,
//   connected: bool,
//   removalTimer: null, // pending eviction while disconnected
//   path: [{ title }],  // titles only — see serializePlayer
//   wins: int,
//   powerUps: {},       // this player's own inventory for the current round
//   currentPageTitle: ""
// }

// How long a disconnected player keeps their seat. A refresh drops the socket and opens a
// new one, so without a grace period reloading the page meant losing the game.
const RECONNECT_GRACE_MS = 30000;

const POWER_UP_TYPES = ['swap', 'scramble', 'freeze'];

const emptyPowerUps = () => ({ swap: 0, scramble: 0, freeze: 0 });

// Ambiguous glyphs (I/O/0/1) are left out so codes are safe to read aloud.
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 5;

// Must always return exactly ROOM_CODE_LENGTH characters: the client's join form requires
// that length, so a short code produced an unjoinable room.
const generateRoomCode = () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    if (!rooms[code]) return code;
  }
  return null;
};

// Wikipedia titles differ only in first-letter case and underscore-vs-space, so compare on
// a normalised form rather than raw strings.
const normalizeTitle = (title) =>
  String(title || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

const titlesMatch = (a, b) => {
  const normalized = normalizeTitle(a);
  return normalized.length > 0 && normalized === normalizeTitle(b);
};

const USERNAME_MAX_LENGTH = 20;

// Compared case- and whitespace-insensitively: "Owen" and "owen " are too easy to confuse
// with each other in a player list to be treated as different people.
const normalizeUsername = (name) =>
  String(name ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

const validateUsername = (raw) => {
  const value = String(raw ?? '').replace(/\s+/g, ' ').trim();

  if (!value) return { ok: false, reason: 'Enter a username to continue.' };
  if (value.length > USERNAME_MAX_LENGTH) {
    return { ok: false, reason: `Usernames can be at most ${USERNAME_MAX_LENGTH} characters.` };
  }
  return { ok: true, value };
};

// Disconnected players still hold their seat during the reconnect window, so their name is
// still theirs — taking it would leave them unable to return.
const isNameTaken = (room, username) =>
  room.players.some((p) => normalizeUsername(p.username) === normalizeUsername(username));

const createPlayer = ({ id, username, isHost }) => ({
  token: randomUUID(),
  id,
  username,
  isHost,
  isPlaying: false,
  connected: true,
  removalTimer: null,
  path: [],
  wins: 0,
  powerUps: emptyPowerUps(),
  currentPageTitle: '',
});

const nobody = () => ({
  id: 'placeholder',
  username: 'Nobody',
  isHost: false,
  isPlaying: false,
  connected: false,
  path: [],
  wins: 0,
});

// What we're willing to tell other clients about a player.
//
// Two things are deliberately withheld mid-race. Paths are only included once the round is
// over: sending them during the race both leaked every opponent's current position and,
// because path entries used to carry the full article HTML, pushed over a megabyte to
// every client on every single move. currentPageTitle is never sent for the same reason.
// The token is never serialized — it is a bearer credential for reclaiming a seat, and only
// ever goes to the socket that owns it.
const serializePlayer = (player, includePath) => ({
  id: player.id,
  username: player.username,
  isHost: player.isHost,
  isPlaying: player.isPlaying,
  connected: player.connected,
  wins: player.wins,
  ...(includePath ? { path: player.path } : {}),
});

const serializePlayers = (room) => {
  const includePaths = room.gameState !== 'RACING';
  return room.players.map((player) => serializePlayer(player, includePaths));
};

const broadcastPlayers = (io, roomCode, room) => {
  io.to(roomCode).emit('update_player_list', serializePlayers(room));
};

const getEffectiveCurrentTitle = (player) => {
  const last = player?.path?.[player.path.length - 1]?.title;
  return last || player?.currentPageTitle || '';
};

const moveTo = (player, title) => {
  player.path.push({ title });
  player.currentPageTitle = title;
};

// The round clock belongs to the server. Clients used to report their own elapsed time,
// which meant the recorded winning time was whatever the winner's browser claimed.
const elapsedFor = (room) => (room.startedAt ? Date.now() - room.startedAt : 0);

module.exports = (io) => {
  // Ends the round for everyone and remembers the outcome, so that a client reconnecting
  // during the game-over screen can be shown the same result.
  const endRound = (roomCode, room, winner, totalTime) => {
    room.gameState = 'FINISHED';
    room.totalTime = totalTime;
    room.winner = winner;
    for (const p of room.players) p.isPlaying = false;

    io.to(roomCode).emit('game_won', { player: winner, totalTime });
    broadcastPlayers(io, roomCode, room);
  };

  // Evict a player whose reconnect window has closed.
  const removePlayer = (roomCode, token) => {
    const room = rooms[roomCode];
    if (!room) return;

    const index = room.players.findIndex((p) => p.token === token);
    if (index === -1) return;

    const [player] = room.players.splice(index, 1);
    clearTimeout(player.removalTimer);
    console.log(`${player.username} removed from room ${roomCode} (reconnect window closed)`);

    if (room.players.length === 0) {
      delete rooms[roomCode];
      console.log(`Room ${roomCode} deleted (empty)`);
      return;
    }

    // Host promotion is deferred until now on purpose: a host who merely refreshed gets
    // their role back, and only a host who is really gone hands it over.
    if (player.isHost) room.players[0].isHost = true;

    if (room.gameState === 'RACING' && room.players.every((p) => !p.isPlaying)) {
      endRound(roomCode, room, nobody(), room.totalTime);
      return;
    }

    broadcastPlayers(io, roomCode, room);
  };

  io.on('connection', (socket) => {
    // Lobby configuration is host-only. The UI already hides these controls from everyone
    // else, but the socket accepted them from any player in the room.
    const asHost = (room) => {
      const player = room?.players.find((p) => p.id === socket.id);
      return player?.isHost ? player : null;
    };

    // Hand the client the credential it needs to reclaim this seat after a reload.
    const establishSession = (roomCode, player) => {
      socket.emit('session_established', {
        roomCode,
        token: player.token,
        username: player.username,
      });
    };

    // CREATE ROOM EVENT
    socket.on('create_room', ({ username } = {}) => {
      const check = validateUsername(username);
      if (!check.ok) {
        socket.emit('join_error', { message: check.reason });
        return;
      }

      const roomCode = generateRoomCode();
      if (!roomCode) {
        socket.emit('join_error', { message: 'Could not create a room, please try again.' });
        return;
      }

      rooms[roomCode] = {
        players: [],
        gameState: 'LOBBY',
        startPage: '',
        targetPage: '',
        startedAt: null,
        totalTime: 0,
        winner: null,
        powerUps: emptyPowerUps(),
      };

      // Join & Setup Host
      socket.join(roomCode);
      const host = createPlayer({ id: socket.id, username: check.value, isHost: true });
      rooms[roomCode].players.push(host);

      console.log(`User ${check.value} created room: ${roomCode}`);

      // Send the new code back to the creator so they can share it
      socket.emit('room_created', roomCode);
      establishSession(roomCode, host);
      broadcastPlayers(io, roomCode, rooms[roomCode]);
    });

    // CHECK IF LOBBY CODE IS VALID
    socket.on('find_room', (lobbyCode) => {
      socket.emit('found_room', Boolean(rooms[lobbyCode]));
    });

    // JOIN LOBBY
    socket.on('join_room', ({ roomCode, username } = {}) => {
      const room = rooms[roomCode];

      if (!room) {
        socket.emit('join_error', { message: 'No room with that code.' });
        return;
      }

      const check = validateUsername(username);
      if (!check.ok) {
        socket.emit('join_error', { message: check.reason });
        return;
      }

      // Names have to be unique per room: the game identifies opponents by name in the
      // power-up menu and marks "you" in the roster, so duplicates make players
      // indistinguishable and untargetable.
      if (isNameTaken(room, check.value)) {
        socket.emit('join_error', {
          message: `"${check.value}" is already taken in this room. Pick another name.`,
          field: 'username',
        });
        return;
      }

      socket.join(roomCode);
      const player = createPlayer({ id: socket.id, username: check.value, isHost: false });
      room.players.push(player);

      console.log(`${check.value} join room ${roomCode}`);

      establishSession(roomCode, player);
      broadcastPlayers(io, roomCode, room);
      // Only the joiner needs the room settings. Broadcasting this used to overwrite every
      // other client's gameSettings and power-up counts mid-round.
      socket.emit('joined_room', room.startPage, room.targetPage, { ...room.powerUps });
    });

    // RECLAIM A SEAT AFTER A RELOAD OR DROPPED CONNECTION
    //
    // The client replays this on every socket connect, so it covers both a deliberate
    // refresh and a transient network blip. Article HTML is deliberately not sent back:
    // the client refetches its current page over the REST route it already uses, which
    // keeps this payload small and avoids a second code path for loading pages.
    socket.on('rejoin_room', ({ roomCode, token } = {}) => {
      const room = rooms[roomCode];
      const player = room?.players.find((p) => p.token === token);

      if (!room || !player) {
        socket.emit('rejoin_failed');
        return;
      }

      clearTimeout(player.removalTimer);
      player.removalTimer = null;
      player.id = socket.id;
      player.connected = true;
      socket.join(roomCode);

      socket.emit('rejoin_success', {
        roomCode,
        username: player.username,
        isHost: player.isHost,
        isPlaying: player.isPlaying,
        gameState: room.gameState,
        startPage: room.startPage,
        targetPage: room.targetPage,
        powerUps: { ...room.powerUps },
        inventory: { ...player.powerUps },
        currentPageTitle: getEffectiveCurrentTitle(player),
        // Lets the client rebuild startTime so the timer keeps reading true across a reload.
        elapsedMs: room.startedAt ? Date.now() - room.startedAt : 0,
        winner: room.winner,
        totalTime: room.totalTime,
        players: serializePlayers(room),
      });

      broadcastPlayers(io, roomCode, room);
      console.log(`${player.username} rejoined room ${roomCode}`);
    });

    // SET THE STARTING PAGE
    socket.on('set_start_page', ({ roomCode, startPage } = {}) => {
      const room = rooms[roomCode];
      if (!room || !asHost(room)) return;

      room.startPage = startPage;
      io.to(roomCode).emit('start_page', startPage);
    });

    // SET THE TARGET PAGE
    socket.on('set_target_page', ({ roomCode, targetPage } = {}) => {
      const room = rooms[roomCode];
      if (!room || !asHost(room)) return;

      room.targetPage = targetPage;
      io.to(roomCode).emit('target_page', targetPage);
    });

    // START GAME
    socket.on('start_game', async ({ roomCode } = {}) => {
      const room = rooms[roomCode];
      if (!room || !asHost(room) || room.gameState === 'RACING') return;
      if (!room.startPage || !room.targetPage) return;

      try {
        // Resolve both endpoints up front so the round runs on canonical titles.
        const [startPage, targetTitle] = await Promise.all([
          fetchWikiPage(room.startPage),
          resolveTitle(room.targetPage),
        ]);

        room.startPage = startPage.title;
        room.targetPage = targetTitle;
        room.gameState = 'RACING';
        room.startedAt = Date.now();
        room.totalTime = 0;
        room.winner = null;

        for (const player of room.players) {
          // A copy per player. Assigning room.powerUps by reference meant one player
          // spending a power-up decremented it for everyone and destroyed the host's
          // configured allowance for subsequent rounds.
          player.powerUps = { ...room.powerUps };
          player.path = [{ title: startPage.title }];
          player.currentPageTitle = startPage.title;
          player.isPlaying = true;
        }

        broadcastPlayers(io, roomCode, room);

        io.to(roomCode).emit('game_started', {
          startPage: room.startPage,
          targetPage: room.targetPage,
          initialHtml: startPage.html,
          inventory: { ...room.powerUps },
        });
      } catch (error) {
        console.error('Start Game Error:', error.message);
        room.gameState = 'LOBBY';
        socket.emit('error', 'Could not load the starting page.');
      }
    });

    // HANDLE PLAYER MOVED
    //
    // The client sends the raw title it clicked; the server decides everything else. It
    // checks the link genuinely exists on the page the player is standing on, resolves the
    // redirect itself, and times the round off its own clock. Previously a client could
    // simply emit the target page and win instantly in zero seconds.
    socket.on('player_moved', async ({ roomCode, pageTitle } = {}) => {
      const room = rooms[roomCode];
      if (!room || room.gameState !== 'RACING') return;
      if (!pageTitle || typeof pageTitle !== 'string') return;

      const player = room.players.find((p) => p.id === socket.id);
      if (!player || !player.isPlaying) return;

      const currentTitle = getEffectiveCurrentTitle(player);
      if (!currentTitle) return;

      try {
        const allowed = await fetchWikiLinks(currentTitle);
        if (!allowed.has(normalizeTitle(pageTitle))) {
          console.warn(`Rejected move by ${player.username}: ${currentTitle} -> ${pageTitle}`);
          socket.emit('move_rejected', {
            attemptedTitle: pageTitle,
            currentPageTitle: currentTitle,
            reason: 'That page is not linked from your current article.',
          });
          return;
        }

        // Re-check: the awaits above mean someone else may have won in the meantime.
        if (room.gameState !== 'RACING' || !player.isPlaying) return;

        const canonicalTitle = await resolveTitle(pageTitle);
        if (room.gameState !== 'RACING' || !player.isPlaying) return;

        moveTo(player, canonicalTitle);

        if (titlesMatch(canonicalTitle, room.targetPage)) {
          player.wins += 1;
          // endRound flips gameState before emitting, so a second player crossing the line
          // in the same tick is ignored rather than overwriting the winner.
          endRound(roomCode, room, serializePlayer(player, true), elapsedFor(room));
          return;
        }

        broadcastPlayers(io, roomCode, room);
      } catch (error) {
        // A Wikipedia failure must not strand the player: tell them the move didn't take
        // so the client can put them back where they were.
        console.error('player_moved failed:', error.message);
        socket.emit('move_rejected', {
          attemptedTitle: pageTitle,
          currentPageTitle: currentTitle,
          reason: 'Could not verify that move, please try again.',
        });
      }
    });

    socket.on('set_power_up', ({ roomCode, powerUpType, value } = {}) => {
      const room = rooms[roomCode];
      if (!room || !asHost(room)) return;
      if (!POWER_UP_TYPES.includes(powerUpType)) return;

      const count = Number(value);
      if (!Number.isInteger(count) || count < 0 || count > 99) return;

      room.powerUps[powerUpType] = count;
      io.to(roomCode).emit('power_up_changed', { powerUpType, value: count });
    });

    // HANDLE POWER UP USE
    socket.on('use_power_up', async ({ roomCode, powerUpType, victimId } = {}) => {
      const room = rooms[roomCode];
      if (!room || room.gameState !== 'RACING') return;
      if (!POWER_UP_TYPES.includes(powerUpType)) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (!player || !player.isPlaying) return;

      // Without this the counter ran unbounded negative (1 -> 0 -> -1 -> -2) while the
      // power-up kept firing every time.
      if (!(player.powerUps[powerUpType] > 0)) return;

      const victim = room.players.find((p) => p.id === victimId);
      // A victim who isn't racing has no current page to swap with.
      if (!victim || !victim.isPlaying || victim.id === player.id) return;

      player.powerUps[powerUpType] -= 1;
      socket.emit('inventory_changed', { ...player.powerUps });

      try {
        if (powerUpType === 'swap') {
          const attackerTitle = getEffectiveCurrentTitle(player);
          const victimTitle = getEffectiveCurrentTitle(victim);
          if (!attackerTitle || !victimTitle) throw new Error('Missing current page');

          const [htmlForAttacker, htmlForVictim] = await Promise.all([
            fetchWikiHtml(victimTitle),
            fetchWikiHtml(attackerTitle),
          ]);

          moveTo(player, victimTitle);
          moveTo(victim, attackerTitle);

          io.to(player.id).emit('pages_swapped', {
            newPageTitle: victimTitle,
            newPageHtml: htmlForAttacker,
          });
          io.to(victim.id).emit('pages_swapped', {
            newPageTitle: attackerTitle,
            newPageHtml: htmlForVictim,
          });
        } else if (powerUpType === 'scramble') {
          const randomPage = await fetchRandomPage();

          moveTo(victim, randomPage.title);

          io.to(victim.id).emit('pages_swapped', {
            newPageTitle: randomPage.title,
            newPageHtml: randomPage.html,
          });
        }

        io.to(victim.id).emit('power_up_used_on_you', {
          attackerUsername: player.username,
          powerUpType,
        });

        broadcastPlayers(io, roomCode, room);
      } catch (error) {
        console.error(`Power-up (${powerUpType}) error:`, error.message);
        player.powerUps[powerUpType] += 1; // Refund
        socket.emit('inventory_changed', { ...player.powerUps });
        socket.emit('error', 'Power-up failed, it has been refunded.');
      }
    });

    // HANDLE RETURN TO LOBBY
    socket.on('navigate_to_lobby', (roomCode) => {
      const room = rooms[roomCode];
      if (!room || !asHost(room)) return;

      room.gameState = 'LOBBY';
      room.startPage = '';
      room.targetPage = '';
      room.startedAt = null;
      room.totalTime = 0;
      room.winner = null;

      for (const player of room.players) {
        player.isPlaying = false;
        player.path = [];
        player.currentPageTitle = '';
        player.powerUps = emptyPowerUps();
      }

      // room.powerUps survives untouched — it is the host's configuration, and nothing
      // during a round spends from it any more.
      io.to(roomCode).emit('return_to_lobby', { ...room.powerUps });
      broadcastPlayers(io, roomCode, room);
    });

    // HANDLE SURRENDER
    socket.on('surrender', (roomCode) => {
      const room = rooms[roomCode];
      if (!room || room.gameState !== 'RACING') return;

      const player = room.players.find((p) => p.id === socket.id);
      if (!player || !player.isPlaying) return;

      // Keep the path: it's what the game-over screen shows, and wiping it here meant
      // surrendering erased your own route from the recap.
      player.isPlaying = false;

      const stillRacing = room.players.filter((p) => p.isPlaying).length;

      if (stillRacing === 0) {
        endRound(roomCode, room, nobody(), elapsedFor(room));
        return;
      }

      broadcastPlayers(io, roomCode, room);
      socket.emit('surrendered_to_lobby', {
        startPage: room.startPage,
        targetPage: room.targetPage,
        powerUps: { ...room.powerUps },
      });
    });

    // GET PLAYERS IN A LOBBY
    socket.on('request_player_list', (roomCode) => {
      const room = rooms[roomCode];
      if (room) {
        // Send the list ONLY to the person who asked
        socket.emit('update_player_list', serializePlayers(room));
      }
    });

    // HANDLE DISCONNECT
    //
    // The seat is held, not freed. A refresh looks exactly like a disconnect from here, so
    // the player is only really evicted once RECONNECT_GRACE_MS passes without a
    // rejoin_room carrying their token.
    socket.on('disconnect', () => {
      for (const roomCode in rooms) {
        const room = rooms[roomCode];

        const player = room.players.find((p) => p.id === socket.id);
        if (!player) continue;

        player.connected = false;
        clearTimeout(player.removalTimer);
        player.removalTimer = setTimeout(
          () => removePlayer(roomCode, player.token),
          RECONNECT_GRACE_MS
        );

        console.log(`${player.username} disconnected from ${roomCode} (holding seat)`);
        broadcastPlayers(io, roomCode, room);
        break;
      }
    });
  });
};
