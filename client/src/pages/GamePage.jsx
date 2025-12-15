import { useEffect, useContext, use } from 'react';
import { GameContext } from '../contexts/GameContext';

import { LobbyView } from '../components/LobbyView';
import { WikiView } from '../components/WikiView';
import { GameOverView } from '../components/GameOverView';

export default function GamePage() {
    const { 
        username, setUsername,
        roomCode, setRoomCode,
        validRoomCode, setValidRoomCode,
        isHost, setIsHost,
        players, setPlayers,
        powerUpsAllowed, setPowerUpsAllowed,
        gameState, setGameState,
        gameData, setGameData, } = useContext(GameContext);

    return (
        <div >
            <h1>{roomCode}</h1>
            { gameState == "LOBBY" && 
                <LobbyView />
            }

            { gameState == "PLAYING" &&
                <WikiView />
            }

            { gameState == "FINISHED" && 
                <GameOverView />
            }
        </div>
    );
}