import { LobbyCode } from "./LobbyCode"
import { GameLink } from "./GameLink"
import { GameRange } from "./GameRange"

export function LobbyView({ lobbyCode, players, isHost, onStartGame, setStart, setEnd }) {
    return (
        <div>
            <LobbyCode lobbyCode={lobbyCode} />
            <GameLink />
            <GameRange isHost={isHost} setStart={setStart} setEnd={setEnd}/>
            <h1>Players: {players.length}</h1>
            <ul>
            {players.map((item, id) => (
                <li key={id}>{item.username}</li>
            ))}
            </ul>
            {isHost ? (
                    <button 
                        onClick={onStartGame}
                    >
                        Start Race
                    </button>
                ) : (
                    <div>
                        Waiting for host to start...
                    </div>
                )}
        </div> 
    )
}