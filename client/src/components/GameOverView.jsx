export function GameOverView({ players, winner, onReturnToLobby, isHost }) {
    console.log("winner", winner);
    return (
        <div>
            <h1>Game Over</h1>
            <h2>Winner: {winner.username}</h2>
            {isHost ? (
                <button onClick={onReturnToLobby}>Return to Lobby</button>
            ) : (
                <p>Waiting for Host...</p>
            )}
        </div>   
    )
}