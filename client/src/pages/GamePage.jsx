import { useEffect, useContext } from 'react';

import { GameContext } from '../contexts/GameContext';
import { useGameLogic } from '../hooks/useGameLogic';

import { LobbyView } from '../components/LobbyView';
import { WikiView } from '../components/WikiView';
import { GameOverView } from '../components/GameOverView';

export default function GamePage() {
    const { 
        username,
        roomCode,
        isHost,
        players, setPlayers,
        powerUpsAllowed, setPowerUpsAllowed,
        gameState, setGameState,
        gameData, setGameData, 
    } = useContext(GameContext);

    const {
        handleStartPoint,
        handleEndPoint,
        handlePowerUpSettings,
        handleStartGame
    } = useGameLogic();

    return (
        <div >
            <h1>{roomCode}</h1>
            { gameState == "LOBBY" && 
                <LobbyView 
                    isHost={isHost}
                    players={players}
                    handleStartSelect={handleStartPoint}
                    handleEndSelect={handleEndPoint}
                    gameData={gameData}
                    powerUpsAllowed={powerUpsAllowed}
                    onStart={handleStartGame}
                />
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