export function GameOverView({ players, winner }) {
    return (
        <div>
            <h1>GAME OVER BRO</h1>
            <h2>{winner} has won the game!</h2>
            <h2>{ players.length }</h2>
        </div>
    )
}