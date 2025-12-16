import { createContext, useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { useWikiPage } from '../hooks/useWikiPage';
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
    const [gameSettings, setGameSettings] = useState({ 
        startPage: "", 
        targetPage: ""
    });

    const [path, setPath] = useState([]);
    const currentPageTitle = path[path.length - 1]?.title || "";
    const currentPageHtml = path[path.length - 1]?.html || "";

    const { fetchPage, isLoading } = useWikiPage({ setPath });

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
            console.log("update_player_list", updatedPlayers);
            setPlayers(updatedPlayers);
            const me = updatedPlayers.find(p => p.id === socket.id);
            if (me) {
                setIsHost(me.isHost);
            }
        });

        socket.on('start_page', (startPage) => {
            setGameSettings(prev => ({
                ...prev,
                startPage: startPage
            }));
        })

        socket.on('target_page', (targetPage) => {
            setGameSettings(prev => ({
                ...prev,
                targetPage: targetPage
            }));
        })

        socket.on('game_started', ({ startPage, targetPage, initialHtml }) => {
            setGameSettings({ startPage, targetPage });
            setPath([{ title: startPage, html: initialHtml }]);
            setGameState("PLAYING");
        });

        socket.on('error', (msg) => {
            alert(msg);
        })
        
        return () => {
            socket.off('room_created');
            socket.off('found_room');
            socket.off('username_check_result');
            socket.off('update_player_list');
            socket.off('start_page');
            socket.off('target_page')
            socket.off('game_started');
            socket.off('error');
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
        gameSettings, setGameSettings,
        path, setPath,
        currentPageTitle,
        currentPageHtml,
        fetchPage, isLoading
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};