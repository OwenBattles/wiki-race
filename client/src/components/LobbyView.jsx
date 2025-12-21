import { TitleEndpoints } from "./TitleEndpoints";
import { PowerUpSettings } from "./PowerUpSettings";
import '../styles/LobbyView.css';
import '../styles/StartGameButton.css';

export function LobbyView({ isHost, players, handleStartSelect, handleEndSelect, gameSettings, onStart, handlePowerUpSettings, handlePowerUpChange, powerUps }) {
    const canStartGame = gameSettings.startPage && gameSettings.targetPage;

    return (
        <div className="lobby-view-container">
            {players.length > 1 && (
                <PowerUpSettings 
                    isHost={isHost} 
                    powerUps={powerUps} 
                    onPowerUpChange={handlePowerUpChange}
                />
            )}
            <TitleEndpoints 
                isHost={isHost} 
                handleStartSelect={handleStartSelect} 
                handleEndSelect={handleEndSelect} 
                gameSettings={gameSettings}
            />
            <ul className="game-player-list">
                {players.map((player, id) => (
                    <li key={id} className="game-player-item">{player.username}</li>
                ))}
            </ul>
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