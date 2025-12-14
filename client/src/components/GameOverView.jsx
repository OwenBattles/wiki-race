export function GameOverView({ isHost, players, winner, onNavigate }) {
    return (
        <div>
            <h1>GAME OVER BRO</h1>
            <h2>{winner} has won the game!</h2>
            <h2>{ players.length }</h2>
            {isHost && 
                <button onClick={onNavigate}>Return to Lobby</button>
            }
            {!isHost && 
                "Waiting for Host..."
            }
        </div>
    )
}