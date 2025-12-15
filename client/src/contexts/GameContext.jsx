import { createContext, useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { useHomeLogic } from '../hooks/useHomeLogic';

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [username, setUsername] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [validRoomCode, setValidRoomCode] = useState(false);
    const [validUsername, setValidUsername] = useState(false);
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

        socket.on('found_room', (found) => {
            if (found) setValidRoomCode(true);
            if (!found) setValidRoomCode(false);
        })

        socket.on('username_check_result', ({ found, message }) => {
            if (!found) {
                setValidUsername(true);
                return;
            } else {
                setValidUsername(false);
                alert(message);
            }
        })

        socket.on('update_player_list', (updatedPlayers) => {
            setPlayers(updatedPlayers);
            const me = updatedPlayers.find(p => p.id === socket.id);
            if (me) {
                setIsHost(me.isHost);
            }
        });

        socket.on('start_page', (startPage) => {
            setGameData(prev => ({
                ...prev,
                startPage: startPage
            }));
        })

        socket.on('target_page', (targetPage) => {
            setGameData(prev => ({
                ...prev,
                targetPage: targetPage
            }));
        })

        socket.on('game_started', ({ startPage, endPage, initialHtml }) => {
            setGameData({ startPage, endPage, initialHtml });
            setGameState("RACING");
        });

        socket.on('error', (msg) => {
            alert(msg);
        })
        
        return () => {
            socket.off('room_created');
            socket.off('found_room');
            socket.off('update_player_list');
            socket.off('start_page');
            socket.off('target_page')
            socket.off('game_started');
            socket.off('join_success');
        };
    }, []);

    const value = {
        // State
        username, setUsername,
        roomCode, setRoomCode,
        validRoomCode, setValidRoomCode,
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