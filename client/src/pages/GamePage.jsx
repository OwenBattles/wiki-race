import { useEffect } from 'react';

import { useGame } from '../contexts/gameContext';
import { useGameLogic } from '../hooks/useGameLogic';

import { LobbyView } from '../components/LobbyView';
import { WikiView } from '../components/WikiView';
import { GameOverView } from '../components/GameOverView';
import { InGameHeader } from '../components/InGameHeader';
import { PowerUpNotificationForVictim } from '../components/PowerUpNotificationForVictim';
import { SurrenderedLobbyView } from '../components/SurrenderedLobbyView';
import { RoomCode } from '../components/RoomCode';
import { Notice } from '../components/Notice';
import '../styles/GamePage.css';

export default function GamePage() {
    const {
        username,
        roomCode,
        isHost,
        players,
        gameState,
        gameSettings,
        currentPageHtml,
        isLoading,
        winner,
        totalTime,
        powerUps,
        inventory,
        victimPowerUpNotice,
        notice,
    } = useGame();

    const {
        handleStartPoint,
        handleEndPoint,
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
        <div className="game-page">
            { gameState == "LOBBY" && 
            <div className="game-lobby-container">
                <div className="game-lobby-content">
                    <div className="game-lobby-header">
                        <RoomCode roomCode={roomCode} />
                    </div>
                    <div className="game-lobby-card">
                        <div className="game-lobby-card-content">
                            {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
                            <LobbyView
                                isHost={isHost}
                                players={players}
                                username={username}
                                handleStartSelect={handleStartPoint}
                                handleEndSelect={handleEndPoint}
                                gameSettings={gameSettings}
                                onStart={handleStartGame}
                                handlePowerUpChange={handlePowerUpChange}
                                powerUps={powerUps}
                            />
                        </div>
                    </div>
                </div>
            </div>       
            }

            { gameState == "SURRENDERED" &&
            <div className="game-lobby-container">
                <div className="game-lobby-content">
                    <div className="game-lobby-card">
                        <div className="game-lobby-card-content">
                            <SurrenderedLobbyView
                                roomCode={roomCode}
                                players={players}
                                gameSettings={gameSettings}
                            />
                        </div>
                    </div>
                </div>
            </div>
            }
            
            { gameState == "PLAYING" &&
            <div>
                {victimPowerUpNotice && (
                    <PowerUpNotificationForVictim
                        attackerUsername={victimPowerUpNotice.attackerUsername}
                        powerUpType={victimPowerUpNotice.powerUpType}
                    />
                )}
                {notice && (
                    <Notice tone={notice.tone} floating>{notice.message}</Notice>
                )}
                <InGameHeader 
                    targetPage={gameSettings.targetPage} 
                    onSurrender={handleSurrender}
                    username={username}
                    players={players}
                    inventory={inventory}
                    handleUsePowerUp={handleUsePowerUp}
                />
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