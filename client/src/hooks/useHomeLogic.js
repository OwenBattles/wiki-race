import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../contexts/GameContext';
import { SocketService } from '../services/socketService';

export function useHomeLogic() {
    const navigate = useNavigate();
    
    const { roomCode, setRoomCode, setUsername, setIsHost } = useContext(GameContext);

    const [error, setError] = useState("");

    const handleCreateRoom = async (username) => {
        if (!username) return setError("Name required");
        
        setUsername(username);
        setIsHost(true);
        
        SocketService.createRoom(username);
        // add error handling first
        navigate('/game');
    };

    const handleFindRoom = (code) => {
        SocketService.findRoom(code);
    }

    const handleJoinRoom = (code, username) => {
        setUsername(username);
        setIsHost(false);
        SocketService.joinRoom(code, username);
        navigate('/game');
    };

    return { handleCreateRoom, handleFindRoom, handleJoinRoom, error };
}