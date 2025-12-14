import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { socket } from "../services/socket"; // Ensure this path is correct
import { LobbyView } from '../components/LobbyView';
import { WikiView } from '../components/WikiView';
import { InGameHeader } from '../components/InGameHeader';
import { useWikiPage } from '../hooks/useWikiPage';

export default function GamePage() {
    const location = useLocation();
    // Default to empty object to prevent crash if accessing directly
    const { username, lobbyCode, initHostStatus } = location.state || {};

    // 1. STATE LIFTED UP
    // We hold the HTML here so both Socket and Hook can touch it
    const [htmlContent, setHtmlContent] = useState(""); 
    const [currentTitle, setCurrentTitle] = useState("");
    
    // 2. USE THE HOOK (Assuming you updated it to accept setters, or just use fetchPage)
    // If your hook manages state internally, you might need to change it. 
    // For now, let's assume 'fetchPage' returns the new HTML or we pass 'setHtmlContent' to it.
    const { fetchPage, isLoading } = useWikiPage(setHtmlContent, setCurrentTitle);

    const [gameState, setGameState] = useState("LOBBY");
    const [players, setPlayers] = useState([]); 
    const [isHost, setIsHost] = useState(initHostStatus);
    
    // Rename these to match Backend expectations
    const [startPage, setStartPage] = useState(""); 
    const [endPage, setEndPage] = useState("");
    const [targetPage, setTargetPage] = useState(""); // Add this missing state

    useEffect(() => {
        // PLAYER LIST UPDATE
        const handlePlayerUpdate = (updatedPlayers) => {
            setPlayers(updatedPlayers);
            const me = updatedPlayers.find(p => p.id === socket.id);
            if (me) setIsHost(me.isHost);
        };

        // GAME STARTED
        const handleGameStart = ({ startPage, endPage, initialHtml }) => {
            console.log("Game started! Loading:", startPage);
            setTargetPage(endPage);
            setCurrentTitle(startPage);
            setHtmlContent(initialHtml); // Inject socket data into state
            setGameState("PLAYING");     // NOW we switch screens
        };

        socket.on('update_player_list', handlePlayerUpdate);
        socket.on("game_started", handleGameStart);
        
        // Initial fetch
        if (lobbyCode) {
            socket.emit('request_player_list', lobbyCode);
        }

        return () => { 
            socket.off('update_player_list', handlePlayerUpdate);
            socket.off('game_started', handleGameStart);
        };
    }, [lobbyCode]);

    const handleStartGame = () => {
        // MATCH THE BACKEND VARIABLE NAMES
        // Send 'startPage' and 'endPage', not 'startingPoint'
        socket.emit("start_game", { 
            roomCode: lobbyCode, // Backend might expect 'roomCode', not 'lobbyCode'
            startPage, 
            endPage 
        });
        // Remove setGameState("PLAYING") from here. Wait for the socket event!
    }

    return (
        <div>
            {gameState === "LOBBY" && (
                <LobbyView 
                    lobbyCode={lobbyCode}
                    players={players}
                    isHost={isHost}
                    onStartGame={handleStartGame}
                    setStart={setStartPage} // Updated prop name
                    setEnd={setEndPage}     // Updated prop name
                />
            )}

            {gameState === "PLAYING" && (
                <div>
                    <InGameHeader currentTitle={currentTitle} target={targetPage} />
                    <WikiView
                        htmlContent={htmlContent} 
                        onNavigate={(title) => fetchPage(title)} // Hook handles logic
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div> 
    );
}