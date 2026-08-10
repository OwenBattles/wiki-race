import { useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';
import { useWikiPage } from '../hooks/useWikiPage';
import { saveSession, loadSession, clearSession } from '../services/session';
import { GameContext } from './gameContext';

// How long to wait for the server to answer a rejoin before giving up and going home.
const REJOIN_TIMEOUT_MS = 8000;

export const GameProvider = ({ children }) => {
    const [username, setUsername] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [validRoomCode, setValidRoomCode] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [players, setPlayers] = useState([]);

    // Game Flow State
    const [startTime, setStartTime] = useState(null);
    const [totalTime, setTotalTime] = useState(0);
    const [gameState, setGameState] = useState("LOBBY"); // "LOBBY", "PLAYING", "SURRENDERED", "FINISHED"
    const [gameSettings, setGameSettings] = useState({
        startPage: "",
        targetPage: ""
    });
    const [winner, setWinner] = useState("");
    const [path, setPath] = useState([]);
    const currentPageTitle = path[path.length - 1]?.title || "";
    const currentPageHtml = path[path.length - 1]?.html || "";
    // powerUps is the host's per-round allowance, shown in the lobby and identical for
    // everyone. inventory is what *this* player still has left to spend this round. These
    // were previously one piece of state, so a spend by one player appeared to change the
    // room's configuration.
    const [powerUps, setPowerUps] = useState({ swap: 0, scramble: 0, freeze: 0 });
    const [inventory, setInventory] = useState({ swap: 0, scramble: 0, freeze: 0 });
    const [victimPowerUpNotice, setVictimPowerUpNotice] = useState(null);
    // One channel for anything the player needs told: rejected moves, socket errors,
    // validation. Replaces three separate alert() calls.
    const [notice, setNotice] = useState(null);

    // "pending" covers both a restore in flight on page load and a create/join we've just
    // fired. Routing waits on this so it never bounces a player home mid-handshake.
    const [sessionStatus, setSessionStatus] = useState(() => (loadSession() ? 'pending' : 'none'));

    // fetchPage is a useCallback over the stable setPath, so its identity never changes —
    // safe to depend on from the socket effect below without re-registering handlers.
    const { fetchPage, isLoading } = useWikiPage({ setPath });

    const showNotice = useCallback((message, tone = 'error') => {
        // Re-set even for an identical message so the auto-dismiss timer restarts.
        setNotice({ message, tone, at: Date.now() });
    }, []);

    const beginSession = useCallback(() => setSessionStatus('pending'), []);

    const endSession = useCallback(() => {
        clearSession();
        setSessionStatus('none');
    }, []);

    useEffect(() => {
        if (!victimPowerUpNotice) return;
        const id = window.setTimeout(() => setVictimPowerUpNotice(null), 4000);
        return () => clearTimeout(id);
    }, [victimPowerUpNotice]);

    useEffect(() => {
        if (!notice) return;
        const id = window.setTimeout(() => setNotice(null), 4500);
        return () => clearTimeout(id);
    }, [notice]);

    useEffect(() => {
        let rejoinTimer = null;

        // Replayed on every connect, so this covers a deliberate refresh and a dropped
        // connection alike — socket.io reconnects on its own and we re-claim the seat.
        const attemptRejoin = () => {
            const stored = loadSession();
            if (!stored) return;

            setSessionStatus('pending');
            socket.emit('rejoin_room', { roomCode: stored.roomCode, token: stored.token });

            clearTimeout(rejoinTimer);
            rejoinTimer = setTimeout(() => {
                clearSession();
                setSessionStatus('none');
            }, REJOIN_TIMEOUT_MS);
        };

        socket.on('connect', attemptRejoin);
        if (socket.connected) attemptRejoin();

        socket.on('session_established', ({ roomCode: code, token, username: name }) => {
            saveSession({ roomCode: code, token, username: name });
            setRoomCode(code);
            setUsername(name);
            setSessionStatus('active');
        });

        socket.on('rejoin_failed', () => {
            clearTimeout(rejoinTimer);
            clearSession();
            setSessionStatus('none');
        });

        socket.on('rejoin_success', (state) => {
            clearTimeout(rejoinTimer);

            setRoomCode(state.roomCode);
            setUsername(state.username);
            setIsHost(state.isHost);
            setPlayers(state.players);
            setGameSettings({ startPage: state.startPage, targetPage: state.targetPage });
            setPowerUps(state.powerUps);
            setInventory(state.inventory);
            setTotalTime(state.totalTime || 0);
            setWinner(state.winner || "");
            setVictimPowerUpNotice(null);
            // Rebuild the clock from how long the round has actually been running.
            setStartTime(state.elapsedMs ? Date.now() - state.elapsedMs : null);

            if (state.gameState === 'RACING' && state.isPlaying) {
                // The server sends the title only; pull the article back through the same
                // REST path a normal move uses, which also repopulates `path`.
                setPath([]);
                setGameState("PLAYING");
                if (state.currentPageTitle) {
                    fetchPage(state.currentPageTitle).catch((err) => {
                        console.error("Could not restore current page:", err);
                    });
                }
            } else if (state.gameState === 'RACING') {
                setPath([]);
                setGameState("SURRENDERED");
            } else {
                setPath([]);
                setGameState(state.gameState === 'FINISHED' ? "FINISHED" : "LOBBY");
            }

            setSessionStatus('active');
        });

        socket.on('room_created', (code) => {
            setRoomCode(code);
        });

        socket.on('found_room', (found) => {
            setValidRoomCode(found);
        });

        socket.on('joined_room', (startPage, targetPage, roomPowerUps) => {
            setGameSettings({ startPage, targetPage });
            setPowerUps(roomPowerUps);
        });

        socket.on('return_to_lobby', (lobbyPowerUps) => {
            setGameState("LOBBY");
            setGameSettings({ startPage: "", targetPage: "" });
            setPowerUps(lobbyPowerUps || { swap: 0, scramble: 0, freeze: 0 });
            setInventory({ swap: 0, scramble: 0, freeze: 0 });
            setPath([]);
            setVictimPowerUpNotice(null);
            setNotice(null);
        });

        socket.on('surrendered_to_lobby', ({ startPage, targetPage, powerUps: roomPowerUps }) => {
            setGameState("SURRENDERED");
            setGameSettings({ startPage, targetPage });
            setPowerUps(roomPowerUps || { swap: 0, scramble: 0, freeze: 0 });
            setPath([]);
            setVictimPowerUpNotice(null);
        });

        socket.on('update_player_list', (updatedPlayers) => {
            setPlayers(updatedPlayers);
            const me = updatedPlayers.find(p => p.id === socket.id);
            if (me) {
                setIsHost(me.isHost);
            }
        });

        socket.on('pages_swapped', ({ newPageTitle, newPageHtml }) => {
            setPath(prev => [...prev, { title: newPageTitle, html: newPageHtml }]);
        });

        // The server refused the move we already rendered optimistically. Rewind to the
        // page it says we're on rather than leaving the view ahead of the real state.
        socket.on('move_rejected', ({ currentPageTitle: serverTitle, reason }) => {
            setNotice({ message: reason || "That move wasn't allowed.", tone: 'error', at: Date.now() });
            setPath(prev => {
                if (prev.length < 2) return prev;
                const rewound = prev.slice(0, -1);
                const landedOn = rewound[rewound.length - 1]?.title;
                // Only rewind if we really are one step ahead of the server.
                return (!serverTitle || landedOn === serverTitle) ? rewound : prev;
            });
        });

        socket.on('power_up_used_on_you', ({ attackerUsername, powerUpType }) => {
            setVictimPowerUpNotice({ attackerUsername, powerUpType });
        });

        socket.on('start_page', (startPage) => {
            setGameSettings(prev => ({ ...prev, startPage }));
        });

        socket.on('target_page', (targetPage) => {
            setGameSettings(prev => ({ ...prev, targetPage }));
        });

        socket.on('power_up_changed', ({ powerUpType, value }) => {
            setPowerUps(prev => ({ ...prev, [powerUpType]: value }));
        });

        socket.on('inventory_changed', (playerPowerUps) => {
            setInventory(playerPowerUps);
        });

        socket.on('game_started', ({ startPage, targetPage, initialHtml, inventory: startingInventory }) => {
            setStartTime(Date.now());
            setGameSettings({ startPage, targetPage });
            setPath([{ title: startPage, html: initialHtml }]);
            setInventory(startingInventory || { swap: 0, scramble: 0, freeze: 0 });
            setGameState("PLAYING");
        });

        socket.on('game_won', ({ player, totalTime: elapsed }) => {
            setWinner(player);
            setTotalTime(elapsed);
            setGameState("FINISHED");
            setVictimPowerUpNotice(null);
        });

        socket.on('error', (msg) => {
            setNotice({ message: String(msg), tone: 'error', at: Date.now() });
            // A failure while joining means there is no seat to hold; a failure mid-game
            // (e.g. a refunded power-up) must not evict an active player.
            setSessionStatus((prev) => (prev === 'pending' ? 'none' : prev));
        });

        return () => {
            clearTimeout(rejoinTimer);
            socket.off('connect', attemptRejoin);
            socket.off('session_established');
            socket.off('rejoin_failed');
            socket.off('rejoin_success');
            socket.off('room_created');
            socket.off('found_room');
            socket.off('joined_room');
            socket.off('return_to_lobby');
            socket.off('surrendered_to_lobby');
            socket.off('update_player_list');
            socket.off('pages_swapped');
            socket.off('move_rejected');
            socket.off('power_up_used_on_you');
            socket.off('start_page');
            socket.off('target_page');
            socket.off('power_up_changed');
            socket.off('inventory_changed');
            socket.off('game_started');
            socket.off('game_won');
            socket.off('error');
        };
    }, [fetchPage]);

    const value = {
        // Identity / room
        username, setUsername,
        roomCode, setRoomCode,
        validRoomCode,
        isHost, setIsHost,
        players,
        // Game flow
        gameState,
        gameSettings,
        path,
        currentPageTitle,
        currentPageHtml,
        winner,
        startTime,
        totalTime,
        powerUps,
        inventory,
        victimPowerUpNotice,
        notice, showNotice,
        // Page loading
        fetchPage, isLoading,
        // Reconnect
        sessionStatus, beginSession, endSession,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};
