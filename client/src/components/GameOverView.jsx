export function GameOverView({ players, winner, onReturnToLobby, isHost, elapsedTime }) {
    // refactor this eventually
    const formatTime = (ms) => {    
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            <h1>Game Over</h1>
            <h2>Winner: {winner.username}</h2>
            <h2>Time Elapsed: {formatTime(elapsedTime)}</h2>
            {isHost ? (
                <button onClick={onReturnToLobby}>Return to Lobby</button>
            ) : (
                <p>Waiting for Host...</p>
            )}
        </div>   
    )
}