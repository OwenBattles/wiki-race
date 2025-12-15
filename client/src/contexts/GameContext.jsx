import { createContext, useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { useHomeLogic } from '../hooks/useHomeLogic';

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [username, setUsername] = useState("");
    const [roomCode, setRoomCode] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [players, setPlayers] = useState([]);
    
    // Game Flow State
    const [powerUpsAllowed, setPowerUpsAllowed] = useState(false);
    const [gameState, setGameState] = useState("LOBBY"); // "LOBBY", "RACING", "FINISHED"
    const [gameData, setGameData] = useState({ 
        startPage: "", 
        targetPage: "", 
        initialHtml: "" 
    });

    useEffect(() => {
        socket.on('room_created', (code) => {
            setRoomCode(code);
        });

        socket.on('update_player_list', (updatedPlayers) => {
            setPlayers(updatedPlayers);
            
            // Auto-detect if I am the host now (e.g., if previous host left)
            const me = updatedPlayers.find(p => p.id === socket.id);
            if (me) setIsHost(me.isHost);
        });

        socket.on('game_started', ({ startPage, endPage, initialHtml }) => {
            setGameData({ startPage, targetPage: endPage, initialHtml });
            setGameState("RACING");
        });
        
        return () => {
            socket.off('update_player_list');
            socket.off('game_started');
            socket.off('join_success');
        };
    }, []);

    const value = {
        // State
        username, setUsername,
        roomCode, setRoomCode,
        isHost, setIsHost,
        players, setPlayers,
        powerUpsAllowed, setPowerUpsAllowed,
        gameState, setGameState,
        gameData, setGameData
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};