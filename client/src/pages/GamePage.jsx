import { useEffect, useContext } from 'react';

import { GameContext } from '../contexts/GameContext';
import { useGameLogic } from '../hooks/useGameLogic';

import { LobbyView } from '../components/LobbyView';
import { WikiView } from '../components/WikiView';
import { GameOverView } from '../components/GameOverView';
import { InGameHeader } from '../components/InGameHeader';
import { InGameSidebar } from '../components/InGameSidebar';

export default function GamePage() {
    const { 
        username,
        roomCode,
        isHost,
        players, setPlayers,
        gameState, setGameState,
        gameSettings, setGameSettings,
        path, setPath,
        currentPageTitle, currentPageHtml,
        htmlContent, currentTitle, fetchPage, isLoading, winner,
        totalTime, setTotalTime,
        powerUps, setPowerUps,
    } = useContext(GameContext);

    const {
        handleStartPoint,
        handleEndPoint,
        handlePowerUpSettings,
        handleChangePage,
        handleStartGame,
        handleReturnToLobby,
        handleSurrender,
        handlePowerUpChange,
        handleUsePowerUp,
    } = useGameLogic();


    useEffect(() => {
        const disableFind = (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
            e.preventDefault();
          }
        };
      
        window.addEventListener('keydown', disableFind);
      
        return () => {
          window.removeEventListener('keydown', disableFind);
        };
      }, []);

    return (
        <div >
            { gameState == "LOBBY" && 
            <div>
                <h1>{roomCode}</h1>
                <LobbyView 
                    isHost={isHost}
                    players={players}
                    handleStartSelect={handleStartPoint}
                    handleEndSelect={handleEndPoint}
                    gameSettings={gameSettings}
                    onStart={handleStartGame}
                    handlePowerUpSettings={handlePowerUpSettings}
                    handlePowerUpChange={handlePowerUpChange}   
                    powerUps={powerUps}
                />
            </div>       
            }
            
            { gameState == "PLAYING" &&
            <div>
                <InGameHeader targetPage={gameSettings.targetPage} onSurrender={handleSurrender} />
                <InGameSidebar username={username} players={players} powerUps={powerUps} handleUsePowerUp={handleUsePowerUp} />
                <WikiView
                    htmlContent={currentPageHtml}
                    onNavigate={handleChangePage}
                    isLoading={ isLoading }
                />
            </div>
            }

            { gameState == "FINISHED" && 
                <GameOverView players={players} winner={winner} onReturnToLobby={handleReturnToLobby} isHost={isHost} totalTime={totalTime} />
            }
        </div>
    );
}