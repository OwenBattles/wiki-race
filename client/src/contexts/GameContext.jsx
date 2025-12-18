import { createContext, useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { useWikiPage } from '../hooks/useWikiPage';
import { useHomeLogic } from '../hooks/useHomeLogic';

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [username, setUsername] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [validUsername, setValidUsername] = useState(false);
    const [validRoomCode, setValidRoomCode] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [players, setPlayers] = useState([]);
    
    // Game Flow State
    const [startTime, setStartTime] = useState(null);
    const [totalTime, setTotalTime] = useState(0);
    const [powerUpsAllowed, setPowerUpsAllowed] = useState(false);
    const [gameState, setGameState] = useState("LOBBY"); // "LOBBY", "RACING", "FINISHED"
    const [gameSettings, setGameSettings] = useState({ 
        startPage: "", 
        targetPage: ""
    });
    const [winner, setWinner] = useState("");
    const [path, setPath] = useState([]);
    const currentPageTitle = path[path.length - 1]?.title || "";
    const currentPageHtml = path[path.length - 1]?.html || "";
    const [powerUps, setPowerUps] = useState({ swap: 0, scramble: 0, freeze: 0 });

    const { fetchPage, isLoading } = useWikiPage({ setPath });

    useEffect(() => {
        socket.on('room_created', (code) => {
            setRoomCode(code);
        });

        socket.on('found_room', (found) => {
            if (found) setValidRoomCode(true);
            if (!found) setValidRoomCode(false);
        })

        socket.on('joined_room', (startPage, targetPage, powerUpsEnabled) => {
            console.log("joined_room", startPage, targetPage, powerUpsEnabled);
            setGameSettings({ startPage, targetPage });
            setPowerUpsAllowed(powerUpsEnabled);
        })

        socket.on('return_to_lobby', () => {
            setGameState("LOBBY");
            setGameSettings({ startPage: "", targetPage: "" });
        })

        socket.on('username_taken', ({ found, message }) => {
            if (found) {
                setValidUsername(false);
                return;
            } else {
                setValidUsername(true);
                return;
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

        socket.on('power_ups_allowed', (powerUpsAllowed) => {
            console.log("power ups allowed", powerUpsAllowed);
            setPowerUpsAllowed(powerUpsAllowed);
        })

        socket.on('power_up_changed', ({ powerUpType, value }) => {
            console.log("power up changed", powerUpType, value);
            setPowerUps(prev => ({
                ...prev,
                [powerUpType]: value
            }));
        })

        socket.on('game_started', ({ startPage, targetPage, initialHtml }) => {
            setStartTime(Date.now());
            setGameSettings({ startPage, targetPage });
            setPath([{ title: startPage, html: initialHtml }]);
            setGameState("PLAYING");
        });

        socket.on('game_won', ({ player, totalTime }) => {
            setWinner(player);
            setTotalTime(totalTime);
            setGameState("FINISHED");
        });

        socket.on('error', (msg) => {
            alert(msg);
        })
        
        return () => {
            socket.off('room_created');
            socket.off('found_room');
            socket.off('joined_room');
            socket.off('power_ups_allowed');
            socket.off('power_up_changed');
            socket.off('return_to_lobby');
            socket.off('username_check_result');
            socket.off('update_player_list');
            socket.off('start_page');
            socket.off('target_page')
            socket.off('game_started');
            socket.off('check_if_won');
            socket.off('error');
        };
    }, []);


    const value = {
        // State
        username, setUsername,
        roomCode, setRoomCode,
        validUsername, setValidUsername,
        validRoomCode, setValidRoomCode,
        isHost, setIsHost,
        players, setPlayers,
        powerUpsAllowed, setPowerUpsAllowed,
        gameState, setGameState,
        gameSettings, setGameSettings,
        path, setPath,
        currentPageTitle,
        currentPageHtml,
        fetchPage, isLoading, winner,
        startTime, setStartTime,
        totalTime, setTotalTime,
        powerUps, setPowerUps,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};