import { TitleEndpoints } from "./TitleEndpoints";
import { PowerUpSettings } from "./PowerUpSettings";

export function LobbyView({ isHost, players, handleStartSelect, handleEndSelect, gameSettings, onStart, handlePowerUpSettings, handlePowerUpChange, powerUps }) {
    const canStartGame = gameSettings.startPage && gameSettings.targetPage;


    return (
        <div>
            <PowerUpSettings isHost={isHost} powerUps={powerUps} onPowerUpChange={handlePowerUpChange}/>
            <TitleEndpoints 
                isHost={isHost} 
                handleStartSelect={handleStartSelect} 
                handleEndSelect={handleEndSelect} 
                gameSettings={gameSettings}
            />
            <ul>
                {players.map((player, id) => (
                    <li key={id}>{player.username}</li>
                ))}
            </ul>
            {isHost ? (
                <button
                    onClick={onStart}
                    disabled={!canStartGame}
                    className={`p-2 rounded text-white ${
                        !canStartGame 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    Start Game
                </button>
            ) : (
                "Waiting for Host..." 
            )}
        </div>
    )
}