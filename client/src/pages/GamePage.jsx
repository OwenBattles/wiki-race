import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useWikiPage } from '../hooks/useWikiPage';
import { socket } from "../services/socket"

import { LobbyView } from '../components/LobbyView';
import { WikiView } from '../components/WikiView';
import { InGameHeader } from '../components/InGameHeader';

export default function GamePage() {
    const location = useLocation();
    const { username, lobbyCode, initHostStatus } = location.state || {};

    const { htmlContent, currentTitle, fetchPage, isLoading } = useWikiPage();

    // Possible states: "LOBBY", "PLAYING", "FINISHED"
    const [gameState, setGameState] = useState("LOBBY");
    const [players, setPlayers] = useState([]); 
    const [isHost, setIsHost] = useState(initHostStatus);

    useEffect(() => {
        
    }, [lobbyCode, username]);

    return (
        <div>
            {gameState == "LOBBY" &&
                <LobbyView 
                    lobbyCode={lobbyCode}
                    players={players}
                    isHost={isHost}
                    onStartGame={() => socket.emit("start_game", lobbyCode)}
                />
            }

            {gameState == "PLAYING" && 
                <div>
                    <InGameHeader currentTitle={currentTitle} target={"Target Page"} />
                    <WikiView
                        htmlContent={htmlContent} 
                        onNavigate={(title) => fetchPage(title)} 
                        isLoading={isLoading}
                    />
                </div>
            }
        </div> 
    );
}