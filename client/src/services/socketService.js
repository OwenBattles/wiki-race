import { socket } from './socket';

export const SocketService = {
    connect: () => {
        if (!socket.connected) socket.connect();
    },
    
    disconnect: () => {
        if (socket.connected) socket.disconnect();
    },

    // --- ROOM ACTIONS ---
    createRoom: (username) => {
        socket.emit('create_room', { username });
    },

    findRoom: (roomCode) => {
        socket.emit('find_room', roomCode);
    },

    joinRoom: (roomCode, username) => {
        socket.emit('join_room', { roomCode, username });
    },

    // --- GAME ACTIONS ---
    setStartPage: (roomCode, startPage) => {
        socket.emit('set_start_page', { roomCode, startPage });
    },

    setTargetPage: (roomCode, targetPage) => {
        socket.emit('set_target_page', { roomCode, targetPage });
    },

    startGame: (roomCode) => {
        socket.emit('start_game', { roomCode });
    },

    // Used when a player clicks a link in the WikiView. Sends the title exactly as it
    // appeared in the link — the server validates it against that page's links, resolves
    // any redirect itself, and times the round off its own clock.
    submitMove: (roomCode, newPageTitle) => {
        socket.emit('player_moved', { roomCode, pageTitle: newPageTitle });
    },

    setPowerUp: (roomCode, powerUpType, value) => {
        socket.emit('set_power_up', { roomCode, powerUpType, value });
    },

    // Named "send" rather than "use" so lint doesn't mistake it for a React hook.
    sendPowerUp: (roomCode, powerUpType, victimId) => {
        socket.emit('use_power_up', { roomCode, powerUpType, victimId });
    },

    returnToLobby: (roomCode) => {
        socket.emit('navigate_to_lobby', roomCode);
    },

    surrender: (roomCode) => {
        socket.emit('surrender', roomCode);
    },

    // Used to sync the player list manually if needed
    requestPlayerList: (roomCode) => {
        socket.emit('request_player_list', roomCode);
    }
};