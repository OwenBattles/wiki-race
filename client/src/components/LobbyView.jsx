import { TitleEndpoints } from "./TitleEndpoints";
import { PowerUpSettings } from "./PowerUpSettings";

export function LobbyView({ isHost, players, handleStartSelect, handleEndSelect, gameData, powerUpsAllowed, onStart }) {
    console.log(gameData.startPage, " => ", gameData.targetPage);
    const canStartGame = gameData.startPage && gameData.targetPage;
    
    return (
        <div>
            <PowerUpSettings powerUpsAllowed={powerUpsAllowed}/>
            <TitleEndpoints 
                isHost={isHost} 
                handleStartSelect={handleStartSelect} 
                handleEndSelect={handleEndSelect} 
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