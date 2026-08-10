import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/gameContext';
import { SocketService } from '../services/socketService';

export function useHomeLogic() {
    const navigate = useNavigate();

    const { setUsername, setIsHost, beginSession } = useGame();

    const [error, setError] = useState("");

    const handleCreateRoom = (username) => {
        if (!username) return setError("Name required");

        setUsername(username);
        setIsHost(true);

        // Mark the session in flight before routing, so SessionGate doesn't see "no session"
        // on /game and bounce us straight back home.
        beginSession();
        SocketService.createRoom(username);
        navigate('/game');
    };

    const handleFindRoom = (code) => {
        SocketService.findRoom(code);
    };

    const handleJoinRoom = (code, username) => {
        setUsername(username);
        setIsHost(false);
        beginSession();
        SocketService.joinRoom(code, username);
        navigate('/game');
    };

    return { handleCreateRoom, handleFindRoom, handleJoinRoom, error };
}
