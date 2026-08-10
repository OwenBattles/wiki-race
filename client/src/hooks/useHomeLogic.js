import { useState } from 'react';
import { useGame } from '../contexts/gameContext';
import { SocketService } from '../services/socketService';

export function useHomeLogic() {
    // No navigation here on purpose. We used to route to /game the instant the socket
    // message went out, so a rejected join (bad code, name already taken) flashed the game
    // page and bounced back. SessionGate now routes once the server confirms the seat.
    const { setUsername, setIsHost, beginSession } = useGame();

    const [error, setError] = useState("");

    const handleCreateRoom = (username) => {
        if (!username) return setError("Enter a username to continue.");

        setUsername(username);
        setIsHost(true);

        // Marks the session in flight; SessionGate waits on this rather than deciding
        // where to route while the handshake is still going.
        beginSession();
        SocketService.createRoom(username);
    };

    const handleFindRoom = (code) => {
        SocketService.findRoom(code);
    };

    const handleJoinRoom = (code, username) => {
        setUsername(username);
        setIsHost(false);
        beginSession();
        SocketService.joinRoom(code, username);
    };

    return { handleCreateRoom, handleFindRoom, handleJoinRoom, error, setError };
}
