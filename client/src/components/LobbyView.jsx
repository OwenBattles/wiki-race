import { TitleEndpoints } from "./TitleEndpoints";
import { PowerUpSettings } from "./PowerUpSettings";
import { PlayerList } from "./PlayerList";
import '../styles/LobbyView.css';
import '../styles/StartGameButton.css';

export function LobbyView({ isHost, players, myId, handleStartSelect, handleEndSelect, gameSettings, onStart, handlePowerUpChange, powerUps }) {
    const canStartGame = gameSettings.startPage && gameSettings.targetPage;

    return (
        <div className="lobby-view-container">
            <TitleEndpoints 
                isHost={isHost} 
                handleStartSelect={handleStartSelect} 
                handleEndSelect={handleEndSelect} 
                gameSettings={gameSettings}
            />
            {players.length > 1 && (
                <PowerUpSettings 
                    isHost={isHost} 
                    powerUps={powerUps} 
                    onPowerUpChange={handlePowerUpChange}
                />
            )}
            <PlayerList players={players} myId={myId} />
            {isHost ? (
                <button
                    className="start-game-button"
                    onClick={onStart}
                    disabled={!canStartGame}
                >
                    Start Game
                </button>
            ) : (
                <p className="game-waiting-message">Waiting for Host...</p>
            )}
        </div>
    )
}