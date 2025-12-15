import { TitleEndpoints } from "./TitleEndpoints";

export function LobbyView({ isHost, players, handleStartSelect, handleEndSelect, gameData }) {
    console.log(gameData.startPage)
    
    const canStartGame = gameData.startPage && gameData.targetPage;
    
    return (
        <div>
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