export function GameOverView({ players, winner }) {

    console.log("players", players);
    return (
        <div>
            <h1>Game Over</h1>
            <h2>Winner: {winner}</h2>
            <button>Play Again</button>
        </div>   
    )
}