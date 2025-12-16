export function GameOverView({ players, winner, onReturnToLobby, isHost }) {
    return (
        <div>
            <h1>Game Over</h1>
            {isHost ? (
                <button onClick={onReturnToLobby}>Return to Lobby</button>
            ) : (
                <p>Waiting for Host...</p>
            )}
        </div>   
    )
}