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
    startGame: (roomCode, startPage, endPage) => {
        socket.emit('start_game', { roomCode, startPage, endPage });
    },

    // Used when a player clicks a link in the WikiView
    submitMove: (roomCode, newPageTitle) => {
        socket.emit('player_moved', { roomCode, pageTitle: newPageTitle });
    },

    // Used to sync the player list manually if needed
    requestPlayerList: (roomCode) => {
        socket.emit('request_player_list', roomCode);
    }
};