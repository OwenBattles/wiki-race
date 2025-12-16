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
        gameSettings, setGameSettings,
        path, setPath,
        currentPageTitle, currentPageHtml,
        htmlContent, currentTitle, fetchPage, isLoading
    } = useContext(GameContext);

    const {
        handleStartPoint,
        handleEndPoint,
        handlePowerUpSettings,
        handleChangePage,
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
                    gameSettings={gameSettings}
                    powerUpsAllowed={powerUpsAllowed}
                    onStart={handleStartGame}
                />
            }

            { gameState == "PLAYING" &&
                <WikiView
                    htmlContent={currentPageHtml}
                    onNavigate={handleChangePage}
                    isLoading={ isLoading }
                />
            }

            { gameState == "FINISHED" && 
                <GameOverView />
            }
        </div>
    );
}