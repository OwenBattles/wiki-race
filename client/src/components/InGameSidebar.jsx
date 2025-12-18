export function InGameSidebar({ username, players, powerUps }) {

    console.log("power ups", powerUps);
    return (
        <div>
            <h2>Players</h2>
            <ul>
                {players.map((player) => (
                    player.username !== username && <li key={player.id}>{player.username}
                        <button>Use PowerUp</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}