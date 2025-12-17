export function GameOverView({ players, winner, onReturnToLobby, isHost, totalTime }) {
    // refactor this eventually
    const formatTime = (ms) => {    
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    console.log("players", players);

    return (
        <div>
            <h1>Game Over</h1>
            <h2>Winner: {winner.username}</h2>
            <h2>Time Elapsed: {formatTime(totalTime)}</h2>
            {players.map((player) => (
            <div key={player.id} className="mb-4 p-4 border rounded">
                <div className="font-bold">
                {player.username} {player.isHost && "(Host)"}
                </div>
                <div className="ml-4 mt-2">
                <div className="text-sm text-gray-600">Path:</div>
                {player.path && player.path.length > 0 ? (
                    <ol className="list-decimal ml-6">
                    {player.path.map((page, index) => (
                        <li key={index}>{page.title}</li>
                    ))}
                    </ol>
                ) : (
                    <div className="text-sm text-gray-400 ml-2">No pages visited yet</div>
                )}
                </div>
            </div>
            ))}
            {isHost ? (
                <button onClick={onReturnToLobby}>Return to Lobby</button>
            ) : (
                <p>Waiting for Host...</p>
            )}
        </div>   
    )
}