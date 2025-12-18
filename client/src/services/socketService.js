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

    validateUsername: (roomCode, username) => {
        const response = socket.emit('check_username', { roomCode, username });
        return response;
    },

    joinRoom: (roomCode, username) => {
        // Ensure uppercase to match server logic
        socket.emit('join_room', { roomCode, username });
    },

    checkUsername: (roomCode, username) => {
        socket.emit('check_username', { lobbyCode: roomCode, username });
    },

    leaveLobby: (roomCode) => {
        socket.emit('leave_game', roomCode);
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

    // Used when a player clicks a link in the WikiView
    submitMove: (roomCode, newPageTitle, elapsedTime) => {
        socket.emit('player_moved', { roomCode, pageTitle: newPageTitle, elapsedTime });
    },

    setPowerUp: (roomCode, powerUpType, value) => {
        socket.emit('set_power_up', { roomCode, powerUpType, value });
    },

    returnToLobby: (roomCode) => {
        socket.emit('navigate_to_lobby', roomCode);
    },

    // Used to sync the player list manually if needed
    requestPlayerList: (roomCode) => {
        socket.emit('request_player_list', roomCode);
    }
};